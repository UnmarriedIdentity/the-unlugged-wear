'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import { useStore } from '@/mocks/store';

export default function Footer() {
  const { scenario, setScenario, resetStoreData } = useStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#111111] text-[#E0E0E0] pt-16 pb-12 border-t border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-[#2A2A2A]">
          {/* Brand Manifesto Col (Spans 2 on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-extrabold text-2xl tracking-tighter uppercase text-white">
              The Unplugged Wear
            </span>
            <p className="text-sm text-[#A0A0A0] max-w-sm leading-relaxed">
              Quiet, dense organic garments built to outlast fast-paced digital cycles. Printed
              purely on-demand in Tiruppur to guarantee zero deadstock and zero excess inventory.
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white block mb-2">
                Join the Dispatch (1-2 Quiet Letters per Month)
              </span>

              {subscribed ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#1E293B] border border-[#334155] text-xs text-[#38BDF8]">
                  <CheckCircle2 size={16} />
                  <span>You are subscribed to the TUW Dispatch. Welcome.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-11 px-4 text-xs rounded-full bg-[#1C1C1E] border border-[#333333] text-white placeholder:text-[#666] outline-none focus:border-white transition-colors"
                  />
                  <Button variant="primary" size="sm" type="submit" icon={<ArrowRight size={14} />} iconPosition="right">
                    Join
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Col 2: Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Catalog</h4>
            <ul className="space-y-2 text-xs text-[#A0A0A0]">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  All Apparel
                </Link>
              </li>
              <li>
                <Link href="/shop?category=hoodies" className="hover:text-white transition-colors">
                  500 GSM French Terry Hoodies
                </Link>
              </li>
              <li>
                <Link href="/shop?category=tees" className="hover:text-white transition-colors">
                  280 GSM Combed Tees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=pants" className="hover:text-white transition-colors">
                  Pleated Duck Canvas Pants
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Capsule Collections
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Story */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ethos</h4>
            <ul className="space-y-2 text-xs text-[#A0A0A0]">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About TUW
                </Link>
              </li>
              <li>
                <Link href="/about/sustainability" className="hover:text-white transition-colors">
                  Sustainability Manifesto
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-white transition-colors">
                  Editorial Journal
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white transition-colors">
                  Fit & Sizing Guide
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Help & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Policies</h4>
            <ul className="space-y-2 text-xs text-[#A0A0A0]">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Disclosures & FAQ
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & POD Note */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#707070]">
          <div>
            © {new Date().getFullYear()} The Unplugged Wear. Mindful POD apparel. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#10B981]" />
              GOTS Organic Cotton
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw size={14} className="text-[#7539FF]" />
              Zero Surplus Inventory
            </span>
            <span>Made with Care in India</span>
          </div>
        </div>

        {/* Interactive Demo Controls Ribbon per MOCK_DATA.md */}
        <div className="mt-8 pt-6 border-t border-[#222222] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#888888]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Demo Scenarios:
            </span>
            {[
              { id: 'normal', label: 'Normal Baseline' },
              { id: 'empty', label: 'Empty States' },
              { id: 'error', label: 'Simulated Error' },
              { id: 'long_content', label: 'Long Multiline Text' },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScenario(sc.id as any)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  scenario === sc.id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#222222] text-[#AAAAAA] hover:text-white hover:bg-[#333333]'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset storefront demo state (cart, wishlist, orders) to baseline?')) {
                  resetStoreData();
                }
              }}
              className="text-[#C8A96A] hover:underline font-medium text-[11px] flex items-center gap-1"
            >
              <span>Reset Demo State</span>
            </button>
            <span className="text-[#555555] text-[10px] hidden sm:inline">
              Local mock storage (tuw_website_v2) · Independent client state
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
