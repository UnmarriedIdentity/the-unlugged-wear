import type { OrderItem, ProductItem, SupportTicket } from '@/mocks/fixtures';
import type { Notification } from './types';

interface OpsSignals {
  orders: OrderItem[];
  products: ProductItem[];
  supportTickets: SupportTicket[];
}

// Pure ops feed builder (N1): live store state in, notification items out.
// Deterministic demo copy with stable ids; a database feed replaces this
// function later without touching any component.
export function buildNotifications({ orders, products, supportTickets }: OpsSignals): Notification[] {
  const items: Notification[] = [];

  orders
    .filter((o) => o.fulfillmentStatus === 'submission_failed')
    .slice(0, 3)
    .forEach((o, i) => {
      items.push({
        id: `sync-${o.id}`,
        category: 'system',
        tone: 'error',
        title: 'Partner sync failed',
        body: `${o.id} print webhook timed out. Needs retry.`,
        time: i === 0 ? '2 min' : `${10 + i * 6} min`,
        href: '/fulfillment',
      });
    });

  const readyToShip = orders.filter((o) => o.paymentStatus === 'paid' && o.fulfillmentStatus === 'queued');
  if (readyToShip.length > 0) {
    items.push({
      id: 'ready-to-ship',
      category: 'orders',
      tone: 'success',
      title: `${readyToShip.length} paid order${readyToShip.length === 1 ? '' : 's'} ready to ship`,
      body: 'Print the shipping labels and queue the batch for dispatch.',
      time: '5 min',
      href: '/orders',
    });
  }

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).slice(0, 2);
  lowStock.forEach((p) => {
    items.push({
      id: `low-${p.id}`,
      category: 'inventory',
      tone: 'warning',
      title: `${p.name} is low on stock`,
      body: `Only ${p.stock} units left. Restock soon to avoid missing sales.`,
      time: '1 h',
      href: '/products',
    });
  });

  const openTickets = supportTickets.filter((t) => t.status === 'open').slice(0, 2);
  openTickets.forEach((t) => {
    items.push({
      id: `ticket-${t.id}`,
      category: 'system',
      tone: 'info',
      title: `Support ticket ${t.id} needs a reply`,
      body: t.subject,
      time: '3 h',
      href: '/support',
    });
  });

  const failedPayments = orders.filter((o) => o.paymentStatus === 'failed').slice(0, 1);
  failedPayments.forEach((o) => {
    items.push({
      id: `pay-${o.id}`,
      category: 'payment',
      tone: 'error',
      title: `Payment failed on ${o.id}`,
      body: `${o.customerName} — ask the customer to retry checkout.`,
      time: '6 h',
      href: '/payments',
    });
  });

  return items;
}
