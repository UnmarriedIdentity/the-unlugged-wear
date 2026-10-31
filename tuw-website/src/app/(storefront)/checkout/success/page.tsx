'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useStore } from '@/mocks/store';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { CheckCircle2, AlertCircle, Clock, Truck, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || searchParams.get('id');
  const { getOrderByNumber, getOrderById } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    // Lookup order by order number or ID
    const found = getOrderByNumber(orderNumber) || getOrderById(orderNumber);
    setOrder(found || null);
    setLoading(false);
  }, [orderNumber, getOrderByNumber, getOrderById]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-stone-600">Verifying order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mx-auto mb-4">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Order Not Found</h1>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          We could not locate an order matching reference{' '}
          <code className="bg-stone-100 px-2 py-0.5 rounded text-stone-800 font-mono text-xs">
            {orderNumber || 'unspecified'}
          </code>
          . A forged or expired confirmation link cannot be displayed as a confirmed order.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="dark" size="md" href="/shop">
            Return to Shop
          </Button>
          <Button variant="outline" size="md" href="/track-order">
            Track Existing Order
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid' || order.status === 'Confirmed' || order.status === 'Printing';
  const isPending = order.paymentStatus === 'pending';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-xs text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isPaid
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
        >
          {isPaid ? <CheckCircle2 size={40} /> : <Clock size={40} />}
        </div>

        <span
          className={`text-xs uppercase font-bold tracking-[0.2em] ${
            isPaid ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {isPaid ? 'Order Confirmed' : 'Payment Processing'}
        </span>
        <h1 className="text-[clamp(1.75rem,3vw+0.5rem,2.25rem)] font-extrabold tracking-tight text-stone-900 mt-2">
          {isPaid ? 'Thank You for Your Order' : 'Awaiting Payment Settlement'}
        </h1>
        <p className="text-sm text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
          Order reference <strong className="text-stone-900">{order.orderNumber}</strong> has been registered.
          {isPaid
            ? ' It is now queued for on-demand production at our studio.'
            : ' Confirmation will update once the payment provider verifies the transaction.'}
        </p>

        {/* Status badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <Badge variant={isPaid ? 'success' : 'warning'}>
            Payment: {order.paymentStatus || (isPaid ? 'paid' : 'pending')}
          </Badge>
          <Badge variant="neutral">Fulfillment: {order.fulfillmentStatus || 'queued'}</Badge>
          {order.partnerOrderId && (
            <Badge variant="neutral">Qikink Ref: {order.partnerOrderId}</Badge>
          )}
        </div>

        {/* Order overview card */}
        <div className="my-8 p-6 rounded-2xl bg-stone-50 border border-stone-200 text-left max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block">Order Reference:</span>
              <span className="font-bold text-stone-900">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Payment Mode:</span>
              <span className="font-bold text-stone-900">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Carrier:</span>
              <span className="font-bold text-stone-900">{order.carrier || 'Delhivery Express'}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Est. Delivery:</span>
              <span className="font-bold text-emerald-700">{order.estimatedDelivery || '3–5 business days'}</span>
            </div>
          </div>

          {/* Purchased items list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
              Items Ordered ({order.items.length})
            </h4>
            <div className="divide-y divide-stone-200 bg-white rounded-xl border border-stone-200 px-4 py-1">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">{item.title}</div>
                      <div className="text-stone-500 text-xs mt-0.5">
                        {item.color} • Size {item.size} • Qty {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-medium text-stone-900 text-right">
                    {formatINR(item.priceINR * item.quantity * 100)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="space-y-1.5 text-xs border-t border-stone-200 pt-4">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatINR(order.subtotalINR * 100)}</span>
            </div>
            {order.discountINR > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Promotional Discount</span>
                <span className="font-mono">-{formatINR(order.discountINR * 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Shipping Fee</span>
              <span className="font-mono">{order.shippingINR === 0 ? 'FREE' : formatINR(order.shippingINR * 100)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>{order.paymentStatus === 'pending' ? 'Total due on delivery' : 'Total Paid'}</span>
              <span className="font-mono">{formatINR(order.totalINR * 100)}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="pt-2 border-t border-stone-200 text-xs">
            <span className="font-bold text-stone-900 block mb-1">Delivering to:</span>
            <p className="text-stone-600 leading-relaxed">
              {order.shippingAddress.fullName} • {order.shippingAddress.phone}
              <br />
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="dark" size="md" href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}>
            Track Shipment Status
          </Button>
          <Button variant="outline" size="md" href="/account/orders">
            View All Orders
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-stone-500">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Need support? Contact support@theunpluggedwear.com</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-stone-600">Loading order status...</p>
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
