'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useStore } from '@/mocks/store';
import { formatINR } from '@/lib/format';
import {
  Package,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getOrderById, getOrderByNumber } = useStore();

  const order = getOrderById(id) || getOrderByNumber(id);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Order Not Found</h1>
          <p className="text-sm text-stone-600 mt-2">
            We could not find an order matching identifier <code className="font-mono bg-stone-100 px-2 py-0.5 rounded">{id}</code>.
          </p>
          <div className="mt-6">
            <Button variant="dark" size="md" href="/account/orders">
              Return to Orders
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid' || order.status === 'Confirmed' || order.status === 'Printing';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account', href: '/account' },
            { label: 'Orders', href: '/account/orders' },
            { label: order.orderNumber },
          ]}
        />

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-mono">
                {order.orderNumber}
              </h1>
              <Badge
                variant={
                  order.status === 'Delivered'
                    ? 'success'
                    : order.status === 'Failed'
                    ? 'error'
                    : 'neutral'
                }
              >
                {order.status}
              </Badge>
              {order.paymentStatus && (
                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  Payment: {order.paymentStatus}
                </Badge>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {order.date} • Reference ID: <span className="font-mono">{order.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
            >
              Track Live Shipment
            </Button>
            <Button variant="outline" size="sm" href="/account/orders">
              <ArrowLeft size={14} className="mr-1" /> All Orders
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main order items & timeline (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items list */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4">
                Ordered Garments ({order.items.length})
              </h2>
              <div className="divide-y divide-stone-200">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Color: <strong>{item.color}</strong> • Size: <strong>{item.size}</strong>
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Quantity: {item.quantity} × {formatINR(item.priceINR * 100)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatINR(item.priceINR * item.quantity * 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfilment & Carrier timeline */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                    Fulfillment Progress
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Partner: {order.partnerOrderId ? `Qikink Direct API (${order.partnerOrderId})` : 'In-House Studio'}
                  </p>
                </div>
                <Badge variant={order.fulfillmentStatus === 'delivered' ? 'success' : 'neutral'}>
                  {order.fulfillmentStatus || 'processing'}
                </Badge>
              </div>

              {order.trackingEvents && order.trackingEvents.length > 0 ? (
                <div className="mt-6 relative pl-6 border-l-2 border-stone-200 space-y-6">
                  {order.trackingEvents.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-stone-900 border-2 border-white ring-2 ring-stone-200" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{evt.status}</span>
                          <span className="text-stone-400">•</span>
                          <span className="text-stone-500">{evt.location}</span>
                        </div>
                        <p className="text-stone-600 mt-0.5">{evt.description}</p>
                        <p className="text-xs text-stone-400 mt-1 font-mono">
                          {evt.date} at {evt.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-stone-500">
                  <Truck size={24} className="mx-auto mb-2 text-stone-400" />
                  <span>Tracking events will appear as the courier scans the package.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Totals & Delivery Address (1 col) */}
          <div className="space-y-6">
            {/* Price summary */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-3">
                Payment Summary
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(order.subtotalINR * 100)}</span>
                </div>
                {order.discountINR > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatINR(order.discountINR * 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span className="font-mono">
                    {order.shippingINR === 0 ? 'FREE' : formatINR(order.shippingINR * 100)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span className="font-mono">{formatINR(order.totalINR * 100)}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-100 text-xs text-stone-500">
                Payment Mode: <strong className="text-stone-800">{order.paymentMethod}</strong>
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-3">
                Shipping Details
              </h2>
              <div className="pt-3 text-xs text-stone-600 space-y-1 leading-relaxed">
                <p className="font-bold text-stone-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                <span>Carrier: <strong>{order.carrier || 'Delhivery Express'}</strong></span>
                <br />
                <span>Est. Delivery: <strong className="text-emerald-700">{order.estimatedDelivery || '3–5 days'}</strong></span>
              </div>
            </div>

            {/* Support link */}
            <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Garment Guarantee</span>
              </div>
              <p className="text-xs leading-relaxed">
                Eligible for returns within 7 days of delivery in unworn condition with tags attached.
              </p>
              <Link
                href="/policies/returns"
                className="inline-block text-xs font-semibold text-stone-900 hover:underline"
              >
                Review Return Policy →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
