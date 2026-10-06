import type { CustomerItem, OrderItem, ProductItem, ShipmentItem } from '@/mocks/fixtures';
import type { ResultSection, SearchScope, SpotlightResult } from './types';
import { parseScopedQuery } from './types';

interface SearchSignals {
  orders: OrderItem[];
  products: ProductItem[];
  customers: CustomerItem[];
  shipments: ShipmentItem[];
}

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

const PREFIX_NAV_KEYS: Record<string, string[]> = {
  '!ret': ['return', 'refund'],
  '!pay': ['payment'],
};

function includes(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle);
}

// Local search adapter (S3): demo store state in, grouped spotlight
// sections out. Deterministic, capped results. A database adapter
// implements the same shape later; components never change.
export function localSearch(signals: SearchSignals, rawQuery: string): ResultSection[] {
  const { scope, term, prefix } = parseScopedQuery(rawQuery);
  const q = term.toLowerCase();
  const wants = (s: SearchScope) => scope === null || scope === s;
  const sections: ResultSection[] = [];

  if (wants('orders')) {
    const hits = signals.orders
      .filter(
        (o) =>
          !q ||
          includes(o.id, q) ||
          includes(o.customerName, q) ||
          includes(o.paymentStatus, q) ||
          includes(o.fulfillmentStatus, q),
      )
      .slice(0, 5)
      .map(
        (o): SpotlightResult => ({
          id: `order-${o.id}`,
          scope: 'orders',
          title: `${o.id} · ${o.customerName}`,
          subtitle: `₹${o.total} · Payment: ${o.paymentStatus} · ${o.fulfillmentStatus}`,
          href: '/orders',
          tileTone: 'purple',
        }),
      );
    if (hits.length > 0) sections.push({ key: 'orders', title: 'Orders', items: hits });
  }

  if (wants('products')) {
    const hits = signals.products
      .filter((p) => !q || includes(p.name, q) || includes(p.category, q))
      .slice(0, 5)
      .map(
        (p): SpotlightResult => ({
          id: `product-${p.id}`,
          scope: 'products',
          title: p.name,
          subtitle: `${p.category} · ₹${p.price} · ${p.stock} units in stock`,
          href: '/products',
          tileTone: 'amber',
        }),
      );
    if (hits.length > 0) sections.push({ key: 'products', title: 'Products', items: hits });
  }

  if (wants('customers')) {
    const hits = signals.customers
      .filter((c) => !q || includes(c.name, q) || includes(c.email, q) || includes(c.city, q))
      .slice(0, 5)
      .map(
        (c): SpotlightResult => ({
          id: `customer-${c.email}`,
          scope: 'customers',
          title: c.name,
          subtitle: `${c.email} · ${c.city}`,
          href: '/customers',
          tileTone: 'blue',
        }),
      );
    if (hits.length > 0) sections.push({ key: 'customers', title: 'Customers', items: hits });
  }

  if (wants('shipments')) {
    const hits = signals.shipments
      .filter(
        (s) =>
          !q ||
          includes(s.trackingId, q) ||
          includes(s.orderId, q) ||
          includes(s.destination, q) ||
          includes(s.carrier, q),
      )
      .slice(0, 5)
      .map(
        (s): SpotlightResult => ({
          id: `shipment-${s.trackingId}`,
          scope: 'shipments',
          title: `${s.trackingId} · ${s.orderId}`,
          subtitle: `${s.carrier} → ${s.destination}`,
          href: '/shipments',
          tileTone: 'cyan',
        }),
      );
    if (hits.length > 0) sections.push({ key: 'shipments', title: 'Shipments', items: hits });
  }

  if (wants('pages')) {
    const keys = prefix && PREFIX_NAV_KEYS[prefix] ? PREFIX_NAV_KEYS[prefix] : null;
    const hits = NAV_TARGETS.filter((n) => {
      if (keys) return keys.some((k) => n.keys.includes(k));
      if (!q) return true;
      return includes(n.title, q) || includes(n.subtitle, q) || n.keys.some((k) => includes(k, q));
    }).slice(0, 6);
    if (hits.length > 0) {
      sections.push({
        key: 'pages',
        title: 'Jump To',
        items: hits.map(
          (n): SpotlightResult => ({
            id: `page-${n.href}`,
            scope: 'pages',
            title: n.title,
            subtitle: n.subtitle,
            href: n.href,
            tileTone: 'green',
          }),
        ),
      });
    }
  }

  return sections;
}
