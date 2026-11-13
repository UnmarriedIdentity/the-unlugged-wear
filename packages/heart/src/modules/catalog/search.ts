import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';

// Storefront search: full-text over products.search_vector with prefix
// matching (so "hood" finds hoodies), plus name / style-code / category
// substring matches. Ranked: exact name, name prefix, a hit in the name,
// then text relevance. Every user word is reduced to letters and digits
// before it reaches to_tsquery, so query operators cannot be injected.

export const normalizeTerm = (q: string): string => q.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 100);

export function toPrefixQuery(q: string): string | null {
  const words = normalizeTerm(q).match(/[\p{L}\p{N}]+/gu)?.slice(0, 8);
  return words?.length ? words.map((w) => `${w}:*`).join(' & ') : null;
}

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface SearchResult {
  /** Public product ids, best match first. */
  ids: string[];
  total: number;
}

export async function searchProducts(q: string, limit = 60): Promise<SearchResult> {
  const term = normalizeTerm(q);
  const prefix = toPrefixQuery(term);
  if (!prefix) return { ids: [], total: 0 };
  const like = `%${likeEscape(term)}%`;
  const starts = `${likeEscape(term)}%`;
  const { rows } = await getDb().execute<{ id: string; total: number }>(sql`
    WITH q AS (SELECT to_tsquery('english', ${prefix}) AS query)
    SELECT coalesce(p.external_id, p.id::text) AS id, count(*) OVER ()::int AS total
    FROM products p LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL, q
    WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.product_kind = 'physical'
      AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active)
      AND (p.search_vector @@ q.query OR p.name ILIKE ${like} OR p.style_code ILIKE ${term} OR c.name ILIKE ${like})
    ORDER BY (lower(p.name) = ${term}) DESC, (p.name ILIKE ${starts}) DESC, (to_tsvector('english', p.name) @@ q.query) DESC,
             ts_rank(p.search_vector, q.query) DESC, p.name, p.id
    LIMIT ${Math.min(Math.max(limit, 1), 100)}`);
  return { ids: rows.map((r) => r.id), total: rows[0]?.total ?? 0 };
}

/** Analytics only: what shoppers look for, and what finds nothing. */
export async function logSearch(q: string, hits: number): Promise<void> {
  const term = normalizeTerm(q);
  if (term.length < 2) return;
  await getDb().execute(sql`INSERT INTO search_terms (id, term, hits) VALUES (${uuidv7()}, ${term}, ${hits})`);
}
