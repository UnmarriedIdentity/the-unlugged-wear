'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface AboutHeroProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  imageSrc?: string;
  className?: string;
}

export default function AboutHero({
  title = 'About Us',
  eyebrow = 'Brand Ethos & Permanence',
  subtitle = 'Crafting heavyweight organic essentials with architectural drape and intentional calm in an overstimulated era.',
  imageSrc = '/images/about/hero-editorial.jpg',
  className = '',
}: AboutHeroProps) {
  return (
    <section className={`relative w-full overflow-hidden bg-store-charcoal ${className}`}>
      {/* Background Editorial Visual with Subtle Motion */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt="The Unplugged Wear editorial atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
        />
        {/* Cinematic Scrim Overlays */}
        <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-black/40" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 flex flex-col justify-end min-h-96 sm:min-h-112 lg:min-h-128">
        {/* Minimal Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs text-white/70">
          <Link href="/" className="hover:text-store-gold transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-white/40" />
          <span className="text-store-gold font-medium">About Us</span>
        </nav>

        <div className="max-w-2xl space-y-4">
          <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
            {eyebrow}
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-medium tracking-tight text-white leading-none">
            {title}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed font-sans max-w-xl pt-2">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

