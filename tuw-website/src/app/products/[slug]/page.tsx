'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Badge from '@storefront/components/ui/Badge';
import ProductGallery from '@storefront/components/commerce/ProductGallery';
import VariantSelector from '@storefront/components/commerce/VariantSelector';
import DynamicDataTable from '@storefront/components/commerce/DynamicDataTable';
import DynamicAccordionFaq from '@storefront/components/commerce/DynamicAccordionFaq';
import RelatedProductsSection from '@storefront/components/commerce/RelatedProductsSection';
import { EditorialFeatureSplit } from '@storefront/components/editorial';
import { useStore } from '@storefront/mocks/store';
import type { Product, ProductColor, ProductSpecTable, ProductType } from '@storefront/lib/types';
import {
  CATEGORY_LABELS,
  RETURN_WINDOW_DAYS,
  deliveryEstimate,
  isWearable,
  productTypeOf,
  relatedProductsFor,
  variantLabelOf,
} from '@storefront/lib/product';
import { formatShortDate } from '@storefront/lib/format';
import { ArrowRight, ChevronDown, MapPin, MessageSquare } from 'lucide-react';

// Accordion headings per product family; wearables share one set.
const SECTION_TITLES: Record<'details' | 'material' | 'care' | 'delivery', (type: ProductType) => string> = {
  details: () => 'Details',
  material: (type) => (isWearable(type) ? 'Fabric & weight' : 'Material'),
  care: () => 'Care',
  delivery: () => 'Delivery & returns',
};

// Spec table for products that don't carry a hand-written one.
function specTableFor(product: Product, type: ProductType): ProductSpecTable {
  const rows: Record<string, string>[] = [
    { spec: 'Product', value: CATEGORY_LABELS[product.category] },
    {
      spec: `${variantLabelOf(product)}s`,
      value: product.sizes.map((s) => s.size).join(', ') || 'One size',
    },
    { spec: 'Colours', value: product.colors.map((c) => c.name).join(', ') || '—' },
  ];
  if (product.weightGrams) rows.push({ spec: 'Approximate weight', value: `${product.weightGrams} g` });
  if (product.printAreas?.length) rows.push({ spec: 'Print areas', value: product.printAreas.join(', ') });
  rows.push({ spec: 'Made', value: 'Printed after you order by our print partner in India' });
  rows.push({ spec: isWearable(type) ? 'Fabric composition' : 'Material', value: 'To be confirmed (draft)' });
  if (product.taxRatePercent) rows.push({ spec: 'GST', value: `${product.taxRatePercent}% (included in price)` });
  if (product.hsnCode) rows.push({ spec: 'HSN code', value: product.hsnCode });
  return {
    title: 'Specifications',
    description: 'From our print partner’s base-product sheet.',
    columns: [
      { key: 'spec', label: 'Specification', align: 'left' },
      { key: 'value', label: 'Detail', align: 'left' },
    ],
    rows,
  };
}

function AccordionItem({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-store-card-border">
      <h3>
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="w-full py-4 text-left flex items-center justify-between text-sm font-medium text-store-charcoal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
        >
          {title}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'text-store-text-secondary'}`}
          />
        </button>
      </h3>
      {isOpen && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="pb-4 text-sm text-store-text-secondary leading-relaxed"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DeliveryCheck() {
  const [pin, setPin] = useState('');
  const [checkedPin, setCheckedPin] = useState<string | null>(null);
  const estimate = checkedPin ? deliveryEstimate(checkedPin) : null;

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setCheckedPin(pin.trim());
        }}
      >
        <label htmlFor="pdp-pin" className="sr-only">
          Delivery PIN code
        </label>
        <div className="relative flex-1">
          <MapPin size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-store-text-secondary" />
          <input
            id="pdp-pin"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter PIN code for delivery date"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full h-11 pl-9 pr-3 border border-store-input-border bg-store-surface text-sm text-store-charcoal placeholder:text-store-text-secondary focus:outline-none focus:border-store-charcoal"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-5 border border-store-charcoal text-store-charcoal text-xs font-medium uppercase tracking-wider hover:bg-store-charcoal hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
        >
          Check
        </button>
      </form>
      <p className="text-sm text-store-text-secondary" aria-live="polite">
        {checkedPin === null
          ? null
          : estimate
          ? `Delivery to ${checkedPin} by ${formatShortDate(estimate.earliest)} – ${formatShortDate(estimate.latest)} (demo estimate).`
          : 'Please enter a valid 6-digit PIN code.'}
      </p>
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { getProductBySlug, products } = useStore();
  const product = getProductBySlug(resolvedParams.slug);

  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [openSection, setOpenSection] = useState<string | null>('details');

  // Phone buy bar appears once the main add-to-bag button scrolls out of view.
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const update = () => {
      const target = document.getElementById('purchase-actions');
      setShowStickyBar(Boolean(target && target.getBoundingClientRect().bottom < 0));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const related = useMemo(
    () => (product ? relatedProductsFor(product, products) : []),
    [product, products]
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-store-canvas">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-heading font-medium text-store-text-primary">Product not found</h1>
          <p className="text-sm text-store-text-secondary mt-2">This piece isn’t in our catalogue any more.</p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-store-charcoal text-white text-xs font-medium uppercase tracking-wider hover:bg-black transition-colors"
            >
              Browse the shop
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const type = productTypeOf(product);
  const wearable = isWearable(type);
  const categoryLabel = CATEGORY_LABELS[product.category];
  const activeColor = selectedColor || product.colors[0];
  const specTable = product.specTable ?? specTableFor(product, type);
  const toggle = (name: string) => setOpenSection(openSection === name ? null : name);

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 pb-28 lg:pb-10">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: categoryLabel, href: `/shop?category=${product.category}` },
              { label: product.title },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              title={product.title}
              videoUrl={product.videoUrl}
              selectedColorValue={activeColor?.value}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <div>
              <p className="text-xs uppercase tracking-wider text-store-text-secondary mb-3">
                <Link href={`/shop?category=${product.category}`} className="hover:text-store-charcoal">
                  {categoryLabel}
                </Link>
              </p>
              <h1 className="font-heading text-[clamp(1.75rem,2.5vw+1rem,2.5rem)] font-medium tracking-tight text-store-charcoal leading-tight">
                {product.title}
              </h1>
              <p className="text-sm text-store-text-secondary mt-1.5">{product.subtitle}</p>
              {product.sustainabilityBadge && (
                <div className="mt-3">
                  <Badge variant="outline">{product.sustainabilityBadge}</Badge>
                </div>
              )}

              <div className="flex flex-wrap items-baseline gap-3 mt-5">
                <span className="text-2xl font-medium text-store-charcoal tuw-tabular-nums">
                  ₹{product.priceINR.toLocaleString('en-IN')}
                </span>
                {product.compareAtPriceINR && product.compareAtPriceINR > product.priceINR && (
                  <span className="text-base text-store-text-secondary line-through tuw-tabular-nums">
                    ₹{product.compareAtPriceINR.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-xs text-store-text-secondary mt-1.5">
                Inclusive of all taxes{product.taxRatePercent ? ` (GST ${product.taxRatePercent}%)` : ''}
                {product.priceIsDraft ? ' · Draft price, to be confirmed' : ''}
              </p>
            </div>

            <p className="text-sm text-store-text-secondary leading-relaxed">{product.description}</p>

            <div className="pt-5 border-t border-store-card-border">
              <VariantSelector product={product} selectedColor={activeColor} onColorChange={setSelectedColor} />
            </div>

            <DeliveryCheck />

            <div className="border-t border-store-card-border">
              <AccordionItem id="pdp-details" title={SECTION_TITLES.details(type)} isOpen={openSection === 'details'} onToggle={() => toggle('details')}>
                <ul className="space-y-1.5 list-disc list-inside">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </AccordionItem>
              <AccordionItem id="pdp-material" title={SECTION_TITLES.material(type)} isOpen={openSection === 'material'} onToggle={() => toggle('material')}>
                <p className="text-store-charcoal">{product.composition}</p>
                {product.weightGrams && <p className="mt-1">Approximate weight: {product.weightGrams} g.</p>}
              </AccordionItem>
              <AccordionItem id="pdp-care" title={SECTION_TITLES.care(type)} isOpen={openSection === 'care'} onToggle={() => toggle('care')}>
                <ul className="space-y-1.5 list-disc list-inside">
                  {product.careInstructions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </AccordionItem>
              <AccordionItem id="pdp-delivery" title={SECTION_TITLES.delivery(type)} isOpen={openSection === 'delivery'} onToggle={() => toggle('delivery')}>
                <p>Printed in 2–3 business days after you order, then shipped with tracking across India.</p>
                <p className="mt-1.5">
                  {wearable
                    ? `Return or exchange unworn pieces with tags within ${RETURN_WINDOW_DAYS} days of delivery. `
                    : 'Printed objects are replaced if they arrive damaged or misprinted (draft policy). '}
                  <Link href="/policies/returns" className="underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal text-store-charcoal">
                    Returns policy
                  </Link>
                </p>
              </AccordionItem>
            </div>
          </div>
        </div>

        <section className="my-16 pt-8 border-t border-store-card-border">
          <DynamicDataTable table={specTable} />
        </section>

        {/* No fabricated ratings: reviews appear only once real, verified orders exist. */}
        <section id="reviews" aria-labelledby="reviews-heading" className="my-16 pt-8 border-t border-store-card-border">
          <h2 id="reviews-heading" className="font-heading text-2xl font-medium text-store-charcoal">
            Reviews
          </h2>
          <div className="mt-6 p-8 border border-store-card-border bg-store-surface flex flex-col sm:flex-row sm:items-center gap-4">
            <MessageSquare size={24} className="text-store-text-secondary shrink-0" aria-hidden="true" />
            <p className="text-sm text-store-text-secondary">
              No reviews yet. Reviews from verified orders will appear here once live ordering opens.
            </p>
          </div>
        </section>

        {related.length > 0 && (
          <RelatedProductsSection
            products={related}
            title="Pairs well with"
            catalogLink={`/shop?category=${product.category}`}
            catalogLabel={`More ${categoryLabel}`}
          />
        )}

        <EditorialFeatureSplit
          title="Printed when you order."
          eyebrow="How it’s made"
          description="Nothing is printed ahead of time. Your piece is made after you order by our print partner in India, so there’s no unsold stock waiting in a warehouse."
          imageSrc="/images/editorial/products-made-with-love.png"
        />

        {product.faqs && product.faqs.length > 0 && (
          <DynamicAccordionFaq
            faqs={product.faqs}
            eyebrow="Questions"
            title="Frequently asked questions"
            description="How this piece is printed, sized and delivered."
          />
        )}

        <section className="relative my-16 overflow-hidden bg-store-deep-teal text-white min-h-64 flex items-center justify-center text-center p-8 sm:p-14">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-heading font-medium text-white">Explore the collection</h2>
            <p className="text-sm text-white/80 leading-relaxed max-w-lg mx-auto">
              Hoodies, tees and everyday objects, each printed with the leaping deer after you order.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-store-charcoal font-medium text-xs uppercase tracking-wider hover:bg-store-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
              >
                Shop all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Phone buy bar: price + jump back to the purchase options */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-store-surface border-t border-store-card-border px-4 py-3 flex items-center gap-3 transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-store-charcoal truncate">{product.title}</p>
          <p className="text-sm text-store-text-secondary tuw-tabular-nums">₹{product.priceINR.toLocaleString('en-IN')}</p>
        </div>
        <button
          type="button"
          tabIndex={showStickyBar ? 0 : -1}
          onClick={() =>
            document.getElementById('purchase-actions')?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'center',
            })
          }
          className="h-11 px-5 rounded-full bg-[#111111] text-white text-xs font-medium uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
        >
          Choose {variantLabelOf(product).toLowerCase()} & add
        </button>
      </div>

      <Footer />
    </div>
  );
}
