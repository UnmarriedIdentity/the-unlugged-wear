'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

export interface AboutCraftHighlightProps {
  headline?: string;
  description?: string;
  checkpoints?: string[];
  founderName?: string;
  founderTitle?: string;
  imageSrc?: string;
  className?: string;
}

const DEFAULT_CHECKPOINTS: string[] = [
  '100% GOTS Certified Organic Cotton',
  'Zero-Deadstock On-Demand Manufacturing',
  'Water-Based OEKO-TEX Non-Toxic Inks',
];

export default function AboutCraftHighlight({
  headline = 'A simple idea in thoughtful matter',
  description = 'We believe clothing should feel like personal sanctuary, not a commercial billboard. By pairing sculptural architectural cuts with heavyweight 500 GSM organic knitwear, every single piece feels grounded, protective, and intentional.',
  checkpoints = DEFAULT_CHECKPOINTS,
  founderName = 'Urvil Kargathala',
  founderTitle = 'Founder, The Unplugged Wear',
  imageSrc = '/images/about/craft-rack.jpg',
  className = '',
}: AboutCraftHighlightProps) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Visual */}
        <div className="lg:col-span-6">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface">
            <Image
              src={imageSrc}
              alt="Atelier team inspecting garment drape and construction"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-102"
            />
          </div>
        </div>

        {/* Right Column: Narrative & Checkpoints */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
            The Philosophy of Form
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
            {description}
          </p>

          {/* Checkpoint Bullets */}
          <div className="space-y-3 pt-2">
            {checkpoints.map((cp) => (
              <div key={cp} className="flex items-center space-x-3 text-sm text-store-charcoal font-medium">
                <div className="w-5 h-5 rounded-full bg-store-cream border border-store-gold/50 flex items-center justify-center shrink-0 text-store-gold">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>{cp}</span>
              </div>
            ))}
          </div>

          {/* Founder Signature Callout */}
          <div className="pt-6 border-t border-store-card-border space-y-1">
            <span className="font-serif italic text-2xl text-store-charcoal tracking-wide block">
              {founderName}
            </span>
            <p className="text-xs uppercase tracking-luxury text-store-muted font-medium">
              {founderTitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

