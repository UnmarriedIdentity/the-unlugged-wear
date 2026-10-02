'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/mocks/store';
import { Truck, CheckCircle2, Clock, AlertCircle, Package, Search } from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref') || 'TUW-9042';

  const { getOrderByNumber } = useStore();
  const [query, setQuery] = useState(refParam);
  const [searchedRef, setSearchedRef] = useState(refParam);

  const order = getOrderByNumber(searchedRef);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchedRef(query.trim());
    }
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
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
          Track Your Shipment
        </h1>
        <p className="text-sm text-[#666] mt-1">
          Monitor your on-demand print progress, carrier dispatch, and estimated doorstep arrival.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 shadow-xs mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter order reference (e.g. TUW-9042 or TUW-8812)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<Search size={18} />}
            />
          </div>
          <Button variant="dark" size="lg" type="submit" icon={<Truck size={18} />}>
            Track Shipment
          </Button>
        </form>

        <div className="flex items-center gap-2 mt-3 text-xs text-[#8A8A8A]">
          <span>Try demo references:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('TUW-9042');
              setSearchedRef('TUW-9042');
            }}
            className="text-[#7539FF] font-semibold hover:underline cursor-pointer"
          >
            TUW-9042
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setQuery('TUW-8812');
              setSearchedRef('TUW-8812');
            }}
            className="text-[#7539FF] font-semibold hover:underline cursor-pointer"
          >
            TUW-8812
          </button>
        </div>
      </div>

      {/* Shipment Status & Timeline */}
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
                Carrier: <strong>{order.carrier}</strong> • Tracking Code:{' '}
                <code>{order.trackingNumber}</code>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#8A8A8A] block">Estimated Delivery:</span>
              <span className="text-base font-extrabold text-[#10B981]">
                {order.estimatedDelivery || 'Delivered'}
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
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] ring-4 ring-white">
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
                    <span className="text-[11px] text-[#8A8A8A] block">{event.location}</span>
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
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
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
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DDCF] p-8 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">Reference &ldquo;{searchedRef}&rdquo; Not Found</h3>
          <p className="text-xs text-[#666] max-w-sm mx-auto mt-2 leading-relaxed">
            Please verify the order reference number from your confirmation email or dispatch SMS.
          </p>
        </div>
      )}
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
