'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface PrincipleItem {
  number: string;
  line1: string;
  line2: string;
}

const PRINCIPLES: PrincipleItem[] = [
  { number: '01 /', line1: 'Considered', line2: 'by design' },
  { number: '02 /', line1: 'Made for', line2: 'real life' },
  { number: '03 /', line1: 'Style on', line2: 'your terms' },
];

export default function OurPhilosophy() {
  return (
    <section
      id="our-philosophy"
      aria-labelledby="philosophy-title"
      className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-store-border overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 items-center">
        {/* Left Column: Narrative, Typography & Principles */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-7">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 text-base uppercase tracking-widest text-store-gold font-sans font-medium">
            <span aria-hidden="true" className="w-7 h-px bg-store-gold" />
            <span>Our Philosophy</span>
          </div>

          {/* Editorial Display Headline */}
          <h2
            id="philosophy-title"
            className="philosophy-headline text-store-text-primary"
          >
            Less, but
            <br />
            <em className="text-store-gold italic font-normal">
              more meaningful.
            </em>
          </h2>

          {/* Intro Narrative Body */}
          <p className="text-sm sm:text-base text-store-text-secondary font-sans leading-relaxed max-w-lg">
            We believe getting dressed should feel effortless—not overwhelming. That means thoughtful silhouettes,
            details with intention, and pieces that feel like you from the very first wear. We&apos;re not here to chase
            every trend. We&apos;re here for personal style, everyday confidence, and clothes you&apos;ll keep reaching for.
          </p>

          {/* 3 Principles Card */}
          <div
            className="w-full max-w-lg bg-store-cream border border-store-card-border rounded-2xl p-5 sm:p-6 shadow-xs"
            aria-label="Our principles"
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-6 divide-x divide-store-card-border">
              {PRINCIPLES.map((principle, index) => (
                <div key={principle.number} className={`space-y-1.5 ${index > 0 ? 'pl-3 sm:pl-6' : ''}`}>
                  <span className="text-xs font-mono uppercase tracking-wider text-store-gold font-semibold block">
                    {principle.number}
                  </span>
                  <p className="font-heading font-semibold text-base text-store-text-primary leading-snug">
                    {principle.line1}
                    <br />
                    {principle.line2}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Call-to-Action Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 pt-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 h-12 rounded-full bg-store-action-primary text-white hover:bg-store-action-hover font-sans font-medium text-xs tracking-wider uppercase transition-colors duration-150 shadow-xs"
            >
              Explore the collection
            </Link>

            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-store-text-primary hover:text-store-action-primary transition-colors py-2"
            >
              <span>A little more about us</span>
              <ArrowUpRight
                size={14}
                color="currentColor"
                className="text-store-text-primary group-hover:text-store-action-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Right Column: Layered Editorial Visual Collage */}
        <div className="lg:col-span-6 xl:col-span-6 relative min-w-0">
          <div className="relative pl-4 sm:pl-8">
            {/* Architectural Outline Frame Accent */}
            <div className="philosophy-visual-frame" aria-hidden="true" />

            {/* Main Editorial Image */}
            <div className="relative w-full overflow-hidden bg-store-cream border border-store-card-border shadow-xs">
              <img
                src="/images/about/street-polo.jpg"
                alt="Woman in a navy knit polo and cream trousers pausing on a city street with a coffee"
                className="philosophy-visual-img transition-transform duration-700 hover:scale-102"
                loading="lazy"
              />
            </div>

            {/* Vertical Running Editorial Caption */}
            <div
              className="absolute right-0 bottom-2 tuw-writing-vertical text-2xs uppercase tracking-widest text-store-text-secondary select-none font-sans"
              aria-hidden="true"
            >
              Thoughtfully chosen · Everyday worn
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
