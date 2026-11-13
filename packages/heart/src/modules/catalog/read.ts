import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '../../platform/db/index.ts';
import { toPaise } from '../../platform/money/index.ts';
import { slugify } from './planner.ts';
import { isMadeToOrder } from '../inventory/index.ts';

// Storefront read model: what shoppers may see — active, not deleted
// products with their active variants — shaped exactly like the
// storefront's Product type so its pages render unchanged. Partner costs,
// source rows and staff fields never leave this file.

export type ProductType = 'apparel' | 'kids-apparel' | 'pet' | 'drinkware' | 'wall-art' | 'phone-case' | 'bag' | 'stationery' | 'home';

export interface StorefrontProduct {
  /** Stable public id (legacy demo id when one exists, else the uuid). */
  id: string;
  productId: string;
  slug: string;
  aliases: string[];
  title: string;
  subtitle: string;
  category: string;
  audience?: ('men' | 'women' | 'kids')[];
  partnerStyleCode?: string;
  /** "From" price: the lowest active variant price. */
  priceINR: number;
  priceMinorINR: number;
  compareAtPriceINR?: number;
  compareAtPriceMinorINR?: number;
  images: { url: string; alt: string; color?: string; label?: string }[];
  colors: { name: string; hex: string; value: string }[];
  /** priceINR/priceMinorINR only when sizes are priced differently (Qikink ladders). */
  sizes: { size: string; inStock: boolean; stockCount: number; priceINR?: number; priceMinorINR?: number }[];
  specTable?: unknown;
  sizeChartId?: string;
  faqs?: { id: string; question: string; answer: string }[];
  description: string;
  details: string[];
  careInstructions: string[];
  composition: string;
  publicationStatus: 'published';
  partnerProvider?: 'Qikink Direct API' | 'Printrove Hub' | 'Custom Atelier';
  partnerAvailability?: 'ready_to_print' | 'partner_delayed' | 'discontinued';
  sustainabilityBadge?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  productType?: ProductType;
  variantLabel?: string;
  priceIsDraft?: boolean;
  printAreas?: string[];
  weightGrams?: number;
  taxRatePercent?: number;
  hsnCode?: string;
}

export interface StorefrontCollection {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  coverImage: string;
  productCount: number;
  /** Public product ids in merchandising order. */
  productIds: string[];
}

export interface StorefrontCategory {
  slug: string;
  name: string;
  parentSlug: string | null;
  showInNavbar: boolean;
  showInMegamenu: boolean;
  sortOrder: number;
}

export interface StorefrontSizeChart {
  id: string;
  name: string;
  columns: string[];
  rows: { size: string; measures: Record<string, number | string> }[];
}

export interface StorefrontCatalog {
  sizeCharts: StorefrontSizeChart[];
  products: StorefrontProduct[];
  collections: StorefrontCollection[];
  categories: StorefrontCategory[];
}

/**
 * Categories for the storefront navigation, without the catalogue. The header
 * only needs visibility flags, so it does not pay for the full read model.
 */
export async function getStorefrontNavigation(): Promise<StorefrontCategory[]> {
  const db = getDb();
  const { rows } = await db.execute<{ slug: string; name: string; parent_slug: string | null; show_in_navbar: boolean; show_in_megamenu: boolean; sort_order: number }>(sql`
    SELECT c.slug, c.name, parent.slug AS parent_slug, c.show_in_navbar, c.show_in_megamenu, c.sort_order
    FROM categories c LEFT JOIN categories parent ON parent.id = c.parent_id
    WHERE c.is_active AND c.deleted_at IS NULL ORDER BY c.sort_order, c.name`);
  return rows.map((c) => ({ slug: c.slug, name: c.name, parentSlug: c.parent_slug, showInNavbar: c.show_in_navbar, showInMegamenu: c.show_in_megamenu, sortOrder: c.sort_order }));
}

const PROVIDER_LABEL: Record<string, StorefrontProduct['partnerProvider']> = {
  qikink: 'Qikink Direct API',
  printrove: 'Printrove Hub',
  custom_atelier: 'Custom Atelier',
};
const AUDIENCE: Record<string, StorefrontProduct['audience']> = {
  Unisex: ['men', 'women'], Male: ['men'], Female: ['women'], Kids: ['kids'], Boy: ['kids'], Girl: ['kids'],
};
const WEARABLE = new Set(['apparel', 'kids-apparel', 'pet']);
/** Made-to-order lines are capped per order, not by a stock count. */
export const MADE_TO_ORDER_CAP = 100;

const rupees = (paise: number) => paise / 100;

/** Extra attributes staff chose to show on the product page ("Fabric: Cotton"). */
function extraDetails(links: { slug: string; def_name: string; visible: boolean; is_variant_axis: boolean; value: string }[]): string[] {
  const by = new Map<string, string[]>();
  for (const l of links) if (!l.is_variant_axis && l.visible) by.set(l.def_name, [...(by.get(l.def_name) ?? []), l.value]);
  return [...by].map(([name, values]) => `${name}: ${values.join(', ')}`);
}

type ProductRow = {
  id: string; external_id: string | null; slug: string; slug_aliases: string[]; name: string; short_description: string | null;
  description: string | null; category_slug: string | null; gender: string | null; style_code: string | null;
  compare_at_price: string | null; spec_table: unknown; details: string[]; care_instructions: string | null;
  composition: string | null; partner_provider: string | null; partner_availability: StorefrontProduct['partnerAvailability'] | null;
  badge: string | null; tags: string[] | null; product_type: ProductType | null; variant_label: string | null;
  price_is_draft: boolean; weight_g: number | null; tax_rate: string | null; hsn_code: string | null; size_chart_id: string | null;
};

export async function getStorefrontCatalog(): Promise<StorefrontCatalog> {
  const db = getDb();
  const [products, variants, variantValues, linkValues, images, faqs, collections, members, categories, charts] = await Promise.all([
    db.execute<ProductRow>(sql`
      SELECT p.id, p.external_id, p.slug, p.slug_aliases, p.name, p.short_description, p.description, c.slug AS category_slug,
             p.gender, p.style_code, p.compare_at_price, p.spec_table, p.details, p.care_instructions, p.composition,
             p.partner_provider, p.partner_availability, p.badge, p.tags, p.product_type, p.variant_label, p.price_is_draft,
             p.weight_g, p.tax_rate, p.hsn_code, p.size_chart_id
      FROM products p LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.product_kind = 'physical'
      ORDER BY p.created_at, p.id`),
    db.execute<{ id: string; product_id: string; price: string; stock: number }>(sql`
      SELECT v.id, v.product_id, v.price, v.stock FROM product_variants v
      JOIN products p ON p.id = v.product_id AND p.status = 'active' AND p.deleted_at IS NULL
      WHERE v.is_active`),
    db.execute<{ variant_id: string; slug: string; value_id: string }>(sql`
      SELECT pvav.variant_id, d.slug, pvav.value_id FROM product_variant_attribute_values pvav
      JOIN attribute_definitions d ON d.id = pvav.definition_id
      JOIN products p ON p.id = pvav.product_id AND p.status = 'active' AND p.deleted_at IS NULL`),
    db.execute<{ product_id: string; slug: string; def_name: string; visible: boolean; is_variant_axis: boolean; variant_axis_position: number | null; axis_label: string | null; value_id: string; value: string; swatch_hex: string | null; position: number }>(sql`
      SELECT l.product_id, d.slug, d.name AS def_name, (d.is_active AND d.show_on_pdp) AS visible, l.is_variant_axis, l.variant_axis_position, l.axis_label, lv.value_id, av.value, av.swatch_hex, lv.position
      FROM product_attribute_links l
      JOIN attribute_definitions d ON d.id = l.definition_id
      JOIN product_attribute_link_values lv ON lv.product_id = l.product_id AND lv.definition_id = l.definition_id
      JOIN attribute_values av ON av.id = lv.value_id
      JOIN products p ON p.id = l.product_id AND p.status = 'active' AND p.deleted_at IS NULL
      ORDER BY l.product_id, lv.position, av.position`),
    db.execute<{ product_id: string; url: string; alt: string | null; label: string | null; color: string | null }>(sql`
      SELECT i.product_id, i.url, i.alt, i.label, av.value AS color FROM product_images i
      LEFT JOIN attribute_values av ON av.id = i.color_value_id
      JOIN products p ON p.id = i.product_id AND p.status = 'active' AND p.deleted_at IS NULL
      ORDER BY i.product_id, i.is_primary DESC, i.sort_order, i.created_at`),
    db.execute<{ id: string; product_id: string; question: string; answer: string }>(sql`
      SELECT id, product_id, question, answer FROM faqs WHERE scope = 'product' AND is_published ORDER BY product_id, sort_order, created_at`),
    db.execute<{ id: string; slug: string; name: string; tagline: string | null; description: string | null; cover_image_url: string | null }>(sql`
      SELECT id, slug, name, tagline, description, cover_image_url FROM collections
      WHERE visibility = 'published' OR (visibility = 'scheduled' AND published_at <= now())
      ORDER BY created_at, id`),
    db.execute<{ collection_id: string; product_id: string }>(sql`
      SELECT cp.collection_id, cp.product_id FROM collection_products cp
      JOIN products p ON p.id = cp.product_id AND p.status = 'active' AND p.deleted_at IS NULL
      ORDER BY cp.collection_id, cp.position, p.created_at`),
    db.execute<{ slug: string; name: string; parent_slug: string | null; show_in_navbar: boolean; show_in_megamenu: boolean; sort_order: number }>(sql`
      SELECT c.slug, c.name, parent.slug AS parent_slug, c.show_in_navbar, c.show_in_megamenu, c.sort_order
      FROM categories c LEFT JOIN categories parent ON parent.id = c.parent_id
      WHERE c.is_active AND c.deleted_at IS NULL ORDER BY c.sort_order, c.name`),
    db.execute<{ id: string; name: string; columns: string[]; rows: StorefrontSizeChart['rows'] }>(sql`SELECT id, name, columns, rows FROM size_charts ORDER BY created_at, id`),
  ]);

  const byProduct = <T extends { product_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const r of rows) map.set(r.product_id, [...(map.get(r.product_id) ?? []), r]);
    return map;
  };
  const variantsBy = byProduct(variants.rows);
  const linksBy = byProduct(linkValues.rows);
  const imagesBy = byProduct(images.rows);
  const faqsBy = byProduct(faqs.rows);
  const valuesOfVariant = new Map<string, Map<string, string>>();
  for (const r of variantValues.rows) {
    const m = valuesOfVariant.get(r.variant_id) ?? new Map<string, string>();
    m.set(r.slug, r.value_id);
    valuesOfVariant.set(r.variant_id, m);
  }

  const out: StorefrontProduct[] = [];
  for (const p of products.rows) {
    const vs = (variantsBy.get(p.id) ?? []).map((v) => ({ ...v, paise: toPaise(v.price), values: valuesOfVariant.get(v.id) ?? new Map() }));
    if (!vs.length) continue; // nothing purchasable → not on the storefront
    const links = linksBy.get(p.id) ?? [];
    const colorLinks = links.filter((l) => l.slug === 'color' && l.is_variant_axis);
    const optionLinks = links.filter((l) => l.is_variant_axis && l.slug !== 'color');
    const optionSlug = optionLinks[0]?.slug;
    const madeToOrder = isMadeToOrder(p.partner_provider);
    const available = (v: (typeof vs)[number]) => (madeToOrder ? p.partner_availability === 'ready_to_print' : v.stock > 0);

    const usedColors = new Set(vs.map((v) => v.values.get('color')).filter(Boolean));
    const colors = colorLinks.filter((l) => usedColors.has(l.value_id)).map((l) => ({ name: l.value, hex: l.swatch_hex ?? '#D9D4C7', value: slugify(l.value) }));

    const sizeRows = optionLinks
      .map((l) => {
        const matching = vs.filter((v) => v.values.get(optionSlug!) === l.value_id);
        if (!matching.length) return null;
        return {
          size: l.value,
          inStock: matching.some(available),
          stockCount: madeToOrder ? MADE_TO_ORDER_CAP : Math.max(...matching.map((v) => v.stock)),
          paise: Math.min(...matching.map((v) => v.paise)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const minPaise = Math.min(...vs.map((v) => v.paise));
    const laddered = new Set(sizeRows.map((s) => s.paise)).size > 1;
    const sizes = sizeRows.length
      ? sizeRows.map(({ paise, ...s }) => (laddered ? { ...s, priceINR: rupees(paise), priceMinorINR: paise } : s))
      : [{ size: 'One size', inStock: vs.some(available), stockCount: madeToOrder ? MADE_TO_ORDER_CAP : Math.max(...vs.map((v) => v.stock)) }];

    const type = p.product_type ?? undefined;
    const compare = p.compare_at_price ? toPaise(p.compare_at_price) : null;
    const tags = p.tags ?? [];
    const productFaqs = (faqsBy.get(p.id) ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
    out.push({
      id: p.external_id ?? p.id,
      productId: p.id,
      slug: p.slug,
      aliases: p.slug_aliases ?? [],
      title: p.name,
      subtitle: p.short_description ?? '',
      category: p.category_slug ?? 'accessories',
      ...(type && WEARABLE.has(type) && p.gender && AUDIENCE[p.gender] ? { audience: AUDIENCE[p.gender] } : {}),
      ...(p.style_code ? { partnerStyleCode: p.style_code } : {}),
      priceINR: rupees(minPaise),
      priceMinorINR: minPaise,
      ...(compare && compare > minPaise ? { compareAtPriceINR: rupees(compare), compareAtPriceMinorINR: compare } : {}),
      images: (imagesBy.get(p.id) ?? []).map((i) => ({
        url: i.url, alt: i.alt ?? p.name, ...(i.color ? { color: slugify(i.color) } : {}), ...(i.label ? { label: i.label } : {}),
      })),
      colors: colors.length ? colors : [{ name: 'Standard', hex: '#D9D4C7', value: 'standard' }],
      sizes,
      ...(p.spec_table ? { specTable: p.spec_table } : {}),
      ...(p.size_chart_id ? { sizeChartId: p.size_chart_id } : {}),
      ...(productFaqs.length ? { faqs: productFaqs } : {}),
      description: p.description ?? '',
      details: [...(p.details ?? []), ...extraDetails(links)],
      careInstructions: (p.care_instructions ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
      composition: p.composition ?? '',
      publicationStatus: 'published',
      ...(p.partner_provider && PROVIDER_LABEL[p.partner_provider] ? { partnerProvider: PROVIDER_LABEL[p.partner_provider] } : {}),
      ...(p.partner_availability ? { partnerAvailability: p.partner_availability } : {}),
      ...(p.badge ? { sustainabilityBadge: p.badge } : {}),
      ...(tags.includes('new') ? { isNew: true } : {}),
      ...(tags.includes('bestseller') ? { isBestseller: true } : {}),
      ...(type ? { productType: type } : {}),
      ...(p.variant_label ? { variantLabel: p.variant_label } : {}),
      ...(p.price_is_draft ? { priceIsDraft: true } : {}),
      ...(links.some((l) => l.slug === 'placements') ? { printAreas: links.filter((l) => l.slug === 'placements').map((l) => l.value) } : {}),
      ...(p.weight_g ? { weightGrams: p.weight_g } : {}),
      ...(p.tax_rate ? { taxRatePercent: Number(p.tax_rate) } : {}),
      ...(p.hsn_code ? { hsnCode: p.hsn_code } : {}),
    });
  }

  const publicId = new Map(out.map((p) => [p.productId, p.id]));
  const membersBy = new Map<string, string[]>();
  for (const m of members.rows) {
    const id = publicId.get(m.product_id);
    if (id) membersBy.set(m.collection_id, [...(membersBy.get(m.collection_id) ?? []), id]);
  }
  return {
    sizeCharts: charts.rows.map((c) => ({ id: c.id, name: c.name, columns: [...new Set([...(c.columns ?? []), ...(c.rows ?? []).flatMap((r) => Object.keys(r.measures))])], rows: c.rows ?? [] })),
    products: out,
    collections: collections.rows.map((c) => {
      const ids = membersBy.get(c.id) ?? [];
      return { id: c.id, slug: c.slug, title: c.name, tagline: c.tagline ?? '', description: c.description ?? '', coverImage: c.cover_image_url ?? '', productCount: ids.length, productIds: ids };
    }),
    categories: categories.rows.map((c) => ({ slug: c.slug, name: c.name, parentSlug: c.parent_slug, showInNavbar: c.show_in_navbar, showInMegamenu: c.show_in_megamenu, sortOrder: c.sort_order })),
  };
}
