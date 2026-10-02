'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useStore } from '@/mocks/store';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    shippingFee,
    freeShippingThreshold,
    freeShippingRemaining,
    promoCode,
    discountAmount,
    applyPromoCode,
    removePromoCode,
  } = useStore();

  const [inputCode, setInputCode] = useState('');

  const total = cartSubtotal - discountAmount + shippingFee;

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      applyPromoCode(inputCode);
      setInputCode('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shopping Bag' },
          ]}
        />

        <div className="my-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
            Your Shopping Bag
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Review your intentional selection before moving to demo checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-[#E2DDCF] p-8 max-w-2xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#8A8A8A] mx-auto mb-4">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Your shopping bag is empty</h2>
            <p className="text-sm text-[#666] max-w-sm mx-auto mt-2 leading-relaxed">
              Explore our architectural French terry hoodies and combed organic staples.
            </p>
            <div className="mt-6">
              <Button variant="dark" size="lg" href="/shop">
                Explore Collection
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Cart Items Table (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free delivery indicator */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-[#1A1A1A]">
                    {freeShippingRemaining > 0
                      ? `Add ₹${freeShippingRemaining.toLocaleString()} more for complimentary delivery`
                      : '✓ You have unlocked free domestic delivery'}
                  </span>
                  <span className="text-[#8A8A8A]">Threshold: ₹{freeShippingThreshold}</span>
                </div>
                <div className="w-full h-2 bg-[#F4F1EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A1A1A] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((cartSubtotal - discountAmount) / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 divide-y divide-[#E2DDCF] shadow-xs">
                {cart.map((item) => (
                  <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex gap-4 sm:gap-6">
                    <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F1EA] border border-[#E2DDCF] shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] leading-snug">
                            {item.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.title}`}
                            className="text-[#8A8A8A] hover:text-[#EF4444] transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="text-xs text-[#8A8A8A] mt-1.5 flex items-center gap-2">
                          <span>Shade: <strong className="text-[#1A1A1A]">{item.color}</strong></span>
                          <span>•</span>
                          <span>Size: <strong className="text-[#1A1A1A]">{item.size}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Qty increment/decrement */}
                        <div className="flex items-center border border-[#E2DDCF] rounded-full bg-white h-10 px-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A]"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-[#1A1A1A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A]"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="text-base font-extrabold text-[#1A1A1A]">
                          ₹{(item.priceINR * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-bold text-[#1A1A1A] uppercase tracking-wider pb-3 border-b border-[#E2DDCF]">
                  Order Summary
                </h3>

                {/* Promo code */}
                <div>
                  {promoCode ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
                      <span className="text-[#15803D] font-semibold">
                        Code {promoCode} (-₹{discountAmount.toLocaleString()})
                      </span>
                      <button
                        type="button"
                        onClick={removePromoCode}
                        className="text-xs text-[#15803D] font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCode} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (UNPLUGGED10)"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="flex-1 h-10 px-3.5 rounded-xl border border-[#E2DDCF] text-xs uppercase outline-none focus:border-[#1A1A1A]"
                      />
                      <Button variant="secondary" size="sm" type="submit">
                        Apply
                      </Button>
                    </form>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-[#5A5A5A] pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1A1A1A]">₹{cartSubtotal.toLocaleString()}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#15803D] font-semibold">
                      <span>Promo Discount</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Domestic Shipping</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-extrabold text-[#1A1A1A] pt-3 border-t border-[#E2DDCF]">
                    <span>Total Amount</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="dark"
                    size="lg"
                    fullWidth
                    href="/checkout"
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                  >
                    Proceed to Demo Checkout
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A] pt-1">
                  <ShieldCheck size={14} className="text-[#10B981]" />
                  <span>Sandbox Environment • No Real Cards</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
