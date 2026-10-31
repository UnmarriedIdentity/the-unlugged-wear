'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/commerce/ProductGrid';
import FilterBar, { FilterState } from '@/components/commerce/FilterBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useStore } from '@/mocks/store';
import { ShieldCheck, Sparkles, Truck } from 'lucide-react';
import Link from 'next/link';

const availableCategories = [
  { value: '', label: 'View all' },
  { value: 'tees', label: 'T-shirts' },
  { value: 'hoodies', label: 'Hoodies & sweats' },
  { value: 'pants', label: 'Joggers' },
  { value: 'kids', label: 'Kids' },
  { value: 'accessories', label: 'Accessories' },
];

// Header navigation lands on /shop?category=men|women; these filter by who a
// piece is cut for rather than by garment type.
const audienceLabels: Record<string, string> = { men: 'Men', women: 'Women' };

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  // Mega-menu links combine who and what, e.g. ?audience=men&category=hoodies
  const audienceParam = searchParams.get('audience') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  const { products } = useStore();

  const [filters, setFilters] = useState<FilterState>({
    category: categoryParam,
    size: '',
    color: '',
    sort: sortParam,
    price: '',
  });

  // Keep the category in step with the URL, including navigating back to /shop.
  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: categoryParam }));
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (audienceParam === 'men' || audienceParam === 'women') {
      result = result.filter((p) => p.audience?.includes(audienceParam));
    }

    // Filter by category
    if (filters.category) {
      if (filters.category === 'men' || filters.category === 'women') {
        const audience = filters.category;
        result = result.filter((p) => p.audience?.includes(audience));
      } else if (filters.category === 'kids') {
        result = result.filter(
          (p) => p.category === 'kids' || Boolean(p.audience?.includes('kids'))
        );
      } else {
        result = result.filter((p) => p.category === filters.category);
      }
    }

    // Filter by size
    if (filters.size) {
      result = result.filter((p) =>
        p.sizes.some((s) => s.size === filters.size && s.inStock)
      );
    }

    // Filter by color (supports multi-selection or matching values)
    if (filters.color) {
      const selectedColorValues = filters.color
        .toLowerCase()
        .split(',')
        .filter(Boolean);
      result = result.filter((p) =>
        p.colors.some((c) => {
          const val = c.value.toLowerCase();
          const name = c.name.toLowerCase();
          return selectedColorValues.some(
            (sc) =>
              val.includes(sc) ||
              name.includes(sc) ||
              sc.includes(val) ||
              sc.includes(name) ||
              (sc === 'black' && (val.includes('black') || val.includes('carbon'))) ||
              (sc === 'white' && (val.includes('white') || val.includes('bone') || val.includes('ecru'))) ||
              (sc === 'navy-blue' && (val.includes('navy') || val.includes('blue') || val.includes('slate'))) ||
              (sc === 'grey-melange' && (val.includes('grey') || val.includes('melange') || val.includes('slate'))) ||
              (sc === 'bottle-green' && (val.includes('green') || val.includes('olive'))) ||
              (sc === 'maroon' && (val.includes('maroon') || val.includes('burgundy'))) ||
              (sc === 'red' && (val.includes('red') || val.includes('maroon')))
          );
        })
      );
    }

    // Filter by price
    if (filters.price) {
      if (filters.price === 'under-1500') {
        result = result.filter((p) => p.priceINR < 1500);
      } else if (filters.price === '1500-3000') {
        result = result.filter((p) => p.priceINR >= 1500 && p.priceINR <= 3000);
      } else if (filters.price === '3000-5000') {
        result = result.filter((p) => p.priceINR > 3000 && p.priceINR <= 5000);
      } else if (filters.price === 'above-5000') {
        result = result.filter((p) => p.priceINR > 5000);
      }
    }

    // Sort
    if (filters.sort === 'price-low') {
      result.sort((a, b) => a.priceINR - b.priceINR);
    } else if (filters.sort === 'price-high') {
      result.sort((a, b) => b.priceINR - a.priceINR);
    } else if (filters.sort === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [products, filters, audienceParam]);

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. TOP ANNOUNCEMENT BANNER (< Discover the Acid Wash >)  */}
      {/* ======================================================== */}
      <div className="w-full bg-store-cream/70 border-b border-store-card-border/60 py-2.5 px-4 text-center">
        <div className="flex items-center justify-center text-xs tracking-wider text-store-charcoal font-medium">
          <Link
            href="/search?q=acid%20wash"
            className="inline-flex items-center min-h-6 hover:underline transition-all"
          >
            Discover the Acid Wash Collection
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-12">
        {/* ======================================================== */}
        {/* 2. SHOP HEADER: breadcrumb, then title + item count       */}
        {/* ======================================================== */}
        <div className="mb-5 sm:mb-6 space-y-2">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop' },
            ]}
          />
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-medium tracking-tight text-store-charcoal">
              {[
                audienceLabels[audienceParam],
                filters.category
                  ? audienceLabels[filters.category] ||
                    availableCategories.find((c) => c.value === filters.category)?.label ||
                    'Catalog'
                  : audienceParam
                  ? ''
                  : 'New In',
              ]
                .filter(Boolean)
                .join(' · ')}
            </h1>
            <span className="text-sm text-store-text-secondary tuw-tabular-nums" aria-live="polite">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. CATEGORY PILLS & FILTER BAR                           */}
        {/* ======================================================== */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          resultCount={filteredProducts.length}
          availableCategories={availableCategories}
          products={products}
        />

        {/* ======================================================== */}
        {/* 4. PRODUCT GRID                                          */}
        {/* ======================================================== */}
        <div className="pt-6">
          <h2 className="sr-only">Products</h2>
          <ProductGrid
            products={filteredProducts}
            onResetFilters={() =>
              setFilters({ category: '', size: '', color: '', sort: 'featured', price: '' })
            }
          />
        </div>

        {/* ======================================================== */}
        {/* 5. FIGMA TRUST PILLARS RIBBON                            */}
        {/* ======================================================== */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-store-card-border/80 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                01. Zero Deadstock POD
              </h3>
              <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                Every piece is printed only after you order it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                02. Made in Tiruppur
              </h3>
              <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                Printed and dispatched by our print partner in Tiruppur, India.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                03. Doorstep Delivery
              </h3>
              <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                Transparent chronological transit tracking powered by Delhivery Surface Express.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-sm text-store-muted">Loading catalog...</div>}>
          <ShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
