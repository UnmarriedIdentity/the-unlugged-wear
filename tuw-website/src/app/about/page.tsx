'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import TuwEmblem from '@storefront/components/layout/TuwEmblem';
import { STORE_PRODUCTS } from '@storefront/mocks/fixtures';
import { CATEGORY_LABELS, RETURN_WINDOW_DAYS, isWearable, productTypeOf } from '@storefront/lib/product';
import type { Product } from '@storefront/lib/types';
import { ArrowRight, ArrowUp, PackageCheck, Printer, RotateCcw, ShoppingBag, Truck } from 'lucide-react';

// Stats are computed from the live catalogue so they can never go stale.
const CLOTHING_COUNT = STORE_PRODUCTS.filter((p) => isWearable(productTypeOf(p))).length;
const OBJECT_COUNT = STORE_PRODUCTS.length - CLOTHING_COUNT;
const COLOUR_COUNT = new Set(STORE_PRODUCTS.flatMap((p) => p.colors.map((c) => c.name.toLowerCase()))).size;
// Round down to a tidy "40+" style figure.
const roundDown = (n: number) => (n >= 20 ? `${Math.floor(n / 10) * 10}+` : String(n));

const SECTION = 'scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const H2 = 'font-heading text-[clamp(1.75rem,3vw+0.75rem,2.75rem)] font-medium tracking-tight text-store-text-primary';

const STEPS = [
  { icon: ShoppingBag, title: 'You order', body: 'Pick your piece, colour and size. Nothing is printed before this.' },
  { icon: Printer, title: 'We print it', body: 'Our print partner in India prints your piece in 2–3 business days.' },
  { icon: Truck, title: 'It ships', body: 'Packed and sent with tracking to your door, anywhere in India.' },
  {
    icon: RotateCcw,
    title: 'Easy returns',
    body: `Unworn clothing can be returned or exchanged within ${RETURN_WINDOW_DAYS} days of delivery.`,
  },
];

// One card per main category, with the first photo from that category.
const CATEGORY_CARDS: { category: Product['category']; image: string }[] = (
  ['hoodies', 'tees', 'pants', 'kids', 'accessories'] as Product['category'][]
).map((category) => ({
  category,
  image:
    STORE_PRODUCTS.find((p) => p.category === category && p.images[0])?.images[0].url ??
    '/images/samples/women-white-cardigan.jpg',
}));

const HELP_LINKS = [
  { href: '/faq', label: 'FAQ', body: 'Sizing, printing and orders' },
  { href: '/policies/shipping', label: 'Shipping', body: 'Printing and delivery times' },
  { href: '/policies/returns', label: 'Returns', body: `${RETURN_WINDOW_DAYS}-day returns on unworn clothing` },
  { href: '/contact', label: 'Contact', body: 'Write to us, we reply ourselves' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />

      <main className="flex-1 w-full pb-16 sm:pb-24">
        {/* HERO */}
        <section
          id="about-top"
          aria-labelledby="about-heading"
          className="relative w-full overflow-hidden bg-primary-dark hero-viewport-height flex flex-col justify-between"
        >
          <img
            src="/images/about/hero-couple.avif"
            alt="A couple sitting together on coastal rocks, one holding a bouquet"
            className="absolute inset-0 w-full h-full object-cover object-[50%_15%]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/25" />

          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/85 font-medium">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span aria-hidden="true" className="text-white/50">/</span>
              <span aria-current="page" className="text-white">About</span>
            </nav>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 lg:pb-16">
            <h1
              id="about-heading"
              className="max-w-3xl font-heading text-[clamp(2rem,4vw+1rem,4rem)] font-medium tracking-tight text-white leading-[1.05]"
            >
              Everyday pieces, made when you order them.
            </h1>
          </div>
        </section>

        {/* OUR STORY + FOUNDER NOTE */}
        <section id="our-story" aria-labelledby="our-story-heading" className={`${SECTION} py-16 sm:py-24`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <figure className="bg-store-cream overflow-hidden aspect-4/5">
              <img
                src="/images/about/story-man-suit.jpg"
                alt="Man in a beige double-breasted suit standing in evening light"
                loading="lazy"
                className="w-full h-full object-cover object-[50%_30%]"
              />
            </figure>

            <div>
              <h2 id="our-story-heading" className={H2}>
                Started in Surat
              </h2>
              <div className="mt-5 space-y-4 text-base sm:text-lg text-store-text-secondary leading-relaxed max-w-xl">
                <p>
                  The Unplugged Wear began with a simple wish: clothes that feel calm, carry one quiet mark, and
                  aren’t made in piles that nobody buys.
                </p>
                <p>
                  So every piece is printed only after you order it, by our print partner in India. We choose the
                  styles, look after every order and answer every message ourselves.
                </p>
              </div>
              <blockquote className="mt-8 border-l-2 border-store-gold pl-5">
                <p className="font-heading text-xl text-store-charcoal leading-snug">
                  “Make fewer things, and make each one worth keeping.”
                </p>
                <footer className="mt-2 text-sm text-store-text-secondary">
                  Urvil Kargathala, founder · The Unplugged Wear is a venture of Opalworks
                </footer>
              </blockquote>

              <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { value: roundDown(CLOTHING_COUNT), label: 'Clothing styles' },
                  { value: roundDown(OBJECT_COUNT), label: 'Everyday objects' },
                  { value: roundDown(COLOUR_COUNT), label: 'Colours' },
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

        {/* HOW IT WORKS */}
        <section id="how-it-works" aria-labelledby="how-heading" className="bg-store-cream border-y border-store-card-border">
          <div className={`${SECTION} py-16 sm:py-20`}>
            <h2 id="how-heading" className={H2}>
              From your order to your door
            </h2>
            <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-store-card-border border border-store-card-border">
              {STEPS.map(({ icon: Icon, title, body }, idx) => (
                <li key={title} className="bg-store-surface p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <Icon size={22} aria-hidden="true" className="text-store-charcoal" />
                    <span className="text-xs text-store-text-secondary tuw-tabular-nums">0{idx + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-store-charcoal">{title}</h3>
                  <p className="mt-2 text-sm text-store-text-secondary leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* OUR PHILOSOPHY */}
        <section id="our-way" aria-labelledby="our-way-heading" className={`${SECTION} py-16 sm:py-24`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2
                id="our-way-heading"
                className="font-heading text-[clamp(2.5rem,5vw+0.5rem,4.5rem)] font-medium tracking-tight text-primary-dark leading-[1.02]"
              >
                Made slowly.
                <br />
                Worn often.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-store-text-secondary leading-relaxed max-w-md">
                Everyday clothes and objects with one small leaping deer. Because each piece is printed after it is
                ordered, nothing is made just to sit on a shelf.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
                >
                  Shop the collection
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/journal/unplugging-the-digital-noise"
                  className="inline-flex items-center h-11 px-6 rounded-full border border-store-border bg-store-surface text-sm font-medium text-store-text-primary hover:border-store-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
                >
                  What “unplugged” means
                </Link>
              </div>
            </div>

            <div className="order-1 md:order-2 relative overflow-hidden bg-store-cream aspect-4/5">
              <img
                src="/images/samples/women-brown-top.jpg"
                alt="Woman in a brown top and wide cream trousers outside a stone building"
                loading="lazy"
                className="w-full h-full object-cover object-[50%_20%]"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 bg-store-surface/90 backdrop-blur-sm px-4 py-3">
                <p className="text-sm text-store-text-primary leading-snug">
                  Printed only when you order.
                  <span className="block text-store-text-secondary">Shipped across India.</span>
                </p>
                <TuwEmblem className="h-6 w-auto text-store-text-primary shrink-0" />
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE MAKE */}
        <section id="what-we-make" aria-labelledby="make-heading" className={`${SECTION} pb-16 sm:pb-24`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="make-heading" className={H2}>
                Clothes first, a few good objects too
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal"
            >
              See everything
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORY_CARDS.map(({ category, image }) => (
              <li key={category}>
                <Link
                  href={`/shop?category=${category}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  <span className="block aspect-3/4 overflow-hidden bg-store-cream">
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-3 flex items-center justify-between text-sm font-medium text-store-charcoal">
                    {CATEGORY_LABELS[category]}
                    <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* LIFESTYLE */}
        <section id="lifestyle" aria-labelledby="lifestyle-heading" className={`${SECTION} pb-16 sm:pb-24`}>
          <h2 id="lifestyle-heading" className={`${H2} mb-10`}>
            Clothes for the slow parts of the day
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-3 sm:gap-4">
            <figure className="relative row-span-2 overflow-hidden bg-store-cream">
              <img src="/images/samples/men-linen-blazer.jpg" alt="Man in a linen blazer and cream sweater on a stone terrace" loading="lazy" className="w-full h-full object-cover object-top" />
              <figcaption className="absolute bottom-3 left-3 bg-store-surface/90 px-3 py-1 text-xs font-medium text-store-text-primary">Weekends</figcaption>
            </figure>
            <div className="col-span-1 md:col-span-2 bg-store-gold/80 p-5 sm:p-6 flex flex-col justify-between">
              <p className="font-heading text-xl sm:text-2xl font-medium text-primary-dark leading-snug">
                Phone face down.
                <br />
                Kettle on.
              </p>
              <p className="text-xs text-primary-dark/80">Our idea of a good day</p>
            </div>
            <figure className="relative row-span-2 overflow-hidden bg-store-cream">
              <img src="/images/samples/women-suede-jacket.jpg" alt="Woman in a suede jacket holding a takeaway coffee on a morning walk" loading="lazy" className="w-full h-full object-cover object-top" />
              <figcaption className="absolute bottom-3 left-3 bg-store-surface/90 px-3 py-1 text-xs font-medium text-store-text-primary">Slow mornings</figcaption>
            </figure>
            <div className="bg-primary-dark p-5 sm:p-6 flex flex-col justify-between text-white">
              <TuwEmblem className="h-8 w-auto text-store-gold" />
              <p className="text-sm text-white/80">Home</p>
            </div>
            <figure className="relative col-span-2 md:col-span-1 overflow-hidden bg-store-cream">
              <img src="/images/samples/men-navy-blazer.jpg" alt="Man in a navy blazer and striped shirt by a doorway" loading="lazy" className="w-full h-full object-cover object-top" />
              <figcaption className="absolute bottom-3 left-3 bg-store-surface/90 px-3 py-1 text-xs font-medium text-store-text-primary">Desk days</figcaption>
            </figure>
          </div>
        </section>

        {/* HONEST NOTE ON MATERIALS */}
        <section aria-labelledby="materials-heading" className={`${SECTION} pb-16 sm:pb-24`}>
          <div className="p-8 sm:p-12 bg-store-surface border border-store-card-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex gap-4 max-w-2xl">
              <PackageCheck size={24} aria-hidden="true" className="shrink-0 mt-1 text-store-charcoal" />
              <div className="space-y-2">
                <h2 id="materials-heading" className="text-2xl font-heading font-medium text-store-charcoal">
                  What we can promise today
                </h2>
                <p className="text-sm text-store-text-secondary leading-relaxed">
                  Printing to order means no unsold stock. Fabric details, inks and any certifications will be
                  published once our print partner confirms them in writing. Until then, we won’t claim them.
                </p>
              </div>
            </div>
            <Link
              href="/about/sustainability"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-store-charcoal text-store-charcoal text-sm font-medium hover:bg-store-charcoal hover:text-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              How we make things
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* QUESTIONS & CONTACT */}
        <section aria-labelledby="help-heading" className={`${SECTION} pb-16 sm:pb-24`}>
          <h2 id="help-heading" className={H2}>
            Anything else you’d like to know?
          </h2>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group h-full flex items-start justify-between gap-4 p-6 bg-store-surface border border-store-card-border hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  <span>
                    <span className="block text-base font-medium text-store-charcoal">{link.label}</span>
                    <span className="block mt-1 text-sm text-store-text-secondary">{link.body}</span>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CLOSING */}
        <section aria-labelledby="closing-heading" className={SECTION}>
          <div className="relative overflow-hidden bg-primary-dark px-6 py-14 sm:px-12 sm:py-20">
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
      </main>

      <Footer />
    </div>
  );
}
