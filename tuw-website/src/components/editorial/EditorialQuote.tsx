'use client';

import React from 'react';
import Image from 'next/image';

export interface EditorialQuoteProps {
  quote: string;
  author: string;
  iconSrc?: string;
  className?: string;
}

export default function EditorialQuote({
  quote,
  author,
  iconSrc = '/images/editorial/quote-icon.svg',
  className = '',
}: EditorialQuoteProps) {
  if (!quote) return null;

  return (
    <section className={`w-full max-w-5xl mx-auto px-4 sm:px-6 my-16 ${className}`}>
      <div className="bg-store-cream border border-store-card-border rounded-2xl p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-xs">
        {iconSrc && (
          <div className="mb-6 relative w-7 h-6 opacity-80">
            <Image
              src={iconSrc}
              alt="Quote Icon"
              width={28}
              height={24}
              className="object-contain"
            />
          </div>
        )}
        <blockquote className="text-lg sm:text-2xl font-serif sm:font-sans font-normal text-store-charcoal max-w-2xl leading-relaxed tracking-tight">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <cite className="mt-4 text-sm sm:text-base font-medium text-store-text-secondary tracking-wide not-italic block">
          {author}
        </cite>
      </div>
    </section>
  );
}

