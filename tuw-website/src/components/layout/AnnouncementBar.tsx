'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/mocks/store';

export default function AnnouncementBar() {
  const { freeShippingRemaining, cartSubtotal, simulatedError, retryConnection } = useStore();

  if (simulatedError) {
    return (
      <div className="bg-[#C91818] text-white py-2 px-4 text-xs font-semibold flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>{simulatedError}</span>
        </div>
        <button
          type="button"
          onClick={retryConnection}
          className="bg-white text-[#C91818] px-2.5 py-0.5 rounded text-[11px] font-bold hover:bg-[#F3F4F6] transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] text-white py-2 px-4 text-center text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-2 select-none">
      {cartSubtotal > 0 && freeShippingRemaining > 0 ? (
        <span>
          Add <strong className="text-[#C8A96A]">₹{freeShippingRemaining.toLocaleString()}</strong> more for complimentary delivery
        </span>
      ) : cartSubtotal > 0 && freeShippingRemaining === 0 ? (
        <span className="text-[#A7F3D0]">
          ✓ You have qualified for complimentary domestic delivery
        </span>
      ) : (
        <span>
          Complimentary domestic delivery over ₹3,000 • 500 GSM Heavyweight Architectural Cotton
        </span>
      )}
    </div>
  );
}
