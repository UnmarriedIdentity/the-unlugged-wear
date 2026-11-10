'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';
import { useStore } from '@storefront/mocks/store';
import { useSession } from '@storefront/lib/session';
import type { Order } from '@storefront/lib/types';
import { formatPaise, formatShortDate } from '@storefront/lib/format';
import { RETURN_WINDOW_DAYS, deliveryEstimate } from '@storefront/lib/product';
import { downloadInvoicePdf } from '@storefront/lib/invoice';
import { AlertCircle, ArrowRight, Check, Clock, Download, Info, Mail } from 'lucide-react';

const STEPS = ['Order placed', 'Printing', 'Shipped', 'Delivered'] as const;
const STEP_INDEX: Record<string, number> = { queued: 0, printing: 1, shipped: 2, delivered: 3 };

// Money in paise; order shipping/discount are stored in whole rupees.
const linePaise = (item: Order['items'][number]) =>
  (item.priceMinorINR ?? Math.round(item.priceINR * 100)) * item.quantity;


function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || searchParams.get('id');
  const { getOrderByNumber, getOrderById, products } = useStore();
  const { session } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    setOrder(getOrderByNumber(orderNumber) || getOrderById(orderNumber) || null);
    setLoading(false);
  }, [orderNumber, getOrderByNumber, getOrderById]);

  if (loading) {
    return (
      <div className="py-24 text-center" role="status">
        <div className="w-10 h-10 border-2 border-store-charcoal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-store-text-secondary">Finding your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto px-4">
        <AlertCircle size={28} aria-hidden="true" className="mx-auto text-store-text-secondary" />
        <h1 className="mt-4 font-heading text-3xl font-medium text-store-charcoal">We couldn’t find that order</h1>
        <p className="text-sm text-store-text-secondary mt-3 leading-relaxed">
          There’s no order with the reference “{orderNumber || 'unspecified'}” in this browser. If you placed it
          somewhere else, you can still track it with its reference.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="inline-flex items-center h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black">
            Track an order
          </Link>
          <Link href="/shop" className="inline-flex items-center h-11 px-6 rounded-full border border-store-border text-sm font-medium text-store-charcoal hover:border-store-charcoal">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const isPending = order.paymentStatus === 'pending';
  const step = STEP_INDEX[order.fulfillmentStatus ?? 'queued'] ?? 0;
  const estimate = deliveryEstimate(order.shippingAddress.postalCode, new Date(order.date));
  const subtotal = order.items.reduce((sum, item) => sum + linePaise(item), 0);
  const total = subtotal - order.discountINR * 100 + order.shippingINR * 100;
  const hasShipped = order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered';
  const address = order.shippingAddress;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
      {/* Demo notice (required for simulated checkouts) */}
      <p className="flex items-start gap-2 text-sm text-store-text-secondary border-l-2 border-store-gold pl-3 mb-10">
        <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        Demo order — no payment was collected and nothing will be printed or shipped.
      </p>

      <header className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-store-charcoal text-white">
          {isPending ? <Clock size={22} aria-hidden="true" /> : <Check size={22} aria-hidden="true" />}
        </span>
        <h1 className="mt-5 font-heading text-[clamp(2rem,3vw+1rem,3rem)] font-medium tracking-tight text-store-charcoal">
          {isPending ? 'Your order is placed' : 'Thank you for your order'}
        </h1>
        <p className="mt-3 text-base text-store-text-secondary leading-relaxed">
          Order <strong className="font-medium text-store-charcoal">{order.orderNumber}</strong> is confirmed.{' '}
          {isPending
            ? 'Payment is due on delivery.'
            : 'We’ll print it in 2–3 business days and send you tracking as soon as it ships.'}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-store-text-secondary">
          <Mail size={14} aria-hidden="true" />
          {session
            ? `Confirmation sent to ${session.email} (demo — no email is sent)`
            : 'A confirmation would be emailed to you (demo — no email is sent)'}
        </p>
      </header>

      {/* What happens next */}
      <section aria-labelledby="next-steps" className="mt-12 p-6 sm:p-8 bg-store-surface border border-store-card-border">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="next-steps" className="font-heading text-xl font-medium text-store-charcoal">
            What happens next
          </h2>
          {estimate && (
            <p className="text-sm text-store-charcoal">
              Expected {formatShortDate(estimate.earliest)} – {formatShortDate(estimate.latest)}
            </p>
          )}
        </div>
        <ol className="mt-6 grid grid-cols-4 gap-2">
          {STEPS.map((label, idx) => (
            <li key={label} aria-current={idx === step ? 'step' : undefined}>
              <span className={`block h-1 ${idx <= step ? 'bg-store-charcoal' : 'bg-store-card-border'}`} />
              <span className={`mt-2 block text-xs sm:text-sm ${idx <= step ? 'text-store-charcoal font-medium' : 'text-store-text-secondary'}`}>
                {label}
              </span>
              <span className="block text-xs text-store-text-secondary">
                {idx === 1 ? '2–3 business days' : idx === 2 ? (hasShipped && order.carrier ? order.carrier : 'Courier assigned when it ships') : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Items */}
        <section aria-labelledby="items-heading" className="p-6 sm:p-8 bg-store-surface border border-store-card-border">
          <h2 id="items-heading" className="font-heading text-xl font-medium text-store-charcoal">
            Your items ({order.items.reduce((n, i) => n + i.quantity, 0)})
          </h2>
          <ul className="mt-4 divide-y divide-store-card-border">
            {order.items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const swatch = product?.colors.find((c) => c.name === item.color)?.hex;
              const href = product ? `/products/${product.slug}` : '/shop';
              return (
                <li key={item.id} className="py-4 flex gap-4">
                  <Link href={href} className="w-20 h-28 shrink-0 overflow-hidden bg-store-cream border border-store-card-border">
                    <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0 flex justify-between gap-4">
                    <div>
                      <Link href={href} className="text-base font-medium text-store-charcoal hover:underline underline-offset-4 decoration-store-gold">
                        {item.title}
                      </Link>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-store-text-secondary">
                        {swatch && (
                          <span aria-hidden="true" className="w-3 h-3 rounded-full border border-store-card-border" style={{ backgroundColor: swatch }} />
                        )}
                        {item.color} · {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-base text-store-charcoal tuw-tabular-nums">{formatPaise(linePaise(item))}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Summary + address */}
        <aside className="space-y-6">
          <section aria-labelledby="summary-heading" className="p-6 bg-store-surface border border-store-card-border">
            <h2 id="summary-heading" className="font-heading text-xl font-medium text-store-charcoal">Summary</h2>
            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-sm text-store-text-secondary tuw-tabular-nums">
              <dt>Items</dt>
              <dd className="text-right text-store-charcoal">{formatPaise(subtotal)}</dd>
              {order.discountINR > 0 && (
                <>
                  <dt>Discount</dt>
                  <dd className="text-right text-store-charcoal">−{formatPaise(order.discountINR * 100)}</dd>
                </>
              )}
              <dt>Delivery</dt>
              <dd className="text-right text-store-charcoal">{order.shippingINR ? formatPaise(order.shippingINR * 100) : 'Free'}</dd>
              <dt>GST</dt>
              <dd className="text-right text-store-charcoal">Included</dd>
              <dt className="pt-3 border-t border-store-card-border font-medium text-store-charcoal">
                {isPending ? 'Due on delivery' : isPaid ? 'Total paid' : 'Total'}
              </dt>
              <dd className="pt-3 border-t border-store-card-border text-right text-lg font-medium text-store-charcoal">
                {formatPaise(total)}
              </dd>
              <dt className="text-xs">Payment</dt>
              <dd className="text-right text-xs">{order.paymentMethod}</dd>
            </dl>
            <button
              type="button"
              onClick={() => void downloadInvoicePdf(order, session?.email)}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-store-charcoal underline-offset-4 decoration-store-gold hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              <Download size={14} aria-hidden="true" /> Download invoice PDF (demo)
            </button>
          </section>

          <section aria-labelledby="address-heading" className="p-6 bg-store-surface border border-store-card-border text-sm">
            <h2 id="address-heading" className="font-heading text-xl font-medium text-store-charcoal">Delivering to</h2>
            <p className="mt-3 text-store-text-secondary leading-relaxed">
              <span className="text-store-charcoal">{address.fullName}</span>
              <br />
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.phone}
            </p>
          </section>
        </aside>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/track-order?ref=${encodeURIComponent(order.orderNumber)}`}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
        >
          Track order
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex items-center h-11 px-6 rounded-full border border-store-charcoal text-sm font-medium text-store-charcoal hover:bg-store-charcoal hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
        >
          View order details
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center h-11 px-6 rounded-full border border-store-border text-sm font-medium text-store-charcoal hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
        >
          Continue shopping
        </Link>
      </div>

      {/* Help */}
      <p className="mt-10 text-center text-sm text-store-text-secondary leading-relaxed">
        Need to change something? <Link href="/contact" className="text-store-charcoal underline underline-offset-4 decoration-store-gold">Contact us</Link>{' '}
        before printing starts. {RETURN_WINDOW_DAYS}-day returns on unworn clothing —{' '}
        <Link href="/policies/returns" className="text-store-charcoal underline underline-offset-4 decoration-store-gold">returns policy</Link>.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center" role="status">
              <div className="w-10 h-10 border-2 border-store-charcoal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-store-text-secondary">Finding your order…</p>
            </div>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
