import 'server-only';
import { createHash } from 'node:crypto';
import { sql, type SQL } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toRupees } from '../../platform/money/index.ts';
import {
  draftRetailPaise, groupImportRows, parseQikinkListing, skuPart, slugify, titleCase, variantKey,
  PARTNER_COLOUR_HEX, type ImportIssue, type ImportProductGroup, type OptionAxis,
} from './planner.ts';

// Import job (DOC/backend/07). Creates DRAFT products — a person publishes.
// Re-running the same sheet is safe: a group maps to one product through
// (source, source_group_key); existing products keep every staff edit
// (name, slug, price, status), only missing variants and source rows are
// added. Each group runs in its own transaction so one bad group never
// aborts the batch; the job row records the honest outcome.

type Db = Transaction | ReturnType<typeof getDb>;

export interface ImportOptions {
  actorId: string | null;
  /** integration_providers slug that prints these products. */
  providerSlug?: string;
  source?: 'csv' | 'json';
}

export interface ImportedProduct {
  key: string;
  productId: string;
  created: boolean;
  variantsAdded: number;
}

export interface ImportReport {
  jobId: string;
  status: 'completed' | 'partial' | 'failed';
  totalRows: number;
  successRows: number;
  failedRows: number;
  created: number;
  updated: number;
  issues: ImportIssue[];
  products: ImportedProduct[];
}

/** products.source for any spreadsheet import (csv or its json export) — the job keeps the file format. */
const PRODUCT_SOURCE = 'csv';

const AXIS_LABEL: Record<OptionAxis, string> = { size: 'Size', model: 'Model', dimensions: 'Dimensions', capacity: 'Capacity', shape: 'Shape', style: 'Style' };

/** Postgres text[] from a JS array without driver array expansion. */
export const textArray = (values: string[]): SQL => sql`ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(values)}::jsonb))::text[]`;

const shortHash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 8).toUpperCase();
const bounded = (sku: string, key: string) => (sku.length <= 64 ? sku : `${sku.slice(0, 55)}-${shortHash(key)}`);

async function definitionIds(db: Db): Promise<Record<string, string>> {
  const { rows } = await db.execute<{ id: string; slug: string }>(sql`SELECT id, slug FROM attribute_definitions`);
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]));
}

/** Rows as a set-returning SQL source — one round trip for many rows. */
export const records = (rows: object[]): SQL => sql`jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)`;

const valueKey = (definitionId: string, value: string) => `${definitionId}|${value.toLowerCase()}`;

/**
 * Library value ids for many (definition, value) pairs, matched
 * case-insensitively; missing ones are created. ≤ 3 round trips; a race
 * with a parallel import resolves to the winner's row.
 */
export async function ensureAttributeValues(db: Db, items: { definitionId: string; value: string; swatchHex?: string | null }[]): Promise<Map<string, string>> {
  const unique = [...new Map(items.map((i) => [valueKey(i.definitionId, i.value), i])).values()];
  const ids = new Map<string, string>();
  if (!unique.length) return ids;
  const lookup = async () => {
    const { rows } = await db.execute<{ id: string; definition_id: string; v: string }>(sql`
      SELECT av.id, av.definition_id, lower(av.value) AS v
      FROM attribute_values av JOIN ${records(unique.map((u) => ({ definition_id: u.definitionId, v: u.value.toLowerCase() })))} AS x(definition_id uuid, v text)
        ON av.definition_id = x.definition_id AND lower(av.value) = x.v`);
    for (const r of rows) if (!ids.has(`${r.definition_id}|${r.v}`)) ids.set(`${r.definition_id}|${r.v}`, r.id);
  };
  await lookup();
  const missing = unique.filter((u) => !ids.has(valueKey(u.definitionId, u.value)));
  if (missing.length) {
    const ord = new Map<string, number>();
    await db.execute(sql`
      INSERT INTO attribute_values (id, definition_id, value, swatch_hex, position)
      SELECT x.id, x.definition_id, x.value, x.swatch_hex,
             coalesce((SELECT max(position) FROM attribute_values a WHERE a.definition_id = x.definition_id), -1) + x.ord
      FROM ${records(missing.map((m) => {
        const n = (ord.get(m.definitionId) ?? 0) + 1;
        ord.set(m.definitionId, n);
        return { id: uuidv7(), definition_id: m.definitionId, value: m.value, swatch_hex: m.swatchHex ?? null, ord: n };
      }))} AS x(id uuid, definition_id uuid, value text, swatch_hex text, ord int)
      ON CONFLICT (definition_id, value) DO NOTHING`);
    await lookup();
  }
  return ids;
}

/** Single-value convenience (seed scripts). */
export async function ensureAttributeValue(db: Db, definitionId: string, value: string, swatchHex?: string | null): Promise<string> {
  return (await ensureAttributeValues(db, [{ definitionId, value, swatchHex }])).get(valueKey(definitionId, value))!;
}

/** First free "base", "base-2", … among slugs and aliases (one query). */
async function uniqueSlug(db: Db, base: string): Promise<string> {
  // Two groups with the same name (one style sold for several genders)
  // allocate in turn, not in a race: the lock lasts until commit.
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`slug:${base}`}, 0))`);
  const { rows } = await db.execute<{ s: string }>(sql`
    SELECT slug AS s FROM products WHERE slug = ${base} OR slug LIKE ${`${base}-%`}
    UNION SELECT a FROM products, unnest(slug_aliases) AS a WHERE a = ${base} OR a LIKE ${`${base}-%`}`);
  const taken = new Set(rows.map((r) => r.s));
  for (let n = 1; ; n += 1) if (!taken.has(n === 1 ? base : `${base}-${n}`)) return n === 1 ? base : `${base}-${n}`;
}

async function uniqueSku(db: Db, base: string): Promise<string> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`sku:${base}`}, 0))`);
  const { rows } = await db.execute<{ sku: string }>(sql`SELECT sku FROM products WHERE sku = ${base} OR sku LIKE ${`${base}-%`}`);
  const taken = new Set(rows.map((r) => r.sku));
  for (let n = 1; ; n += 1) {
    const candidate = bounded(n === 1 ? base : `${base}-${n}`, `${base}#${n}`);
    if (!taken.has(candidate)) return candidate;
  }
}

async function importGroup(tx: Transaction, group: ImportProductGroup, defs: Record<string, string>, opts: Required<Pick<ImportOptions, 'source'>> & ImportOptions): Promise<ImportedProduct> {
  // Serialise imports of the same group: FOR UPDATE cannot lock a row that
  // does not exist yet, so two parallel runs would both try to create it.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`import:${PRODUCT_SOURCE}:${group.key}`}, 0))`);
  const existing = await tx.execute<{ id: string; sku: string }>(sql`
    SELECT id, sku FROM products WHERE source = ${PRODUCT_SOURCE} AND source_group_key = ${group.key} FOR UPDATE`);
  let productId = existing.rows[0]?.id;
  let productSku = existing.rows[0]?.sku;
  const created = !productId;
  const retail = group.variants.map((v) => draftRetailPaise(v.costPaise));
  const minCost = Math.min(...group.variants.map((v) => v.costPaise));

  if (!productId) {
    productId = uuidv7();
    productSku = await uniqueSku(tx, `TUW-${group.styleCode ?? `${skuPart(group.name)}-${group.gender.charAt(0)}`}`);
    const slug = await uniqueSlug(tx, slugify(group.name));
    await tx.execute(sql`
      INSERT INTO products (id, sku, name, slug, style_code, price, base_price, status, partner_provider, partner_availability,
                            source, source_group_key, internal_serial_no, weight_g, shipping_weight_g, dimensions, gender,
                            tax_rate, hsn_code, variant_label, price_is_draft)
      VALUES (${productId}, ${productSku}, ${group.name}, ${slug}, ${group.styleCode}, ${toRupees(Math.min(...retail))}, ${toRupees(minCost)},
              'draft', ${opts.providerSlug ?? null}, ${opts.providerSlug ? 'ready_to_print' : null},
              ${PRODUCT_SOURCE}, ${group.key}, ${group.rows[0]?.serialNo ?? null}, ${group.weightG ?? null}, ${group.shippingWeightG ?? null},
              ${group.dimensions ?? null}, ${group.gender}, ${group.taxRate === undefined ? null : group.taxRate.toFixed(2)},
              ${group.hsnCode}, ${AXIS_LABEL[group.optionAxis]}, true)`);
  }

  // Attribute library (one batch), then the product's links: colour axis
  // first, then the option axis, then placements (not an axis).
  const optionDef = defs[group.optionAxis]!;
  const items = [
    ...group.colors.map((c) => ({ definitionId: defs.color!, value: titleCase(c), swatchHex: PARTNER_COLOUR_HEX[c.toLowerCase()] ?? null })),
    ...group.options.map((o) => ({ definitionId: optionDef, value: o })),
    ...(defs.placements ? group.placements.map((p) => ({ definitionId: defs.placements!, value: titleCase(p) })) : []),
  ];
  const valueIds = await ensureAttributeValues(tx, items);
  const idOf = (definitionId: string, value: string) => valueIds.get(valueKey(definitionId, value))!;

  const links = [
    ...(group.colors.length ? [{ definition_id: defs.color!, axis: true, pos: 0, label: 'Colour' }] : []),
    { definition_id: optionDef, axis: true, pos: group.colors.length ? 1 : 0, label: AXIS_LABEL[group.optionAxis] },
    ...(defs.placements && group.placements.length ? [{ definition_id: defs.placements, axis: false, pos: null, label: null }] : []),
  ];
  await tx.execute(sql`
    INSERT INTO product_attribute_links (product_id, definition_id, is_variant_axis, variant_axis_position, axis_label)
    SELECT ${productId}, x.definition_id, x.axis, x.pos, x.label FROM ${records(links)} AS x(definition_id uuid, axis boolean, pos smallint, label text)
    ON CONFLICT (product_id, definition_id) DO NOTHING`);
  const linkValues = [
    ...group.colors.map((c, i) => ({ definition_id: defs.color!, value_id: idOf(defs.color!, titleCase(c)), position: i })),
    ...group.options.map((o, i) => ({ definition_id: optionDef, value_id: idOf(optionDef, o), position: i })),
    ...(defs.placements ? group.placements.map((p, i) => ({ definition_id: defs.placements!, value_id: idOf(defs.placements!, titleCase(p)), position: i })) : []),
  ];
  await tx.execute(sql`
    INSERT INTO product_attribute_link_values (product_id, definition_id, value_id, position)
    SELECT ${productId}, x.definition_id, x.value_id, x.position FROM ${records(linkValues)} AS x(definition_id uuid, value_id uuid, position smallint)
    ON CONFLICT (product_id, definition_id, value_id) DO NOTHING`);

  // Source rows (audit trail of what the sheet said).
  const { rows: sourceRows } = await tx.execute<{ id: string; source_row_no: number }>(sql`
    INSERT INTO product_source_rows (id, product_id, source_serial_no, source_row_no, raw_data)
    SELECT x.id, ${productId}, x.serial, x.row_no, x.raw FROM ${records(group.rows.map((r) => ({ id: uuidv7(), serial: r.serialNo ?? r.rowNo, row_no: r.rowNo, raw: r.raw })))}
      AS x(id uuid, serial int, row_no int, raw jsonb)
    ON CONFLICT (product_id, source_serial_no) DO UPDATE SET raw_data = EXCLUDED.raw_data, source_row_no = EXCLUDED.source_row_no, imported_at = now()
    RETURNING id, source_row_no`);
  const rowIds = new Map(sourceRows.map((r) => [r.source_row_no, r.id]));

  // Variants: only missing combinations are added; existing ones keep staff edits.
  // SKU parts are cut to 20 characters, so two long model names can meet
  // ("Redmi Note 12 Pro 5G…"); a repeat gets a hash of its full key instead.
  const usedSkus = new Set<string>();
  const drafts = group.variants.map((v, i) => {
    const key = variantKey(v.color, v.option);
    let sku = bounded(`${productSku}${v.color ? `-${skuPart(v.color)}` : ''}-${skuPart(v.option)}`, `${productSku}|${key}`);
    if (usedSkus.has(sku)) sku = bounded(`${productSku}-${shortHash(key)}`, key);
    usedSkus.add(sku);
    return {
      id: uuidv7(), key, row_id: rowIds.get(v.rowNo) ?? null,
      sku,
      price: toRupees(retail[i]!), weight: v.weightG ?? null, ship: v.shippingWeightG ?? null, dims: v.dimensions ?? null,
      color_id: v.color ? idOf(defs.color!, titleCase(v.color)) : null, option_id: idOf(optionDef, v.option),
    };
  });
  const { rows: added } = await tx.execute<{ id: string }>(sql`
    INSERT INTO product_variants (id, product_id, source_row_id, sku, variant_key, price, stock, weight_g, shipping_weight_g, dimensions)
    SELECT x.id, ${productId}, x.row_id, x.sku, x.key, x.price, 0, x.weight, x.ship, x.dims
    FROM ${records(drafts)} AS x(id uuid, key text, row_id uuid, sku text, price numeric, weight int, ship int, dims text)
    ON CONFLICT (product_id, variant_key) DO NOTHING RETURNING id`);
  const addedIds = new Set(added.map((r) => r.id));
  const pvav = drafts.filter((d) => addedIds.has(d.id)).flatMap((d) => [
    ...(d.color_id ? [{ variant_id: d.id, definition_id: defs.color!, value_id: d.color_id }] : []),
    { variant_id: d.id, definition_id: optionDef, value_id: d.option_id },
  ]);
  if (pvav.length) {
    await tx.execute(sql`
      INSERT INTO product_variant_attribute_values (variant_id, product_id, definition_id, value_id)
      SELECT x.variant_id, ${productId}, x.definition_id, x.value_id FROM ${records(pvav)} AS x(variant_id uuid, definition_id uuid, value_id uuid)`);
  }
  return { key: group.key, productId, created, variantsAdded: addedIds.size };
}

/** A unique-slug/sku race between two parallel groups is retried, not failed. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i += 1) {
    try {
      return await fn();
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code;
      if (code !== '23505' || i >= attempts) throw error;
    }
  }
}

export async function importGroups(groups: ImportProductGroup[], preIssues: ImportIssue[], rejectedRows: number, options: ImportOptions): Promise<ImportReport> {
  const opts = { source: 'json' as const, ...options };
  const db = getDb();
  const jobId = uuidv7();
  const totalRows = groups.reduce((n, g) => n + g.rows.length, 0) + rejectedRows;
  await db.execute(sql`INSERT INTO import_jobs (id, source, status, total_rows, created_by)
    VALUES (${jobId}, ${opts.source}, 'processing', ${totalRows}, ${opts.actorId})`);
  const defs = await definitionIds(db);

  const issues: ImportIssue[] = [...preIssues];
  const products: ImportedProduct[] = [];
  let successRows = 0;
  // A few groups at a time (pool max 5): each group is its own transaction.
  const queue = [...groups.entries()];
  const results: (ImportedProduct | undefined)[] = [];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [index, group] = next;
      try {
        results[index] = await withRetry(() => withTransaction((tx) => importGroup(tx, group, defs, opts)));
        successRows += group.rows.length;
      } catch (error) {
      // The driver's own message (constraint name) is the useful part, not the SQL text.
      const cause = (error as { cause?: { message?: string } }).cause?.message ?? (error as Error).message;
      issues.push({ row: group.rows[0]?.rowNo ?? 0, message: `"${group.name}" was not imported: ${cause.split('\n')[0]}` });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, groups.length) }, worker));
  products.push(...results.filter((r): r is ImportedProduct => Boolean(r)));
  const failedRows = totalRows - successRows;
  const status = successRows === 0 ? 'failed' : failedRows > 0 ? 'partial' : 'completed';
  await db.execute(sql`UPDATE import_jobs SET status = ${status}, success_count = ${successRows}, failed_count = ${failedRows},
    errors = ${JSON.stringify(issues.slice(0, 500))}::jsonb, updated_at = now() WHERE id = ${jobId}`);
  return {
    jobId, status, totalRows, successRows, failedRows,
    created: products.filter((p) => p.created).length,
    updated: products.filter((p) => !p.created).length,
    issues, products,
  };
}

/** Qikink "Final Listing" JSON → draft products (the admin import and the demo seed call this). */
export async function importQikinkListing(rows: unknown[], options: ImportOptions): Promise<ImportReport> {
  const parsed = parseQikinkListing(rows);
  const grouped = groupImportRows(parsed.rows);
  return importGroups(grouped.groups, [...parsed.issues, ...grouped.issues], rows.length - parsed.rows.length, { providerSlug: 'qikink', ...options });
}
