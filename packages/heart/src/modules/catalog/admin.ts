import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toPaise, toRupees } from '../../platform/money/index.ts';
import { ensureAttributeValues, records, textArray } from './import.ts';
import { adjustStock, isMadeToOrder, syncProductStock } from '../inventory/index.ts';
import { getSetting } from '../settings/index.ts';
import { skuPart, slugify, variantKey } from './planner.ts';
import type { ProductInput } from './schemas.ts';
import type { z } from 'zod';
import type { categoryFields, collectionFields } from './schemas.ts';

// Staff side of the catalog (DOC/backend/04). Every write locks the product,
// validates against the database (not only the form), audits the change and
// leaves order history intact: variants are switched off, products are
// soft-deleted. Prices arrive as rupee numbers and are stored exactly.

const UNCATEGORIZED = 'Uncategorized';
const NO_COLOR = 'Default';
const PARTNER_SLUG: Record<ProductInput['partner'], string> = { 'Qikink Direct API': 'qikink', 'Printrove Hub': 'printrove', 'Custom Atelier': 'custom_atelier' };
const PARTNER_LABEL: Record<string, ProductInput['partner']> = { qikink: 'Qikink Direct API', printrove: 'Printrove Hub', custom_atelier: 'Custom Atelier' };
const toStatus = { published: 'active', draft: 'draft', archived: 'archived' } as const;
const fromStatus = { active: 'published', draft: 'draft', archived: 'archived' } as const;
const rupees = (v: string | number) => toPaise(String(v)) / 100;
const uniqueConflict = (error: unknown) => {
  const cause = (error as { cause?: { code?: string; constraint?: string } }).cause;
  return cause?.code === '23505' ? (cause.constraint ?? 'unique') : null;
};

export interface AdminVariant {
  id: string; color: string; size: string; sku: string; variantKey: string; price: number; priceOverridden?: true; stock: number; loadedStock: number;
  weight?: string; shippingWeight?: string; dimensions?: string;
}
export interface AdminProduct {
  id: string; name: string; slug: string; category: string; price: number; compareAtPrice?: number; stock: number;
  /** At or below this many units the product counts as low. */
  lowStockAt: number;
  /** Partner prints to order: stock numbers do not apply. */
  madeToOrder: boolean; priceSpread: boolean; updatedAt: string;
  publicationStatus: 'published' | 'draft' | 'archived'; description: string; colors: string[]; sizes: string[];
  partner: ProductInput['partner']; soldCount: number; rating: number; images: string[];
  styleCode?: string; internalSerialNo?: number; hsnCode?: string;
}
export interface AdminProductDetail extends AdminProduct {
  basePrice: number; priceAdjustments?: Record<string, number>; variants: AdminVariant[];
  attributes: { name: string; values: string[]; builtin: boolean; displayType: 'pill' | 'swatch' | 'radio'; swatchHex: Record<string, string> }[];
  discounts: { id: string; discountType: 'percent' | 'fixed'; value: number; startsAt: string; endsAt: string; isActive: boolean }[];
  fabricGsm?: string; cut?: string; modelDims?: string; care?: string; weight?: string; shippingWeight?: string; dimensions?: string;
  gender?: NonNullable<ProductInput['gender']>; taxRate?: number; photoSettings?: ProductInput['photoSettings'];
  monogram?: { enabled: boolean; maxChars: number; upcharge: number };
  lowStockThreshold?: number; sizeChartId?: string; exchangePolicy: NonNullable<ProductInput['exchangePolicy']>; productKind: NonNullable<ProductInput['productKind']>;
  movements: { id: string; productId: string; variantId?: string; qtyChange: number; reason: string; qtyAfter: number; createdAt: string }[];
}

type Db = Transaction | ReturnType<typeof getDb>;
type Row = {
  id: string; name: string; slug: string; category: string | null; price: string; compare_at_price: string | null; status: keyof typeof fromStatus;
  description: string | null; partner_provider: string | null; style_code: string | null; internal_serial_no: number | null; hsn_code: string | null; updated_at: string; low_stock_threshold: number | null;
};

async function summaries(db: Db, only?: string[]): Promise<AdminProduct[]> {
  const filter = only ? sql`AND p.id IN (${sql.join(only.map((i) => sql`${i}::uuid`), sql`, `)})` : sql``;
  const [storeLowAt, products, variants, links, images, sold, ratings] = await Promise.all([
    getSetting('inventory.low_stock_threshold', db),
    db.execute<Row>(sql`SELECT p.id, p.name, p.slug, c.name AS category, p.price, p.compare_at_price, p.status, p.description, p.partner_provider,
        p.style_code, p.internal_serial_no, p.hsn_code, p.updated_at, p.low_stock_threshold
      FROM products p LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
      WHERE p.deleted_at IS NULL ${filter} ORDER BY p.created_at DESC, p.id DESC`),
    db.execute<{ product_id: string; min: string | null; max: string | null; stock: number }>(sql`
      SELECT v.product_id, min(v.price) AS min, max(v.price) AS max, coalesce(sum(v.stock), 0)::int AS stock
      FROM product_variants v JOIN products p ON p.id = v.product_id AND p.deleted_at IS NULL WHERE v.is_active ${filter} GROUP BY v.product_id`),
    db.execute<{ product_id: string; slug: string; value: string }>(sql`
      SELECT DISTINCT ON (pvav.product_id, d.slug, av.id) pvav.product_id, d.slug, av.value, lv.position
      FROM product_variant_attribute_values pvav
      JOIN product_variants v ON v.id = pvav.variant_id AND v.is_active
      JOIN products p ON p.id = pvav.product_id AND p.deleted_at IS NULL
      JOIN attribute_definitions d ON d.id = pvav.definition_id
      JOIN attribute_values av ON av.id = pvav.value_id
      JOIN product_attribute_link_values lv ON lv.product_id = pvav.product_id AND lv.definition_id = pvav.definition_id AND lv.value_id = pvav.value_id
      WHERE true ${filter} ORDER BY pvav.product_id, d.slug, av.id`),
    db.execute<{ product_id: string; url: string }>(sql`SELECT i.product_id, i.url FROM product_images i JOIN products p ON p.id = i.product_id AND p.deleted_at IS NULL
      WHERE true ${filter} ORDER BY i.product_id, i.is_primary DESC, i.sort_order, i.created_at`),
    db.execute<{ product_id: string; n: number }>(sql`SELECT oi.product_id, sum(oi.qty)::int AS n FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE true ${filter} GROUP BY oi.product_id`),
    db.execute<{ product_id: string; r: string }>(sql`SELECT rv.product_id, avg(rv.rating)::numeric(3,1) AS r FROM reviews rv JOIN products p ON p.id = rv.product_id WHERE rv.is_approved ${filter} GROUP BY rv.product_id`),
  ]);
  const vBy = new Map(variants.rows.map((v) => [v.product_id, v]));
  const soldBy = new Map(sold.rows.map((s) => [s.product_id, s.n]));
  const rateBy = new Map(ratings.rows.map((r) => [r.product_id, Number(r.r)]));
  const imgBy = new Map<string, string[]>();
  for (const i of images.rows) imgBy.set(i.product_id, [...(imgBy.get(i.product_id) ?? []), i.url]);
  const linkRows = [...links.rows].sort((a, b) => Number((a as unknown as { position: number }).position) - Number((b as unknown as { position: number }).position));
  const colorsBy = new Map<string, string[]>();
  const sizesBy = new Map<string, string[]>();
  for (const l of linkRows) {
    const map = l.slug === 'color' ? colorsBy : sizesBy;
    map.set(l.product_id, [...(map.get(l.product_id) ?? []), l.value]);
  }
  return products.rows.map((p) => {
    const v = vBy.get(p.id);
    const min = v?.min ?? p.price;
    return {
      id: p.id, name: p.name, slug: p.slug, category: p.category ?? UNCATEGORIZED, price: rupees(min),
      ...(p.compare_at_price ? { compareAtPrice: rupees(p.compare_at_price) } : {}),
      stock: v?.stock ?? 0, lowStockAt: p.low_stock_threshold ?? storeLowAt, madeToOrder: isMadeToOrder(p.partner_provider), priceSpread: Boolean(v?.min && v?.max && v.min !== v.max),
      updatedAt: new Date(p.updated_at).toISOString(), publicationStatus: fromStatus[p.status], description: p.description ?? '',
      colors: colorsBy.get(p.id) ?? [NO_COLOR], sizes: sizesBy.get(p.id) ?? [], partner: PARTNER_LABEL[p.partner_provider ?? ''] ?? 'Custom Atelier',
      soldCount: soldBy.get(p.id) ?? 0, rating: rateBy.get(p.id) ?? 0, images: imgBy.get(p.id) ?? [],
      ...(p.style_code ? { styleCode: p.style_code } : {}),
      ...(p.internal_serial_no ? { internalSerialNo: p.internal_serial_no } : {}),
      ...(p.hsn_code ? { hsnCode: p.hsn_code } : {}),
    };
  });
}

/** Every non-deleted product, newest first, without variants (light list). */
export const adminListProducts = (): Promise<AdminProduct[]> => summaries(getDb());

export async function adminGetProduct(id: string, db: Db = getDb()): Promise<AdminProductDetail> {
  const [summary] = await summaries(db, [id]);
  if (!summary) throw new AppError('NOT_FOUND', 'That product does not exist.');
  const [full, variants, values, links, discounts, movements] = await Promise.all([
    db.execute<{ base_price: string | null; fabric_spec: string | null; cut: string | null; model_dims: string | null; care_instructions: string | null; weight_g: number | null; shipping_weight_g: number | null; dimensions: string | null; gender: AdminProductDetail['gender'] | null; tax_rate: string | null; photo_settings: Record<string, unknown>; monogram_enabled: boolean; monogram_max_chars: number; monogram_upcharge: string; size_chart_id: string | null; exchange_policy: AdminProductDetail['exchangePolicy']; product_kind: AdminProductDetail['productKind']; low_stock_threshold: number | null }>(sql`
      SELECT base_price, fabric_spec, cut, model_dims, care_instructions, weight_g, shipping_weight_g, dimensions, gender, tax_rate, photo_settings, monogram_enabled, monogram_max_chars, monogram_upcharge, size_chart_id, exchange_policy, product_kind, low_stock_threshold FROM products WHERE id = ${id}`),
    db.execute<{ id: string; sku: string; variant_key: string; price: string; price_overridden: boolean; stock: number; weight_g: number | null; shipping_weight_g: number | null; dimensions: string | null }>(sql`
      SELECT id, sku, variant_key, price, price_overridden, stock, weight_g, shipping_weight_g, dimensions FROM product_variants WHERE product_id = ${id} AND is_active ORDER BY created_at, id`),
    db.execute<{ variant_id: string; slug: string; value: string }>(sql`
      SELECT pvav.variant_id, d.slug, av.value FROM product_variant_attribute_values pvav JOIN attribute_definitions d ON d.id = pvav.definition_id JOIN attribute_values av ON av.id = pvav.value_id WHERE pvav.product_id = ${id}`),
    db.execute<{ slug: string; name: string; is_variant_axis: boolean; display_type: 'pill' | 'swatch' | 'radio'; value: string; swatch_hex: string | null; price_adjustment: string | null }>(sql`
      SELECT d.slug, d.name, l.is_variant_axis, d.display_type, av.value, av.swatch_hex, lv.price_adjustment
      FROM product_attribute_links l JOIN attribute_definitions d ON d.id = l.definition_id
      JOIN product_attribute_link_values lv ON lv.product_id = l.product_id AND lv.definition_id = l.definition_id
      JOIN attribute_values av ON av.id = lv.value_id WHERE l.product_id = ${id} ORDER BY lv.position, av.position`),
    db.execute<{ id: string; discount_type: 'percent' | 'fixed'; value: string; starts_at: string; ends_at: string; is_active: boolean }>(sql`SELECT id, discount_type, value, starts_at, ends_at, is_active FROM product_discounts WHERE product_id = ${id} ORDER BY starts_at`),
    db.execute<{ id: string; variant_id: string | null; qty_change: number; reason: string; qty_after: number; created_at: string }>(sql`SELECT id, variant_id, qty_change, reason, qty_after, created_at FROM stock_movements WHERE product_id = ${id} ORDER BY created_at DESC LIMIT 100`),
  ]);
  const p = full.rows[0]!;
  const valuesOf = new Map<string, Map<string, string>>();
  for (const v of values.rows) valuesOf.set(v.variant_id, (valuesOf.get(v.variant_id) ?? new Map()).set(v.slug, v.value));
  const base = rupees(p.base_price ?? summary.price);
  const adjustments: Record<string, number> = {};
  const isOption = (l: { slug: string; is_variant_axis: boolean }) => l.is_variant_axis && l.slug !== 'color';
  for (const l of links.rows) {
    if (!l.price_adjustment || Number(l.price_adjustment) === 0) continue;
    if (l.slug === 'color') adjustments[`Color:${l.value}`] = rupees(l.price_adjustment);
    else if (isOption(l)) adjustments[`Size:${l.value}`] = rupees(l.price_adjustment);
  }
  const variantRows: AdminVariant[] = variants.rows.map((v) => {
    const vals = valuesOf.get(v.id) ?? new Map<string, string>();
    const color = vals.get('color') ?? NO_COLOR;
    const size = [...vals.entries()].find(([k]) => k !== 'color')?.[1] ?? '';
    const price = rupees(v.price);
    const derived = Math.round((base + (adjustments[`Color:${color}`] ?? 0) + (adjustments[`Size:${size}`] ?? 0)) * 100) / 100;
    return {
      id: v.id, color, size, sku: v.sku, variantKey: v.variant_key, price, stock: v.stock, loadedStock: v.stock,
      // Pinned when flagged or when the price is not what the ladder derives.
      ...(v.price_overridden || derived !== price ? { priceOverridden: true as const } : {}),
      ...(v.weight_g ? { weight: String(v.weight_g) } : {}), ...(v.shipping_weight_g ? { shippingWeight: String(v.shipping_weight_g) } : {}), ...(v.dimensions ? { dimensions: v.dimensions } : {}),
    };
  });
  const custom = new Map<string, AdminProductDetail['attributes'][number]>();
  for (const l of links.rows.filter((x) => !x.is_variant_axis)) {
    const a = custom.get(l.name) ?? { name: l.name, values: [], builtin: l.slug === 'placements', displayType: l.display_type, swatchHex: {} };
    a.values.push(l.value);
    if (l.swatch_hex) a.swatchHex[l.value] = l.swatch_hex;
    custom.set(l.name, a);
  }
  const hex: Record<string, string> = {};
  for (const l of links.rows) if (l.slug === 'color' && l.swatch_hex) hex[l.value] = l.swatch_hex;
  const photo = p.photo_settings as ProductInput['photoSettings'] | Record<string, never>;
  return {
    ...summary, basePrice: base, ...(Object.keys(adjustments).length ? { priceAdjustments: adjustments } : {}), variants: variantRows,
    attributes: [
      { name: 'Color', values: summary.colors, builtin: true, displayType: 'swatch', swatchHex: hex },
      { name: 'Size', values: summary.sizes, builtin: true, displayType: 'pill', swatchHex: {} },
      ...custom.values(),
    ],
    discounts: discounts.rows.map((d) => ({ id: d.id, discountType: d.discount_type, value: rupees(d.value), startsAt: new Date(d.starts_at).toISOString(), endsAt: new Date(d.ends_at).toISOString(), isActive: d.is_active })),
    ...(p.fabric_spec ? { fabricGsm: p.fabric_spec } : {}), ...(p.cut ? { cut: p.cut } : {}), ...(p.model_dims ? { modelDims: p.model_dims } : {}), ...(p.care_instructions ? { care: p.care_instructions } : {}),
    ...(p.weight_g ? { weight: String(p.weight_g) } : {}), ...(p.shipping_weight_g ? { shippingWeight: String(p.shipping_weight_g) } : {}), ...(p.dimensions ? { dimensions: p.dimensions } : {}),
    ...(p.gender ? { gender: p.gender } : {}), ...(p.tax_rate ? { taxRate: Number(p.tax_rate) } : {}),
    ...(photo && 'layout' in photo ? { photoSettings: photo as ProductInput['photoSettings'] } : {}),
    ...(p.monogram_enabled ? { monogram: { enabled: true, maxChars: p.monogram_max_chars, upcharge: rupees(p.monogram_upcharge) } } : {}),
    ...(p.size_chart_id ? { sizeChartId: p.size_chart_id } : {}), exchangePolicy: p.exchange_policy, productKind: p.product_kind,
    ...(p.low_stock_threshold !== null ? { lowStockThreshold: p.low_stock_threshold } : {}),
    movements: movements.rows.map((m) => ({ id: m.id, productId: id, ...(m.variant_id ? { variantId: m.variant_id } : {}), qtyChange: m.qty_change, reason: m.reason, qtyAfter: m.qty_after, createdAt: new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) })),
  };
}

const field = (name: string, message: string, code: 'VALIDATION_FAILED' | 'CONFLICT' | 'RULE_VIOLATION' = 'VALIDATION_FAILED') => new AppError(code, message, [{ field: name, message }]);

/** "180", "180 g", "180.5gm" → whole grams; anything else is refused. */
function grams(label: string, raw: string | undefined): number | null {
  if (!raw) return null;
  const match = /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams)?$/i.exec(raw.trim());
  if (!match) throw field(label, 'Enter a weight in grams, e.g. 180');
  return Math.round(Number(match[1]));
}

async function resolveCategory(db: Db, name: string): Promise<string | null> {
  if (!name || name.toLowerCase() === UNCATEGORIZED.toLowerCase()) return null;
  const { rows } = await db.execute<{ id: string }>(sql`SELECT id FROM categories WHERE lower(name) = lower(${name}) AND deleted_at IS NULL LIMIT 1`);
  if (!rows[0]) throw field('category', `There is no category called "${name}".`);
  return rows[0].id;
}

async function claimSlug(tx: Transaction, slug: string, productId: string | null): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`slug:${slug}`}, 0))`);
  const { rows } = await tx.execute(sql`SELECT 1 FROM products WHERE (slug = ${slug} OR ${slug} = ANY(slug_aliases)) AND id IS DISTINCT FROM ${productId}::uuid LIMIT 1`);
  if (rows.length) throw field('slug', 'Another product already uses this URL slug.', 'CONFLICT');
}

interface VariantDraft { color: string | null; size: string; sku?: string; paise: number; pinned: boolean; stock: number; loadedStock?: number; weight: number | null; ship: number | null; dims: string | null }

function variantDrafts(input: ProductInput): VariantDraft[] {
  const rows = input.variants ?? (input.colors.length ? input.colors : [NO_COLOR]).flatMap((color, ci, colors) =>
    (input.sizes.length ? input.sizes : ['One size']).map((size, si, sizes) => {
      // Spread the opening stock across the matrix, conserving the total.
      const n = colors.length * sizes.length; const i = ci * sizes.length + si;
      return { color, size, price: input.price, stock: Math.floor(input.stock / n) + (i < input.stock % n ? 1 : 0), loadedStock: undefined, weight: undefined, shippingWeight: undefined, dimensions: undefined, priceOverridden: false, sku: undefined };
    }));
  const seen = new Set<string>();
  return rows.map((v) => {
    const color = v.color && v.color !== NO_COLOR ? v.color : null;
    const key = variantKey(color, v.size);
    if (seen.has(key)) throw field('variants', `${color ?? 'No colour'} / ${v.size} appears twice.`);
    seen.add(key);
    return { color, size: v.size, sku: v.sku || undefined, paise: toPaise(v.price), pinned: Boolean(v.priceOverridden), stock: v.stock, loadedStock: v.loadedStock, weight: grams('variants', v.weight), ship: grams('variants', v.shippingWeight), dims: v.dimensions ?? null };
  });
}

async function writeVariants(tx: Transaction, productId: string, productSku: string, drafts: VariantDraft[], input: ProductInput, defs: Record<string, string>) {
  // Axes: colour first, then the product's option axis (Size / Model / …).
  const { rows: axes } = await tx.execute<{ definition_id: string; slug: string; pos: number }>(sql`
    SELECT l.definition_id, d.slug, l.variant_axis_position AS pos FROM product_attribute_links l JOIN attribute_definitions d ON d.id = l.definition_id WHERE l.product_id = ${productId} AND l.is_variant_axis`);
  const optionDef = axes.find((a) => a.slug !== 'color')?.definition_id ?? defs.size!;
  const hasColors = drafts.some((d) => d.color);
  if (hasColors && !axes.some((a) => a.slug === 'color')) {
    await tx.execute(sql`UPDATE product_attribute_links SET variant_axis_position = variant_axis_position + 1 WHERE product_id = ${productId} AND is_variant_axis`);
    await tx.execute(sql`INSERT INTO product_attribute_links (product_id, definition_id, is_variant_axis, variant_axis_position, axis_label) VALUES (${productId}, ${defs.color!}, true, 0, 'Colour')`);
  }
  if (!axes.some((a) => a.slug !== 'color')) {
    await tx.execute(sql`INSERT INTO product_attribute_links (product_id, definition_id, is_variant_axis, variant_axis_position, axis_label) VALUES (${productId}, ${optionDef}, true, ${hasColors ? 1 : 0}, 'Size') ON CONFLICT DO NOTHING`);
  }

  const colors = [...new Map(drafts.filter((d) => d.color).map((d) => [d.color!.toLowerCase(), d.color!])).values()];
  const options = [...new Map(drafts.map((d) => [d.size.toLowerCase(), d.size])).values()];
  const colorAttr = input.attributes.find((a) => a.name.toLowerCase() === 'color');
  const hexOf = (c: string) => colorAttr?.swatchHex[c] ?? null;
  const ids = await ensureAttributeValues(tx, [...colors.map((c) => ({ definitionId: defs.color!, value: c, swatchHex: hexOf(c) })), ...options.map((o) => ({ definitionId: optionDef, value: o }))]);
  const idOf = (def: string, v: string) => ids.get(`${def}|${v.toLowerCase()}`)!;
  const adj = input.priceAdjustments ?? {};
  const adjOf = (attr: string, v: string) => (adj[`${attr}:${v}`] ? toRupees(toPaise(adj[`${attr}:${v}`]!)) : null);
  await tx.execute(sql`UPDATE product_attribute_link_values lv SET price_adjustment = NULL FROM product_attribute_links l WHERE l.product_id = ${productId} AND lv.product_id = l.product_id AND lv.definition_id = l.definition_id AND l.is_variant_axis`);
  await tx.execute(sql`INSERT INTO product_attribute_link_values (product_id, definition_id, value_id, position, price_adjustment)
    SELECT ${productId}, x.def, x.val, x.pos, x.adj FROM ${records([
      ...colors.map((c, i) => ({ def: defs.color!, val: idOf(defs.color!, c), pos: i, adj: adjOf('Color', c) })),
      ...options.map((o, i) => ({ def: optionDef, val: idOf(optionDef, o), pos: i, adj: adjOf('Size', o) })),
    ])} AS x(def uuid, val uuid, pos smallint, adj numeric)
    ON CONFLICT (product_id, definition_id, value_id) DO UPDATE SET position = EXCLUDED.position, price_adjustment = EXCLUDED.price_adjustment`);
  for (const c of colors) {
    if (hexOf(c)) await tx.execute(sql`UPDATE attribute_values SET swatch_hex = ${hexOf(c)} WHERE id = ${idOf(defs.color!, c)}`);
  }

  const { rows: before } = await tx.execute<{ id: string; variant_key: string; stock: number; sku: string }>(sql`SELECT id, variant_key, stock, sku FROM product_variants WHERE product_id = ${productId}`);
  const prior = new Map(before.map((b) => [b.variant_key, b]));
  const used = new Set<string>();
  const rows = drafts.map((d) => {
    const key = variantKey(d.color, d.size);
    const old = prior.get(key);
    // Editor placeholders (built from the uuid) never become real SKUs.
    const given = d.sku && !d.sku.startsWith(productId) ? d.sku : undefined;
    let sku = given ?? old?.sku ?? `${productSku}${d.color ? `-${skuPart(d.color)}` : ''}-${skuPart(d.size)}`.slice(0, 64);
    if (used.has(sku)) sku = `${sku.slice(0, 55)}-${uuidv7().slice(-8)}`;
    used.add(sku);
    // Apply what the editor changed, so a sale made meanwhile is kept.
    const delta = old ? d.stock - (d.loadedStock ?? old.stock) : d.stock;
    return { id: old?.id ?? uuidv7(), key, sku, price: toRupees(d.paise), pinned: d.pinned, delta, weight: d.weight, ship: d.ship, dims: d.dims, color_id: d.color ? idOf(defs.color!, d.color) : null, option_id: idOf(optionDef, d.size) };
  });
  await tx.execute(sql`UPDATE product_variants SET is_active = false, updated_at = now() WHERE product_id = ${productId} AND variant_key NOT IN (${sql.join(rows.map((r) => sql`${r.key}`), sql`, `)})`);
  await tx.execute(sql`INSERT INTO product_variants (id, product_id, sku, variant_key, price, price_overridden, stock, weight_g, shipping_weight_g, dimensions, is_active)
    SELECT x.id, ${productId}, x.sku, x.key, x.price, x.pinned, 0, x.weight, x.ship, x.dims, true
    FROM ${records(rows)} AS x(id uuid, key text, sku text, price numeric, pinned boolean, weight int, ship int, dims text)
    ON CONFLICT (product_id, variant_key) DO UPDATE SET sku = EXCLUDED.sku, price = EXCLUDED.price, price_overridden = EXCLUDED.price_overridden,
      weight_g = EXCLUDED.weight_g, shipping_weight_g = EXCLUDED.shipping_weight_g, dimensions = EXCLUDED.dimensions, is_active = true, updated_at = now()`);
  await tx.execute(sql`INSERT INTO product_variant_attribute_values (variant_id, product_id, definition_id, value_id)
    SELECT x.vid, ${productId}, x.def, x.val FROM ${records(rows.flatMap((r) => [...(r.color_id ? [{ vid: r.id, def: defs.color!, val: r.color_id }] : []), { vid: r.id, def: optionDef, val: r.option_id }]))} AS x(vid uuid, def uuid, val uuid)
    ON CONFLICT (variant_id, definition_id) DO UPDATE SET value_id = EXCLUDED.value_id`);

  return { minPaise: Math.min(...drafts.map((d) => d.paise)), changes: rows.map((r) => ({ variantId: r.id, delta: r.delta })) };
}

async function writeExtras(tx: Transaction, productId: string, input: ProductInput) {
  // Images: kept by URL so labels and colour links survive reorders.
  const { rows: existing } = await tx.execute<{ id: string; url: string }>(sql`SELECT id, url FROM product_images WHERE product_id = ${productId}`);
  const urls = [...new Set(input.images)];
  await tx.execute(sql`UPDATE product_images SET is_primary = false WHERE product_id = ${productId}`);
  const removed = existing.filter((e) => !urls.includes(e.url));
  if (removed.length) await tx.execute(sql`DELETE FROM product_images WHERE id IN (${sql.join(removed.map((r) => sql`${r.id}::uuid`), sql`, `)})`);
  if (urls.length) {
    const byUrl = new Map(existing.map((e) => [e.url, e.id]));
    await tx.execute(sql`INSERT INTO product_images (id, product_id, url, alt, sort_order, is_primary)
      SELECT x.id, ${productId}, x.url, ${input.name}, x.ord, x.ord = 0 FROM ${records(urls.map((url, ord) => ({ id: byUrl.get(url) ?? uuidv7(), url, ord })))} AS x(id uuid, url text, ord int)
      ON CONFLICT (id) DO UPDATE SET sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary`);
  }
  await tx.execute(sql`DELETE FROM product_discounts WHERE product_id = ${productId}`);
  if (input.discounts.length) {
    await tx.execute(sql`INSERT INTO product_discounts (id, product_id, discount_type, value, starts_at, ends_at, is_active)
      SELECT x.id, ${productId}, x.t, x.v, x.s, x.e, x.a FROM ${records(input.discounts.map((d) => ({ id: uuidv7(), t: d.discountType, v: toRupees(toPaise(d.value)), s: new Date(d.startsAt).toISOString(), e: new Date(d.endsAt).toISOString(), a: d.isActive })))}
      AS x(id uuid, t text, v numeric, s timestamptz, e timestamptz, a boolean)`);
  }
  // Non-axis attributes (Placements + customs): the submitted set replaces the old one.
  const others = input.attributes.filter((a) => !['color', 'size'].includes(a.name.toLowerCase()) && a.values.length);
  const { rows: oldLinks } = await tx.execute<{ definition_id: string }>(sql`SELECT definition_id FROM product_attribute_links WHERE product_id = ${productId} AND NOT is_variant_axis`);
  if (oldLinks.length) {
    const list = sql.join(oldLinks.map((l) => sql`${l.definition_id}::uuid`), sql`, `);
    await tx.execute(sql`DELETE FROM product_attribute_link_values WHERE product_id = ${productId} AND definition_id IN (${list})`);
    await tx.execute(sql`DELETE FROM product_attribute_links WHERE product_id = ${productId} AND definition_id IN (${list})`);
  }
  for (const a of others) {
    const slug = slugify(a.name);
    await tx.execute(sql`INSERT INTO attribute_definitions (id, name, slug, display_type) SELECT ${uuidv7()}, ${a.name}, ${slug}, ${a.displayType}
      WHERE NOT EXISTS (SELECT 1 FROM attribute_definitions WHERE lower(name) = lower(${a.name}) OR slug = ${slug})`);
    const { rows } = await tx.execute<{ id: string }>(sql`SELECT id FROM attribute_definitions WHERE lower(name) = lower(${a.name}) OR slug = ${slug} LIMIT 1`);
    const def = rows[0]!.id;
    const ids = await ensureAttributeValues(tx, a.values.map((value) => ({ definitionId: def, value, swatchHex: a.swatchHex[value] ?? null })));
    await tx.execute(sql`INSERT INTO product_attribute_links (product_id, definition_id, is_variant_axis) VALUES (${productId}, ${def}, false) ON CONFLICT DO NOTHING`);
    const values = [...new Set(a.values.map((v) => ids.get(`${def}|${v.toLowerCase()}`)!))];
    await tx.execute(sql`INSERT INTO product_attribute_link_values (product_id, definition_id, value_id, position)
      SELECT ${productId}, ${def}, x.val, x.pos FROM ${records(values.map((val, pos) => ({ val, pos })))} AS x(val uuid, pos smallint) ON CONFLICT DO NOTHING`);
  }
}

async function definitions(db: Db): Promise<Record<string, string>> {
  const { rows } = await db.execute<{ id: string; slug: string }>(sql`SELECT id, slug FROM attribute_definitions`);
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]));
}

function assertPublishable(input: ProductInput, categoryId: string | null, drafts: VariantDraft[]) {
  if (input.publicationStatus !== 'published') return;
  if (!categoryId) throw field('category', 'Choose a category before publishing.', 'RULE_VIOLATION');
  if (!drafts.length) throw field('variants', 'Add at least one variant before publishing.', 'RULE_VIOLATION');
  if (drafts.some((d) => d.paise <= 0)) throw field('price', 'Every variant needs a price above ₹0 before publishing.', 'RULE_VIOLATION');
}

function assertCompare(input: ProductInput, minPaise: number) {
  if (input.compareAtPrice !== undefined && toPaise(input.compareAtPrice) <= minPaise) throw field('compareAtPrice', 'The compare-at price must be above the selling price.');
}

const translate = (error: unknown): never => {
  if ((error as { cause?: { code?: string; constraint?: string } }).cause?.code === '23503' && (error as { cause?: { constraint?: string } }).cause?.constraint?.includes('size_chart')) throw field('sizeChartId', 'That size chart no longer exists.');
  const constraint = uniqueConflict(error);
  if (constraint?.includes('sku')) throw field('variants', 'One of these SKUs is already used by another product.', 'CONFLICT');
  if (constraint?.includes('slug')) throw field('slug', 'Another product already uses this URL slug.', 'CONFLICT');
  throw error;
};

export async function adminCreateProduct(input: ProductInput, actorId: string): Promise<AdminProductDetail> {
  const drafts = variantDrafts(input);
  const id = uuidv7();
  try {
    return await withTransaction(async (tx) => {
      const categoryId = await resolveCategory(tx, input.category);
      assertPublishable(input, categoryId, drafts);
      assertCompare(input, Math.min(...drafts.map((d) => d.paise)));
      const slug = input.slug || slugify(input.name);
      await claimSlug(tx, slug, null);
      const sku = `TUW-${skuPart(input.name)}-${id.slice(-6).toUpperCase()}`;
      await tx.execute(sql`INSERT INTO products (id, sku, name, slug, price, status, source, partner_provider, partner_availability)
        VALUES (${id}, ${sku}, ${input.name}, ${slug}, ${toRupees(toPaise(input.price))}, 'draft', 'local', ${PARTNER_SLUG[input.partner]}, 'ready_to_print')`);
      await applyProduct(tx, id, sku, input, drafts, categoryId, slug, []);
      await recordAudit(tx, { actorId, action: 'product.create', entity: 'products', entityId: id, diff: { name: { from: null, to: input.name } } });
      return adminGetProduct(id, tx);
    });
  } catch (error) { return translate(error); }
}

async function applyProduct(tx: Transaction, id: string, sku: string, input: ProductInput, drafts: VariantDraft[], categoryId: string | null, slug: string, aliases: string[]) {
  const defs = await definitions(tx);
  const { minPaise, changes } = await writeVariants(tx, id, sku, drafts, input, defs);
  await writeExtras(tx, id, input);
  const base = input.basePrice ?? input.price;
  await tx.execute(sql`UPDATE products SET name = ${input.name}, slug = ${slug}, slug_aliases = ${textArray(aliases)}::varchar(280)[], category_id = ${categoryId},
      price = ${toRupees(minPaise)}, base_price = ${toRupees(toPaise(base))}, compare_at_price = ${input.compareAtPrice === undefined ? null : toRupees(toPaise(input.compareAtPrice))},
      status = ${toStatus[input.publicationStatus]}, partner_provider = ${PARTNER_SLUG[input.partner]}, low_stock_threshold = ${input.lowStockThreshold ?? null}, description = ${input.description},
      style_code = ${input.styleCode ?? null}, internal_serial_no = ${input.internalSerialNo ?? null}, weight_g = ${grams('weight', input.weight)}, shipping_weight_g = ${grams('shippingWeight', input.shippingWeight)},
      dimensions = ${input.dimensions ?? null}, gender = ${input.gender ?? null}, tax_rate = ${input.taxRate === undefined ? null : input.taxRate.toFixed(2)}, hsn_code = ${input.hsnCode ?? null},
      fabric_spec = ${input.fabricGsm ?? null}, cut = ${input.cut ?? null}, model_dims = ${input.modelDims ?? null}, care_instructions = ${input.care ?? null},
      photo_settings = ${JSON.stringify(input.photoSettings ?? {})}::jsonb, monogram_enabled = ${input.monogram?.enabled ?? false}, monogram_max_chars = ${input.monogram?.maxChars ?? 3},
      monogram_upcharge = ${toRupees(toPaise(input.monogram?.upcharge ?? 0))}, size_chart_id = ${input.sizeChartId ?? null}, exchange_policy = ${input.exchangePolicy}, product_kind = ${input.productKind}, updated_at = now() WHERE id = ${id}`);
  // After the product row, so alerts see its new status, partner and level.
  await adjustStock(tx, changes);
  await syncProductStock(tx, [id]);
}

/** The variant a shopper picked; null when the product has no such axis, so any variant counts. */
export async function findVariantId(productId: string, color: string | undefined, size: string | undefined): Promise<string | null> {
  const { rows } = await getDb().execute<{ id: string; variant_key: string }>(sql`SELECT id, variant_key FROM product_variants WHERE product_id = ${productId} AND is_active`);
  if (!size || size === 'One size') return rows.length === 1 ? rows[0]!.id : null;
  const wanted = [variantKey(color ?? null, size), variantKey(null, size)];
  const match = wanted.map((key) => rows.find((r) => r.variant_key === key)).find(Boolean);
  if (!match) throw new AppError('NOT_FOUND', 'That option is not available.');
  return match.id;
}

export async function adminUpdateProduct(id: string, input: ProductInput, actorId: string, expectedUpdatedAt?: string): Promise<AdminProductDetail> {
  const drafts = variantDrafts(input);
  try {
    return await withTransaction(async (tx) => {
      const { rows } = await tx.execute<{ sku: string; name: string; slug: string; slug_aliases: string[]; status: string; price: string; updated_at: string }>(sql`
        SELECT sku, name, slug, slug_aliases, status, price, updated_at FROM products WHERE id = ${id} AND deleted_at IS NULL FOR UPDATE`);
      const current = rows[0];
      if (!current) throw new AppError('NOT_FOUND', 'That product does not exist.');
      if (expectedUpdatedAt && new Date(current.updated_at).toISOString() !== expectedUpdatedAt) {
        throw new AppError('CONFLICT', 'Someone else changed this product while you were editing. Reopen it to see the latest version.');
      }
      const categoryId = await resolveCategory(tx, input.category);
      assertPublishable(input, categoryId, drafts);
      assertCompare(input, Math.min(...drafts.map((d) => d.paise)));
      const slug = input.slug || current.slug;
      // A renamed product keeps its old URL as an alias.
      let aliases = current.slug_aliases ?? [];
      if (slug !== current.slug) {
        await claimSlug(tx, slug, id);
        aliases = [...new Set([...aliases.filter((a) => a !== slug), current.slug])];
      }
      await applyProduct(tx, id, current.sku, input, drafts, categoryId, slug, aliases);
      const diff: Record<string, { from: unknown; to: unknown }> = {};
      if (current.name !== input.name) diff.name = { from: current.name, to: input.name };
      if (current.slug !== slug) diff.slug = { from: current.slug, to: slug };
      if (current.status !== toStatus[input.publicationStatus]) diff.status = { from: current.status, to: toStatus[input.publicationStatus] };
      const min = toRupees(Math.min(...drafts.map((d) => d.paise)));
      if (toRupees(toPaise(current.price)) !== min) diff.price = { from: current.price, to: min };
      await recordAudit(tx, { actorId, action: 'product.update', entity: 'products', entityId: id, diff });
      return adminGetProduct(id, tx);
    });
  } catch (error) { return translate(error); }
}

export async function adminSetProductsStatus(ids: string[], status: ProductInput['publicationStatus'], actorId: string): Promise<{ updated: string[]; refused: { id: string; name: string; reason: string }[] }> {
  return withTransaction(async (tx) => {
    const list = sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `);
    const { rows } = await tx.execute<{ id: string; name: string; status: string; category_id: string | null; active: number }>(sql`
      SELECT p.id, p.name, p.status, p.category_id, (SELECT count(*)::int FROM product_variants v WHERE v.product_id = p.id AND v.is_active AND v.price > 0) AS active
      FROM products p WHERE p.id IN (${list}) AND p.deleted_at IS NULL FOR UPDATE OF p`);
    const refused: { id: string; name: string; reason: string }[] = [];
    const updated: string[] = [];
    for (const p of rows) {
      if (status === 'published' && !p.category_id) refused.push({ id: p.id, name: p.name, reason: 'needs a category' });
      else if (status === 'published' && !p.active) refused.push({ id: p.id, name: p.name, reason: 'has no priced variant' });
      else updated.push(p.id);
    }
    if (updated.length) {
      await tx.execute(sql`UPDATE products SET status = ${toStatus[status]}, updated_at = now() WHERE id IN (${sql.join(updated.map((i) => sql`${i}::uuid`), sql`, `)})`);
      await recordAudit(tx, { actorId, action: 'product.status', entity: 'products', diff: Object.fromEntries(rows.filter((r) => updated.includes(r.id)).map((r) => [r.id, { from: r.status, to: toStatus[status] }])) });
    }
    return { updated, refused };
  });
}

/** Soft delete: order history keeps its product; the URL stays reserved. */
export async function adminDeleteProducts(ids: string[], actorId: string): Promise<{ deleted: string[] }> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ id: string; name: string }>(sql`UPDATE products SET deleted_at = now(), status = 'archived', updated_at = now()
      WHERE id IN (${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)}) AND deleted_at IS NULL RETURNING id, name`);
    if (rows.length) await recordAudit(tx, { actorId, action: 'product.delete', entity: 'products', diff: Object.fromEntries(rows.map((r) => [r.id, { from: r.name, to: null }])) });
    return { deleted: rows.map((r) => r.id) };
  });
}

// ------------------------------------------------------------- collections

export interface AdminCollection { id: string; name: string; slug: string; season: string; productIds: string[]; visibility: 'published' | 'draft' | 'scheduled'; publishedAt?: string; updatedAt: string; description: string }
type CollectionInput = z.infer<typeof collectionFields>;

export async function adminListCollections(db: Db = getDb()): Promise<AdminCollection[]> {
  const [cols, members] = await Promise.all([
    db.execute<{ id: string; name: string; slug: string; season: string | null; visibility: AdminCollection['visibility']; published_at: string | null; updated_at: string; description: string | null }>(sql`
      SELECT id, name, slug, season, visibility, published_at, updated_at, description FROM collections ORDER BY created_at DESC, id DESC`),
    db.execute<{ collection_id: string; product_id: string }>(sql`SELECT cp.collection_id, cp.product_id FROM collection_products cp JOIN products p ON p.id = cp.product_id AND p.deleted_at IS NULL ORDER BY cp.collection_id, cp.position`),
  ]);
  const by = new Map<string, string[]>();
  for (const m of members.rows) by.set(m.collection_id, [...(by.get(m.collection_id) ?? []), m.product_id]);
  return cols.rows.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, season: c.season ?? '', productIds: by.get(c.id) ?? [], visibility: c.visibility,
    ...(c.published_at ? { publishedAt: new Date(c.published_at).toISOString() } : {}),
    updatedAt: new Date(c.updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }), description: c.description ?? '',
  }));
}

export async function adminSaveCollection(id: string | undefined, input: CollectionInput, actorId: string): Promise<AdminCollection[]> {
  const productIds = [...new Set(input.productIds)];
  try {
    return await withTransaction(async (tx) => {
      if (productIds.length) {
        const { rows } = await tx.execute<{ id: string }>(sql`SELECT id FROM products WHERE deleted_at IS NULL AND id IN (${sql.join(productIds.map((i) => sql`${i}::uuid`), sql`, `)})`);
        if (rows.length !== productIds.length) throw field('productIds', 'One of the chosen products no longer exists.');
      }
      const publishedAt = input.visibility === 'scheduled' ? new Date(input.publishedAt!).toISOString() : input.visibility === 'published' ? new Date().toISOString() : null;
      const collectionId = id ?? uuidv7();
      if (id) {
        const { rows } = await tx.execute<{ visibility: string; published_at: string | null }>(sql`SELECT visibility, published_at FROM collections WHERE id = ${id} FOR UPDATE`);
        if (!rows[0]) throw new AppError('NOT_FOUND', 'That collection does not exist.');
        // Staying published keeps the original go-live date.
        const keep = input.visibility === 'published' && rows[0].visibility === 'published' ? rows[0].published_at : publishedAt;
        await tx.execute(sql`UPDATE collections SET name = ${input.name}, slug = ${input.slug}, season = ${input.season || null}, visibility = ${input.visibility}, published_at = ${keep}, description = ${input.description}, updated_at = now() WHERE id = ${id}`);
        await tx.execute(sql`DELETE FROM collection_products WHERE collection_id = ${id}`);
      } else {
        await tx.execute(sql`INSERT INTO collections (id, name, slug, season, visibility, published_at, description) VALUES (${collectionId}, ${input.name}, ${input.slug}, ${input.season || null}, ${input.visibility}, ${publishedAt}, ${input.description})`);
      }
      if (productIds.length) {
        await tx.execute(sql`INSERT INTO collection_products (collection_id, product_id, position) SELECT ${collectionId}, x.pid, x.pos FROM ${records(productIds.map((pid, pos) => ({ pid, pos })))} AS x(pid uuid, pos int)`);
      }
      await recordAudit(tx, { actorId, action: id ? 'collection.update' : 'collection.create', entity: 'collections', entityId: collectionId, diff: { name: { from: null, to: input.name } } });
      return adminListCollections(tx);
    });
  } catch (error) {
    if (uniqueConflict(error)) throw field('slug', 'Another collection already uses this slug.', 'CONFLICT');
    throw error;
  }
}

export async function adminDeleteCollection(id: string, actorId: string): Promise<AdminCollection[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ name: string }>(sql`DELETE FROM collections WHERE id = ${id} RETURNING name`);
    if (!rows[0]) throw new AppError('NOT_FOUND', 'That collection does not exist.');
    await recordAudit(tx, { actorId, action: 'collection.delete', entity: 'collections', entityId: id, diff: { name: { from: rows[0].name, to: null } } });
    return adminListCollections(tx);
  });
}

// -------------------------------------------------------------- categories

export interface AdminCategory { id: string; name: string; slug: string; isActive: boolean; showInNavbar: boolean; showInMegamenu: boolean; sortOrder: number; productCount: number }
type CategoryInput = z.infer<typeof categoryFields>;

export async function adminListCategories(db: Db = getDb()): Promise<AdminCategory[]> {
  const { rows } = await db.execute<{ id: string; name: string; slug: string; is_active: boolean; show_in_navbar: boolean; show_in_megamenu: boolean; sort_order: number; n: number }>(sql`
    SELECT c.id, c.name, c.slug, c.is_active, c.show_in_navbar, c.show_in_megamenu, c.sort_order,
           (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) AS n
    FROM categories c WHERE c.deleted_at IS NULL ORDER BY c.sort_order, c.name`);
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, isActive: c.is_active, showInNavbar: c.show_in_navbar, showInMegamenu: c.show_in_megamenu, sortOrder: c.sort_order, productCount: c.n }));
}

export async function adminSaveCategory(input: CategoryInput, actorId: string): Promise<AdminCategory[]> {
  if (input.name.toLowerCase() === UNCATEGORIZED.toLowerCase()) throw field('name', `"${UNCATEGORIZED}" is reserved for products with no category.`);
  const slug = input.slug || slugify(input.name);
  try {
    return await withTransaction(async (tx) => {
      const { rows: clash } = await tx.execute(sql`SELECT 1 FROM categories WHERE lower(name) = lower(${input.name}) AND deleted_at IS NULL AND id IS DISTINCT FROM ${input.id ?? null}::uuid LIMIT 1`);
      if (clash.length) throw field('name', 'A category with this name already exists.', 'CONFLICT');
      const id = input.id ?? uuidv7();
      if (input.id) {
        const { rowCount } = await tx.execute(sql`UPDATE categories SET name = ${input.name}, slug = ${slug}, is_active = ${input.isActive}, show_in_navbar = ${input.showInNavbar}, show_in_megamenu = ${input.showInMegamenu}, sort_order = ${input.sortOrder}, updated_at = now() WHERE id = ${input.id} AND deleted_at IS NULL`);
        if (!rowCount) throw new AppError('NOT_FOUND', 'That category does not exist.');
      } else {
        await tx.execute(sql`INSERT INTO categories (id, name, slug, is_active, show_in_navbar, show_in_megamenu, sort_order) VALUES (${id}, ${input.name}, ${slug}, ${input.isActive}, ${input.showInNavbar}, ${input.showInMegamenu}, ${input.sortOrder})`);
      }
      await recordAudit(tx, { actorId, action: input.id ? 'category.update' : 'category.create', entity: 'categories', entityId: id, diff: { name: { from: null, to: input.name } } });
      return adminListCategories(tx);
    });
  } catch (error) {
    if (uniqueConflict(error)) throw field('slug', 'Another category already uses this slug.', 'CONFLICT');
    throw error;
  }
}

export async function adminDeleteCategory(id: string, actorId: string): Promise<AdminCategory[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ name: string; n: number; kids: number }>(sql`
      SELECT c.name, (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) AS n,
             (SELECT count(*)::int FROM categories k WHERE k.parent_id = c.id AND k.deleted_at IS NULL) AS kids
      FROM categories c WHERE c.id = ${id} AND c.deleted_at IS NULL FOR UPDATE OF c`);
    const c = rows[0];
    if (!c) throw new AppError('NOT_FOUND', 'That category does not exist.');
    if (c.n) throw new AppError('RULE_VIOLATION', `Move the ${c.n} product${c.n === 1 ? '' : 's'} out of "${c.name}" before deleting it.`);
    if (c.kids) throw new AppError('RULE_VIOLATION', `"${c.name}" still has sub-categories.`);
    await tx.execute(sql`DELETE FROM categories WHERE id = ${id}`);
    await recordAudit(tx, { actorId, action: 'category.delete', entity: 'categories', entityId: id, diff: { name: { from: c.name, to: null } } });
    return adminListCategories(tx);
  });
}
