'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Disclosure from '@/components/ui/Disclosure';
import { FAQ_ITEMS } from '@/mocks/fixtures';

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = [
    'All',
    'Ordering & Sizing',
    'Shipping & Tracking',
    'Sustainable POD',
    'Returns & Care',
  ];

  const filteredFaqs =
    activeCategory === 'All'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Help & FAQ' },
          ]}
        />

        <div className="my-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#666] mt-2 leading-relaxed">
            Everything you need to know about our GOTS organic heavyweight textiles, on-demand printing process, and doorstep returns.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 pb-6 border-b border-[#E2DDCF] overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Disclosures Accordion */}
        <div className="divide-y divide-[#E2DDCF] pt-6">
          {filteredFaqs.map((faq) => (
            <Disclosure
              key={faq.id}
              title={faq.question}
              subtitle={faq.category}
              defaultOpen={faq.id === 'faq-1'}
            >
              <p className="text-sm text-[#5A5A5A] leading-relaxed">{faq.answer}</p>
            </Disclosure>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
