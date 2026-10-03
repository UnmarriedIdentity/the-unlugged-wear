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
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Sustainability Through Intentional Production
          </h1>
          <p className="text-sm sm:text-base text-[#666] leading-relaxed">
            We reject the industry dogma of speculative mass-manufacturing. Here is our exact, verified process for sustainable POD apparel.
          </p>
        </div>

        {/* Verification Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">100% GOTS Certified Organic Cotton</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              Sourced exclusively from certified organic farming cooperatives in Central India. Grown without synthetic pesticides, genetically modified seeds, or toxic defoliants.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Zero Deadstock Inventory Model</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              Traditional brands forecast demand and inevitably incinerate what goes unsold. Our garments exist as organic blanks until purchased by you, eliminating 100% of unsold deadstock.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#B45309] flex items-center justify-center">
              <Droplets size={20} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Non-Toxic Water-Based Inks</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              Our direct-to-garment digital pigment inks are OEKO-TEX Standard 100 and Eco-Passport certified. They contain zero heavy metals, formaldehydes, or microplastic plastisols.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7539FF] flex items-center justify-center">
              <Sun size={20} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Solar-Assisted Curing Ateliers</h3>
            <p className="text-xs text-[#666] leading-relaxed">
              Our partner production floors in Tiruppur utilize rooftop solar PV arrays to offset up to 70% of energy consumed during the thermal ink curing and garment setting phase.
            </p>
          </div>
        </div>

        {/* Plastic-Free Packaging */}
        <div className="p-8 rounded-3xl bg-[#F4F1EA] border border-[#E2DDCF] my-8 space-y-3">
          <h3 className="text-base font-bold text-[#1A1A1A]">100% Plastic-Free Packaging</h3>
          <p className="text-xs text-[#666] leading-relaxed">
            Your package arrives in FSC-certified unbleached kraft paper mailers secured with natural starch-based water-activated tape. Garments are wrapped in tissue paper made from recycled cotton rag. No single-use polybags ever touch our shipments.
          </p>
        </div>

        <div className="pt-6 text-center">
          <Button variant="dark" size="lg" href="/shop">
            Shop Sustainable Essentials
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
