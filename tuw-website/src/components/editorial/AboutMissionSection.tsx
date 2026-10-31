'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface AboutMissionSectionProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  primaryImageSrc?: string;
  secondaryImageSrc?: string;
  className?: string;
}

export default function AboutMissionSection({
  eyebrow = 'Our Mission',
  headline = 'Building a wardrobe for a modern world with elegance & dedicated calm.',
  description = 'Our mission is to create garments that outlive seasonal trends, reduce planetary waste through zero-deadstock on-demand production, and provide everyday sanctuary through dense GOTS-certified organic cotton tailored on-demand.',
  ctaText = 'Explore Collection',
  ctaHref = '/shop',
  primaryImageSrc = '/images/about/story-designers.jpg',
  secondaryImageSrc = '/images/about/story-rack.jpg',
  className = '',
}: AboutMissionSectionProps) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Primary Atelier Visual (Left in Mission, maintaining asymmetric balance) */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface">
            <Image
              src={primaryImageSrc}
              alt="Artisans at work in sustainable apparel workshop"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-102"
            />
          </div>
        </div>

        {/* Mission Content Column */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 flex flex-col justify-center">
          <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
            {description}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full border border-store-charcoal text-store-charcoal hover:bg-store-charcoal hover:text-white transition-all duration-200 text-xs uppercase tracking-luxury font-medium"
            >
              <span>{ctaText}</span>
              <ArrowRight size={14} />
            </Link>

            {secondaryImageSrc && (
              <div className="relative w-36 h-20 rounded-xl overflow-hidden border border-store-card-border shadow-xs bg-store-surface shrink-0 hidden sm:block">
                <Image
                  src={secondaryImageSrc}
                  alt="Curated organic cotton wardrobe display"
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

