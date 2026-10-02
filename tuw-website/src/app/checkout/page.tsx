'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PaymentSimulationPanel from '@/components/commerce/PaymentSimulationPanel';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useStore } from '@/mocks/store';
import { Address, Order } from '@/lib/types';
import { CheckCircle2, ShieldCheck, Truck, ArrowLeft, RefreshCw, ShoppingBag, PackageCheck } from 'lucide-react';

export default function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    shippingFee,
    discountAmount,
    addresses,
    createOrder,
  } = useStore();

  const total = cartSubtotal - discountAmount + shippingFee;

  // Checkout step: 1. Address -> 2. Shipping -> 3. Payment Simulation -> 4. Order Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [fullName, setFullName] = useState(addresses[0]?.fullName || 'Arjun Rao');
  const [email, setEmail] = useState('arjun.rao@example.com');
  const [phone, setPhone] = useState(addresses[0]?.phone || '+91 98450 12345');
  const [addressLine1, setAddressLine1] = useState(addresses[0]?.addressLine1 || 'Flat 402, Skyline Residency');
  const [addressLine2, setAddressLine2] = useState(addresses[0]?.addressLine2 || '12th Main, Indiranagar');
  const [city, setCity] = useState(addresses[0]?.city || 'Bengaluru');
  const [state, setState] = useState(addresses[0]?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(addresses[0]?.postalCode || '560038');

  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!addressLine1.trim()) errs.addressLine1 = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!postalCode.trim()) errs.postalCode = 'Postal PIN code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) {
      setStep(2);
    }
  };

  const handleProceedToPayment = () => {
    setStep(3);
  };

  const handlePaymentSuccess = (paymentMethod: 'UPI' | 'Card' | 'COD (Demo)') => {
    const shippingAddress: Address = {
      id: `addr-${Date.now()}`,
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: 'India',
      phone,
    };

    const newOrder = createOrder({
      items: cart,
      subtotalINR: cartSubtotal,
      shippingINR: shippingFee,
      discountINR: discountAmount,
      totalINR: total,
      shippingAddress,
      paymentMethod,
    });

    setCompletedOrder(newOrder);
    setStep(4);
  };

  // If cart is empty and not completed
  if (cart.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#8A8A8A] mx-auto mb-4">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold">Your Bag is Empty</h1>
          <p className="text-sm text-[#666] mt-2">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <div className="mt-6">
            <Button variant="dark" size="md" href="/shop">
              Browse Collection
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // STEP 4: Order Confirmation Screen
  if (step === 4 && completedOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
          <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 sm:p-12 shadow-xs text-center">
            <div className="w-20 h-20 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#15803D] mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>

            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#10B981]">
              Simulated Order Confirmed
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A] mt-2">
              Thank You for Your Order
            </h1>
            <p className="text-sm text-[#666] max-w-md mx-auto mt-2 leading-relaxed">
              Order reference <strong className="text-[#1A1A1A]">{completedOrder.orderNumber}</strong> has been
              queued for on-demand printing at our studio.
            </p>

            {/* Order summary card */}
            <div className="my-8 p-6 rounded-2xl bg-[#FAF9F6] border border-[#E2DDCF] text-left max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[#E2DDCF] text-xs">
                <div>
                  <span className="text-[#8A8A8A] block">Order Reference:</span>
                  <span className="font-bold text-[#1A1A1A]">{completedOrder.orderNumber}</span>
                </div>
                <div>
                  <span className="text-[#8A8A8A] block">Payment Mode:</span>
                  <span className="font-bold text-[#1A1A1A]">{completedOrder.paymentMethod} (Demo)</span>
                </div>
                <div>
                  <span className="text-[#8A8A8A] block">Carrier:</span>
                  <span className="font-bold text-[#1A1A1A]">{completedOrder.carrier}</span>
                </div>
                <div>
                  <span className="text-[#8A8A8A] block">Est. Delivery:</span>
                  <span className="font-bold text-[#10B981]">{completedOrder.estimatedDelivery}</span>
                </div>
              </div>

              {/* Purchased items list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
                  Purchased Items ({completedOrder.items.length})
                </h4>
                <div className="divide-y divide-[#E2DDCF] bg-white rounded-xl border border-[#E2DDCF] px-4 py-1">
                  {completedOrder.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#F4F1EA] shrink-0 border border-[#E2DDCF]">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-[#1A1A1A]">{item.title}</div>
                          <div className="text-[#8A8A8A] text-[11px] mt-0.5">
                            {item.color} • Size {item.size} • Qty {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-[#1A1A1A] shrink-0">
                        ₹{(item.priceINR * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals Breakdown */}
              <div className="pt-2 border-t border-[#E2DDCF] space-y-2 text-xs">
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Subtotal</span>
                  <span>₹{completedOrder.subtotalINR.toLocaleString()}</span>
                </div>
                {completedOrder.discountINR > 0 && (
                  <div className="flex justify-between text-[#15803D] font-semibold">
                    <span>Discount Applied</span>
                    <span>-₹{completedOrder.discountINR.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Domestic Shipping</span>
                  <span>{completedOrder.shippingINR === 0 ? 'FREE' : `₹${completedOrder.shippingINR}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#1A1A1A] pt-2 border-t border-[#E2DDCF]">
                  <span>Total Paid</span>
                  <span>₹{completedOrder.totalINR.toLocaleString()}</span>
                </div>
              </div>

              {/* Next Steps Guide */}
              <div className="p-4 rounded-xl bg-white border border-[#E2DDCF] text-xs space-y-2">
                <span className="font-bold text-[#1A1A1A] block uppercase tracking-wider text-[11px]">
                  What Happens Next?
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[#666] leading-relaxed">
                  <li>
                    <strong className="text-[#1A1A1A]">POD Atelier Queue:</strong> Your order is inspected and scheduled on high-density Japanese digital printers within 12 hours.
                  </li>
                  <li>
                    <strong className="text-[#1A1A1A]">Artisan Finishing & QC:</strong> Each garment undergoes manual seam inspection, pre-shrink steaming, and eco-tagging.
                  </li>
                  <li>
                    <strong className="text-[#1A1A1A]">Express Courier Dispatch:</strong> Transferred to {completedOrder.carrier} with tracking updates sent to your email.
                  </li>
                </ol>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="dark"
                size="md"
                href={`/track-order?ref=${completedOrder.orderNumber}`}
                icon={<Truck size={16} />}
              >
                Track Shipment Timeline
              </Button>
              <Button
                variant="secondary"
                size="md"
                href="/account"
              >
                View Account Orders
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shopping Bag', href: '/cart' },
            { label: 'Demo Checkout' },
          ]}
        />

        <div className="my-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
            Checkout Simulation
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Complete your order preview with realistic delivery and payment sandbox states.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto no-scrollbar">
          {[
            { num: 1, label: 'Delivery Address' },
            { num: 2, label: 'Shipping Mode' },
            { num: 3, label: 'Payment Sandbox' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                step === s.num
                  ? 'text-[#1A1A1A]'
                  : step > s.num
                  ? 'text-[#10B981]'
                  : 'text-[#B5AEA1]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? 'bg-[#1A1A1A] text-white'
                    : step > s.num
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#E2DDCF] text-[#8A8A8A]'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
              {s.num < 3 && <span className="text-[#D1D5DB] ml-2">/</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Flow (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2DDCF] p-6 sm:p-8 shadow-xs">
            {/* Step 1: Address */}
            {step === 1 && (
              <form onSubmit={handleProceedToShipping} className="space-y-6">
                <h3 className="text-lg font-bold text-[#1A1A1A]">1. Recipient Contact & Delivery Address</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                    required
                  />
                  <Input
                    label="Email Address (for order updates)"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                  />
                </div>

                <Input
                  label="Contact Phone (for delivery courier)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  required
                />

                <Input
                  label="Street Address / Flat / Building"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  error={errors.addressLine1}
                  required
                />

                <Input
                  label="Apartment, Suite, Unit, Landmark"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  helperText="Optional landmark or apartment number"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                  <Input
                    label="PIN / Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    error={errors.postalCode}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="dark" size="lg" type="submit">
                    Continue to Shipping Method
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Shipping Method */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1A1A1A]">2. Delivery Courier Option</h3>

                <div className="space-y-3">
                  <label
                    onClick={() => setDeliverySpeed('standard')}
                    className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      deliverySpeed === 'standard'
                        ? 'border-[#1A1A1A] bg-[#FAF9F6] ring-1 ring-[#1A1A1A]'
                        : 'border-[#E2DDCF] bg-white'
                    }`}
                  >
                    <div className="flex gap-3">
                      <Truck size={20} className="text-[#1A1A1A] mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-[#1A1A1A]">
                          Delhivery Surface Carbon-Neutral
                        </div>
                        <p className="text-xs text-[#666] mt-0.5">
                          Standard 3-5 business days after 24h POD printing and inspection.
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </label>

                  <label
                    onClick={() => setDeliverySpeed('express')}
                    className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      deliverySpeed === 'express'
                        ? 'border-[#1A1A1A] bg-[#FAF9F6] ring-1 ring-[#1A1A1A]'
                        : 'border-[#E2DDCF] bg-white'
                    }`}
                  >
                    <div className="flex gap-3">
                      <PackageCheck size={20} className="text-[#7539FF] mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-[#1A1A1A]">
                          BlueDart Air Priority Express
                        </div>
                        <p className="text-xs text-[#666] mt-0.5">
                          Expedited 2-3 business days domestic air cargo.
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1A1A1A]">₹250</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                    Back to Address
                  </Button>
                  <Button variant="dark" size="lg" onClick={handleProceedToPayment}>
                    Continue to Payment Sandbox
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Sandbox Simulation */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1A1A1A]">3. Payment Sandbox Simulation</h3>
                <PaymentSimulationPanel
                  totalAmount={total}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFail={(reason) => console.log('Payment failed:', reason)}
                  onCancel={() => setStep(2)}
                />
              </div>
            )}
          </div>

          {/* Right: Cart Preview Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A] uppercase tracking-wider pb-3 border-b border-[#E2DDCF]">
                Bag ({cart.reduce((a, b) => a + b.quantity, 0)} Items)
              </h3>

              <div className="divide-y divide-[#E2DDCF] max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex gap-3 text-xs">
                    <div className="w-14 h-18 rounded-lg overflow-hidden bg-[#F4F1EA] shrink-0 border border-[#E2DDCF]">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1A1A1A] leading-snug">{item.title}</h4>
                      <p className="text-[#8A8A8A] mt-0.5">
                        {item.color} • Size {item.size} • Qty {item.quantity}
                      </p>
                      <p className="font-bold text-[#1A1A1A] mt-1">
                        ₹{(item.priceINR * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs text-[#5A5A5A] pt-3 border-t border-[#E2DDCF]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1A1A1A]">₹{cartSubtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#15803D] font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Domestic Shipping</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#1A1A1A] pt-3 border-t border-[#E2DDCF]">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E2DDCF] text-xs text-[#666] space-y-1">
              <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#10B981]" />
                <span>Simulated Transaction</span>
              </div>
              <p>Demo checkout process. No bank deduction or actual credit card processing occurs.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
