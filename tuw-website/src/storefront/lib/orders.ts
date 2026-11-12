import type { OrderView } from '@tuw/heart/modules/orders';
import type { CartItem, FulfillmentStatus, Order } from './types';

// Database orders in the shape the existing order screens render. The
// storefront's older words map onto the SQL vocabulary (AGENTS §6).

const LEGACY_STATUS: Record<OrderView['status'], Order['status']> = {
  pending: 'Confirmed', confirmed: 'Confirmed', processing: 'Printing', shipped: 'Shipped', delivered: 'Delivered',
  cancelled: 'Cancelled', failed: 'Failed', refunded: 'Refunded',
};
const FULFILMENT: Record<OrderView['status'], FulfillmentStatus> = {
  pending: 'queued', confirmed: 'queued', processing: 'printing', shipped: 'shipped', delivered: 'delivered',
  cancelled: 'queued', failed: 'submission_failed', refunded: 'queued',
};
const METHOD: Record<string, Order['paymentMethod']> = { card: 'Card', upi: 'UPI', cod: 'COD (Demo)', netbanking: 'UPI', wallet: 'UPI' };

export function toStoreOrder(o: OrderView): Order {
  const items: CartItem[] = o.lines.map((l) => ({
    id: l.id, productId: l.productId, title: l.title, color: l.color ?? 'Standard', size: l.size ?? 'One size',
    priceINR: l.unitPaise / 100, priceMinorINR: l.unitPaise, quantity: l.qty, image: l.image ?? '',
  }));
  const a = o.shippingAddress;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    date: new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    status: LEGACY_STATUS[o.status],
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: FULFILMENT[o.status],
    items,
    subtotalINR: o.subtotalPaise / 100,
    shippingINR: o.shippingPaise / 100,
    discountINR: o.discountPaise / 100,
    totalINR: o.grandTotalPaise / 100,
    shippingAddress: { id: o.id, fullName: a.fullName, addressLine1: a.line1, addressLine2: a.line2, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country, phone: a.phone },
    paymentMethod: METHOD[o.paymentMethod ?? 'card'] ?? 'Card',
    sqlStatus: o.status,
    cancellableUntil: o.cancellableUntil ?? undefined,
    canCancel: o.canCancel,
    trackingEvents: o.history.map((h) => {
      const at = new Date(h.at);
      return { date: at.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), time: at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }), status: h.status === 'pending' ? 'Order placed' : h.status === 'cancelled' ? 'Cancelled' : h.status, location: 'The Unplugged Wear', description: h.note ?? '' };
    }),
  };
}
