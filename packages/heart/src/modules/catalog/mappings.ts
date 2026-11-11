import 'server-only';
import { sql } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb, withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toPaise, toRupees } from '../../platform/money/index.ts';
import { records } from './import.ts';
import type { mappingSave } from './schemas.ts';

// Partner SKU mappings (DOC/backend/16 §6): which partner SKU prints each
// variant and what it costs us. Strategy A = provider_sku holds the Qikink
// Store SKU; provider_payload keeps the design fields for strategy B, so a
// switch is data. Staff-only: nothing here reaches the storefront.

export interface VariantMapping {
  variantId: string; label: string; sku: string; retail: number;
  providerSku: string; unitCost: number | null;
  /** Partner cost from the imported sheet, as a hint when none is saved. */
  sheetCost: number | null;
  payload: Record<string, unknown>;
}

export async function listMappings(productId: string): Promise<{ provider: string | null; providerName: string | null; variants: VariantMapping[] }> {
  const db = getDb();
  const { rows: head } = await db.execute<{ slug: string | null; name: string | null }>(sql`
    SELECT ip.slug, ip.name FROM products p LEFT JOIN integration_providers ip ON ip.slug = p.partner_provider WHERE p.id = ${productId} AND p.deleted_at IS NULL`);
  if (!head[0]) throw new AppError('NOT_FOUND', 'That product does not exist.');
  const { rows } = await db.execute<{ id: string; sku: string; price: string; label: string | null; provider_sku: string | null; unit_cost: string | null; provider_payload: Record<string, unknown> | null; sheet_cost: string | null }>(sql`
    SELECT v.id, v.sku, v.price,
           (SELECT string_agg(av.value, ' / ' ORDER BY l.variant_axis_position) FROM product_variant_attribute_values pv
             JOIN attribute_values av ON av.id = pv.value_id
             JOIN product_attribute_links l ON l.product_id = pv.product_id AND l.definition_id = pv.definition_id WHERE pv.variant_id = v.id) AS label,
           m.provider_sku, m.unit_cost, m.provider_payload, sr.raw_data ->> 'basePriceINR' AS sheet_cost
    FROM product_variants v
    LEFT JOIN integration_providers ip ON ip.slug = ${head[0].slug}
    LEFT JOIN provider_product_mappings m ON m.variant_id = v.id AND m.provider_id = ip.id
    LEFT JOIN product_source_rows sr ON sr.id = v.source_row_id
    WHERE v.product_id = ${productId} AND v.is_active ORDER BY v.created_at, v.id`);
  const rupees = (s: string | null) => { if (s === null || s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
  return {
    provider: head[0].slug, providerName: head[0].name,
    variants: rows.map((r) => ({ variantId: r.id, label: r.label ?? r.sku, sku: r.sku, retail: Number(r.price), providerSku: r.provider_sku ?? '', unitCost: rupees(r.unit_cost), sheetCost: rupees(r.sheet_cost), payload: r.provider_payload ?? {} })),
  };
}

/** A blank partner SKU removes that variant's mapping. */
export async function saveMappings(input: z.infer<typeof mappingSave>, actorId: string) {
  await withTransaction(async (tx) => {
    const { rows: head } = await tx.execute<{ provider_id: string | null }>(sql`
      SELECT ip.id AS provider_id FROM products p LEFT JOIN integration_providers ip ON ip.slug = p.partner_provider WHERE p.id = ${input.productId} AND p.deleted_at IS NULL FOR UPDATE OF p`);
    if (!head[0]) throw new AppError('NOT_FOUND', 'That product does not exist.');
    const providerId = head[0].provider_id;
    if (!providerId) throw new AppError('RULE_VIOLATION', 'This product has no print partner.');
    if (input.rows.length) {
      const { rows: owned } = await tx.execute<{ id: string }>(sql`SELECT id FROM product_variants WHERE product_id = ${input.productId} AND id IN (${sql.join(input.rows.map((r) => sql`${r.variantId}::uuid`), sql`, `)})`);
      if (owned.length !== new Set(input.rows.map((r) => r.variantId)).size) throw new AppError('VALIDATION_FAILED', 'One of these variants does not belong to this product.');
    }
    const filled = input.rows.filter((r) => r.providerSku);
    const dupes = filled.map((r) => r.providerSku.toLowerCase()).filter((s, i, a) => a.indexOf(s) !== i);
    if (dupes.length) throw new AppError('VALIDATION_FAILED', `Partner SKU "${dupes[0]}" is used twice: two variants would print the same item.`, [{ field: 'rows', message: 'Duplicate partner SKU' }]);
    if (filled.length) {
      const { rows: clash } = await tx.execute<{ provider_sku: string }>(sql`
        SELECT m.provider_sku FROM provider_product_mappings m WHERE m.provider_id = ${providerId} AND m.is_active
          AND lower(m.provider_sku) IN (${sql.join(filled.map((r) => sql`${r.providerSku.toLowerCase()}`), sql`, `)})
          AND m.variant_id NOT IN (${sql.join(input.rows.map((r) => sql`${r.variantId}::uuid`), sql`, `)}) LIMIT 1`);
      if (clash[0]) throw new AppError('CONFLICT', `Partner SKU "${clash[0].provider_sku}" already belongs to another product.`, [{ field: 'rows', message: 'Partner SKU in use' }]);
      await tx.execute(sql`INSERT INTO provider_product_mappings (id, provider_id, variant_id, provider_sku, provider_payload, unit_cost)
        SELECT x.id, ${providerId}, x.vid, x.sku, x.payload, x.cost FROM ${records(filled.map((r) => ({ id: uuidv7(), vid: r.variantId, sku: r.providerSku, payload: r.payload, cost: r.unitCost === null || r.unitCost === undefined ? null : toRupees(toPaise(r.unitCost)) })))}
        AS x(id uuid, vid uuid, sku text, payload jsonb, cost numeric)
        ON CONFLICT (provider_id, variant_id) DO UPDATE SET provider_sku = EXCLUDED.provider_sku, provider_payload = EXCLUDED.provider_payload, unit_cost = EXCLUDED.unit_cost, is_active = true, updated_at = now()`);
    }
    const blank = input.rows.filter((r) => !r.providerSku);
    if (blank.length) await tx.execute(sql`DELETE FROM provider_product_mappings WHERE provider_id = ${providerId} AND variant_id IN (${sql.join(blank.map((r) => sql`${r.variantId}::uuid`), sql`, `)})`);
    await recordAudit(tx, { actorId, action: 'mapping.update', entity: 'provider_product_mappings', entityId: input.productId, diff: { mapped: { from: null, to: filled.length } } });
  });
  return listMappings(input.productId);
}
