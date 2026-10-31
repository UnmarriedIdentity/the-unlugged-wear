'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useStore } from '@/mocks/store';
import { formatINR } from '@/lib/format';
import { Package, Truck, ExternalLink, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function AccountOrdersPage() {
  const { orders } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account', href: '/account' },
            { label: 'Order History' },
          ]}
        />

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-heading">
              Order History
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Review and track all past garment orders from The Unplugged Wear studio.
            </p>
          </div>
          <Button variant="outline" size="sm" href="/account">
            Back to Account Overview
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 mt-8 p-8">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mx-auto mb-4">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-xl font-bold text-stone-900">No Orders Placed Yet</h2>
            <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
              Your placed orders will appear here with real-time on-demand production and dispatch checkpoints.
            </p>
            <div className="mt-6">
              <Button variant="dark" size="md" href="/shop">
                Explore The Collection
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs transition-all hover:border-stone-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-stone-900 font-mono">
                        {order.orderNumber}
                      </span>
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
                    <p className="text-xs text-stone-500">
                      Placed on {order.date} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-stone-500 block">Total</span>
                      <span className="font-bold text-stone-900 font-mono text-sm">
                        {formatINR(order.totalINR * 100)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/account/orders/${encodeURIComponent(order.id)}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-stone-50 border border-stone-100"
                    >
                      <div className="w-12 h-14 rounded overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-semibold text-stone-900 truncate">{item.title}</p>
                        <p className="text-stone-500 text-xs">
                          {item.color} • Size {item.size} • Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-medium text-stone-900">
                        {formatINR(item.priceINR * item.quantity * 100)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking footer */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <Truck size={14} className="text-stone-500" />
                    <span>
                      Carrier: <strong>{order.carrier || 'Delhivery Express'}</strong> • Est.{' '}
                      <span className="text-emerald-700 font-medium">
                        {order.estimatedDelivery || '3–5 days'}
                      </span>
                    </span>
                  </div>
                  <Link
                    href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                    className="inline-flex items-center gap-1 font-semibold text-stone-900 hover:underline"
                  >
                    <span>Track Shipment</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
