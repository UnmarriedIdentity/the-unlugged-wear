'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useStore } from '@/mocks/store';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import ImageWithFallback from '../ui/ImageWithFallback';

export default function CartDrawer() {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
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
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={() => setIsCartDrawerOpen(false)}
      position="right"
      maxWidth="max-w-md"
      title={`Shopping Bag (${cart.reduce((a, b) => a + b.quantity, 0)})`}
      subtitle="Heavyweight Organic POD Apparel"
    >
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#8A8A8A] mb-4">
            <ShoppingBag size={28} />
          </div>
          <h4 className="text-base font-bold text-[#1A1A1A]">Your bag is empty</h4>
          <p className="text-xs text-[#8A8A8A] max-w-xs mt-1 leading-relaxed">
            Discover our dense 500 GSM French terry hoodies and combed organic staples.
          </p>
          <div className="mt-6">
            <Button
              variant="dark"
              size="md"
              onClick={() => setIsCartDrawerOpen(false)}
              href="/shop"
            >
              Explore Collection
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between gap-6">
          {/* Free Shipping Progress Indicator */}
          <div className="p-3.5 rounded-xl bg-[#F4F1EA] border border-[#E2DDCF]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[#1A1A1A]">
                {freeShippingRemaining > 0
                  ? `Add ₹${freeShippingRemaining.toLocaleString()} for complimentary delivery`
                  : '✓ Free domestic delivery unlocked'}
              </span>
              <span className="text-[#8A8A8A]">₹{freeShippingThreshold}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2DDCF] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A1A1A] transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((cartSubtotal - discountAmount) / freeShippingThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2DDCF] -mx-2 px-2">
            {cart.map((item) => (
              <div key={item.id} className="py-4 flex gap-4">
                {/* Item Thumbnail */}
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-[#F4F1EA] shrink-0 border border-[#E2DDCF]">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] leading-tight">
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="text-[#8A8A8A] hover:text-[#EF4444] transition-colors p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="text-xs text-[#8A8A8A] mt-1 flex items-center gap-2">
                      <span>{item.color}</span>
                      <span>•</span>
                      <span>Size {item.size}</span>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#E2DDCF] rounded-md bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-[#1A1A1A]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-sm font-bold text-[#1A1A1A]">
                      ₹{(item.priceINR * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code Input */}
          <div className="pt-3 border-t border-[#E2DDCF]">
            {promoCode ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
                <span className="text-[#15803D] font-medium">
                  Code <strong>{promoCode}</strong> applied (-₹{discountAmount.toLocaleString()})
                </span>
                <button
                  type="button"
                  onClick={removePromoCode}
                  className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (try UNPLUGGED10)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E2DDCF] text-xs uppercase outline-none focus:border-[#1A1A1A]"
                />
                <Button variant="secondary" size="sm" type="submit">
                  Apply
                </Button>
              </form>
            )}
          </div>

          {/* Summary & Checkout CTA */}
          <div className="space-y-2 pt-2 border-t border-[#E2DDCF] text-xs">
            <div className="flex justify-between text-[#5A5A5A]">
              <span>Subtotal</span>
              <span>₹{cartSubtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[#15803D]">
                <span>Discount</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-[#5A5A5A]">
              <span>Estimated Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-[#1A1A1A] pt-2 border-t border-[#E2DDCF]">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <div className="pt-2">
              <Button
                variant="dark"
                size="lg"
                fullWidth
                href="/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
              >
                Proceed to Checkout
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A] pt-1">
              <ShieldCheck size={14} className="text-[#10B981]" />
              <span>Demo Checkout • No actual card charges</span>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
