'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProductFaqItem } from '@/lib/types';

export interface DynamicAccordionFaqProps {
  faqs?: ProductFaqItem[];
  title?: string;
  eyebrow?: string;
  description?: string;
  className?: string;
}

export default function DynamicAccordionFaq({
  faqs,
  title = 'Frequently Asked Questions',
  eyebrow = 'Atelier Specifications',
  description = 'Clear transparency on how our slow-living garments and studio objects are milled, crafted, and delivered to your doorstep.',
  className = '',
}: DynamicAccordionFaqProps) {
  // Data-driven conditional guard: strictly omit if no FAQs provided
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const [activeFaq, setActiveFaq] = useState<number>(0);

  return (
    <section className={`my-16 pt-12 border-t border-store-card-border ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Title & Context (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest text-store-gold font-semibold block">
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-heading font-medium uppercase tracking-wide text-store-text-primary">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-store-text-secondary leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right Accordion List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;

            return (
              <div
                key={faq.id || idx}
                className={`rounded-2xl transition-all border ${
                  isOpen
                    ? 'bg-store-deep-teal text-white border-store-deep-teal p-6 shadow-xs'
                    : 'bg-store-surface border-store-card-border p-5 text-store-text-primary hover:border-store-charcoal'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                  className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
                >
                  <span className="text-sm font-bold tracking-wide">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-store-gold' : 'text-store-muted'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-3 text-xs leading-relaxed opacity-90 space-y-1.5">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

