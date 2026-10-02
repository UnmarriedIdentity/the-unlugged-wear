'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/commerce/ProductGrid';
import FilterBar, { FilterState } from '@/components/commerce/FilterBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useStore } from '@/mocks/store';

const availableCategories = [
  { value: '', label: 'All Garments' },
  { value: 'hoodies', label: 'French Terry Hoodies' },
  { value: 'tees', label: 'Combed Tees' },
  { value: 'pants', label: 'Pleated Pants' },
  { value: 'accessories', label: 'Utilitarian Bags & Caps' },
];

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const availableColors = [
  { value: 'vintage-black', name: 'Vintage Black', hex: '#1C1C1E' },
  { value: 'bone-white', name: 'Bone White', hex: '#F3EFE6' },
  { value: 'washed-slate', name: 'Washed Slate', hex: '#4A5568' },
  { value: 'slate-olive', name: 'Slate Olive', hex: '#4A5340' },
  { value: 'raw-sand', name: 'Raw Sand', hex: '#D7CDBE' },
  { value: 'raw-ecru', name: 'Raw Ecru', hex: '#EAE5D9' },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  const { products } = useStore();

  const [filters, setFilters] = useState<FilterState>({
    category: categoryParam,
    size: '',
    color: '',
    sort: sortParam,
  });

  useEffect(() => {
    if (categoryParam) {
      setFilters((prev) => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // Filter by size
    if (filters.size) {
      result = result.filter((p) =>
        p.sizes.some((s) => s.size === filters.size && s.inStock)
      );
    }

    // Filter by color
    if (filters.color) {
      result = result.filter((p) =>
        p.colors.some((c) => c.value === filters.color)
      );
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
  }, [products, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop Catalog' },
          ]}
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A] mt-2">
          {filters.category
            ? availableCategories.find((c) => c.value === filters.category)?.label || 'Apparel'
            : 'All Apparel'}
        </h1>
        <p className="text-sm text-[#666] mt-1 max-w-xl">
          Constructed with unbrushed organic loops, pre-shrunk heavyweight jersey, and intentional drop silhouettes.
        </p>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredProducts.length}
        availableCategories={availableCategories}
        availableSizes={availableSizes}
        availableColors={availableColors}
      />

      <div className="pt-8">
        <ProductGrid
          products={filteredProducts}
          onResetFilters={() =>
            setFilters({ category: '', size: '', color: '', sort: 'featured' })
          }
        />
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-sm">Loading catalog...</div>}>
          <ShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
