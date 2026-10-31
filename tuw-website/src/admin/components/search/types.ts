export type SearchScope = 'orders' | 'products' | 'customers' | 'shipments' | 'pages';

export type TileTone = 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'cyan' | 'pink' | 'yellow' | 'teal';

export interface SpotlightResult {
  id: string;
  scope: SearchScope;
  title: string;
  subtitle: string;
  href: string;
  tileTone: TileTone;
}

export interface ResultSection {
  key: string;
  title: string;
  items: SpotlightResult[];
}

export interface SearchPrefix {
  token: string;
  scope: SearchScope;
  label: string;
  hint: string;
}

// Prefix scope config (S3): new scopes are data-only additions — append one
// entry, never new branches. DB-backed search swaps the adapter, not this.
export const SEARCH_PREFIXES: SearchPrefix[] = [
  { token: '#orders', scope: 'orders', label: '#orders', hint: 'Orders only' },
  { token: '@customer', scope: 'customers', label: '@customer', hint: 'Customers only' },
  { token: '!ship', scope: 'shipments', label: '!ship', hint: 'Shipments only' },
  { token: '!ret', scope: 'pages', label: '!ret', hint: 'Returns pages' },
  { token: '!pay', scope: 'pages', label: '!pay', hint: 'Payments pages' },
  { token: '!inv', scope: 'products', label: '!inv', hint: 'Inventory only' },
];

export function parseScopedQuery(raw: string): { scope: SearchScope | null; term: string; prefix: string | null } {
  const trimmed = raw.trim();
  const first = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';
  const hit = SEARCH_PREFIXES.find((p) => p.token === first);
  if (!hit) return { scope: null, term: trimmed, prefix: null };
  return { scope: hit.scope, term: trimmed.slice(first.length).trim(), prefix: hit.token };
}

// Adapter contract (S3): grouped results for a query. The local
// implementation searches demo store state; a database adapter implements
// this same interface later and no component moves.
export interface SearchAdapter {
  search: (query: string) => ResultSection[];
}
