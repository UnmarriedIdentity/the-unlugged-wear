'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import { ShieldCheck, RefreshCw, Feather, Sun, Droplets, CheckCircle } from 'lucide-react';

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Sustainability Manifesto' },
          ]}
        />

        <div className="my-8 space-y-4">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#10B981] block">
            Environmental Accountability
          </span>
          <h1 className="text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-extrabold tracking-tight text-[#1A1A1A]">
            Sustainability Through Intentional Production
          </h1>
          <p className="text-sm sm:text-base text-[#666] leading-relaxed">
            We reject the industry dogma of speculative mass-manufacturing. Here is how printing to order works, and what we are still confirming.
          </p>
        </div>

        {/* Verification Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Printed Only After You Order</h2>
            <p className="text-xs text-[#666] leading-relaxed">
              Every piece starts as a blank garment held by our print partner and is printed with our design only once someone has ordered it.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Zero Deadstock Inventory Model</h2>
            <p className="text-xs text-[#666] leading-relaxed">
              Traditional brands forecast demand and inevitably incinerate what goes unsold. Our garments stay blank until you order them, so we never hold unsold printed stock.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#B45309] flex items-center justify-center">
              <Droplets size={20} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Materials &amp; Inks (Draft)</h2>
            <p className="text-xs text-[#666] leading-relaxed">
              Fabric composition, ink type and any certifications will be published here once our print partner confirms them in writing. We will not list a certification we cannot show.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7539FF] flex items-center justify-center">
              <Sun size={20} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Made in Tiruppur</h2>
            <p className="text-xs text-[#666] leading-relaxed">
              Our print partner prints and dispatches every order from Tiruppur, India, one of the country&apos;s largest knitwear centres.
            </p>
          </div>
        </div>

        {/* Plastic-Free Packaging */}
        <div className="p-8 rounded-3xl bg-[#F4F1EA] border border-[#E2DDCF] my-8 space-y-3">
          <h2 className="text-base font-bold text-[#1A1A1A]">Packaging (Draft)</h2>
          <p className="text-xs text-[#666] leading-relaxed">
            Packaging is handled by our print partner. We will describe it here once the details are confirmed.
          </p>
        </div>

        <div className="pt-6 text-center">
          <Button variant="dark" size="lg" href="/shop">
            Shop the Collection
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
