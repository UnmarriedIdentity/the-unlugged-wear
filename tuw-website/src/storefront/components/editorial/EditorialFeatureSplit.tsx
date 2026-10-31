'use client';

import React from 'react';
import Image from 'next/image';

export interface EditorialFeatureSplitProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  reversed?: boolean;
  className?: string;
}

export default function EditorialFeatureSplit({
  title = 'Products made with love.',
  eyebrow = 'Atelier Craftsmanship',
  description = 'Every garment and utilitarian piece is designed with mindful intention and tailored in zero-deadstock ateliers. We eliminate surplus manufacturing by producing solely on-demand with uncompromised organic textiles.',
  imageSrc = '/images/editorial/products-made-with-love.png',
  imageAlt = 'Crafted with care in verified atelier',
  reversed = false,
  className = '',
}: EditorialFeatureSplitProps) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 ${className}`}>
      <div className="bg-store-cream border border-store-card-border rounded-3xl p-6 sm:p-12 lg:p-16 overflow-hidden">
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
            reversed ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Visual Column */}
          <div className="lg:col-span-6 relative aspect-16/10 rounded-2xl overflow-hidden bg-store-surface border border-store-card-border shadow-xs">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            {eyebrow && (
              <span className="text-xs font-semibold uppercase tracking-widest text-store-gold block">
                {eyebrow}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed pt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

