'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface AboutAtelierProcessProps {
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
  className?: string;
}

export default function AboutAtelierProcess({
  headline = 'Every garment tells a story of dedicated craftsmanship & slow-living.',
  description = 'From combed long-staple organic cotton to precision double-needle finishing, our process rejects the speed-first mentality of mass production in favor of enduring form. We work closely with master artisans in Tiruppur to guarantee dignified atelier conditions, living wages, and zero-deadstock sustainability.',
  ctaText = 'Our Tiruppur Atelier',
  ctaHref = '/about/sustainability',
  imageSrc = '/images/about/creator-studio.jpg',
  className = '',
}: AboutAtelierProcessProps) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Narrative Split */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
            Craftsmanship & Provenance
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
            {description}
          </p>

          <div className="pt-2">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full border border-store-charcoal text-store-charcoal hover:bg-store-charcoal hover:text-white transition-all duration-200 text-xs uppercase tracking-luxury font-medium"
            >
              <span>{ctaText}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="lg:col-span-6">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface">
            <Image
              src={imageSrc}
              alt="Tailoring atelier and photographic design studio"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-102"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

