'use client';

import React from 'react';
import { Truck, Headphones, RefreshCw, LucideIcon } from 'lucide-react';

export interface ValuePillarItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface AboutValuePillarsProps {
  pillars?: ValuePillarItem[];
  className?: string;
}

const DEFAULT_PILLARS: ValuePillarItem[] = [
  {
    icon: Truck,
    title: 'Free Shipping Over ₹1,999',
    description: 'Complimentary express doorstep delivery across all qualified domestic orders.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Atelier Support',
    description: 'Direct concierge guidance for sizing, organic fabric care, and orders.',
  },
  {
    icon: RefreshCw,
    title: '30-Day Effortless Returns',
    description: 'Seamless size exchanges and return guarantee for complete peace of mind.',
  },
];

export default function AboutValuePillars({
  pillars = DEFAULT_PILLARS,
  className = '',
}: AboutValuePillarsProps) {
  if (!pillars || pillars.length === 0) return null;

  return (
    <section className={`w-full bg-store-cream border-y border-store-card-border py-12 sm:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 divide-y md:divide-y-0 md:divide-x divide-store-card-border">
          {pillars.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.title}
                className={`flex items-start space-x-4 ${idx > 0 ? 'pt-6 md:pt-0 md:pl-8 lg:pl-12' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-store-surface border border-store-card-border flex items-center justify-center shrink-0 text-store-gold shadow-2xs">
                  <IconComponent size={20} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-heading font-medium text-store-charcoal">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-store-text-secondary leading-relaxed font-sans">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

