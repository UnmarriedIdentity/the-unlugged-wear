'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PaymentSimulationPanel from '@/components/commerce/PaymentSimulationPanel';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useStore } from '@/mocks/store';
import { useDemoSession } from '@/mocks/auth';
import { Address, Order } from '@/lib/types';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  PackageCheck,
  Minus,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Tag,
} from 'lucide-react';

const EXPRESS_FEE = 250;

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    shippingFee,
    freeShippingThreshold,
    freeShippingRemaining,
    discountAmount,
    promoCode,
    applyPromoCode,
    removePromoCode,
    updateQuantity,
    removeFromCart,
    addresses,
    createOrder,
  } = useStore();

  const { session } = useDemoSession();

  // 3-step checkout flow matching Figma Node Checkout (media_1793276628297_7100bb4c.png)
  // Step 1: Your cart -> Step 2: Your details -> Step 3: Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states for Step 2 (Your details). Guests start empty; a demo
  // sign-in fills them from the account and its default address.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [prefilledFor, setPrefilledFor] = useState('');

  useEffect(() => {
    if (!session || prefilledFor === session.email) return;
    const [first = '', ...rest] = session.name.split(' ');
    const saved = addresses.find((a) => a.isDefault) || addresses[0];
    // Only fill empty fields, so nothing the shopper typed is overwritten.
    const fill = (setter: React.Dispatch<React.SetStateAction<string>>, value?: string) =>
      setter((current) => current || value || '');
    fill(setFirstName, first);
    fill(setLastName, rest.join(' '));
    fill(setEmail, session.email);
    if (saved) {
      fill(setPhone, saved.phone);
      fill(setAddressLine1, saved.addressLine1);
      fill(setAddressLine2, saved.addressLine2);
      fill(setCity, saved.city);
      fill(setState, saved.state);
      fill(setPostalCode, saved.postalCode);
    }
    setPrefilledFor(session.email);
  }, [session, addresses, prefilledFor]);

  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  // Express replaces the standard fee rather than adding to it.
  const deliveryFee = deliverySpeed === 'express' ? EXPRESS_FEE : shippingFee;
  const total = cartSubtotal - discountAmount + deliveryFee;
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!addressLine1.trim()) errs.addressLine1 = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!postalCode.trim()) errs.postalCode = 'Postal PIN code is required';
    setErrors(errs);
    const firstInvalid = Object.keys(errs)[0];
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = applyPromoCode(promoInput.trim());
    if (ok) {
      setPromoMessage({ type: 'success', text: 'Coupon applied: 10% off' });
      setPromoInput('');
    } else {
      setPromoMessage({ type: 'error', text: 'Invalid coupon. Try UNPLUGGED10.' });
    }
  };

  const handleProceedToDetails = () => {
    if (cart.length > 0) setStep(2);
  };

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateDetails()) {
      setStep(3);
    }
  };

  const handlePaymentSuccess = (paymentMethod: 'UPI' | 'Card' | 'COD (Demo)') => {
    const shippingAddress: Address = {
      id: `addr-${Date.now()}`,
      fullName: `${firstName} ${lastName}`.trim(),
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
    };

    const newOrder = createOrder({
      items: cart,
      subtotalINR: cartSubtotal,
      shippingINR: deliveryFee,
      discountINR: discountAmount,
      totalINR: total,
      shippingAddress,
      paymentMethod,
      deliverySpeed,
    });

    router.push(`/checkout/success?order=${encodeURIComponent(newOrder.orderNumber)}`);
  };

  // Empty cart fallback
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-store-canvas">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-store-cream flex items-center justify-center text-store-muted mx-auto mb-4">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold font-heading text-store-charcoal">Your Bag is Empty</h1>
          <p className="text-sm text-store-muted mt-2">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-store-action-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-store-action-hover transition-colors shadow-sm"
            >
              Browse Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Truthful demo feedback (project rule): stated before any input */}
        <div
          role="note"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-store-gold/40 bg-store-cream px-4 py-3 text-sm text-store-text-primary"
        >
          <ShieldCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-store-gold" />
          <p>
            <span className="font-semibold">Demo checkout sandbox</span> — no payment will be
            collected and no order will be printed or shipped.
          </p>
        </div>

        {/* ======================================================== */}
        {/* TOP ROW: Header Title (L) + Floating 3-Step Indicator (R)*/}
        {/* Byte-identical to Figma media_1793276765072_2f83cc78.png */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-store-charcoal tracking-tight">
              {step === 1 && `Your cart`}
              {step === 2 && `Your details`}
              {step === 3 && `Payment`}
            </h1>
          </div>

          {/* Floating Naked 3-Step Indicator directly on canvas (Figma media_1793276765072_2f83cc78.png) */}
          <div className="flex items-center self-start sm:self-auto py-1">
            {/* Step 1: Cart */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center cursor-pointer group"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  step === 1
                    ? 'bg-store-action-primary text-white font-semibold shadow-xs'
                    : step > 1
                    ? 'bg-store-checkout-gold text-store-charcoal font-bold'
                    : 'border border-store-secondary-mint/70 text-store-primary-teal font-normal bg-transparent'
                }`}
              >
                {step > 1 ? '✓' : '1'}
              </span>
              <span
                className={`text-xs ml-2 tracking-wide transition-colors ${
                  step === 1
                    ? 'font-bold text-store-action-primary'
                    : 'font-normal text-store-text-secondary group-hover:text-store-action-primary'
                }`}
              >
                Cart
              </span>
            </button>

            {/* Connecting Hairline Line 1 */}
            <span className="w-6 sm:w-10 h-px bg-store-card-border mx-2.5 sm:mx-3.5" />

            {/* Step 2: Details */}
            <button
              type="button"
              onClick={() => {
                if (cart.length > 0) setStep(2);
              }}
              className="flex items-center cursor-pointer group"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  step === 2
                    ? 'bg-store-action-primary text-white font-semibold shadow-xs'
                    : step > 2
                    ? 'bg-store-checkout-gold text-store-charcoal font-bold'
                    : 'border border-store-secondary-mint/70 text-store-primary-teal font-normal bg-transparent'
                }`}
              >
                {step > 2 ? '✓' : '2'}
              </span>
              <span
                className={`text-xs ml-2 tracking-wide transition-colors ${
                  step === 2
                    ? 'font-bold text-store-action-primary'
                    : 'font-normal text-store-text-secondary group-hover:text-store-action-primary'
                }`}
              >
                Details
              </span>
            </button>

            {/* Connecting Hairline Line 2 */}
            <span className="w-6 sm:w-10 h-px bg-store-card-border mx-2.5 sm:mx-3.5" />

            {/* Step 3: Payment */}
            <button
              type="button"
              onClick={() => {
                if (validateDetails()) setStep(3);
              }}
              className="flex items-center cursor-pointer group"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  step === 3
                    ? 'bg-store-action-primary text-white font-semibold shadow-xs'
                    : 'border border-store-secondary-mint/70 text-store-primary-teal font-normal bg-transparent'
                }`}
              >
                3
              </span>
              <span
                className={`text-xs ml-2 tracking-wide transition-colors ${
                  step === 3
                    ? 'font-bold text-store-action-primary'
                    : 'font-normal text-store-text-secondary group-hover:text-store-action-primary'
                }`}
              >
                Payment
              </span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Main Flow Content (8 cols)                  */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-store-card-border p-6 sm:p-8 shadow-xs">
            {/* STEP 1: YOUR CART (Figma Screen 1) */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-store-card-border pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-store-muted">
                    Shopping Bag Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </span>
                  <Link
                    href="/shop"
                    className="text-xs uppercase tracking-wider text-store-muted hover:text-store-charcoal transition-colors font-medium"
                  >
                    Continue shopping
                  </Link>
                </div>

                {/* Cart Items List matching Figma Screen 1 */}
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-store-card-border/80 bg-store-canvas/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-store-card-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-18 h-20 rounded-xl overflow-hidden bg-store-cream shrink-0 border border-store-card-border/80">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold text-store-charcoal leading-snug">
                            {item.title}
                          </h3>
                          {/* Attribute Chips & Stepper */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-md border border-store-card-border bg-white px-2 py-0.5 text-2xs text-store-charcoal font-medium">
                              {item.color} • {item.size}
                            </span>

                            {/* Quantity Stepper Pill */}
                            <div className="inline-flex items-center rounded-md border border-store-card-border bg-white px-1.5 py-0.5 text-2xs text-store-charcoal font-medium gap-1.5 shadow-2xs">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="text-store-muted hover:text-store-charcoal transition-colors cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-4 text-center font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="text-store-muted hover:text-store-charcoal transition-colors cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Remove text */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-store-card-border/60">
                        <span className="text-sm font-bold text-store-charcoal">
                          ₹{(item.priceINR * item.quantity).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-2xs text-store-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Navigation */}
                <div className="pt-4 flex items-center justify-between border-t border-store-card-border">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-store-muted hover:text-store-charcoal transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to shop</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleProceedToDetails}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-store-checkout-gold hover:bg-store-checkout-gold-hover text-store-charcoal font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Proceed to details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: YOUR DETAILS (Figma Screen 2) */}
            {step === 2 && (
              <form onSubmit={handleProceedToPayment} noValidate className="space-y-6">
                <div className="border-b border-store-card-border pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-store-muted">
                    Delivery Address & Speed
                  </span>
                </div>

                {/* Signed-in state: details come from the demo account */}
                <p className="text-sm text-store-text-secondary">
                  {session ? (
                    <>Signed in as <span className="font-medium text-store-text-primary">{session.email}</span>. Your saved address is filled in below.</>
                  ) : (
                    <>
                      Checking out as a guest.{' '}
                      <Link href="/login?next=/checkout" className="font-medium text-store-text-primary underline underline-offset-4">
                        Log in
                      </Link>{' '}
                      to use your saved address.
                    </>
                  )}
                </p>

                {/* Section 1: Contact */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-store-charcoal">
                    1. Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-email" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        Email Address (for order tracking)
                      </label>
                      <input
                        id="checkout-email"
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arjun.rao@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.email && (
                        <p id="checkout-email-error" className="text-2xs text-store-terracotta mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="checkout-phone" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        Contact Phone (for delivery courier)
                      </label>
                      <input
                        id="checkout-phone"
                        aria-invalid={errors.phone ? true : undefined}
                        aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.phone && (
                        <p id="checkout-phone-error" className="text-2xs text-store-terracotta mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Shipping Address */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-store-charcoal">
                    2. Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-firstName" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        First Name
                      </label>
                      <input
                        id="checkout-firstName"
                        aria-invalid={errors.firstName ? true : undefined}
                        aria-describedby={errors.firstName ? 'checkout-firstName-error' : undefined}
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Arjun"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.firstName && (
                        <p id="checkout-firstName-error" className="text-2xs text-store-terracotta mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="checkout-lastName" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        Last Name
                      </label>
                      <input
                        id="checkout-lastName"
                        aria-invalid={errors.lastName ? true : undefined}
                        aria-describedby={errors.lastName ? 'checkout-lastName-error' : undefined}
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Rao"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.lastName && (
                        <p id="checkout-lastName-error" className="text-2xs text-store-terracotta mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-addressLine1" className="text-xs font-medium text-store-charcoal block mb-1.5">
                      Street Address / Flat / Building
                    </label>
                    <input
                      id="checkout-addressLine1"
                      aria-invalid={errors.addressLine1 ? true : undefined}
                      aria-describedby={errors.addressLine1 ? 'checkout-addressLine1-error' : undefined}
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Flat 402, Skyline Residency"
                      className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                      required
                    />
                    {errors.addressLine1 && (
                      <p id="checkout-addressLine1-error" className="text-2xs text-store-terracotta mt-1">{errors.addressLine1}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-addressLine2" className="text-xs font-medium text-store-charcoal block mb-1.5">
                      Apartment, Suite, Unit, Landmark (Optional)
                    </label>
                    <input
                      id="checkout-addressLine2"
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="12th Main, Indiranagar"
                      className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="checkout-city" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        City
                      </label>
                      <input
                        id="checkout-city"
                        aria-invalid={errors.city ? true : undefined}
                        aria-describedby={errors.city ? 'checkout-city-error' : undefined}
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.city && (
                        <p id="checkout-city-error" className="text-2xs text-store-terracotta mt-1">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="checkout-state" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        State
                      </label>
                      <input
                        id="checkout-state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Karnataka"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-postalCode" className="text-xs font-medium text-store-charcoal block mb-1.5">
                        PIN / Postal Code
                      </label>
                      <input
                        id="checkout-postalCode"
                        aria-invalid={errors.postalCode ? true : undefined}
                        aria-describedby={errors.postalCode ? 'checkout-postalCode-error' : undefined}
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="560038"
                        className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                        required
                      />
                      {errors.postalCode && (
                        <p id="checkout-postalCode-error" className="text-2xs text-store-terracotta mt-1">{errors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Delivery Method */}
                <div className="space-y-4 pt-2">
                  <h3 id="checkout-delivery-heading" className="text-xs font-bold uppercase tracking-wider text-store-charcoal">
                    3. Delivery Speed
                  </h3>
                  <div role="radiogroup" aria-labelledby="checkout-delivery-heading" className="space-y-3">
                    <label
                      className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-store-gold ${
                        deliverySpeed === 'standard'
                          ? 'border-store-charcoal bg-store-cream/60 ring-1 ring-store-charcoal'
                          : 'border-store-card-border bg-white hover:border-store-charcoal'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-speed"
                        value="standard"
                        checked={deliverySpeed === 'standard'}
                        onChange={() => setDeliverySpeed('standard')}
                        className="sr-only"
                      />
                      <div className="flex gap-3">
                        <Truck size={20} className="text-store-charcoal mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-store-charcoal">
                            Delhivery Surface
                          </div>
                          <p className="text-xs text-store-muted mt-0.5">
                            Standard 3-5 business days after atelier printing & QC.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-store-charcoal">
                        {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                      </span>
                    </label>

                    <label
                      className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-store-gold ${
                        deliverySpeed === 'express'
                          ? 'border-store-charcoal bg-store-cream/60 ring-1 ring-store-charcoal'
                          : 'border-store-card-border bg-white hover:border-store-charcoal'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-speed"
                        value="express"
                        checked={deliverySpeed === 'express'}
                        onChange={() => setDeliverySpeed('express')}
                        className="sr-only"
                      />
                      <div className="flex gap-3">
                        <PackageCheck size={20} className="text-store-action-primary mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-store-charcoal">
                            BlueDart Air Priority Express
                          </div>
                          <p className="text-xs text-store-muted mt-0.5">
                            Expedited 1-2 business days domestic air cargo.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-store-charcoal">₹{EXPRESS_FEE}</span>
                    </label>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="pt-4 flex items-center justify-between border-t border-store-card-border">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-store-muted hover:text-store-charcoal transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to cart</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-store-checkout-gold hover:bg-store-checkout-gold-hover text-store-charcoal font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Proceed to payment</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PAYMENT (Figma Screens 3, 4, 5) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-store-card-border pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-store-muted">
                    Payment Authorization Sandbox
                  </span>
                </div>

                <PaymentSimulationPanel
                  totalAmount={total}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFail={(reason) => console.log('Payment declined:', reason)}
                  onCancel={() => setStep(2)}
                />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Figma Dark Teal Sticky Order Summary Card  */}
          {/* Byte-identical to Figma media_1793276684365_5c63b95e.png */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-8">
            <div className="rounded-3xl bg-store-checkout-teal text-white p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden">
              {/* Subtle Ambient Background Wash */}
              <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <h2 className="text-xl font-heading font-medium tracking-wide text-white border-b border-white/15 pb-4">
                Order summary
              </h2>

              {/* Order Totals Line Items at Top */}
              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹{cartSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-300 font-medium">
                    <span>Discount (10%)</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-white">
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-white">
                    {cartSubtotal > 0 ? 'Included' : '₹0'}
                  </span>
                </div>
              </div>

              {/* Step 2 & 3: Miniature Purchased Items Preview */}
              {step !== 1 && (
                <div className="pt-3 border-t border-white/10 space-y-2.5 max-h-48 overflow-y-auto pr-1 divide-y divide-white/10">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-store-checkout-teal-light/60 shrink-0 border border-white/20">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-white line-clamp-1">{item.title}</div>
                          <div className="text-2xs text-white/70">
                            {item.color} • Size {item.size} • Qty {item.quantity}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-white shrink-0">
                        ₹{(item.priceINR * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* COUPON CODE Input Box matching Figma (media_1793276684365_5c63b95e.png) */}
              <form onSubmit={handleApplyPromo} className="space-y-2 pt-2">
                <label className="text-2xs uppercase tracking-widest text-white/70 font-semibold block">
                  COUPON CODE
                </label>
                <div className="flex items-center gap-2 rounded-full border border-dashed border-white/30 bg-transparent px-3 py-1.5 focus-within:border-white/70 transition-colors">
                  <Tag size={16} className="text-white/70 shrink-0 ml-1.5" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 bg-transparent text-white placeholder-white/40 text-xs tracking-wider outline-hidden py-1 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-white hover:bg-white/90 text-store-charcoal font-bold text-xs tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p
                    className={`text-2xs mt-1 font-medium ${
                      promoMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
                {discountAmount > 0 && !promoMessage && (
                  <div className="flex items-center justify-between text-2xs text-emerald-300 pt-0.5 font-medium">
                    <span>Coupon applied: 10% off</span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="underline text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Free Shipping Unlocked Progress Bar (media_1793276684365_5c63b95e.png) */}
              <div className="p-3.5 rounded-2xl bg-store-checkout-teal-light/40 border border-white/10 space-y-2">
                <span className="text-xs text-white font-medium block">
                  {freeShippingRemaining === 0
                    ? 'You have unlocked free shipping'
                    : `Add ₹${freeShippingRemaining.toLocaleString()} to unlock free shipping`}
                </span>
                <div className="w-full h-1.5 rounded-full bg-black/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-store-checkout-gold transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((freeShippingThreshold - freeShippingRemaining) / freeShippingThreshold) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Divider & Large Bold Total matching Figma */}
              <div className="pt-4 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-sm font-medium text-white/90">Total</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  ₹{total.toLocaleString()}
                </span>
              </div>

              {/* Gold Pill CTA Button matching Figma with Right Arrow (media_1793276684365_5c63b95e.png) */}
              <div className="pt-2">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleProceedToDetails}
                    className="w-full py-4 px-6 rounded-full bg-store-checkout-gold hover:bg-store-checkout-gold-hover text-store-charcoal font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => handleProceedToPayment()}
                    className="w-full py-4 px-6 rounded-full bg-store-checkout-gold hover:bg-store-checkout-gold-hover text-store-charcoal font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to payment</span>
                    <ArrowRight size={16} />
                  </button>
                )}

                {step === 3 && (
                  <div className="text-center text-2xs text-white/60 py-2">
                    Complete authorization on the left payment panel
                  </div>
                )}
              </div>
            </div>

            {/* Feature Trust Badges */}
            <div className="p-5 rounded-2xl bg-white border border-store-card-border space-y-3 text-xs text-store-muted">
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-store-action-primary shrink-0" />
                <span>Free doorstep delivery on orders above ₹3,000</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-store-gold shrink-0" />
                <span>Zero deadstock on-demand artisan craftsmanship</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw size={18} className="text-store-action-primary shrink-0" />
                <span>7-day seamless doorstep reverse logistics & returns</span>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-store-card-border/60">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span className="text-2xs text-store-charcoal font-medium">
                  Demo Checkout Sandbox — No financial deductions occur
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
