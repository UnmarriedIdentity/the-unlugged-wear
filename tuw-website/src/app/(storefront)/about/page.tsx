'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TuwEmblem from '@/components/layout/TuwEmblem';
import { STORE_PRODUCTS } from '@/mocks/fixtures';
import { ArrowRight, ArrowUp } from 'lucide-react';
import {
  AboutTeamSection,
  AboutCraftHighlight,
  AboutCustomerReviews,
  InstagramFeedSection,
} from '@/components/editorial';

// Stats are computed from the live catalog so they can never go stale.
const STYLE_COUNT = STORE_PRODUCTS.length;
const COLOUR_COUNT = new Set(STORE_PRODUCTS.flatMap((p) => p.colors.map((c) => c.name))).size;

const SECTION = 'scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const EYEBROW = 'text-xs uppercase tracking-widest text-store-gold font-medium';
const H2 = 'font-heading text-[clamp(1.75rem,3vw+0.75rem,2.75rem)] font-medium tracking-tight text-store-text-primary';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />

      <main className="flex-1 w-full pb-16 sm:pb-24">
        {/* HERO (Full Screen Width) */}
        <section
          id="about-top"
          aria-labelledby="about-heading"
          className="relative w-full overflow-hidden bg-primary-dark aspect-4/5 sm:aspect-16/9 lg:aspect-21/9 min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] flex flex-col justify-between"
        >
          <img
            src="/images/about/our-story-couple.webp"
            alt="Two people sitting together on coastal rocks, one holding a bouquet"
            className="absolute inset-0 w-full h-full object-cover object-[60%_30%] grayscale"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/20" />
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/30 to-transparent" />

          {/* Top Breadcrumb inside hero */}
          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <nav aria-label="Breadcrumbs" className="flex items-center space-x-2 text-xs uppercase tracking-wider text-white/75 font-medium">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-store-gold font-medium">About Us</span>
            </nav>
          </div>

          {/* Bottom Heading & Eyebrow */}
          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 lg:pb-16">
            <span className="text-xs uppercase tracking-widest text-store-gold font-medium">About Us</span>
            <h1
              id="about-heading"
              className="mt-2 max-w-3xl font-heading text-[clamp(2rem,4vw+1rem,4rem)] font-medium tracking-tight text-white leading-[1.05]"
            >
              Everyday pieces, made when you order them.
            </h1>
          </div>
        </section>

        {/* OUR STORY */}
        <section id="our-story" aria-labelledby="our-story-heading" className={`${SECTION} py-16 sm:py-24`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative overflow-hidden rounded-3xl bg-store-cream aspect-4/5">
              <img
                src="/images/about/cream-polo.jpg"
                alt="Woman in a cream polo and wide trousers walking through a garden terrace"
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-store-text-primary">
                Part of Opalworks · A house of ventures
              </span>
            </div>

            <div>
              <span className={EYEBROW}>Behind the brand</span>
              <h2 id="our-story-heading" className={`${H2} mt-3`}>
                A small team in Surat
              </h2>
              <p className="mt-5 text-base sm:text-lg text-store-text-secondary leading-relaxed max-w-xl">
                The Unplugged Wear is a venture of Opalworks, a house of ventures founded by Urvil
                Kargathala in Surat. We design, photograph and look after every order ourselves, and work
                with a print-on-demand partner in India who prints and ships each piece.
              </p>
              <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { value: STYLE_COUNT, label: 'Styles' },
                  { value: COLOUR_COUNT, label: 'Colours shown' },
                  { value: 1, label: 'Print partner' },
                ].map((stat) => (
                  <div key={stat.label} className="border-t border-store-border pt-3 flex flex-col-reverse">
                    <dt className="mt-1 text-sm text-store-text-secondary">{stat.label}</dt>
                    <dd className="font-heading text-3xl sm:text-4xl font-medium text-store-text-primary tuw-tabular-nums">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* OUR PHILOSOPHY */}
        <section id="our-way" aria-labelledby="our-way-heading" className={`${SECTION} pb-16 sm:pb-24`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 md:order-1">
              <span className="inline-flex rounded-full bg-store-cream border border-store-border px-3 py-1 text-xs font-medium text-store-text-secondary">
                Our philosophy
              </span>
              <h2
                id="our-way-heading"
                className="mt-5 font-heading text-[clamp(2.5rem,5vw+0.5rem,4.5rem)] font-medium tracking-tight text-primary-dark leading-[1.02]"
              >
                Made slowly.
                <br />
                Worn often.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-store-text-secondary leading-relaxed max-w-md">
                The Unplugged Wear makes everyday clothes and objects with one quiet mark. We print each
                piece only after it is ordered, so nothing is made just to sit on a shelf.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary-dark text-white text-sm font-medium hover:bg-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
                >
                  Shop the collection
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/journal/unplugging-the-digital-noise"
                  className="inline-flex items-center h-11 px-6 rounded-full border border-store-border bg-white text-sm font-medium text-store-text-primary hover:border-store-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
                >
                  What &ldquo;unplugged&rdquo; means
                </Link>
              </div>
            </div>

            <div className="order-1 md:order-2 relative overflow-hidden rounded-3xl bg-store-cream aspect-4/5">
              <img
                src="/images/about/street-polo.jpg"
                alt="Woman in a black polo and cream trousers on a city street, holding a coffee"
                loading="lazy"
                className="w-full h-full object-cover object-[50%_20%]"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white/90 backdrop-blur-sm px-4 py-3">
                <p className="text-sm text-store-text-primary leading-snug">
                  Printed only when you order.
                  <span className="block text-store-text-secondary">Shipped from India.</span>
                </p>
                <TuwEmblem className="h-6 w-auto text-store-text-primary shrink-0" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            EDITORIAL SECTIONS (Imported from preview)
            ========================================================================= */}

        {/* Meet Our Team: Leadership Triad Grid (Meet, Dharmil, Urvil) */}
        <AboutTeamSection />

        {/* Brand Story Highlight: A Simple Idea in Thoughtful Matter */}
        <AboutCraftHighlight />

        {/* Happy Customers: 3 Verified Testimonial Cards */}
        <AboutCustomerReviews />

        {/* Sustainability Manifesto Banner Callout */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-store-surface border border-store-card-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
                Planetary Responsibility
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-medium text-store-charcoal">
                Read the Sustainability Manifesto
              </h3>
              <p className="text-sm text-store-text-secondary leading-relaxed font-sans">
                Explore our GOTS organic certifications, solar curing tunnels, zero-deadstock print-on-demand infrastructure, and carbon-neutral freight logistics.
              </p>
            </div>
            <Link
              href="/about/sustainability"
              className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-store-action-primary hover:bg-store-action-hover text-white transition-colors duration-200 text-xs uppercase tracking-luxury font-medium shrink-0 shadow-xs"
            >
              <span>Explore Manifesto</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* =========================================================================
            LIFESTYLE SECTION
            ========================================================================= */}
        <section id="lifestyle" aria-labelledby="lifestyle-heading" className={`${SECTION} py-16 sm:py-24`}>
          <span className={EYEBROW}>Our lifestyle</span>
          <h2 id="lifestyle-heading" className={`${H2} mt-3 mb-10`}>
            Clothes for the slow parts of the day
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-3 sm:gap-4">
            <figure className="relative row-span-2 overflow-hidden rounded-2xl bg-store-cream">
              <img src="/images/lifestyle/linen-man.jpg" alt="Man in a green linen shirt carrying a leather weekend bag" loading="lazy" className="w-full h-full object-cover object-[60%_0%]" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-store-text-primary">Weekends</figcaption>
            </figure>

            <div className="col-span-1 md:col-span-2 rounded-2xl bg-store-gold/80 p-5 sm:p-6 flex flex-col justify-between">
              <p className="font-heading text-xl sm:text-2xl font-medium text-primary-dark leading-snug">
                Phone face down.
                <br />
                Kettle on.
              </p>
              <p className="text-xs text-primary-dark/80">Our idea of a good day</p>
            </div>

            <figure className="relative row-span-2 overflow-hidden rounded-2xl bg-store-cream">
              <img src="/images/about/street-polo.jpg" alt="Close-up of a hand holding a takeaway coffee on a morning walk" loading="lazy" className="w-full h-full object-cover object-center scale-[1.9] origin-[69%_66%]" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-store-text-primary">Slow mornings</figcaption>
            </figure>

            <div className="rounded-2xl bg-primary-dark p-5 sm:p-6 flex flex-col justify-between text-white">
              <TuwEmblem className="h-8 w-auto text-store-gold" />
              <p className="text-sm text-white/80">Home</p>
            </div>

            {/* Bottom-anchored crop keeps the shirt's third-party chest logo out of frame */}
            <figure className="relative col-span-2 md:col-span-1 overflow-hidden rounded-2xl bg-store-cream">
              <img src="/images/about/office-polo.jpg" alt="Wide cream trousers and white heels by an office desk" loading="lazy" className="w-full h-full object-cover object-bottom scale-125 origin-bottom" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-store-text-primary">Desk days</figcaption>
            </figure>
          </div>
        </section>

        {/* =========================================================================
            CLOSING SECTION
            ========================================================================= */}
        <section aria-labelledby="closing-heading" className={`${SECTION} pt-12`}>
          <div className="relative overflow-hidden rounded-3xl bg-primary-dark px-6 py-14 sm:px-12 sm:py-20">
            <TuwEmblem className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-auto text-white/5" />
            <h2
              id="closing-heading"
              className="relative font-heading text-[clamp(2.25rem,4vw+0.75rem,4rem)] font-medium tracking-tight text-white leading-[1.05]"
            >
              Fewer things.
              <br />
              <span className="text-store-gold">Better kept.</span>
            </h2>
            <p className="relative mt-5 max-w-md text-base text-white/75 leading-relaxed">
              Tees, hoodies and a few everyday objects, each with the same small deer.
            </p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-primary-dark text-sm font-medium hover:bg-store-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
              >
                Explore the collection
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="#about-top"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-white/30 text-sm font-medium text-white hover:border-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
              >
                Back to top
                <ArrowUp size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FOLLOW US ON INSTAGRAM (Moved to the very end)
            ========================================================================= */}
        <InstagramFeedSection />
      </main>

      <Footer />
    </div>
  );
}
