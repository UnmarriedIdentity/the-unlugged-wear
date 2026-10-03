'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, RefreshCw, Sparkles, Feather } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/commerce/ProductCard';
import CollectionCard from '@/components/commerce/CollectionCard';
import Button from '@/components/ui/Button';
import { useStore } from '@/mocks/store';
import { STORE_COLLECTIONS, JOURNAL_ARTICLES } from '@/mocks/fixtures';

export default function HomePage() {
  const { products } = useStore();

  const essentials = products.slice(0, 4);
  const featuredArticle = JOURNAL_ARTICLES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1A1A1A]">
      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* 1. Editorial Hero Section */}
        <section className="relative overflow-hidden bg-[#F4F1EA] border-b border-[#E2DDCF] py-20 sm:py-32 lg:py-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2DDCF] text-xs font-semibold uppercase tracking-wider text-[#5A5A5A] shadow-xs">
                <Feather size={14} className="text-[#C8A96A]" />
                <span>Heavyweight Organic POD Apparel</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1A1A1A] leading-[1.08]">
                Architectural Form. Zero Deadstock.
              </h1>

              <p className="text-base sm:text-lg text-[#666] max-w-xl leading-relaxed font-normal">
                Dense 500 GSM French terry hoodies and combed organic essentials crafted for quiet permanence. No surplus inventory. Cured on-demand in Tiruppur.
              </p>

              <div className="pt-4 flex flex-wrap gap-3">
                <Button
                  variant="dark"
                  size="lg"
                  href="/shop"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                >
                  Explore Collection
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="/about"
                >
                  The POD Manifesto
                </Button>
              </div>
            </div>
          </div>

          {/* Subdued Background Watermark Accent */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-5 select-none font-black text-[18vw] leading-none tracking-tighter text-black uppercase translate-x-12 translate-y-12 hidden lg:block">
            UNPLUGGED
          </div>
        </section>

        {/* 2. Core Pillars Banner */}
        <section className="border-b border-[#E2DDCF] bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDCF]">
              <div className="flex items-center sm:items-start gap-4 sm:px-4">
                <div className="w-12 h-12 rounded-xl bg-[#F4F1EA] flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <ShieldCheck size={22} className="text-[#10B981]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">500 GSM French Terry</h4>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">Heavy architectural drape that holds its shape over years.</p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-4 sm:px-4 pt-4 sm:pt-0">
                <div className="w-12 h-12 rounded-xl bg-[#F4F1EA] flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <RefreshCw size={22} className="text-[#7539FF]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Zero Deadstock POD</h4>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">Custom-cured on demand. We eliminate overproduction waste.</p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-4 sm:px-4 pt-4 sm:pt-0">
                <div className="w-12 h-12 rounded-xl bg-[#F4F1EA] flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <Sparkles size={22} className="text-[#C8A96A]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Pre-Shrunk Organic Cotton</h4>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">100% GOTS certified cotton, natural eco-friendly water dyes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Selected Essentials (Product Showcase) */}
        <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8A8A] block mb-2">
                Core Foundations
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
                Selected Essentials
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:text-[#7539FF] flex items-center gap-1.5 transition-colors"
            >
              <span>View All ({products.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {essentials.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* 4. Capsule Collections Showcase */}
        <section className="py-20 bg-[#F4F1EA] border-y border-[#E2DDCF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8A8A] block mb-2">
                Limited Drops & Formats
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
                Capsule Series
              </h2>
              <p className="text-sm text-[#666] mt-2">
                Curated suites of apparel conceptualized around stillness, structural textiles, and utilitarian daily objects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {STORE_COLLECTIONS.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          </div>
        </section>

        {/* 5. Editorial Journal Feature */}
        {featuredArticle && (
          <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-3xl p-6 sm:p-12 border border-[#E2DDCF] shadow-xs">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F1EA]">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                    {featuredArticle.category} • {featuredArticle.readTime}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A96A] block">
                  The Editorial Journal
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1A1A] leading-snug">
                  {featuredArticle.title}
                </h3>
                <p className="text-sm text-[#666] leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
                <div className="pt-2">
                  <Button
                    variant="dark"
                    size="md"
                    href={`/journal/${featuredArticle.slug}`}
                    icon={<ArrowRight size={14} />}
                    iconPosition="right"
                  >
                    Read Journal Entry
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
