'use client';

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';

export interface CustomerReview {
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatarSrc: string;
}

export interface AboutCustomerReviewsProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  reviews?: CustomerReview[];
  className?: string;
}

const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    name: 'Vikram Trivedi',
    location: 'Mumbai, IN',
    rating: 5,
    quote: 'The weight of the 500 GSM fleece is unmatched. You immediately feel the difference from typical commercial garments.',
    avatarSrc: '/images/about/customer-vikram.jpg',
  },
  {
    name: 'Maya Sharma',
    location: 'Bengaluru, IN',
    rating: 5,
    quote: 'Breathable, beautifully draped, and the stitching is pure perfection. It has quickly become my daily uniform for slow living.',
    avatarSrc: '/images/about/customer-maya.jpg',
  },
  {
    name: 'Anand Verma',
    location: 'New Delhi, IN',
    rating: 5,
    quote: 'Fast delivery, zero plastic packaging, and completely void of synthetic polyester fluff. Truly in a league of its own.',
    avatarSrc: '/images/about/customer-anand.jpg',
  },
];

export default function AboutCustomerReviews({
  title = 'Happy Customers',
  eyebrow = 'Verified Patrons',
  subtitle = 'Reflections from patrons who choose heavyweight permanence and intentional drape.',
  reviews = DEFAULT_REVIEWS,
  className = '',
}: AboutCustomerReviewsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      {/* Section Header */}
      <div className="max-w-2xl mb-12 sm:mb-16 space-y-3">
        <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
          {eyebrow}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
          {subtitle}
        </p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {reviews.map((review) => (
          <div
            key={review.name}
            className="flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-store-surface border border-store-card-border shadow-2xs space-y-6"
          >
            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center space-x-1" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={15} className="fill-store-gold text-store-gold" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm sm:text-base text-store-charcoal leading-relaxed font-sans">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author Profile */}
            <div className="flex items-center space-x-4 pt-4 border-t border-store-card-border">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-store-cream border border-store-card-border shrink-0">
                <Image
                  src={review.avatarSrc}
                  alt={`Portrait of ${review.name}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-heading font-medium text-store-charcoal">
                  {review.name}
                </h3>
                <p className="text-xs uppercase tracking-luxury text-store-muted">
                  {review.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

