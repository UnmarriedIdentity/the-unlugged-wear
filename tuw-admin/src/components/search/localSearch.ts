import type { ResultSection, SearchScope, SpotlightResult } from './types';
import { parseScopedQuery } from './types';

interface NavTarget {
  title: string;
  subtitle: string;
  href: string;
  keys: string[];
}

const NAV_TARGETS: NavTarget[] = [
  { title: 'Dashboard Overview', subtitle: 'Store performance and operational KPIs', href: '/dashboard', keys: ['dashboard', 'overview', 'kpi'] },
  { title: 'Order Fulfillment Queue', subtitle: 'Fulfillment queue and live sales logs', href: '/orders', keys: ['order', 'fulfillment', 'sales'] },
  { title: 'Product Catalog & Inventory', subtitle: 'Catalog, variants, pricing, and stock control', href: '/products', keys: ['product', 'catalog', 'inventory', 'stock'] },
  { title: 'Customer Directory & LTV', subtitle: 'Accounts, lifetime value, and order history', href: '/customers', keys: ['customer', 'client', 'ltv'] },
  { title: 'Shipments & Logistics Manifests', subtitle: 'Dispatch manifests and courier tracking sync', href: '/shipments', keys: ['ship', 'logistics', 'manifest', 'courier', 'dispatch'] },
  { title: 'Returns & RMA Management', subtitle: 'Customer return requests, inspection & disputes', href: '/returns', keys: ['return', 'rma', 'refund', 'dispute'] },
  { title: 'Payments & Settlements', subtitle: 'Captured payments, failures, and refunds', href: '/payments', keys: ['payment', 'pay', 'settlement', 'refund'] },
];

const TILE_BY_INDEX = ['green', 'purple', 'amber', 'blue', 'cyan'] as const;

// Curated Jump-to defaults (P1): shown when there is no frequent history
// yet. Data-only list — reorder or extend without touching components.
export function getPopularTargets(): SpotlightResult[] {
  return NAV_TARGETS.slice(0, 5).map(
    (n, i): SpotlightResult => ({
      id: `page-${n.href}`,
      scope: 'pages',
      title: n.title,
      subtitle: n.subtitle,
      href: n.href,
      tileTone: TILE_BY_INDEX[i % TILE_BY_INDEX.length],
    }),
  );
}

const PREFIX_NAV_KEYS: Record<string, string[]> = {
  '!ret': ['return', 'refund'],
  '!pay': ['payment'],
};

function includes(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle);
}

/** What the server returns for a query (server/search-actions.ts). */
export interface ServerHits {
  orders: { orderNumber: string; customerName: string; totalPaise: number; status: string; paymentStatus: string }[];
  products: { id: string; name: string; category: string; status: string; pricePaise: number; stock: number; madeToOrder: boolean }[];
  customers: { profileId: string; name: string; email: string; city: string }[];
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Search adapter (S3): database hits from the server plus the static page
// shortcuts, as grouped spotlight sections. Each hit deep-links to its record.
export function buildSections(hits: ServerHits | null, rawQuery: string): ResultSection[] {
  const { scope, term, prefix } = parseScopedQuery(rawQuery);
  const q = term.toLowerCase();
  const wants = (s: SearchScope) => scope === null || scope === s;
  const sections: ResultSection[] = [];

  if (hits && wants('orders') && hits.orders.length) {
    sections.push({ key: 'orders', title: 'Orders', items: hits.orders.map((o): SpotlightResult => ({
      id: `order-${o.orderNumber}`, scope: 'orders', title: `${o.orderNumber} · ${o.customerName}`,
      subtitle: `${rupees(o.totalPaise)} · Payment: ${o.paymentStatus} · ${o.status}`, href: `/orders?open=${encodeURIComponent(o.orderNumber)}`, tileTone: 'purple',
    })) });
  }
  if (hits && wants('products') && hits.products.length) {
    sections.push({ key: 'products', title: 'Products', items: hits.products.map((p): SpotlightResult => ({
      id: `product-${p.id}`, scope: 'products', title: p.name,
      subtitle: `${p.category} · ${rupees(p.pricePaise)} · ${p.madeToOrder ? 'Made to order' : `${p.stock} in stock`}${p.status === 'published' ? '' : ` · ${p.status}`}`,
      href: `/products?open=${encodeURIComponent(p.id)}`, tileTone: 'amber',
    })) });
  }
  if (hits && wants('customers') && hits.customers.length) {
    sections.push({ key: 'customers', title: 'Customers', items: hits.customers.map((c): SpotlightResult => ({
      id: `customer-${c.profileId}`, scope: 'customers', title: c.name, subtitle: [c.email, c.city].filter(Boolean).join(' · '),
      href: `/customers?customer=${encodeURIComponent(c.profileId)}`, tileTone: 'blue',
    })) });
  }

  if (wants('pages')) {
    const keys = prefix && PREFIX_NAV_KEYS[prefix] ? PREFIX_NAV_KEYS[prefix] : null;
    const pageHits = NAV_TARGETS.filter((n) => {
      if (keys) return keys.some((k) => n.keys.includes(k));
      if (!q) return true;
      return includes(n.title, q) || includes(n.subtitle, q) || n.keys.some((k) => includes(k, q));
    }).slice(0, 6);
    if (pageHits.length > 0) {
      sections.push({
        key: 'pages',
        title: 'Jump To',
        items: pageHits.map((n): SpotlightResult => ({ id: `page-${n.href}`, scope: 'pages', title: n.title, subtitle: n.subtitle, href: n.href, tileTone: 'green' })),
      });
    }
  }
  return sections;
}
