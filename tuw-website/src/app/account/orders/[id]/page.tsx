'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Badge from '@storefront/components/ui/Badge';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';
import { useStore } from '@storefront/mocks/store';
import type { FulfillmentStatus, Order, PaymentStatus } from '@storefront/lib/types';
import { formatPaise, formatShortDate } from '@storefront/lib/format';
import { RETURN_WINDOW_DAYS, deliveryEstimate } from '@storefront/lib/product';
import { AlertCircle, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { downloadInvoicePdf } from '@storefront/lib/invoice';
import { useSession } from '@storefront/lib/session';

interface PageProps {
  params: Promise<{ id: string }>;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Payment pending',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

const FULFILMENT_LABELS: Record<FulfillmentStatus, string> = {
  queued: 'Queued for print',
  printing: 'Printing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  submission_failed: 'Print submission failed',
};

const STEPS = ['Order placed', 'Printing', 'Shipped', 'Delivered'] as const;
const STEP_INDEX: Partial<Record<FulfillmentStatus, number>> = { queued: 0, printing: 1, shipped: 2, delivered: 3 };

const linePaise = (item: Order['items'][number]) =>
  (item.priceMinorINR ?? Math.round(item.priceINR * 100)) * item.quantity;

const CARD = 'bg-store-surface border border-store-card-border p-6 sm:p-8';
const CARD_TITLE = 'font-heading text-xl font-medium text-store-charcoal';

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getOrderById, getOrderByNumber, products } = useStore();
  const order = getOrderById(id) || getOrderByNumber(id);
  const { session } = useSession();

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-store-canvas">
        <Header />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center">
          <AlertCircle size={28} aria-hidden="true" className="mx-auto text-store-text-secondary" />
          <h1 className="mt-4 font-heading text-3xl font-medium text-store-charcoal">We couldn’t find that order</h1>
          <p className="text-sm text-store-text-secondary mt-3">There’s no order “{id}” in this account.</p>
          <Link href="/account" className="mt-8 inline-flex items-center h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black">
            Back to my orders
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const payment = order.paymentStatus ?? 'paid';
  const fulfilment = order.fulfillmentStatus ?? 'queued';
  const step = STEP_INDEX[fulfilment];
  const hasIssue = payment === 'failed' || payment === 'refunded' || fulfilment === 'submission_failed';
  const hasShipped = fulfilment === 'shipped' || fulfilment === 'delivered';
  const estimate = deliveryEstimate(order.shippingAddress.postalCode, new Date(order.date));
  const subtotal = order.items.reduce((sum, item) => sum + linePaise(item), 0);
  const total = subtotal - order.discountINR * 100 + order.shippingINR * 100;
  const address = order.shippingAddress;

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'My account', href: '/account' },
            { label: order.orderNumber },
          ]}
        />

        {/* Header */}
        <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-store-card-border">
          <div>
            <h1 className="font-heading text-[clamp(2rem,3vw+1rem,2.75rem)] font-medium tracking-tight text-store-charcoal">
              Order {order.orderNumber}
            </h1>
            <p className="mt-2 text-sm text-store-text-secondary">
              Placed {formatShortDate(order.date)} · {order.items.reduce((n, i) => n + i.quantity, 0)} items ·{' '}
              <span className="tuw-tabular-nums">{formatPaise(total)}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant={payment === 'failed' ? 'error' : payment === 'paid' ? 'outline' : 'neutral'}>
                {PAYMENT_LABELS[payment]}
              </Badge>
              <Badge variant={fulfilment === 'submission_failed' ? 'error' : fulfilment === 'delivered' ? 'dark' : 'neutral'}>
                {FULFILMENT_LABELS[fulfilment]}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {!hasIssue && (
              <Link
                href={`/track-order?ref=${encodeURIComponent(order.orderNumber)}`}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
              >
                Track order
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/account"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-store-border text-sm font-medium text-store-charcoal hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              All orders
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
          <div className="space-y-6 min-w-0">
            {/* Progress */}
            <section aria-labelledby="progress-heading" className={CARD}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="progress-heading" className={CARD_TITLE}>Progress</h2>
                {estimate && !hasIssue && fulfilment !== 'delivered' && (
                  <p className="text-sm text-store-charcoal">
                    Expected {formatShortDate(estimate.earliest)} – {formatShortDate(estimate.latest)}
                  </p>
                )}
              </div>
              {step === undefined || hasIssue ? (
                <p className="mt-4 text-sm text-store-text-secondary border-l-2 border-store-terracotta pl-3">
                  {fulfilment === 'submission_failed'
                    ? 'We couldn’t send this order to print. We’ll contact you before anything is charged again.'
                    : payment === 'refunded'
                    ? 'This order was refunded and won’t be printed.'
                    : 'Payment didn’t go through, so this order is on hold.'}
                </p>
              ) : (
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
              )}

              {order.trackingEvents && order.trackingEvents.length > 0 && (
                <ol className="mt-8 pt-6 border-t border-store-card-border space-y-5">
                  {order.trackingEvents.map((evt) => (
                    <li key={`${evt.date}-${evt.time}-${evt.status}`} className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 text-sm">
                      <span className="text-store-text-secondary tuw-tabular-nums">
                        {formatShortDate(evt.date)}
                        <span className="block text-xs">{evt.time}</span>
                      </span>
                      <span>
                        <span className="font-medium text-store-charcoal">{evt.status}</span>
                        <span className="text-store-text-secondary"> · {evt.location}</span>
                        <span className="block text-store-text-secondary mt-0.5">{evt.description}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Items */}
            <section aria-labelledby="items-heading" className={CARD}>
              <h2 id="items-heading" className={CARD_TITLE}>
                Items ({order.items.reduce((n, i) => n + i.quantity, 0)})
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
                          {item.quantity > 1 && (
                            <p className="mt-1 text-xs text-store-text-secondary tuw-tabular-nums">
                              {formatPaise(linePaise(item) / item.quantity)} each
                            </p>
                          )}
                        </div>
                        <span className="text-base text-store-charcoal tuw-tabular-nums">{formatPaise(linePaise(item))}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="space-y-6">
            {/* Summary */}
            <section aria-labelledby="summary-heading" className={CARD}>
              <h2 id="summary-heading" className={CARD_TITLE}>Summary</h2>
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
                  {payment === 'pending' ? 'Due on delivery' : payment === 'paid' ? 'Total paid' : 'Total'}
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

            {/* Address */}
            <section aria-labelledby="address-heading" className={`${CARD} text-sm`}>
              <h2 id="address-heading" className={CARD_TITLE}>Delivering to</h2>
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

            {/* Help */}
            <section aria-labelledby="help-heading" className="p-6 bg-store-cream border border-store-card-border text-sm text-store-text-secondary leading-relaxed">
              <h2 id="help-heading" className="font-medium text-store-charcoal">Need help?</h2>
              <p className="mt-2">
                Unworn clothing can be returned within {RETURN_WINDOW_DAYS} days of delivery.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/policies/returns" className="text-store-charcoal underline underline-offset-4 decoration-store-gold">
                  Returns policy
                </Link>
                <Link href="/contact" className="text-store-charcoal underline underline-offset-4 decoration-store-gold">
                  Contact us
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
