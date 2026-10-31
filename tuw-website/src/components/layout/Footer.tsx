'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  RefreshCw,
  Sparkles,
  PackageCheck,
  Mail,
  MapPin,
} from 'lucide-react';
import { useStore } from '@/mocks/store';
import TuwEmblem from './TuwEmblem';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

// Static directory data kept at module scope so every link is emitted into the
// pre-rendered HTML. Never gate this behind client state or lazy mounting —
// crawlers must see real <a href> anchors in the initial response.
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: 'catalog',
    title: 'Catalog',
    links: [
      { label: 'All Apparel', href: '/shop' },
      { label: 'Hoodies & Sweats', href: '/shop?category=hoodies' },
      { label: 'T-Shirts', href: '/shop?category=tees' },
      { label: 'Joggers & Sweatpants', href: '/shop?category=pants' },
      { label: 'Capsule Collections', href: '/collections' },
      { label: 'Saved Wishlist', href: '/wishlist' },
    ],
  },
  {
    id: 'ethos',
    title: 'Ethos',
    links: [
      { label: 'About The Unplugged Wear', href: '/about' },
      { label: 'Sustainability Manifesto', href: '/about/sustainability' },
      { label: 'Editorial Journal', href: '/journal' },
      { label: 'Fit & Sizing Architecture', href: '/size-guide' },
      { label: 'Track Shipment', href: '/track-order' },
      { label: 'Contact Studio Concierge', href: '/contact' },
    ],
  },
  {
    id: 'policies',
    title: 'Policies',
    links: [
      { label: 'Disclosures & FAQ', href: '/faq' },
      { label: 'Returns & Exchanges', href: '/policies/returns' },
      { label: 'Shipping & Delivery', href: '/policies/shipping' },
      { label: 'Privacy Policy', href: '/policies/privacy' },
      { label: 'Terms of Service', href: '/policies/terms' },
    ],
  },
];

const FOOTER_LEGAL_LINKS: FooterLink[] = [
  { label: 'Tiruppur Atelier', href: '/about' },
  { label: 'Privacy', href: '/policies/privacy' },
  { label: 'Terms', href: '/policies/terms' },
];

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
    <footer aria-label="Site Footer" className="jitter-footer-shell pb-0 select-none">
      {/* Upper Card: Scooped Ivory Canvas with Primary Directory & Disclosures (Z-index 20) */}
        <div className="jitter-footer-inner pt-16 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Top Grid: Brand Ethos + Navigation Directory */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-store-border">
              {/* Brand Statement Col */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2.5">
                  <TuwEmblem className="h-7 w-auto text-primary-dark" />
                  <span className="font-heading font-semibold text-[clamp(1.25rem,2vw+0.5rem,1.5rem)] tracking-tighter uppercase text-store-text-primary">
                    The Unplugged Wear
                  </span>
                </div>
                <p className="text-base text-store-text-secondary max-w-sm leading-relaxed font-sans font-light">
                  Everyday pieces printed with the leaping deer. Printed only after you order, in
                  Tiruppur, so nothing is made that nobody wanted.
                </p>
                <div className="flex items-center gap-4 text-base text-store-text-secondary pt-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Shield size={14} className="text-store-action-primary" />
                    Printed to Order
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-store-action-primary" />
                    Zero Deadstock
                  </span>
                </div>
              </div>

              {/* Columns 2-4: Directory (single source of truth, prerendered) */}
              {FOOTER_COLUMNS.map((column) => (
                <nav
                  key={column.id}
                  aria-labelledby={`footer-${column.id}-heading`}
                  className="space-y-3"
                >
                  <h2
                    id={`footer-${column.id}-heading`}
                    className="font-heading font-medium uppercase tracking-wider text-store-text-primary"
                  >
                    {column.title}
                  </h2>
                  <ul className="space-y-2.5 text-base text-store-text-secondary">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="inline-flex items-center min-h-6 hover:text-store-text-primary transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* Bottom Row: Copyright + Mindful Legal Notice matching Jitter format */}
            <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-store-text-secondary">
              <div>
                © {new Date().getFullYear()} The Unplugged Wear. Mindful POD apparel. All rights reserved.
              </div>
              <nav
                aria-label="Legal"
                className="flex items-center gap-5 text-xs uppercase tracking-wider"
              >
                {FOOTER_LEGAL_LINKS.map((link, index) => (
                  <React.Fragment key={link.href}>
                    {index > 0 && <span aria-hidden="true">•</span>}
                    <Link href={link.href} className="inline-flex items-center min-h-6 hover:text-store-text-primary transition-colors">
                      {link.label}
                    </Link>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Demo controls (required by the UI phase): tucked into a closed
                disclosure so shoppers are not shown test tooling by default. */}
            <details className="pt-4 border-t border-store-border text-xs text-store-text-secondary">
              <summary className="inline-flex items-center min-h-6 cursor-pointer font-medium text-store-text-secondary hover:text-store-text-primary">
                Demo tools (preview build)
              </summary>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-store-text-primary">Scenario:</span>
                  {[
                    { id: 'normal', label: 'Normal Baseline' },
                    { id: 'empty', label: 'Empty States' },
                    { id: 'error', label: 'Simulated Error' },
                    { id: 'long_content', label: 'Long Multiline Text' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      aria-pressed={scenario === sc.id}
                      onClick={() => setScenario(sc.id as any)}
                      className={`min-h-6 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        scenario === sc.id
                          ? 'bg-primary-dark text-white font-semibold'
                          : 'bg-store-canvas border border-store-border text-store-text-secondary hover:text-store-text-primary hover:bg-store-cream'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset storefront demo state (cart, wishlist, orders) to baseline?')) {
                      resetStoreData();
                    }
                  }}
                  className="inline-flex items-center min-h-6 text-store-gold hover:underline font-medium text-xs cursor-pointer"
                >
                  Reset Demo State
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Lower Reveal Section: Dark Canvas Revealed Under the Scooped Curtain (Sticky Bottom) */}
        <div className="jitter-footer-reveal px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 pb-8 sm:pb-10 border-b border-white/10">
              {/* Left: Animated Motion Sticker with Fabric Looping Video */}
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
                <div className="jitter-video-badge shrink-0">
                  <video
                    src="/videos/h3.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover scale-105"
                  />
                  <div className="absolute inset-0 bg-primary-dark/20 pointer-events-none" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-store-gold" />
                    <span className="text-xs uppercase tracking-luxury text-store-gold font-medium">
                      Slow-Living Motion • Tiruppur
                    </span>
                  </div>
                  <h3 className="font-heading text-[clamp(1.125rem,2vw+0.5rem,1.5rem)] text-white tracking-tight leading-snug">
                    Crafted for Quiet Permanence.
                  </h3>
                  <p className="text-sm text-white/70 max-w-sm font-sans leading-relaxed">
                    Hoodies, tees and everyday objects, made in Tiruppur.
                  </p>
                </div>
              </div>

              {/* Right: Join the Dispatch Form with Gold CTA Button (Strictly No Admin Purple) */}
              <div className="w-full lg:max-w-md space-y-3 text-center sm:text-left">
                <span className="text-base uppercase tracking-luxury text-white/80 font-medium block">
                  The TUW Dispatch
                </span>
                <p className="text-sm text-white/60 font-sans leading-relaxed">
                  Quiet letters on architectural slow-living form and seasonal capsule drops.
                </p>

                {subscribed ? (
                  <div className="flex items-center gap-2 p-3 rounded-full bg-white/10 border border-white/20 text-xs text-secondary-mint">
                    <CheckCircle2 size={16} />
                    <span>Demo only: no email was stored or sent. The newsletter is not live yet.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <label htmlFor="footer-dispatch-email" className="sr-only">
                      Email address for the TUW Dispatch newsletter
                    </label>
                    <input
                      id="footer-dispatch-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 h-11 px-4 text-base rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-store-gold focus:bg-white/15 outline-hidden transition-all"
                    />
                    <button
                      type="submit"
                      className="h-11 px-7 rounded-full bg-store-gold hover:bg-store-gold/90 text-primary-dark font-sans font-medium text-xs uppercase tracking-luxury transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <span>Join</span>
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Monumental Architectural Brand Signature with High Visibility & Leaping Deer Emblem */}
            <div className="w-full flex flex-col items-center justify-center text-center select-none pt-6 sm:pt-8 pb-16 sm:pb-20">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <TuwEmblem className="h-7 sm:h-7 w-auto text-store-gold" />
              </div>

              <h2 className="font-heading font-black uppercase jitter-brand-signature">
                The Unplugged Wear
              </h2>

              <div className="flex items-center gap-3 sm:gap-5 text-xs uppercase tracking-wider text-white/50 font-sans font-medium mt-2.5">
                <span>Tiruppur, India</span>
                <span aria-hidden="true">•</span>
                <span>Printed to Order</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
}
