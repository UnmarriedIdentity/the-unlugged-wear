import 'server-only';
import { sql } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { ensureAttributeValues, textArray } from './import.ts';
import { slugify } from './planner.ts';
import type { attributeCreate, attributeUpdate, sizeChartFields } from './schemas.ts';

// Attribute library + size charts. New option types are data rows, never
// schema changes. In-use definitions and values cannot be deleted (products
// and order history point at them); they can be switched off instead.

type Db = Transaction | ReturnType<typeof getDb>;
const field = (name: string, message: string, code: 'VALIDATION_FAILED' | 'CONFLICT' | 'RULE_VIOLATION' = 'VALIDATION_FAILED') => new AppError(code, message, [{ field: name, message }]);
/** The variant axes every product relies on. */
const CORE = new Set(['color', 'size']);

export interface LibraryAttribute {
  id: string; name: string; slug: string; values: string[]; swatchHex: Record<string, string>; displayType: 'pill' | 'swatch' | 'radio'; enabled: boolean;
  showOnPdp: boolean; showOnCheckout: boolean; showOnAdmin: boolean; productCount: number; core: boolean;
}

export async function listLibrary(db: Db = getDb()): Promise<LibraryAttribute[]> {
  const [defs, values] = await Promise.all([
    db.execute<{ id: string; name: string; slug: string; display_type: LibraryAttribute['displayType']; is_active: boolean; show_on_pdp: boolean; show_on_checkout: boolean; show_on_admin: boolean; n: number }>(sql`
      SELECT d.id, d.name, d.slug, d.display_type, d.is_active, d.show_on_pdp, d.show_on_checkout, d.show_on_admin,
             (SELECT count(*)::int FROM product_attribute_links l JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL WHERE l.definition_id = d.id) AS n
      FROM attribute_definitions d ORDER BY d.created_at, d.id`),
    db.execute<{ definition_id: string; value: string; swatch_hex: string | null }>(sql`SELECT definition_id, value, swatch_hex FROM attribute_values ORDER BY definition_id, position, value`),
  ]);
  return defs.rows.map((d) => {
    const own = values.rows.filter((v) => v.definition_id === d.id);
    return {
      id: d.id, name: d.name, slug: d.slug, values: own.map((v) => v.value),
      swatchHex: Object.fromEntries(own.filter((v) => v.swatch_hex).map((v) => [v.value, v.swatch_hex!])),
      displayType: d.display_type, enabled: d.is_active, showOnPdp: d.show_on_pdp, showOnCheckout: d.show_on_checkout, showOnAdmin: d.show_on_admin,
      productCount: d.n, core: CORE.has(d.slug),
    };
  });
}

export async function createAttribute(input: z.infer<typeof attributeCreate>, actorId: string): Promise<LibraryAttribute[]> {
  return withTransaction(async (tx) => {
    const slug = slugify(input.name);
    const { rows } = await tx.execute(sql`SELECT 1 FROM attribute_definitions WHERE lower(name) = lower(${input.name}) OR slug = ${slug} LIMIT 1`);
    if (rows.length) throw field('name', `"${input.name}" is already in the library.`, 'CONFLICT');
    const id = uuidv7();
    // Internal production attributes stay off the product page by default.
    await tx.execute(sql`INSERT INTO attribute_definitions (id, name, slug, display_type, show_on_pdp) VALUES (${id}, ${input.name}, ${slug}, ${input.displayType}, ${slug !== 'placements'})`);
    await recordAudit(tx, { actorId, action: 'attribute.create', entity: 'attribute_definitions', entityId: id, diff: { name: { from: null, to: input.name } } });
    return listLibrary(tx);
  });
}

export async function updateAttribute(input: z.infer<typeof attributeUpdate>, actorId: string): Promise<LibraryAttribute[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ slug: string; is_active: boolean; display_type: string; show_on_pdp: boolean; show_on_checkout: boolean; show_on_admin: boolean }>(sql`
      SELECT slug, is_active, display_type, show_on_pdp, show_on_checkout, show_on_admin FROM attribute_definitions WHERE id = ${input.id} FOR UPDATE`);
    const cur = rows[0];
    if (!cur) throw new AppError('NOT_FOUND', 'That attribute does not exist.');
    const next = {
      is_active: input.enabled ?? cur.is_active, display_type: input.displayType ?? cur.display_type,
      show_on_pdp: input.showOnPdp ?? cur.show_on_pdp, show_on_checkout: input.showOnCheckout ?? cur.show_on_checkout, show_on_admin: input.showOnAdmin ?? cur.show_on_admin,
    };
    if (CORE.has(cur.slug) && !next.is_active) throw new AppError('RULE_VIOLATION', 'Colour and Size are used by every product and cannot be switched off.');
    if (!next.show_on_pdp && !next.show_on_checkout && !next.show_on_admin) throw new AppError('RULE_VIOLATION', 'Keep this attribute visible in at least one place.');
    await tx.execute(sql`UPDATE attribute_definitions SET is_active = ${next.is_active}, display_type = ${next.display_type}, show_on_pdp = ${next.show_on_pdp}, show_on_checkout = ${next.show_on_checkout}, show_on_admin = ${next.show_on_admin}, updated_at = now() WHERE id = ${input.id}`);
    await recordAudit(tx, { actorId, action: 'attribute.update', entity: 'attribute_definitions', entityId: input.id, diff: { settings: { from: cur, to: next } } });
    return listLibrary(tx);
  });
}

export async function deleteAttribute(id: string, actorId: string): Promise<LibraryAttribute[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ name: string; slug: string; n: number }>(sql`
      SELECT d.name, d.slug, (SELECT count(*)::int FROM product_attribute_links l WHERE l.definition_id = d.id) AS n FROM attribute_definitions d WHERE d.id = ${id} FOR UPDATE OF d`);
    const d = rows[0];
    if (!d) throw new AppError('NOT_FOUND', 'That attribute does not exist.');
    if (CORE.has(d.slug)) throw new AppError('RULE_VIOLATION', 'Colour and Size cannot be deleted.');
    if (d.n) throw new AppError('RULE_VIOLATION', `"${d.name}" is used by ${d.n} product${d.n === 1 ? '' : 's'}. Remove it there first, or switch it off.`);
    await tx.execute(sql`DELETE FROM attribute_definitions WHERE id = ${id}`);
    await recordAudit(tx, { actorId, action: 'attribute.delete', entity: 'attribute_definitions', entityId: id, diff: { name: { from: d.name, to: null } } });
    return listLibrary(tx);
  });
}

export async function addAttributeValue(id: string, value: string, actorId: string, swatchHex?: string): Promise<LibraryAttribute[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute(sql`SELECT 1 FROM attribute_definitions WHERE id = ${id} FOR UPDATE`);
    if (!rows.length) throw new AppError('NOT_FOUND', 'That attribute does not exist.');
    const { rows: dup } = await tx.execute(sql`SELECT 1 FROM attribute_values WHERE definition_id = ${id} AND lower(value) = lower(${value}) LIMIT 1`);
    if (dup.length) throw field('value', `"${value}" is already a value of this attribute.`, 'CONFLICT');
    await ensureAttributeValues(tx, [{ definitionId: id, value, swatchHex: swatchHex ?? null }]);
    await recordAudit(tx, { actorId, action: 'attribute.value_add', entity: 'attribute_definitions', entityId: id, diff: { value: { from: null, to: value } } });
    return listLibrary(tx);
  });
}

export async function removeAttributeValue(id: string, value: string, actorId: string): Promise<LibraryAttribute[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ id: string; n: number }>(sql`
      SELECT av.id, (SELECT count(*)::int FROM product_attribute_link_values lv WHERE lv.value_id = av.id) AS n FROM attribute_values av WHERE av.definition_id = ${id} AND av.value = ${value} FOR UPDATE OF av`);
    const v = rows[0];
    if (!v) throw new AppError('NOT_FOUND', 'That value does not exist.');
    if (v.n) throw new AppError('RULE_VIOLATION', `"${value}" is used by ${v.n} product${v.n === 1 ? '' : 's'}. Remove it there first.`);
    await tx.execute(sql`DELETE FROM attribute_values WHERE id = ${v.id}`);
    await recordAudit(tx, { actorId, action: 'attribute.value_remove', entity: 'attribute_definitions', entityId: id, diff: { value: { from: value, to: null } } });
    return listLibrary(tx);
  });
}

// -------------------------------------------------------------- size charts

export interface SizeChart { id: string; name: string; columns: string[]; rows: { size: string; measures: Record<string, number | string> }[]; productCount: number }

/** Saved order first; any measurement missing from it follows. */
export const orderedColumns = (columns: string[], rows: { measures: Record<string, unknown> }[]): string[] =>
  [...new Set([...(columns ?? []), ...rows.flatMap((r) => Object.keys(r.measures))])];

export async function listSizeCharts(db: Db = getDb()): Promise<SizeChart[]> {
  const { rows } = await db.execute<{ id: string; name: string; columns: string[]; rows: SizeChart['rows']; n: number }>(sql`
    SELECT s.id, s.name, s.columns, s.rows, (SELECT count(*)::int FROM products p WHERE p.size_chart_id = s.id AND p.deleted_at IS NULL) AS n FROM size_charts s ORDER BY s.created_at, s.id`);
  return rows.map((r) => ({ id: r.id, name: r.name, columns: orderedColumns(r.columns, r.rows ?? []), rows: r.rows ?? [], productCount: r.n }));
}

export async function saveSizeChart(input: z.infer<typeof sizeChartFields>, actorId: string): Promise<SizeChart[]> {
  const seen = new Set<string>();
  for (const r of input.rows) {
    const key = r.size.toLowerCase();
    if (seen.has(key)) throw field('rows', `Size "${r.size}" appears twice.`);
    seen.add(key);
  }
  const columns = orderedColumns(input.columns, input.rows);
  return withTransaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('size_chart_names', 0))`);
    const { rows: dup } = await tx.execute(sql`SELECT 1 FROM size_charts WHERE lower(name) = lower(${input.name}) AND id IS DISTINCT FROM ${input.id ?? null}::uuid LIMIT 1`);
    if (dup.length) throw field('name', `"${input.name}" already exists.`, 'CONFLICT');
    const id = input.id ?? uuidv7();
    if (input.id) {
      const { rowCount } = await tx.execute(sql`UPDATE size_charts SET name = ${input.name}, columns = ${textArray(columns)}, rows = ${JSON.stringify(input.rows)}::jsonb, updated_at = now() WHERE id = ${input.id}`);
      if (!rowCount) throw new AppError('NOT_FOUND', 'That size chart does not exist.');
    } else {
      await tx.execute(sql`INSERT INTO size_charts (id, name, columns, rows) VALUES (${id}, ${input.name}, ${textArray(columns)}, ${JSON.stringify(input.rows)}::jsonb)`);
    }
    await recordAudit(tx, { actorId, action: input.id ? 'size_chart.update' : 'size_chart.create', entity: 'size_charts', entityId: id, diff: { name: { from: null, to: input.name } } });
    return listSizeCharts(tx);
  });
}

export async function deleteSizeChart(id: string, actorId: string): Promise<SizeChart[]> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ name: string; n: number }>(sql`SELECT s.name, (SELECT count(*)::int FROM products p WHERE p.size_chart_id = s.id AND p.deleted_at IS NULL) AS n FROM size_charts s WHERE s.id = ${id} FOR UPDATE OF s`);
    const c = rows[0];
    if (!c) throw new AppError('NOT_FOUND', 'That size chart does not exist.');
    if (c.n) throw new AppError('RULE_VIOLATION', `"${c.name}" is linked to ${c.n} product${c.n === 1 ? '' : 's'}. Unlink it there first.`);
    await tx.execute(sql`DELETE FROM size_charts WHERE id = ${id}`);
    await recordAudit(tx, { actorId, action: 'size_chart.delete', entity: 'size_charts', entityId: id, diff: { name: { from: c.name, to: null } } });
    return listSizeCharts(tx);
  });
}
