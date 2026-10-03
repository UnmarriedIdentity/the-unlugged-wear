'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, RefreshCw, Feather } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'About The Unplugged Wear' },
          ]}
        />

        <div className="my-8 space-y-4">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
            Brand Ethos
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1A1A1A] leading-tight">
            Quiet Apparel for an Overstimulated Era.
          </h1>
          <p className="text-base sm:text-lg text-[#666] leading-relaxed max-w-2xl">
            We started The Unplugged Wear with a singular observation: our modern spaces are saturated with digital chatter and disposable synthetic garments. In response, we build heavyweight architectural essentials that invite you to slow down.
          </p>
        </div>

        {/* Editorial Photo Showcase */}
        <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden my-12 border border-[#E2DDCF] bg-[#1A1A1A]">
          <img
            src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1600&auto=format&fit=crop&q=80"
            alt="The Unplugged Wear studio atmosphere"
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        {/* 3 Core Principles */}
        <div className="space-y-12 my-16 divide-y divide-[#E2DDCF]">
          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <h3 className="text-xl font-bold text-[#1A1A1A] md:col-span-4">
              1. Weight as Architecture
            </h3>
            <p className="text-sm text-[#5A5A5A] md:col-span-8 leading-relaxed">
              When fabric is flimsy, it clings and requires constant adjustment. When cotton is knitted at 500 grams per square meter on slow circular looms, it establishes its own clean architectural drape. It insulates, shields, and feels like personal sanctuary.
            </p>
          </div>

          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <h3 className="text-xl font-bold text-[#1A1A1A] md:col-span-4">
              2. Zero Deadstock POD
            </h3>
            <p className="text-sm text-[#5A5A5A] md:col-span-8 leading-relaxed">
              Fast fashion burns or dumps millions of unsold garments each year. At TUW, not a single roll of organic fleece is printed until you order it. We partner with state-of-the-art curing facilities in Tiruppur that print with certified water-based pigment inks. You wait a few days longer; the earth is spared another garbage truck of waste.
            </p>
          </div>

          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <h3 className="text-xl font-bold text-[#1A1A1A] md:col-span-4">
              3. The Omission of Noise
            </h3>
            <p className="text-sm text-[#5A5A5A] md:col-span-8 leading-relaxed">
              No garish discount countdowns. No artificial scarcity timers. No dangling cords or synthetic polyester fluff. Just honest, heavyweight GOTS certified organic cotton tailored for decades of daily life.
            </p>
          </div>
        </div>

        {/* CTA to Sustainability Manifesto */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Read the Sustainability Manifesto</h3>
            <p className="text-xs text-[#666] mt-1 max-w-md">
              Learn about our GOTS organic certifications, solar curing tunnels, and carbon-neutral transit.
            </p>
          </div>
          <Button
            variant="dark"
            size="md"
            href="/about/sustainability"
            icon={<ArrowRight size={14} />}
            iconPosition="right"
          >
            Sustainability Manifesto
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
