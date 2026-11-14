'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin } from 'lucide-react';
import Badge from '@storefront/components/ui/Badge';
import ProductGallery from '@storefront/components/commerce/ProductGallery';
import VariantSelector from '@storefront/components/commerce/VariantSelector';
import type { Product, ProductColor, ProductType } from '@storefront/lib/types';
import {
  categoryLabel,
  RETURN_WINDOW_DAYS,
  deliveryEstimate,
  isWearable,
  productTypeOf,
  variantLabelOf,
  priceLabel,
} from '@storefront/lib/product';
import { formatShortDate } from '@storefront/lib/format';

// The product page's one interactive island: gallery, summary, variant picker,
// delivery check, detail accordions and the phone buy bar. They share the
// selected colourway (the gallery follows the swatch) and the accordion state,
// so they belong together. It renders from the cached product; live stock
// arrives separately through lib/live-stock.
const SECTION_TITLES: Record<'details' | 'material' | 'care' | 'delivery', (type: ProductType) => string> = {
  details: () => 'Details',
  material: (type) => (isWearable(type) ? 'Fabric & weight' : 'Material'),
  care: () => 'Care',
  delivery: () => 'Delivery & returns',
};

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

export default function ProductShowcase({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
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

  const type = productTypeOf(product);
  const wearable = isWearable(type);
  const categoryName = categoryLabel(product.category);
  const activeColor = selectedColor || product.colors[0];
  const toggle = (name: string) => setOpenSection(openSection === name ? null : name);

  return (
    <>
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
                {categoryName}
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
                {priceLabel(product)}
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

      {/* Phone buy bar: price + jump back to the purchase options */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-store-surface border-t border-store-card-border px-4 py-3 flex items-center gap-3 transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-store-charcoal truncate">{product.title}</p>
          <p className="text-sm text-store-text-secondary tuw-tabular-nums">{priceLabel(product)}</p>
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
    </>
  );
}
