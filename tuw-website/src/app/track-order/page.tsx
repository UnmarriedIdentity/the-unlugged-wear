'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Input from '@storefront/components/ui/Input';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';
import Button from '@storefront/components/ui/Button';
import Badge from '@storefront/components/ui/Badge';
import { useSession } from '@storefront/lib/session';
import { toStoreOrder } from '@storefront/lib/orders';
import type { Order } from '@storefront/lib/types';
import { getOrderAction, trackOrderAction } from '@/server/order-actions';
import { Truck, CheckCircle2, Clock, AlertCircle, Package, Search } from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref') || searchParams.get('order') || '';
  const { session } = useSession();

  const [query, setQuery] = useState(refParam);
  const [email, setEmail] = useState(session?.email ?? '');
  const [searchedRef, setSearchedRef] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // A signed-in customer opening their own order from a link needs no email.
  useEffect(() => {
    if (!refParam || !session) return;
    let live = true;
    void getOrderAction({ orderNumber: refParam }).then((result) => {
      if (live && result.ok) { setOrder(toStoreOrder(result.data)); setSearchedRef(refParam); }
    });
    return () => { live = false; };
  }, [refParam, session]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !email.trim()) {
      setError('Enter the order number and the email used for the order.');
      return;
    }
    setSearching(true);
    setError(null);
    const result = await trackOrderAction({ orderNumber: query.trim(), email: email.trim() });
    setSearching(false);
    setSearchedRef(query.trim());
    if (result.ok) setOrder(toStoreOrder(result.data));
    else { setOrder(null); setError(result.error.message); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Track Order' },
        ]}
      />

      <div className="my-6">
        <h1 className="text-[clamp(1.75rem,3vw+0.5rem,2.25rem)] font-extrabold tracking-tight text-[#1A1A1A]">
          Track Your Order
        </h1>
        <p className="text-sm text-[#666] mt-1">
          Enter the order number from your confirmation and the email you used at checkout.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 shadow-xs mb-8">
        <form onSubmit={handleSearch} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Input
            id="track-order-number"
            label="Order number"
            placeholder="e.g. TUW-261112-K7Q4M"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Search size={18} />}
            autoComplete="off"
          />
          <Input
            id="track-order-email"
            label="Email"
            type="email"
            placeholder="asha.rao@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button variant="dark" size="lg" type="submit" icon={<Truck size={18} />} disabled={searching}>
            {searching ? 'Looking…' : 'Track order'}
          </Button>
        </form>
        <p className="mt-3 text-xs text-[#8A8A8A]">
          Have an account? <a href="/account/orders" className="underline underline-offset-2 text-[#1A1A1A]">See all your orders</a>.
        </p>
      </div>

      {/* Order Status & Timeline */}
      {order ? (
        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 sm:p-8 shadow-xs space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E2DDCF]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#1A1A1A]">{order.orderNumber}</h2>
                <Badge
                  variant={
                    order.status === 'Delivered'
                      ? 'success'
                      : order.status === 'Shipped'
                      ? 'info'
                      : 'neutral'
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <p className="text-xs text-[#8A8A8A] mt-1">
                {order.carrier && order.trackingNumber ? (
                  <>Carrier: <strong>{order.carrier}</strong> • Tracking code: <code>{order.trackingNumber}</code></>
                ) : (
                  order.sqlStatus === 'shipped' || order.sqlStatus === 'delivered'
                    ? 'No tracking code was added for this shipment.'
                    : 'A courier and tracking code are added when it ships.'
                )}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#8A8A8A] block">Estimated Delivery:</span>
              <span className="text-base font-extrabold text-[#10B981]">
                {order.sqlStatus === 'delivered' ? 'Delivered' : order.sqlStatus === 'cancelled' ? 'Cancelled' : order.estimatedDelivery || 'Shared when it ships'}
              </span>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] mb-6">
              Milestone Progress Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DDCF]">
              {order.trackingEvents?.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs ring-4 ring-white">
                    ✓
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1A1A1A]">{event.status}</span>
                      <span className="text-xs text-[#8A8A8A]">
                        {event.date} at {event.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#666]">{event.description}</p>
                    <span className="text-xs text-[#8A8A8A] block">{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Garments in package */}
          <div className="pt-6 border-t border-[#E2DDCF]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] mb-4">
              Items in this Package
            </h3>
            <div className="divide-y divide-[#E2DDCF]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-4 text-xs">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#F4F1EA] shrink-0 border border-[#E2DDCF]">
                    <ImageWithFallback src={item.image} alt={item.title} fallbackText="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#1A1A1A]">{item.title}</h4>
                    <span className="text-[#8A8A8A]">
                      {item.color} • Size {item.size} • Qty {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searchedRef && error ? (
        <div role="alert" className="text-center py-16 bg-white rounded-3xl border border-[#E2DDCF] p-8 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">{error}</h2>
          <p className="text-xs text-[#666] max-w-sm mx-auto mt-2 leading-relaxed">
            Check the order number on your confirmation and use the same email you checked out with.
          </p>
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-sm">Loading tracking information...</div>}>
          <TrackOrderContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
