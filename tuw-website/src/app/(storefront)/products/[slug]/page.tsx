'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ProductGallery from '@/components/commerce/ProductGallery';
import VariantSelector from '@/components/commerce/VariantSelector';
import DynamicDataTable from '@/components/commerce/DynamicDataTable';
import DynamicAccordionFaq from '@/components/commerce/DynamicAccordionFaq';
import ProductReviews from '@/components/commerce/ProductReviews';
import RelatedProductsSection from '@/components/commerce/RelatedProductsSection';
import { EditorialQuote, EditorialFeatureSplit } from '@/components/editorial';
import { useStore } from '@/mocks/store';
import { ProductColor, ReviewItem } from '@/lib/types';
import {
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

// 1. Shirt / Apparel Reviews
const SHIRT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-s1',
    author: 'Isabella Rodriguez',
    role: 'Architect & Spatial Designer',
    verified: true,
    rating: 5,
    date: 'October 18, 2026',
    title: 'Incredible loopback terry drape',
    content:
      'The weight is uncompromising. You immediately feel the density of the custom-milled organic cotton. It holds an architectural silhouette all day without buckling.',
    variant: 'Size L • Vintage Black',
  },
  {
    id: 'rev-s2',
    author: 'Gabrielle Williams',
    role: 'Creative Director, Studio Monolith',
    verified: true,
    rating: 5,
    date: 'October 14, 2026',
    title: 'The perfect unbranded luxury staple',
    content:
      'No screaming logos, no artificial polyester sheen. Just pure, dense combed cotton that feels substantial and honest. The collar construction is the best I have experienced.',
    variant: 'Size M • Washed Slate',
  },
  {
    id: 'rev-s3',
    author: 'Samantha Johnson',
    role: 'Founder, Nordic Living',
    verified: true,
    rating: 4,
    date: 'October 09, 2026',
    title: 'Exceeded expectations in fabric permanence',
    content:
      'Washed it multiple times now on cold gentle cycle — zero shrinkage and zero seam twisting. The zero-deadstock POD model is the true definition of modern luxury.',
    variant: 'Size S • Bone White',
  },
  {
    id: 'rev-s4',
    author: 'Victoria Thompson',
    role: 'Senior Textile Curator',
    verified: true,
    rating: 5,
    date: 'September 28, 2026',
    title: 'Quiet permanence personified',
    content:
      'Dense, heavy, and thoughtfully cut. The dropped shoulder and neckline drape naturally without needing synthetic elastane. A masterclass in minimalist tailoring.',
    variant: 'Size XL • Vintage Black',
  },
];

// 2. Mug / Object Reviews
const MUG_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-m1',
    author: 'Marcus Vance',
    role: 'Industrial Designer, Oona Studio',
    verified: true,
    rating: 5,
    date: 'October 21, 2026',
    title: 'Substantial hand-weight & tactile matte finish',
    content:
      'The 380-gram dry weight feels grounded and purposeful on my workspace desk. The matte glaze does not show fingerprints, and the two-finger handle balance is ergonomic perfection.',
    variant: 'Standard (350 ml) • Matte Charcoal',
  },
  {
    id: 'rev-m2',
    author: 'Elena Rostova',
    role: 'Ceramics Enthusiast & Architect',
    verified: true,
    rating: 5,
    date: 'October 15, 2026',
    title: 'Withstood daily dishwasher cycles effortlessly',
    content:
      'Fired at high temperatures as advertised. Glaze has zero crazing or dullness after two weeks of daily espresso and upper-rack dishwasher runs. The raw clay foot is a gorgeous touch.',
    variant: 'Studio Grande (450 ml) • Matte Charcoal',
  },
  {
    id: 'rev-m3',
    author: 'Devon Hayes',
    role: 'Creative Director, Slow Coffee Journal',
    verified: true,
    rating: 5,
    date: 'October 11, 2026',
    title: 'Holds brewing temperature exceptionally well',
    content:
      'Dense stoneware walls keep my pour-over brew warm for over 35 minutes. No metallic aftertaste, clean drinking lip geometry, and subtle tone-on-tone stag emblem.',
    variant: 'Standard (350 ml) • Bone White',
  },
  {
    id: 'rev-m4',
    author: 'Aria Patel',
    role: 'Interior Stylist',
    verified: true,
    rating: 4,
    date: 'September 29, 2026',
    title: 'Minimalist desk sculpture as much as a mug',
    content:
      'Beautiful proportions that look striking on open studio shelving. Packaged in completely recyclable molded paper pulp with zero plastic tape.',
    variant: 'Studio Grande (450 ml) • Raw Terracotta',
  },
];

// 3. Kids Organic Cotton Reviews
const KIDS_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-k1',
    author: 'Meera Kapur',
    role: 'Mother of two & Pediatric Nurse',
    verified: true,
    rating: 5,
    date: 'October 22, 2026',
    title: 'Zero scratchy tags — gentle on eczema-prone skin',
    content:
      'My 4-year-old usually complains about neck tags and seam friction. The flatlock stitching and screenprinted interior label on this tee are completely irritation-free. Ultra-soft combed cotton.',
    variant: '4-5Y (104-110cm) • Royal Blue',
  },
  {
    id: 'rev-k2',
    author: 'David Chen',
    role: 'Architect & Father',
    verified: true,
    rating: 5,
    date: 'October 16, 2026',
    title: 'Survived 20 wash cycles without shrinking',
    content:
      'Kids clothes often warp after a few tumble dries, but the pre-shrunk organic jersey holds its square shape and neckline stretch. The jumping stag graphic hasn’t cracked at all.',
    variant: '6-7Y (116-122cm) • Royal Blue',
  },
  {
    id: 'rev-k3',
    author: 'Priya Sharma',
    role: 'Sustainable Living Advocate',
    verified: true,
    rating: 5,
    date: 'October 12, 2026',
    title: 'GOTS organic certified reassurance',
    content:
      'Knowing that zero toxic azo dyes or formaldehyde were used gives immense peace of mind. Generous room to crawl, run, and play without restrictive armholes.',
    variant: '2-3Y (92-98cm) • Sage Mist',
  },
  {
    id: 'rev-k4',
    author: 'Liam O’Connor',
    role: 'Product Designer',
    verified: true,
    rating: 5,
    date: 'October 03, 2026',
    title: 'Vibrant royal blue and wonderful drape',
    content:
      'The shade is rich without feeling neon. Easy over-the-head stretch neckline means zero morning dressing meltdowns. Will definitely order the next size up when he grows.',
    variant: '4-5Y (104-110cm) • Bone White',
  },
];


// Exact Figma Pairs Well With Datasets (Figma Node 354:24651 FINAL PDP)
const APPAREL_PAIRS_ITEMS = [
  {
    id: 'pairs-apparel-1',
    title: 'Everyday Heavy Tee',
    priceText: '$80 · 4 colours',
    image: '/images/pdp-figma/pairs/apparel-heavy-tee.png',
  },
  {
    id: 'pairs-apparel-2',
    title: 'Pleated Wide Trouser',
    priceText: '$220 · 3 colours',
    image: '/images/pdp-figma/pairs/apparel-wide-trouser.png',
  },
  {
    id: 'pairs-apparel-3',
    title: 'Norsbro Crew Neck',
    priceText: '$250 · 3 colours',
    image: '/images/pdp-figma/pairs/apparel-crewneck.png',
  },
  {
    id: 'pairs-apparel-4',
    title: 'Sadie Jeans Sheets',
    priceText: '$250 · 2 colours',
    image: '/images/pdp-figma/pairs/apparel-jeans-sheets.png',
  },
];

const MUG_PAIRS_ITEMS = [
  {
    id: 'pairs-mug-1',
    title: 'Tumbler Bottle, 20 oz',
    priceText: 'from ₹1,199',
    image: '/images/pdp-figma/pairs/living-tumbler-bottle.png',
  },
  {
    id: 'pairs-mug-2',
    title: 'Steel Water Bottle',
    priceText: 'from ₹699',
    image: '/images/pdp-figma/pairs/living-steel-bottle.png',
  },
  {
    id: 'pairs-mug-3',
    title: 'Coasters',
    priceText: 'from ₹199',
    image: '/images/pdp-figma/pairs/living-coasters.png',
  },
  {
    id: 'pairs-mug-4',
    title: 'Sipper Bottle',
    priceText: 'from ₹699',
    image: '/images/pdp-figma/pairs/living-sipper-bottle.png',
  },
];

const KIDS_PAIRS_ITEMS = [
  {
    id: 'pairs-kids-1',
    title: 'Kids Hoodie',
    priceText: 'from ₹899',
    image: '/images/pdp-figma/pairs/kids-kids-hoodie.png',
  },
  {
    id: 'pairs-kids-2',
    title: 'Rompers',
    priceText: 'from ₹299',
    image: '/images/pdp-figma/pairs/kids-rompers.png',
  },
  {
    id: 'pairs-kids-3',
    title: 'Kids AOP Sweatshirt',
    priceText: 'from ₹899',
    image: '/images/pdp-figma/pairs/kids-kids-sweatshirt.png',
  },
  {
    id: 'pairs-kids-4',
    title: 'Kids AOP Sports Shorts',
    priceText: 'from ₹799',
    image: '/images/pdp-figma/pairs/kids-kids-shorts.png',
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { getProductBySlug, products } = useStore();

  const product = getProductBySlug(resolvedParams.slug);

  // Maintain active color selection synchronized with gallery
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );

  // Accordion state for product details
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');


  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-store-canvas">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-heading font-medium uppercase tracking-wide text-store-text-primary">
            Piece Not Found
          </h1>
          <p className="text-sm text-store-text-secondary mt-2">
            The requested piece could not be located in our active catalog.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-store-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
            >
              Browse All Pieces
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 1. Template Classification
  const isKids =
    product.category === 'kids' ||
    product.slug.includes('kids') ||
    Boolean(product.sizes?.some((s) => s.size.includes('Y')));

  const isMug =
    product.slug.includes('mug') ||
    product.slug.includes('cup') ||
    (product.category === 'accessories' &&
      Boolean(product.sizes?.some((s) => s.size.includes('ml'))));

  const templateType: 'shirt' | 'mug' | 'kids' = isKids ? 'kids' : isMug ? 'mug' : 'shirt';

  // 2. Reviews dataset based on category
  const activeReviews =
    templateType === 'kids'
      ? KIDS_REVIEWS
      : templateType === 'mug'
      ? MUG_REVIEWS
      : SHIRT_REVIEWS;

  const ratingScore = templateType === 'shirt' ? '4.6' : '4.8';
  const reviewsCount =
    templateType === 'kids' ? '86' : templateType === 'mug' ? '94' : '128';

  // 3. Related "Pairs Well With" items (4 cards matching Figma)
  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .filter((p) => {
      if (templateType === 'kids') {
        return p.category === 'kids' || p.slug.includes('kids') || true;
      }
      if (templateType === 'mug') {
        return p.category === 'accessories' || p.slug.includes('tote') || true;
      }
      return p.category === 'hoodies' || p.category === 'tees' || p.category === 'pants';
    })
    .slice(0, 4);

  const activeColor = selectedColor || (product.colors && product.colors[0]);

  const discountPercent =
    product.compareAtPriceINR && product.compareAtPriceINR > product.priceINR
      ? Math.round(
          ((product.compareAtPriceINR - product.priceINR) / product.compareAtPriceINR) * 100
        )
      : null;

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        {/* Breadcrumb Trail */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Catalog', href: '/shop' },
              {
                label:
                  templateType === 'kids'
                    ? 'Kids Atelier'
                    : templateType === 'mug'
                    ? 'Utilitarian Objects'
                    : 'Apparel',
                href: `/shop?category=${product.category}`,
              },
              { label: product.title },
            ]}
          />
        </div>

        {/* ======================================================== */}
        {/* 1. HERO SECTION: Left Gallery (7 cols) + Right Buy Box (5 cols) */}
        {/* Matching Figma Node 354:24651 FINAL PDP Layout Invariant */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Quad Photo Gallery (7 cols on lg) */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              title={product.title}
              videoUrl={product.videoUrl}
              selectedColorValue={activeColor?.value}
            />
          </div>

          {/* Right Column: Sticky Purchase Rail (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-store-muted block mb-2">
                {templateType === 'kids'
                  ? 'The Unplugged Wear • Little Atelier Kids'
                  : templateType === 'mug'
                  ? 'The Unplugged Wear • Living & Utilitarian Objects'
                  : 'The Unplugged Wear • Atelier Drop'}
              </span>

              <div className="flex items-center gap-2 mb-2.5">
                {product.isNew && <Badge variant="dark">New Arrival</Badge>}
                {product.sustainabilityBadge && (
                  <Badge variant="outline">{product.sustainabilityBadge}</Badge>
                )}
                <span className="text-xs uppercase tracking-wider text-store-muted font-semibold">
                  SKU: {product.id.toUpperCase()}-POD
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-medium uppercase tracking-wide text-store-text-primary">
                {product.title}
              </h1>
              <p className="text-sm font-medium text-store-text-secondary mt-1">
                {product.subtitle}
              </p>

              {/* Atelier Rating Badge */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex text-store-gold text-xs tracking-tight">
                  ★★★★★
                </div>
                <a
                  href="#reviews"
                  className="text-xs text-store-text-secondary font-medium hover:text-store-charcoal hover:underline transition-colors"
                >
                  {ratingScore} ({reviewsCount} Verified{' '}
                  {templateType === 'kids'
                    ? 'Parent'
                    : templateType === 'mug'
                    ? 'Studio'
                    : 'Atelier'}{' '}
                  Reviews)
                </a>
              </div>

              {/* Price display */}
              <div className="flex flex-wrap items-baseline gap-3 mt-4">
                <span className="text-2xl sm:text-3xl font-bold text-store-text-primary">
                  ₹{product.priceINR.toLocaleString()}
                </span>
                {product.compareAtPriceINR && (
                  <span className="text-base text-store-muted line-through">
                    ₹{product.compareAtPriceINR.toLocaleString()}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs font-bold text-store-terracotta bg-store-terracotta/10 px-2.5 py-0.5 rounded-full">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
              <span className="text-xs text-emerald-700 font-medium block mt-1.5">
                Inclusive of all taxes & doorstep delivery eligibility
              </span>
            </div>

            {/* Narrative description */}
            <p className="text-sm text-store-text-secondary leading-relaxed">
              {product.description}
            </p>

            {/* Interactive Variant Selector (Color, Size/Capacity, Radio Groups, Qty, Add to Bag) */}
            <div className="pt-2 border-t border-store-card-border">
              <VariantSelector
                product={product}
                selectedColor={activeColor}
                onColorChange={setSelectedColor}
              />
            </div>

            {/* Product Accordion Disclosures */}
            <div className="pt-4 border-t border-store-card-border space-y-2">
              {/* Accordion 1: Details */}
              <div className="border border-store-card-border rounded-xl bg-store-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('details')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold uppercase tracking-wider text-store-text-primary cursor-pointer hover:bg-store-cream transition-colors"
                >
                  <span>
                    {templateType === 'mug'
                      ? 'Object Details & Craft'
                      : templateType === 'kids'
                      ? 'Garment Details & Anti-Chafe Fit'
                      : 'Product Details & Cut'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'details' ? 'rotate-180 text-store-charcoal' : 'text-store-muted'
                    }`}
                  />
                </button>
                {openAccordion === 'details' && (
                  <div className="p-4 pt-0 text-xs text-store-text-secondary leading-relaxed border-t border-store-card-border bg-store-cream/40">
                    <ul className="space-y-1.5 list-disc list-inside mt-2">
                      {product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 2: Material & Safety */}
              <div className="border border-store-card-border rounded-xl bg-store-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('material')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold uppercase tracking-wider text-store-text-primary cursor-pointer hover:bg-store-cream transition-colors"
                >
                  <span>
                    {templateType === 'mug'
                      ? 'Stoneware Clay & Glaze Safety'
                      : templateType === 'kids'
                      ? '100% GOTS Certified Cotton'
                      : 'Composition & Fabric Weight'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'material' ? 'rotate-180 text-store-charcoal' : 'text-store-muted'
                    }`}
                  />
                </button>
                {openAccordion === 'material' && (
                  <div className="p-4 pt-0 text-xs text-store-text-secondary leading-relaxed border-t border-store-card-border bg-store-cream/40">
                    <p className="mt-2 font-medium text-store-text-primary">
                      {product.composition}
                    </p>
                    <p className="mt-1">
                      {templateType === 'mug'
                        ? 'High-density vitrified ceramic with non-toxic, lead-free mineral glaze formulation safe for high microwave heat.'
                        : templateType === 'kids'
                        ? 'Spun from long-staple organic fibers with zero harsh chemical pesticides or toxic fixation salts. Safe for direct skin contact.'
                        : 'Milled from high-density organic combed cotton with pre-shrunk treatment to maintain silhouette after laundering.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Care Guide */}
              <div className="border border-store-card-border rounded-xl bg-store-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold uppercase tracking-wider text-store-text-primary cursor-pointer hover:bg-store-cream transition-colors"
                >
                  <span>
                    {templateType === 'mug' ? 'Care & Dishwasher Instructions' : 'Laundering & Care Guide'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'care' ? 'rotate-180 text-store-charcoal' : 'text-store-muted'
                    }`}
                  />
                </button>
                {openAccordion === 'care' && (
                  <div className="p-4 pt-0 text-xs text-store-text-secondary leading-relaxed border-t border-store-card-border bg-store-cream/40">
                    <ul className="space-y-1.5 list-disc list-inside mt-2">
                      {product.careInstructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 4: Delivery & Returns */}
              <div className="border border-store-card-border rounded-xl bg-store-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold uppercase tracking-wider text-store-text-primary cursor-pointer hover:bg-store-cream transition-colors"
                >
                  <span>
                    {templateType === 'mug'
                      ? 'Fragile Packaging & Transit'
                      : 'Doorstep Delivery & Exchanges'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'shipping' ? 'rotate-180 text-store-charcoal' : 'text-store-muted'
                    }`}
                  />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="p-4 pt-0 text-xs text-store-text-secondary leading-relaxed border-t border-store-card-border bg-store-cream/40 space-y-1.5">
                    <p className="mt-2">
                      {templateType === 'mug'
                        ? 'Dispatched in reinforced molded pulp buffers with 100% zero-breakage transit guarantee.'
                        : 'Dispatched directly from regional distribution hubs with live SMS & tracking.'}
                    </p>
                    <p>
                      {templateType === 'kids'
                        ? '14-Day seamless size exchanges collected directly from your doorstep if child outgrows.'
                        : 'Hassle-free 14-day doorstep reverse collection across India.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. DYNAMIC SPECIFICATION / MEASUREMENT / TEXTURE TABLE */}
        {/* User Invariant: If specTable is null, the entire section is omitted */}
        {/* ======================================================== */}
        {product.specTable && (
          <section className="my-16 pt-8 border-t border-store-card-border">
            <DynamicDataTable table={product.specTable} />
          </section>
        )}

        {/* ======================================================== */}
        {/* 3. REUSABLE CUSTOMER REVIEWS & RATINGS BREAKDOWN */}
        {/* ======================================================== */}
        <ProductReviews
          reviews={activeReviews}
          ratingScore={ratingScore}
          reviewsCount={reviewsCount}
          title={
            templateType === 'kids'
              ? 'Parent Reviews & Growth Feedback'
              : templateType === 'mug'
              ? 'Studio & Tableware Feedback'
              : 'Customer Reviews & Atelier Feedback'
          }
          eyebrow="Verified Customer Experiences"
          productTitle={product.title}
        />

        {/* ======================================================== */}
        {/* 4. REUSABLE EDITORIAL QUOTE (Figma Node 197:17347) */}
        {/* ======================================================== */}
        <EditorialQuote
          quote="Don’t let anyone tell you that you have to be a certain way. Be unique, be what you feel like being. Life is too short to be perfect."
          author="— Emma Nika"
          iconSrc="/images/editorial/quote-icon.svg"
        />

        {/* ======================================================== */}
        {/* 5. REUSABLE 'PAIRS WELL WITH' (Figma Recommendation Row) */}
        {/* ======================================================== */}
        <RelatedProductsSection
          pairsItems={
            templateType === 'kids'
              ? KIDS_PAIRS_ITEMS
              : templateType === 'mug'
              ? MUG_PAIRS_ITEMS
              : APPAREL_PAIRS_ITEMS
          }
          title="Pairs well with"
          catalogLink="/shop"
          catalogLabel="SHOP ALL"
        />

        {/* ======================================================== */}
        {/* 6. REUSABLE SPLIT FEATURE STORY (Figma Node 197:17352) */}
        {/* ======================================================== */}
        <EditorialFeatureSplit
          title="Products made with love."
          eyebrow="Atelier Craftsmanship"
          description="Every garment and utilitarian piece is designed with mindful intention and tailored in zero-deadstock ateliers. We eliminate surplus manufacturing by producing solely on-demand with uncompromised organic textiles."
          imageSrc="/images/editorial/products-made-with-love.png"
        />

        {/* ======================================================== */}
        {/* 7. DYNAMIC FREQUENTLY ASKED QUESTIONS */}
        {/* ======================================================== */}
        {product.faqs && product.faqs.length > 0 && (
          <DynamicAccordionFaq
            faqs={product.faqs}
            eyebrow="Atelier Specifications"
            title="Frequently Asked Questions"
            description="Clear transparency on how our slow-living garments and studio objects are milled, crafted, and delivered to your doorstep."
          />
        )}

        {/* ======================================================== */}
        {/* 6. FULL-BLEED OUTDOOR LIFESTYLE BANNER */}
        {/* ======================================================== */}
        <section className="relative my-16 rounded-3xl overflow-hidden bg-store-deep-teal text-white min-h-72 flex items-center justify-center text-center p-8 sm:p-14 shadow-xs">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-store-gold font-semibold block">
              The Unplugged Wear • Slow Living Luxury
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-medium uppercase tracking-wide text-white">
              Crafted for Quiet Permanence
            </h2>
            <p className="text-sm text-white/80 leading-relaxed max-w-lg mx-auto">
              Objects and garments made to outlast fast-fashion cycles. Dense natural fibers, lead-free ceramics, and purposeful daily design.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-store-charcoal font-bold text-xs uppercase tracking-wider hover:bg-store-cream transition-all active:scale-95 shadow-xs"
              >
                <span>Explore The Collection</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
