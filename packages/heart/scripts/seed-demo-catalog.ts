// Demo catalog seed (TL-BE-05). Run: pnpm db:seed-catalog
//
// 1. Imports tuw-website/data/qikink-listing.json through the real import
//    job (draft products, same code path as the admin import).
// 2. Applies the storefront's existing demo classification — titles, slugs,
//    categories, page type, copy, placeholder photos — which the import job
//    itself never guesses (DOC/backend/07), plus the 14 hand-written products
//    (db/seed/catalog/curated-products.json) and the 4 collections.
// 3. Publishes them.
//
// Re-runnable: a product is classified once (external_id is set then);
// later runs never overwrite staff edits. Collections are recomputed.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, closeDb, type Transaction } from '../src/platform/db/index.ts';
import { uuidv7 } from '../src/platform/ids/index.ts';
import { toPaise, toRupees } from '../src/platform/money/index.ts';
import { importGroups, ensureAttributeValues, records, textArray } from '../src/modules/catalog/import.ts';
import { groupImportRows, parseQikinkListing, slugify, skuPart, variantKey, type ImportProductGroup } from '../src/modules/catalog/planner.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const listing = JSON.parse(readFileSync(join(ROOT, 'tuw-website/data/qikink-listing.json'), 'utf8')) as unknown[];
type Curated = {
  id: string; slug: string; aliases?: string[]; title: string; subtitle: string; category: string; partnerStyleCode?: string;
  priceINR: number; images: { url: string; alt: string; color?: string; label?: string }[]; colors: { name: string; hex: string; value: string }[];
  sizes: { size: string }[]; specTable?: unknown; faqs?: { question: string; answer: string }[]; description: string; details: string[];
  careInstructions: string[]; composition: string; sustainabilityBadge?: string; isNew?: boolean;
};
const curated = JSON.parse(readFileSync(join(ROOT, 'db/seed/catalog/curated-products.json'), 'utf8')) as Curated[];
const collections = JSON.parse(readFileSync(join(ROOT, 'db/seed/catalog/collections.json'), 'utf8')) as {
  slug: string; title: string; tagline: string; description: string; coverImage: string; categories?: string[]; titleIncludes?: string[];
}[];

// Curated products without a Qikink style code map to name groups.
const CURATED_GROUP: Record<string, string> = {
  'TOTE-ZIP': 'name:tote bag zipper|gender:unisex',
  'MUG-BLK-11': 'name:black coffee mug|gender:unisex',
  'KIDS-HOODIE': 'name:hoodie|gender:kids',
};
const groupKeyOf = (c: Curated) => CURATED_GROUP[c.partnerStyleCode ?? ''] ?? `code:${(c.partnerStyleCode ?? '').toLowerCase()}`;

const CATEGORIES = [
  ['hoodies', 'Hoodies & Sweats'], ['tees', 'T-Shirts & Tops'], ['jackets', 'Jackets'], ['pants', 'Pants & Joggers'],
  ['kids', 'Kids'], ['mugs', 'Mugs & Drinkware'], ['accessories', 'Accessories & Objects'], ['capsules', 'Capsules'],
] as const;

// ---- demo classification (ported from the retired generate-catalog script) ----
type PType = 'apparel' | 'kids-apparel' | 'pet' | 'drinkware' | 'wall-art' | 'phone-case' | 'bag' | 'stationery' | 'home';
function productTypeFor(name: string, gender: string): PType {
  const n = name.toLowerCase();
  if (/dog/.test(n)) return 'pet';
  if (/mug|bottle|sipper|tumbler|cup|coaster/.test(n)) return 'drinkware';
  if (/poster|canvas|frame|wall/.test(n)) return 'wall-art';
  if (/case|cover/.test(n) && /mobile|phone|iphone|samsung|oneplus|redmi|vivo|oppo|realme|case/.test(n)) return 'phone-case';
  if (/tote|bag|pouch|backpack/.test(n)) return 'bag';
  if (/planner|notebook|diary|sticker|bookmark|calendar|card|patch|badge/.test(n)) return 'stationery';
  if (/cushion|pillow|placemat|puzzle|ornament|clock|stand|mousepad|mouse pad|keychain|key chain|magnet|towel|apron|blanket|mask|cap|hat|socks/.test(n)) return 'home';
  if (['Kids', 'Boy', 'Girl'].includes(gender) || /kids|romper|baby/.test(n)) return 'kids-apparel';
  return 'apparel';
}
function categoryFor(name: string, type: PType): string {
  const n = name.toLowerCase();
  if (type === 'kids-apparel') return 'kids';
  if (type === 'drinkware') return 'mugs';
  if (type !== 'apparel') return 'accessories';
  if (/jacket|bomber|varsity/.test(n)) return 'jackets';
  if (/hood|sweatshirt/.test(n)) return 'hoodies';
  if (/jogger|pant|short|trouser/.test(n)) return 'pants';
  return 'tees';
}
const GENDER_PREFIX: Record<string, string> = { Male: "Men's", Female: "Women's", Boy: "Boys'", Girl: "Girls'", Kids: 'Kids' };
const titleCase = (s: string) => s.replace(/([a-z])Sublimation/gi, '$1 Sublimation').replace(/\s+/g, ' ').trim()
  .replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
  .replace(/\bAop\b/g, 'AOP').replace(/\bIPhone\b/gi, 'iPhone').replace(/\bT-shirt/gi, 'T-Shirt');
function displayTitle(name: string, gender: string, type: PType, nameCount: number) {
  let t = titleCase(name.replace(/\bWomens\b/i, "Women's").replace(/\bMens\b/i, "Men's").replace(/\bNonZipper\b/i, 'Non-Zipper'));
  const hasPrefix = /^(men's|women's|kids|boys'|girls')/i.test(t);
  if (!hasPrefix && (nameCount > 1 || type === 'kids-apparel') && GENDER_PREFIX[gender] && gender !== 'Unisex') t = `${GENDER_PREFIX[gender]} ${t}`;
  return t;
}
const VARIANT_LABEL: Record<PType, string> = { apparel: 'Size', 'kids-apparel': 'Age', pet: 'Size', drinkware: 'Option', 'wall-art': 'Size', 'phone-case': 'Phone model', bag: 'Option', stationery: 'Option', home: 'Option' };
const CARE: Record<PType, string[]> = {
  apparel: ['Machine wash cold, inside out', 'Do not bleach', 'Do not iron directly on the print', 'Line dry in shade'],
  'kids-apparel': ['Machine wash cold, inside out', 'Do not bleach', 'Do not iron directly on the print', 'Line dry in shade'],
  pet: ['Hand wash cold', 'Do not bleach', 'Line dry in shade'],
  drinkware: ['Hand wash recommended to keep the print sharp', 'Care details to be confirmed with our print partner (draft)'],
  'wall-art': ['Wipe gently with a dry, soft cloth', 'Keep away from direct sunlight and damp walls'],
  'phone-case': ['Wipe clean with a soft, slightly damp cloth'],
  bag: ['Spot clean or hand wash cold', 'Do not iron directly on the print', 'Line dry in shade'],
  stationery: ['Keep dry and away from direct sunlight'],
  home: ['Care details to be confirmed with our print partner (draft)'],
};
const DESCRIPTION: Record<PType, string> = {
  apparel: 'printed to order with the leaping deer of The Unplugged Wear.', 'kids-apparel': 'for kids, printed to order with the leaping deer of The Unplugged Wear.',
  pet: 'for dogs, printed to order with the leaping deer of The Unplugged Wear.', drinkware: 'printed to order with the leaping deer of The Unplugged Wear.',
  'wall-art': 'printed to order for your wall.', 'phone-case': 'printed to order for your phone model.', bag: 'printed to order with the leaping deer of The Unplugged Wear.',
  stationery: 'printed to order with the leaping deer of The Unplugged Wear.', home: 'printed to order with the leaping deer of The Unplugged Wear.',
};
const SAMPLE = { men: ['men-linen-blazer.jpg', 'men-navy-blazer.jpg', 'men-linen-shirt.jpg'], women: ['women-suede-jacket.jpg', 'women-brown-top.jpg', 'women-white-cardigan.jpg', 'women-pleated-skirt.jpg'] };
const samplePhoto = (gender: string, n: number) => {
  const pool = gender === 'Male' || gender === 'Boy' ? SAMPLE.men : gender === 'Female' || gender === 'Girl' ? SAMPLE.women : [...SAMPLE.women, ...SAMPLE.men];
  return `/images/samples/${pool[n % pool.length]}`;
};
const DRAFT_COMPOSITION = 'Material details to be confirmed with our print partner (draft)';
const CURATED_TYPE: Record<string, PType> = { hoodies: 'apparel', tees: 'apparel', pants: 'apparel', jackets: 'apparel', kids: 'kids-apparel', mugs: 'drinkware' };

async function uniqueSlug(tx: Transaction, base: string, productId: string) {
  for (let n = 1; ; n += 1) {
    const s = n === 1 ? base : `${base}-${n}`;
    const { rows } = await tx.execute(sql`SELECT 1 FROM products WHERE (slug = ${s} OR ${s} = ANY(slug_aliases)) AND id <> ${productId}`);
    if (!rows.length) return s;
  }
}

async function categoryIds(tx: Transaction) {
  for (const [i, [slug, name]] of CATEGORIES.entries()) {
    await tx.execute(sql`INSERT INTO categories (id, name, slug, sort_order, show_in_navbar, show_in_megamenu) VALUES (${uuidv7()}, ${name}, ${slug}, ${i}, false, true)
      ON CONFLICT (slug) DO NOTHING`);
  }
  const { rows } = await tx.execute<{ id: string; slug: string }>(sql`SELECT id, slug FROM categories`);
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]));
}

async function classifyGenerated(tx: Transaction, productId: string, group: ImportProductGroup, index: number, nameCount: number, cats: Record<string, string>) {
  const type = productTypeFor(group.name, group.gender);
  const title = displayTitle(group.name, group.gender, type, nameCount);
  const slug = await uniqueSlug(tx, slugify(title), productId);
  const wearable = type === 'apparel' || type === 'kids-apparel' || type === 'pet';
  const options = group.options;
  const range = options.length > 1 ? `${options[0]}–${options[options.length - 1]}` : options[0] ?? 'One size';
  const audienceLabel: Record<string, string> = { Unisex: 'Unisex', Male: 'Men', Female: 'Women', Kids: 'Kids', Boy: 'Boys', Girl: 'Girls' };
  const subtitle = [wearable ? audienceLabel[group.gender] : null, options.length > 1 ? (wearable ? range : `${options.length} options`) : options[0],
    group.colors.length > 1 ? `${group.colors.length} colours` : null].filter(Boolean).join(' · ');
  const label = VARIANT_LABEL[type];
  const details = [
    `${label}${options.length > 1 ? 's' : ''}: ${options.join(', ')}`,
    `Printed to order — print areas: ${group.placements.length ? group.placements.join(', ').toLowerCase() : 'to be confirmed'}`,
    ...(group.weightG ? [`Approximate weight: ${group.weightG} g`] : []),
  ];
  const externalId = `qk-${group.styleCode ? group.styleCode.toLowerCase() : slug}`;
  await tx.execute(sql`UPDATE products SET name = ${title}, slug = ${slug}, short_description = ${subtitle}, external_id = ${externalId},
      description = ${`${title} ${DESCRIPTION[type]} Full description to follow (draft).`}, details = ${textArray(details)},
      care_instructions = ${CARE[type].join('\n')}, composition = ${DRAFT_COMPOSITION}, category_id = ${cats[categoryFor(group.name, type)]!},
      product_type = ${type}, variant_label = ${label}, badge = 'Printed to order', status = 'active', updated_at = now()
    WHERE id = ${productId}`);
  await tx.execute(sql`INSERT INTO product_images (id, product_id, url, alt, sort_order, is_primary)
    VALUES (${uuidv7()}, ${productId}, ${samplePhoto(group.gender, index)}, ${`Placeholder sample photo for the ${title}`}, 0, true)`);
}

async function applyCurated(tx: Transaction, productId: string, c: Curated, cats: Record<string, string>, defs: Record<string, string>) {
  const type = CURATED_TYPE[c.category] ?? (/mug/i.test(c.title) ? 'drinkware' : /tote|bag/i.test(c.title) ? 'bag' : 'home');
  const pricePaise = toPaise(String(c.priceINR));
  await tx.execute(sql`UPDATE products SET name = ${c.title}, slug = ${await uniqueSlug(tx, c.slug, productId)}, slug_aliases = ${textArray(c.aliases ?? [])},
      short_description = ${c.subtitle}, external_id = ${c.id}, description = ${c.description}, details = ${textArray(c.details)},
      care_instructions = ${c.careInstructions.join('\n')}, composition = ${c.composition}, spec_table = ${c.specTable ? JSON.stringify(c.specTable) : null}::jsonb,
      category_id = ${cats[c.category]!}, product_type = ${type}, variant_label = ${type === 'kids-apparel' ? 'Age' : 'Size'},
      badge = ${c.sustainabilityBadge ?? null}, tags = ${textArray(c.isNew ? ['new'] : [])}::varchar(50)[], price = ${toRupees(pricePaise)}, base_price = ${toRupees(pricePaise)},
      price_is_draft = false, status = 'active', updated_at = now()
    WHERE id = ${productId}`);

  // The curated colour × size set is what the store sells; other partner
  // variants stay in the catalog, switched off.
  const { rows: links } = await tx.execute<{ definition_id: string; slug: string }>(sql`
    SELECT l.definition_id, d.slug FROM product_attribute_links l JOIN attribute_definitions d ON d.id = l.definition_id
    WHERE l.product_id = ${productId} AND l.is_variant_axis ORDER BY l.variant_axis_position`);
  const optionDef = links.find((l) => l.slug !== 'color')?.definition_id ?? defs.size!;
  let colorDef = links.find((l) => l.slug === 'color')?.definition_id;
  if (!colorDef) {
    colorDef = defs.color!;
    await tx.execute(sql`UPDATE product_attribute_links SET variant_axis_position = variant_axis_position + 1 WHERE product_id = ${productId} AND is_variant_axis`);
    await tx.execute(sql`INSERT INTO product_attribute_links (product_id, definition_id, is_variant_axis, variant_axis_position, axis_label)
      VALUES (${productId}, ${colorDef}, true, 0, 'Colour') ON CONFLICT DO NOTHING`);
  }
  await tx.execute(sql`UPDATE product_variants SET is_active = false, updated_at = now() WHERE product_id = ${productId}`);
  const { rows: skuRows } = await tx.execute<{ sku: string }>(sql`SELECT sku FROM products WHERE id = ${productId}`);
  const productSku = skuRows[0]!.sku;
  const ids = await ensureAttributeValues(tx, [
    ...c.colors.map((x) => ({ definitionId: colorDef!, value: x.name, swatchHex: x.hex })),
    ...c.sizes.map((x) => ({ definitionId: optionDef, value: x.size })),
  ]);
  const idOf = (def: string, value: string) => ids.get(`${def}|${value.toLowerCase()}`)!;
  await tx.execute(sql`INSERT INTO product_attribute_link_values (product_id, definition_id, value_id, position)
    SELECT ${productId}, x.def, x.val, x.pos FROM ${records([
      ...c.colors.map((x, i) => ({ def: colorDef, val: idOf(colorDef!, x.name), pos: i })),
      ...c.sizes.map((x, i) => ({ def: optionDef, val: idOf(optionDef, x.size), pos: i })),
    ])} AS x(def uuid, val uuid, pos smallint)
    ON CONFLICT (product_id, definition_id, value_id) DO UPDATE SET position = EXCLUDED.position`);
  const combos = c.colors.flatMap((color) => c.sizes.map((size) => ({
    id: uuidv7(), key: variantKey(color.name, size.size), sku: `${productSku}-${skuPart(color.name)}-${skuPart(size.size)}`.slice(0, 64),
    color_id: idOf(colorDef!, color.name), size_id: idOf(optionDef, size.size),
  })));
  const { rows: variants } = await tx.execute<{ id: string; variant_key: string }>(sql`
    INSERT INTO product_variants (id, product_id, sku, variant_key, price, price_overridden, stock)
    SELECT x.id, ${productId}, x.sku, x.key, ${toRupees(pricePaise)}, true, 0 FROM ${records(combos)} AS x(id uuid, key text, sku text)
    ON CONFLICT (product_id, variant_key) DO UPDATE SET is_active = true, price = EXCLUDED.price, price_overridden = true, updated_at = now()
    RETURNING id, variant_key`);
  const variantByKey = new Map(variants.map((v) => [v.variant_key, v.id]));
  await tx.execute(sql`INSERT INTO product_variant_attribute_values (variant_id, product_id, definition_id, value_id)
    SELECT x.vid, ${productId}, x.def, x.val FROM ${records(combos.flatMap((k) => [
      { vid: variantByKey.get(k.key), def: colorDef, val: k.color_id },
      { vid: variantByKey.get(k.key), def: optionDef, val: k.size_id },
    ]))} AS x(vid uuid, def uuid, val uuid) ON CONFLICT DO NOTHING`);

  await tx.execute(sql`DELETE FROM product_images WHERE product_id = ${productId}`);
  await tx.execute(sql`INSERT INTO product_images (id, product_id, url, alt, label, color_value_id, sort_order, is_primary)
    SELECT x.id, ${productId}, x.url, x.alt, x.label, x.color_id, x.ord, x.ord = 0 FROM ${records(c.images.map((img, i) => {
      const colorName = img.color ? c.colors.find((x) => x.value === img.color)?.name : undefined;
      return { id: uuidv7(), url: img.url, alt: img.alt, label: img.label ?? null, color_id: colorName ? idOf(colorDef!, colorName) : null, ord: i };
    }))} AS x(id uuid, url text, alt text, label text, color_id uuid, ord int)`);
  await tx.execute(sql`DELETE FROM faqs WHERE scope = 'product' AND product_id = ${productId}`);
  if (c.faqs?.length) {
    await tx.execute(sql`INSERT INTO faqs (id, scope, product_id, question, answer, sort_order, is_published)
      SELECT x.id, 'product', ${productId}, x.q, x.a, x.ord, true FROM ${records(c.faqs.map((f, i) => ({ id: uuidv7(), q: f.question, a: f.answer, ord: i })))}
      AS x(id uuid, q text, a text, ord int)`);
  }
}

async function main() {
  const parsed = parseQikinkListing(listing);
  const grouped = groupImportRows(parsed.rows);
  // A style split by conflicting HSN codes ("code:mp25|hsn:…") attaches the
  // curated product to its largest part; the conflict stays in the report.
  const resolveKey = (key: string) => {
    if (grouped.groups.some((g) => g.key === key)) return key;
    const parts = grouped.groups.filter((g) => g.key.startsWith(`${key}|hsn:`)).sort((a, b) => b.rows.length - a.rows.length);
    if (parts[0]) console.warn(`note: ${key} is split by HSN (${parts.map((p) => p.key.split('|hsn:')[1]).join(' vs ')}); curated product uses ${parts[0].key}`);
    return parts[0]?.key ?? key;
  };
  const curatedKeys = new Map(curated.map((c) => [resolveKey(groupKeyOf(c)), c]));
  const missing = [...curatedKeys.keys()].filter((k) => !grouped.groups.some((g) => g.key === k));
  if (missing.length) throw new Error(`Curated products without a listing group: ${missing.join(', ')}`);
  // Curated first so they lead the default (newest-first is not used) order.
  const order = [...curatedKeys.keys()].map((k) => grouped.groups.find((g) => g.key === k)!).concat(grouped.groups.filter((g) => !curatedKeys.has(g.key)));

  const report = await importGroups(order, [...parsed.issues, ...grouped.issues], listing.length - parsed.rows.length, { actorId: null, providerSlug: 'qikink', source: 'json' });
  console.log(`import job ${report.jobId}: ${report.status} — ${report.created} created, ${report.updated} already there, ${report.failedRows} failed rows, ${report.issues.length} notices`);

  const db = getDb();
  const { rows: defRows } = await db.execute<{ id: string; slug: string }>(sql`SELECT id, slug FROM attribute_definitions`);
  const defs = Object.fromEntries(defRows.map((r) => [r.slug, r.id]));
  const nameCounts = new Map<string, number>();
  for (const g of order) nameCounts.set(g.name.toLowerCase(), (nameCounts.get(g.name.toLowerCase()) ?? 0) + 1);

  let classified = 0;
  const cats = await withTransaction((tx) => categoryIds(tx));
  const { rows: done } = await db.execute<{ id: string }>(sql`SELECT id FROM products WHERE external_id IS NOT NULL`);
  const already = new Set(done.map((r) => r.id));
  // Slugs are unique, so products are classified one transaction each, a few at a time.
  const queue = [...order.entries()].filter(([, g]) => {
    const product = report.products.find((p) => p.key === g.key);
    return product && !already.has(product.productId); // classified once — later runs keep staff edits
  });
  const worker = async (jobs: typeof queue) => {
    for (let next = jobs.shift(); next; next = jobs.shift()) {
      const [i, g] = next;
      const productId = report.products.find((p) => p.key === g.key)!.productId;
      const c = curatedKeys.get(g.key);
      for (let attempt = 1; ; attempt += 1) {
        try {
          await withTransaction((tx) => (c ? applyCurated(tx, productId, c, cats, defs) : classifyGenerated(tx, productId, g, i, nameCounts.get(g.name.toLowerCase()) ?? 1, cats)));
          break;
        } catch (error) {
          // two products racing for the same slug: retry picks the next free one
          if ((error as { cause?: { code?: string } }).cause?.code !== '23505' || attempt >= 3) throw error;
        }
      }
      classified += 1;
    }
  };
  // Curated first (their hand-picked slugs win), then the rest in parallel.
  const curatedJobs = queue.filter(([, g]) => curatedKeys.has(g.key));
  const restJobs = queue.filter(([, g]) => !curatedKeys.has(g.key));
  await Promise.all(Array.from({ length: 4 }, () => worker(curatedJobs)));
  await Promise.all(Array.from({ length: 4 }, () => worker(restJobs)));

  await withTransaction(async (tx) => {
    // Collections: same rules as the old storefront fixture, stored as membership.
    for (const col of collections) {
      await tx.execute(sql`INSERT INTO collections (id, name, slug, visibility, published_at, tagline, description, cover_image_url)
        VALUES (${uuidv7()}, ${col.title}, ${col.slug}, 'published', now(), ${col.tagline}, ${col.description}, ${col.coverImage})
        ON CONFLICT (slug) DO NOTHING`);
      const { rows: [row] } = await tx.execute<{ id: string }>(sql`SELECT id FROM collections WHERE slug = ${col.slug}`);
      const { rows: members } = await tx.execute<{ id: string }>(col.titleIncludes?.length
        ? sql`SELECT id FROM products WHERE status = 'active' AND deleted_at IS NULL
              AND (${sql.join(col.titleIncludes.map((w) => sql`name ILIKE ${`%${w}%`}`), sql` OR `)}) ORDER BY created_at, id`
        : sql`SELECT p.id FROM products p JOIN categories c ON c.id = p.category_id WHERE p.status = 'active' AND p.deleted_at IS NULL
              AND c.slug IN (${sql.join((col.categories ?? []).map((s) => sql`${s}`), sql`, `)}) ORDER BY p.created_at, p.id`);
      await tx.execute(sql`DELETE FROM collection_products WHERE collection_id = ${row!.id}`);
      for (const [pos, m] of members.entries()) {
        await tx.execute(sql`INSERT INTO collection_products (collection_id, product_id, position) VALUES (${row!.id}, ${m.id}, ${pos})`);
      }
    }
  });
  const { rows: [counts] } = await db.execute<{ active: number; draft: number }>(sql`
    SELECT count(*) FILTER (WHERE status = 'active')::int AS active, count(*) FILTER (WHERE status = 'draft')::int AS draft FROM products WHERE deleted_at IS NULL`);
  console.log(`classified ${classified} products; catalog now ${counts!.active} active, ${counts!.draft} draft`);
}

main().then(() => closeDb()).catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
