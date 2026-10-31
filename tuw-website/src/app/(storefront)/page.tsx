'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Pause,
  Play,
  ShoppingBag,
  ShieldCheck,
  Headphones,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VirtualFittingRoom from '@/components/commerce/VirtualFittingRoom';
import OurPhilosophy from '@/components/commerce/OurPhilosophy';
import ProductCard from '@/components/commerce/ProductCard';
import { STORE_PRODUCTS, JOURNAL_ARTICLES } from '@/mocks/fixtures';
import type { Product } from '@/lib/types';



// 2. Explore the Collection: catalog products shown with the shared ProductCard
const CATEGORY_LABELS: Record<Product['category'], string> = {
  hoodies: 'Hoodies & Sweats',
  tees: 'T-shirts',
  pants: 'Joggers',
  kids: 'Kids',
  accessories: 'Accessories',
  mugs: 'Accessories',
  jackets: 'Jackets',
  capsules: 'Capsules',
};

// Derived from the catalog so the homepage can never drift from /shop.
const HOME_PRODUCTS = STORE_PRODUCTS.filter((p) => p.images.length > 0);

const CATEGORY_PILLS = ['All Collection', 'Hoodies & Sweats', 'T-shirts', 'Kids', 'Accessories'];

// 3. Virtual fitting room data + interaction live in @/components/commerce/VirtualFittingRoom.tsx

// 4. From the Journal: real articles, so every card links somewhere that exists
const RECOMMENDATION_STORIES = JOURNAL_ARTICLES.slice(0, 3).map((article) => ({
  id: article.id,
  title: article.title,
  subtitle: article.excerpt,
  image: article.coverImage,
  imagePosition: article.coverPosition,
  slug: article.slug,
}));

// 5. Customer Experience feature pillars (Section 3)
interface ExperienceFeature {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
}

const EXPERIENCE_FEATURES: ExperienceFeature[] = [
  {
    id: 'support',
    icon: Headphones,
    iconClassName: 'text-secondary-mint',
    title: 'Real People, Real Replies',
    description:
      'Questions about sizing or an order? Write to us through the contact page and someone from the studio will get back to you.',
  },
  {
    id: 'collection',
    icon: Users,
    iconClassName: 'text-secondary-blue',
    title: 'Printed for You',
    description:
      'Nothing is printed until you order it, so every piece is made for someone, never for a warehouse.',
  },
  {
    id: 'satisfaction',
    icon: ShieldCheck,
    iconClassName: 'text-store-gold',
    title: 'Honest Details',
    description:
      'Sizes, colours and weights come from our print partner. Anything still being confirmed is clearly marked as a draft.',
  },
];

const HERO_VIDEO_SRC = '/videos/hero-video.mp4';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All Collection');

  // Hero background video: swap HERO_VIDEO_SRC for the final 30s hero cut.
  // Looping motion longer than 5s needs a pause control (WCAG 2.2.2), and
  // reduced-motion visitors start on a still frame.
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(true);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
    }
    setIsHeroVideoPlaying(!video.paused);
  }, []);

  const toggleHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  // Filter best sellers: capped to exactly 6 cards for the homepage showcase
  const filteredProducts = (
    activeCategory === 'All Collection'
      ? HOME_PRODUCTS
      : HOME_PRODUCTS.filter((p) => CATEGORY_LABELS[p.category].toLowerCase() === activeCategory.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-text-primary selection:bg-store-action-primary selection:text-white">
      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* =========================================================================
            SECTION 1: HERO SHOWCASE (Full-bleed video, single-size two-line headline, pause control)
            ========================================================================= */}
        <section
          aria-label="Hero Showcase"
          className="relative w-full overflow-hidden bg-primary-dark hero-viewport-height flex flex-col justify-end"
        >
          {/* Background Video (decorative, muted, continuous loop) */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <video
              ref={heroVideoRef}
              src={HERO_VIDEO_SRC}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              onPlay={() => setIsHeroVideoPlaying(true)}
              onPause={() => setIsHeroVideoPlaying(false)}
              className="w-full h-full object-cover video-watermark-cloak"
            />
          </div>

          {/* Cinematic Scrim Gradients (Guarantee 100% WCAG 2.1 AA Contrast) */}
          <div className="absolute inset-0 hero-scrim-gradient z-10 pointer-events-none" />

          {/* Bottom-centred campaign caption, modelled on luxury house heroes
              (Louis Vuitton: 32px / 400 title + 16px text links; COS: 35px):
              the video carries the hero, the copy stays small. */}
          <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading font-normal text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)] tracking-tight text-white leading-tight">
                <span className="block md:inline">
                  Architectural Form<span className="text-store-gold">.</span>
                </span>{' '}
                <span className="block md:inline">Pure Permanence.</span>
              </h1>

              <p className="mt-3 text-sm text-white/75 font-sans font-light leading-relaxed">
                Dense 500 GSM organic essentials, tailored <span className="whitespace-nowrap">on-demand.</span>
              </p>

              <div className="mt-5 sm:mt-6 flex items-center justify-center gap-6 sm:gap-10">
                <Link
                  href="/shop"
                  className="inline-flex items-center h-11 text-white font-sans font-medium text-xs tracking-luxury uppercase underline underline-offset-[6px] decoration-white/60 hover:decoration-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-4 focus-visible:ring-offset-primary-dark rounded-sm"
                >
                  Shop Collection
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center h-11 text-white font-sans font-medium text-xs tracking-luxury uppercase underline underline-offset-[6px] decoration-white/60 hover:decoration-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-4 focus-visible:ring-offset-primary-dark rounded-sm"
                >
                  The Manifesto
                </Link>
              </div>
            </div>
          </div>

          {/* Pause / play: top-right on phones, bottom-right (level with the links) from sm up */}
          <div className="absolute inset-x-0 top-4 sm:top-auto sm:bottom-[1.875rem] lg:bottom-[2.375rem] z-20 pointer-events-none">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-end">
              <button
                type="button"
                onClick={toggleHeroVideo}
                aria-label={isHeroVideoPlaying ? 'Pause background video' : 'Play background video'}
                className="pointer-events-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/40 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
              >
                {isHeroVideoPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 1.5: OUR PHILOSOPHY (Editorial Slow-Living Fashion Manifesto)
            ========================================================================= */}
        <OurPhilosophy />

        {/* =========================================================================
            SECTION 2: EXPLORE OUR BEST SELLING PRODUCT COLLECTION (Figma Specimen)
            ========================================================================= */}
        <section id="best-sellers" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-store-border">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight text-store-text-primary">
                Explore the Collection
              </h2>
            </div>

            <div className="max-w-md space-y-4">
              <p className="text-base text-store-text-secondary font-sans leading-relaxed">
                Hoodies, tees and everyday objects, each printed with the leaping deer after you order.
              </p>
              <div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-store-action-primary hover:bg-store-action-hover text-white font-sans font-medium text-xs tracking-wider uppercase transition-colors"
                >
                  <span>Let&apos;s Shop Now</span>
                  <ShoppingBag size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Pills matching Figma */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-10" role="tablist">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activeCategory === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(pill)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-store-action-primary text-white shadow-xs'
                      : 'bg-transparent text-store-text-secondary border border-store-border hover:border-store-action-primary hover:text-store-text-primary'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>

          {/* Same borderless card as /shop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: WHAT YOU CAN EXPECT (Figma Teal Banner)
            ========================================================================= */}
        <section className="bg-primary-dark text-white py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Row matching Explore section format */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div>
                <h2 className="font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight text-white">
                  What You Can Expect
                </h2>
              </div>

              <div className="max-w-md">
                <p className="text-base sm:text-xl text-white/70 font-sans leading-relaxed">
                  A small studio printing to order. Here is what we can promise, and nothing we
                  cannot.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {EXPERIENCE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ${feature.iconClassName}`}
                    >
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-white">{feature.title}</h3>
                    <p className="text-base text-white/70 leading-relaxed font-sans">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: VIRTUAL FITTING ROOM
            ========================================================================= */}
        <section aria-label="Virtual fitting room" className="py-20 sm:py-28 border-b border-store-border">
          <VirtualFittingRoom />
        </section>

        {/* =========================================================================
            SECTION 5: FROM THE JOURNAL (Figma Editorial Cards)
            ========================================================================= */}
        <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-store-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight text-store-text-primary">
                From the Journal
              </h2>
              <p className="text-lg text-store-text-secondary font-sans mt-1">
                Notes on how our pieces are made, and why we print to order.
              </p>
            </div>

            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-store-action-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-store-action-hover transition-colors shrink-0 self-start sm:self-auto"
            >
              <span>Read the Journal</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {RECOMMENDATION_STORIES.map((story) => (
              <div
                key={story.id}
                className="group bg-store-surface rounded-2xl border border-store-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-card-story w-full bg-store-cream overflow-hidden">
                  <img
                    src={story.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: story.imagePosition }}
                  />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="font-heading font-semibold text-lg text-store-text-primary leading-snug group-hover:text-store-action-primary transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-base text-store-text-secondary leading-relaxed font-sans">
                    {story.subtitle}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/journal/${story.slug}`}
                      className="text-sm font-medium tracking-wider text-store-text-primary hover:text-store-action-primary inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Read Story</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: STRATOSPHERE LIFESTYLE BANNER (4th Atelier Video Integration)
            ========================================================================= */}
        <section className="relative overflow-hidden py-28 sm:py-36 bg-primary-dark text-white text-center">
          {/* Full-width 4th Benchmark Video (public/videos/h4.mp4) */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              src="/videos/h4.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover video-watermark-cloak"
            />
          </div>

          {/* Cinematic Scrim Gradient (Guarantee 100% WCAG Contrast) */}
          <div className="absolute inset-0 bg-primary-dark/65 hero-scrim-gradient z-1 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight text-white leading-tight">
              Made When You Order It
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed font-sans">
              Choose a piece and it is printed for you in Tiruppur. No warehouse, no leftovers.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 px-8 h-12 rounded-full bg-white text-primary-dark font-sans font-semibold text-sm hover:bg-store-cream active:scale-95 transition-all shadow-lg"
              >
                <span>Shop the Collection</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
