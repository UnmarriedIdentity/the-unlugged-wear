'use client';

import React from 'react';
import Image from 'next/image';

export interface AboutStorySectionProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  founderName?: string;
  founderRole?: string;
  primaryImageSrc?: string;
  secondaryImageSrc?: string;
  className?: string;
}

export default function AboutStorySection({
  eyebrow = 'Our Story',
  headline = 'Redefining fashion for a modern world with elegance & ethical craftsmanship.',
  description = 'The Unplugged Wear began with a singular observation: modern clothing has become disposable, loud, and fleeting. In response, we build heavyweight architectural essentials that invite you to slow down. From slow circular looms in Tiruppur to zero-deadstock tailoring, our garments prioritize tactile permanence over fast-fashion hype.',
  founderName = 'Urvil Kargathala',
  founderRole = 'Founder & Creative Director',
  primaryImageSrc = '/images/about/story-designers.jpg',
  secondaryImageSrc = '/images/about/story-rack.jpg',
  className = '',
}: AboutStorySectionProps) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Narrative & Story Column */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-center">
          <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
            {description}
          </p>

          {/* Founder Signature Block & Secondary Studio Asset */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-store-card-border">
            <div className="space-y-1">
              <span className="font-serif italic text-2xl text-store-charcoal tracking-wide block">
                {founderName}
              </span>
              <p className="text-xs uppercase tracking-luxury text-store-muted font-medium">
                {founderRole}
              </p>
            </div>

            {secondaryImageSrc && (
              <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface shrink-0">
                <Image
                  src={secondaryImageSrc}
                  alt="Atelier garment rack and raw textiles"
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Primary Atelier Lifestyle Visual */}
        <div className="lg:col-span-6">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface">
            <Image
              src={primaryImageSrc}
              alt="Designers and artisans collaborating in Tiruppur workshop"
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

