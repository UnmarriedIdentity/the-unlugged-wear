'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Disclosure from '@/components/ui/Disclosure';
import Tabs from '@/components/ui/Tabs';
import { Copy, Check, Feather, ShieldCheck, Heart, ShoppingBag, Eye } from 'lucide-react';

export default function StorefrontDesignSystemPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [demoInput, setDemoInput] = useState('Urbanist Architectural Heavyweight');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tokens = [
    { name: 'Canvas Warm Cream', hex: '#FAF9F6', role: 'Storefront canvas', css: 'bg-[#FAF9F6]' },
    { name: 'Neutral White', hex: '#FFFFFF', role: 'Card & modal surfaces', css: 'bg-white' },
    { name: 'Oatmeal Subsurface', hex: '#F4F1EA', role: 'Secondary backgrounds & swatches', css: 'bg-[#F4F1EA]' },
    { name: 'Muted Border', hex: '#E2DDCF', role: 'Card & divider borders', css: 'border-[#E2DDCF]' },
    { name: 'Deep Noir', hex: '#1A1A1A', role: 'Primary typography & dark CTAs', css: 'text-[#1A1A1A]' },
    { name: 'Secondary Muted', hex: '#666666', role: 'Paragraph body & descriptions', css: 'text-[#666]' },
    { name: 'Subdued Meta', hex: '#8A8A8A', role: 'Metadata & captions', css: 'text-[#8A8A8A]' },
    { name: 'Gold / Camel Accent', hex: '#C8A96A', role: 'Capsule & editorial accent', css: 'text-[#C8A96A]' },
    { name: 'Brand Purple Action', hex: '#7539FF', role: 'Storefront highlight & wishlist', css: 'text-[#7539FF]' },
    { name: 'Verified Green', hex: '#10B981', role: 'Success, GOTS badge, in-stock', css: 'text-[#10B981]' },
  ];

  const typeScale = [
    {
      role: 'Editorial Display',
      size: '44–72px',
      weight: '800 (ExtraBold)',
      sample: 'Architectural Form. Zero Deadstock.',
      css: 'text-4xl sm:text-6xl font-extrabold tracking-tight',
    },
    {
      role: 'Heading 1 (Page Title)',
      size: '32–40px',
      weight: '800 (ExtraBold)',
      sample: 'Heavyweight French Terry Hoodies',
      css: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
    },
    {
      role: 'Heading 2 (Section)',
      size: '24–32px',
      weight: '700 (Bold)',
      sample: 'Selected Essentials Capsule',
      css: 'text-2xl sm:text-3xl font-bold tracking-tight',
    },
    {
      role: 'Heading 3 (Card Title)',
      size: '18–20px',
      weight: '700 (Bold)',
      sample: 'Monolith Heavyweight Hoodie 500 GSM',
      css: 'text-lg sm:text-xl font-bold',
    },
    {
      role: 'Body / Lead',
      size: '16px',
      weight: '400 (Regular)',
      sample: 'Dense 500 GSM French terry hoodies and combed organic essentials crafted for quiet permanence.',
      css: 'text-base font-normal text-[#5A5A5A]',
    },
    {
      role: 'Body / Default',
      size: '14px',
      weight: '400 (Regular)',
      sample: 'Our modern spaces are saturated with digital noise. We craft heavyweight garments that invite you to slow down.',
      css: 'text-sm font-normal text-[#666]',
    },
    {
      role: 'Label / Control',
      size: '12–14px',
      weight: '600 (SemiBold)',
      sample: 'ADD TO BAG • EXPLORE CAPSULE',
      css: 'text-xs uppercase font-semibold tracking-wider',
    },
    {
      role: 'Metadata / Footnote',
      size: '11–12px',
      weight: '400 (Regular)',
      sample: '100% GOTS Certified Organic Cotton • Pre-Shrunk • Made in Tiruppur',
      css: 'text-xs text-[#8A8A8A]',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Storefront Design System Specimen' },
          ]}
        />

        <div className="my-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2DDCF] text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]">
            <Feather size={14} className="text-[#C8A96A]" />
            <span>Figma Specimen Node 1:26969 Reference</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            TUW Storefront Design System
          </h1>
          <p className="text-sm text-[#666] max-w-2xl leading-relaxed">
            Living specimen documenting typography scale, editorial palette, interactive UI primitives, and accessible component contracts for The Unplugged Wear.
          </p>
        </div>

        {/* Section 1: Color Palette */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] pb-2 border-b border-[#E2DDCF]">
            1. Curated Storefront Palette
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tokens.map((token) => (
              <div
                key={token.name}
                onClick={() => copyToClipboard(token.hex, token.name)}
                className="group p-3 rounded-2xl bg-white border border-[#E2DDCF] shadow-xs cursor-pointer hover:shadow-md transition-all"
              >
                <div
                  className="h-20 w-full rounded-xl border border-black/10 flex items-end justify-end p-2 transition-transform group-hover:scale-[1.02]"
                  style={{ backgroundColor: token.hex }}
                >
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                    {copiedKey === token.name ? <Check size={10} /> : <Copy size={10} />}
                    {token.hex}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xs font-bold text-[#1A1A1A]">{token.name}</div>
                  <p className="text-[11px] text-[#8A8A8A] mt-0.5">{token.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography Scale */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] pb-2 border-b border-[#E2DDCF]">
            2. Urbanist Typography Scale
          </h2>

          <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 divide-y divide-[#E2DDCF] shadow-xs">
            {typeScale.map((t) => (
              <div key={t.role} className="py-5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#8A8A8A]">
                  <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">
                    {t.role}
                  </span>
                  <span>
                    Size: <strong>{t.size}</strong> • Weight: <strong>{t.weight}</strong>
                  </span>
                </div>
                <div className={t.css}>{t.sample}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Interactive UI Primitives */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] pb-2 border-b border-[#E2DDCF]">
            3. Interactive UI Primitives Showcase
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons Showcase */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">Button Variants & States</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="dark" size="md">
                  Dark (Primary CTA)
                </Button>
                <Button variant="primary" size="md">
                  Primary Purple
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Neutral
                </Button>
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="danger" size="md">
                  Danger / Error
                </Button>
                <Button variant="dark" size="md" isLoading>
                  Loading State
                </Button>
                <Button variant="dark" size="md" disabled>
                  Disabled State
                </Button>
              </div>
            </div>

            {/* Badges Showcase */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">Badge Semantics</h3>
              <div className="flex flex-wrap gap-2.5">
                <Badge variant="dark">Dark Core</Badge>
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="success">GOTS Organic</Badge>
                <Badge variant="info">In Transit</Badge>
                <Badge variant="warning">Low Stock</Badge>
                <Badge variant="error">Sold Out</Badge>
                <Badge variant="outline">POD Certified</Badge>
              </div>
            </div>

            {/* Form Fields Showcase */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">Input & Field States</h3>
              <div className="space-y-3">
                <Input
                  label="Default Populated Field"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                />
                <Input
                  label="Invalid Error Field"
                  value="invalid_sku_code"
                  error="Garment SKU could not be verified."
                  readOnly
                />
                <Input
                  label="Read-only Disabled Field"
                  value="POD-TIRUPPUR-FACILITY-01"
                  disabled
                />
              </div>
            </div>

            {/* Disclosures & Accordions */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">Information Disclosures</h3>
              <div className="divide-y divide-[#E2DDCF]">
                <Disclosure title="500 GSM French Terry Drape" defaultOpen>
                  Our French terry is knitted from unbrushed loopback organic yarn on slow circular looms, providing structural insulation that holds an architectural boxy drape.
                </Disclosure>
                <Disclosure title="14-Day Doorstep Returns">
                  We schedule free courier reverse pickup at your registered shipping address within 48 hours of logging an RMA request.
                </Disclosure>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
