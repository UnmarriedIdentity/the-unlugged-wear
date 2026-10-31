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

  const figmaPrimaryColors = [
    { name: 'Primary 1 (Midnight Teal)', hex: '#002B3A', role: 'Brand primary dark CTA & headers', css: 'bg-[#002B3A]' },
    { name: 'Primary 2 (Oceanic Teal)', hex: '#005B6C', role: 'Brand primary vibrant teal accent', css: 'bg-[#005B6C]' },
  ];

  const figmaSecondaryColors = [
    { name: 'Secondary Mint', hex: '#82C3B7', role: 'Category badges & soft indicators', css: 'bg-[#82C3B7]' },
    { name: 'Secondary Coral', hex: '#FF8B66', role: 'Warm peach/coral notification accent', css: 'bg-[#FF8B66]' },
    { name: 'Secondary Sky Blue', hex: '#57AFFF', role: 'Electric sky blue active links', css: 'bg-[#57AFFF]' },
    { name: 'Secondary Violet Purple', hex: '#8364FF', role: 'Vibrant secondary purple accent', css: 'bg-[#8364FF]' },
  ];

  const figmaTertiaryColors = [
    { name: 'Tertiary 1 (Deep Noir)', hex: '#0F0F0F', role: 'High-contrast typography & icons', css: 'bg-[#0F0F0F]' },
    { name: 'Tertiary 2 (Slate Gray)', hex: '#676767', role: 'Muted body copy & secondary text', css: 'bg-[#676767]' },
    { name: 'Tertiary 3 (Light Gray)', hex: '#E8E8E8', role: 'Borders & subtle dividers', css: 'bg-[#E8E8E8]' },
    { name: 'Tertiary 4 (Warm Ivory)', hex: '#FCFAF6', role: 'Storefront canvas background', css: 'bg-[#FCFAF6]' },
    { name: 'Tertiary 5 (Pure White)', hex: '#FFFFFF', role: 'Surface cards & badges', css: 'bg-white' },
  ];

  const tokens = [...figmaPrimaryColors, ...figmaSecondaryColors, ...figmaTertiaryColors];

  const typeScale = [
    {
      role: 'Editorial Display',
      size: '28–40px',
      weight: '400 (Regular)',
      sample: 'Architectural Form. Pure Permanence.',
      css: 'text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)] font-normal tracking-tight',
    },
    {
      role: 'Heading 1 (Page Title)',
      size: '32–40px',
      weight: '500 (Medium)',
      sample: 'Heavyweight French Terry Hoodies',
      css: 'text-3xl sm:text-4xl font-medium tracking-tight',
    },
    {
      role: 'Heading 2 (Section)',
      size: '28–48px',
      weight: '500 (Medium)',
      sample: 'Selected Essentials Capsule',
      css: 'text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight',
    },
    {
      role: 'Eyebrow (Section Kicker)',
      size: '16px',
      weight: '500 (Medium)',
      sample: 'OUR PHILOSOPHY',
      css: 'text-base font-medium uppercase tracking-widest',
    },
    {
      role: 'Heading 3 (Card Title)',
      size: '18px',
      weight: '600 (SemiBold)',
      sample: 'Monolith Heavyweight Hoodie 500 GSM',
      css: 'text-lg font-semibold',
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
      weight: '500 (Medium)',
      sample: 'ADD TO BAG • EXPLORE CAPSULE',
      css: 'text-xs uppercase font-medium tracking-wider',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E8E8] text-xs font-semibold uppercase tracking-wider text-[#676767]">
            <Feather size={14} className="text-[#57AFFF]" />
            <span>Figma Specimen Node 82:5702 Source of Truth</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading uppercase tracking-wide text-[#0F0F0F]">
            The Unplugged Wear Design System
          </h1>
          <p className="text-sm text-[#676767] max-w-2xl leading-relaxed font-sans">
            Living specimen documenting Outfit for headings and body text (generic sans fallback only), the 3-tier Figma Color Style foundation, and the 1612×529 Frame layout metrics.
          </p>
        </div>

        {/* Section 1: Color Palette */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-heading uppercase tracking-wide text-[#0F0F0F] pb-2 border-b border-[#E8E8E8]">
            1. Curated Storefront Palette (Figma Color Style)
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

        {/* Section 2: Auto-Layout Frame Specimen (From Sidebar Details) */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-heading uppercase tracking-wide text-[#0F0F0F] pb-2 border-b border-[#E8E8E8]">
            2. Figma Frame & Auto-Layout Specimen (Sidebar Details)
          </h2>

          <div className="bg-white rounded-3xl border border-[#E8E8E8] p-6 space-y-6 shadow-xs">
            {/* Sidebar properties summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E8E8]">
                <span className="text-[#676767] block">Position:</span>
                <strong className="text-[#002B3A]">X: 270, Y: 452</strong>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E8E8]">
                <span className="text-[#676767] block">Dimensions:</span>
                <strong className="text-[#002B3A]">W: 1612px × H: 529px</strong>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E8E8]">
                <span className="text-[#676767] block">Auto Layout:</span>
                <strong className="text-[#002B3A]">Column (Gap: 150px)</strong>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E8E8]">
                <span className="text-[#676767] block">Padding / Radius:</span>
                <strong className="text-[#002B3A]">0px / 0px</strong>
              </div>
            </div>

            {/* Frame Reproduction: Upper Text and Lower Text both in Outfit */}
            <div className="p-8 sm:p-12 rounded-2xl bg-[#FCFAF6] border border-dashed border-[#57AFFF] flex flex-col" style={{ gap: '150px' }}>
              <div>
                <span className="text-xs font-mono uppercase text-[#676767] block mb-2">
                  Upper Text • Heading Font (Outfit Medium 500, Size 128px / responsive)
                </span>
                <p className="font-heading text-4xl sm:text-6xl text-[#0F0F0F] uppercase tracking-wider">
                  THE UNPLUGGED WEAR
                </p>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-[#676767] block mb-2">
                  Lower Text • Everywhere Else Font (Outfit Medium 500, Size 128px / responsive)
                </span>
                <p className="font-sans text-4xl sm:text-6xl text-[#0F0F0F] uppercase tracking-wider">
                  THE UNPLUGGED WEAR
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Typography Scale */}
        <section className="my-12 space-y-6">
          <h2 className="text-2xl font-heading uppercase tracking-wide text-[#0F0F0F] pb-2 border-b border-[#E8E8E8]">
            3. Typography Hierarchy & Scales
          </h2>

          <div className="bg-white rounded-3xl border border-[#E8E8E8] p-6 divide-y divide-[#E8E8E8] shadow-xs">
            {typeScale.map((t) => (
              <div key={t.role} className="py-5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#676767]">
                  <span className="font-bold text-[#0F0F0F] uppercase tracking-wider">
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
