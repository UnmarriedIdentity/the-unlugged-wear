'use client';

import React, { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { SlidersHorizontal, X, Plus, Minus, Check } from 'lucide-react';
import Drawer from '../ui/Drawer';

export interface FilterState {
  category: string;
  size: string;
  color: string;
  sort: string;
  price?: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  resultCount: number;
  availableCategories: { value: string; label: string; count?: number }[];
  availableSizes?: string[];
  availableColors?: { value: string; name: string; hex: string; count?: number }[];
  /** Full catalog, used to show real match counts beside each filter option. */
  products?: Product[];
}

export const FIGMA_FILTER_COLORS = [
  { value: 'black', name: 'Black', hex: '#1A1A1A', count: 22 },
  { value: 'white', name: 'White', hex: '#FFFFFF', count: 10 },
  { value: 'navy-blue', name: 'Navy Blue', hex: '#1D2A44', count: 16 },
  { value: 'grey-melange', name: 'Grey Melange', hex: '#8A8A8E', count: 6 },
  { value: 'bottle-green', name: 'Bottle Green', hex: '#1A4329', count: 15 },
  { value: 'maroon', name: 'Maroon', hex: '#6A1A26', count: 15 },
  { value: 'red', name: 'Red', hex: '#C82333', count: 11 },
  { value: 'lavender', name: 'Lavender', hex: '#B8A9D9', count: 12 },
  { value: 'light-baby-pink', name: 'Light Baby Pink', hex: '#F3C5CD', count: 11 },
  { value: 'off-white', name: 'Off White', hex: '#EAE6DF', count: 4 },
];

export const FIGMA_SORT_OPTIONS = [
  { value: 'featured', label: 'Novelty' },
  { value: 'price-high', label: 'Highest to Lowest Price' },
  { value: 'price-low', label: 'Lowest to Highest Price' },
];

export const FIGMA_CATEGORIES = [
  { value: 'tees', label: 'T-shirts', count: 6 },
  { value: 'hoodies', label: 'Hoodies & sweats', count: 4 },
  { value: 'pants', label: 'Joggers', count: 3 },
  { value: 'kids', label: 'Kids', count: 2 },
  { value: 'accessories', label: 'Accessories', count: 4 },
];

export const FIGMA_PRICE_RANGES = [
  { value: 'under-1500', label: 'Under ₹1,500', count: 4 },
  { value: '1500-3000', label: '₹1,500 – ₹3,000', count: 12 },
  { value: '3000-5000', label: '₹3,000 – ₹5,000', count: 6 },
  { value: 'above-5000', label: 'Above ₹5,000', count: 2 },
];

export default function FilterBar({
  filters,
  onFilterChange,
  resultCount,
  availableCategories,
  products = [],
}: FilterBarProps) {
  // Real per-option counts from the catalog (the Figma mock's numbers were placeholders).
  const countByCategory = (value: string) =>
    products.filter((p) => (value === 'kids' ? p.category === 'kids' || Boolean(p.audience?.includes('kids')) : p.category === value)).length;
  const countByColour = (value: string) =>
    products.filter((p) => p.colors.some((c) => c.value === value)).length;
  const countByPrice = (value: string) =>
    products.filter((p) =>
      value === 'under-1500' ? p.priceINR < 1500
      : value === '1500-3000' ? p.priceINR >= 1500 && p.priceINR <= 3000
      : value === '3000-5000' ? p.priceINR > 3000 && p.priceINR <= 5000
      : p.priceINR > 5000
    ).length;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Accordion section states matching Figma screenshot (Sort: open, Category: closed, Colour: open, Price: closed)
  const [sectionsOpen, setSectionsOpen] = useState({
    sort: true,
    category: false,
    colour: true,
    price: false,
  });

  const toggleSection = (section: 'sort' | 'category' | 'colour' | 'price') => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Selected colors handling (supports comma-separated string)
  const selectedColors = useMemo(() => {
    return filters.color ? filters.color.split(',').filter(Boolean) : [];
  }, [filters.color]);

  const isColorSelected = (val: string) => selectedColors.includes(val);

  const handleToggleColor = (val: string) => {
    let next: string[];
    if (isColorSelected(val)) {
      next = selectedColors.filter((c) => c !== val);
    } else {
      next = [...selectedColors, val];
    }
    onFilterChange({ ...filters, color: next.join(',') });
  };

  const handleToggleCategory = (val: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === val ? '' : val,
    });
  };

  const handleTogglePrice = (val: string) => {
    onFilterChange({
      ...filters,
      price: filters.price === val ? '' : val,
    });
  };

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.size ? 1 : 0) +
    (selectedColors.length > 0 ? selectedColors.length : 0) +
    (filters.price ? 1 : 0) +
    (filters.sort && filters.sort !== 'featured' ? 1 : 0);

  const handleReset = () => {
    onFilterChange({
      category: '',
      size: '',
      color: '',
      sort: 'featured',
      price: '',
    });
  };

  const currentSortLabel =
    FIGMA_SORT_OPTIONS.find((s) => s.value === filters.sort)?.label || 'Novelty';

  // The drawer button always reports the real number of matches.
  const displayResultCount = resultCount;

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* ======================================================== */}
      {/* 1. ONE ROW: category pills (left, scroll on phones) +      */}
      {/*    Filter & Sort by (right)                               */}
      {/* ======================================================== */}
      <div className="flex items-center gap-4 border-b border-store-card-border/80 pb-4">
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar p-1 -m-1">
          {availableCategories.map((cat) => {
            const isActive = filters.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onFilterChange({ ...filters, category: cat.value })}
                aria-pressed={isActive}
                className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                  isActive
                    ? 'bg-primary-dark text-white shadow-xs'
                    : 'bg-white border border-store-card-border text-store-charcoal hover:border-store-charcoal'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filter & Sort trigger (the item count sits next to the page title) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-1 text-sm font-medium text-store-charcoal hover:text-black transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold rounded-full"
        >
          <span className="hidden sm:inline">Filter & Sort by</span>
          <span className="sm:hidden">Filter</span>
          <SlidersHorizontal size={14} aria-hidden="true" className="text-store-charcoal" />
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-store-charcoal text-white text-xs font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-store-muted">Active:</span>

          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-store-charcoal text-white text-xs font-medium">
              Category: {availableCategories.find((c) => c.value === filters.category)?.label || filters.category}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, category: '' })}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedColors.map((col) => {
            const colObj = FIGMA_FILTER_COLORS.find((c) => c.value === col);
            return (
              <span
                key={col}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-store-charcoal text-white text-xs font-medium"
              >
                Color: {colObj?.name || col}
                <button
                  type="button"
                  onClick={() => handleToggleColor(col)}
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {filters.price && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-store-charcoal text-white text-xs font-medium">
              Price: {FIGMA_PRICE_RANGES.find((p) => p.value === filters.price)?.label || filters.price}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, price: '' })}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.sort && filters.sort !== 'featured' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-store-charcoal text-white text-xs font-medium">
              Sort: {currentSortLabel}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, sort: 'featured' })}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-store-action-primary hover:text-store-charcoal hover:underline ml-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FIGMA FILTER & SORT BY SLIDE-OVER DRAWER              */}
      {/* (With Rolls-Royce Luxury Cascading Staggered Animation)  */}
      {/* ======================================================== */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Filter & Sort by"
        maxWidth="max-w-md"
        bodyClassName="p-0"
        footer={
          <div className="grid grid-cols-2 gap-3 p-5 sm:p-6 bg-white border-t border-store-card-border/70 tuw-reveal-item tuw-delay-12">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 px-4 rounded-full border border-store-charcoal text-store-charcoal bg-transparent hover:bg-store-cream text-xs font-semibold uppercase tracking-wider text-center transition-colors cursor-pointer"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full py-3.5 px-4 rounded-full bg-primary-dark text-white hover:bg-black text-xs font-semibold uppercase tracking-wider text-center transition-colors cursor-pointer"
            >
              Show {displayResultCount} {displayResultCount === 1 ? 'result' : 'results'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col">
          {/* SECTION 1: Sort by (Expanded with '-' in Figma) */}
          <div className="border-b border-store-card-border/70">
            <button
              type="button"
              onClick={() => toggleSection('sort')}
              className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-store-cream/40 transition-colors tuw-reveal-item tuw-delay-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-store-charcoal">Sort by</span>
                <span className="text-sm font-normal text-store-muted">{currentSortLabel}</span>
              </div>
              {sectionsOpen.sort ? (
                <Minus size={14} className="text-store-charcoal shrink-0" />
              ) : (
                <Plus size={14} className="text-store-charcoal shrink-0" />
              )}
            </button>

            {sectionsOpen.sort && (
              <div className="px-6 pb-5 pt-1 space-y-1">
                {FIGMA_SORT_OPTIONS.map((opt, idx) => {
                  const isSelected = filters.sort === opt.value;
                  const delayClass =
                    idx === 0
                      ? 'tuw-delay-3'
                      : idx === 1
                      ? 'tuw-delay-4'
                      : 'tuw-delay-5';

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onFilterChange({ ...filters, sort: opt.value })}
                      className={`flex items-center gap-3 w-full py-2.5 text-left cursor-pointer group tuw-reveal-item ${delayClass}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-store-charcoal'
                            : 'border-store-card-border group-hover:border-store-muted'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-store-charcoal" />
                        )}
                      </div>
                      <span className="text-xs text-store-charcoal font-normal select-none">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Category (Collapsed with '+' in Figma) */}
          <div className="border-b border-store-card-border/70">
            <button
              type="button"
              onClick={() => toggleSection('category')}
              className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-store-cream/40 transition-colors tuw-reveal-item tuw-delay-6"
            >
              <span className="text-sm font-medium text-store-charcoal">Category</span>
              {sectionsOpen.category ? (
                <Minus size={14} className="text-store-charcoal shrink-0" />
              ) : (
                <Plus size={14} className="text-store-charcoal shrink-0" />
              )}
            </button>

            {sectionsOpen.category && (
              <div className="px-6 pb-5 pt-1 space-y-1">
                {FIGMA_CATEGORIES.map((cat, idx) => {
                  const isChecked = filters.category === cat.value;
                  const delayClass =
                    idx === 0
                      ? 'tuw-delay-7'
                      : idx === 1
                      ? 'tuw-delay-8'
                      : 'tuw-delay-9';

                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleToggleCategory(cat.value)}
                      className={`flex items-center justify-between w-full py-2 text-left cursor-pointer group tuw-reveal-item ${delayClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-store-charcoal border-store-charcoal text-white'
                              : 'border-store-card-border bg-white group-hover:border-store-muted'
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-xs text-store-charcoal font-normal">
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-xs text-store-muted tabular-nums">
                        {countByCategory(cat.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: Colour (Expanded with '-' in Figma) */}
          <div className="border-b border-store-card-border/70">
            <button
              type="button"
              onClick={() => toggleSection('colour')}
              className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-store-cream/40 transition-colors tuw-reveal-item tuw-delay-7"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-store-charcoal">Colour</span>
                {selectedColors.length > 0 && (
                  <span className="text-sm font-normal text-store-charcoal">
                    ({selectedColors.length})
                  </span>
                )}
              </div>
              {sectionsOpen.colour ? (
                <Minus size={14} className="text-store-charcoal shrink-0" />
              ) : (
                <Plus size={14} className="text-store-charcoal shrink-0" />
              )}
            </button>

            {sectionsOpen.colour && (
              <div className="px-6 pb-5 pt-1 space-y-1">
                {FIGMA_FILTER_COLORS.map((col, idx) => {
                  const isChecked = isColorSelected(col.value);
                  const delayClass =
                    idx === 0
                      ? 'tuw-delay-8'
                      : idx === 1
                      ? 'tuw-delay-9'
                      : idx === 2
                      ? 'tuw-delay-10'
                      : idx === 3
                      ? 'tuw-delay-11'
                      : 'tuw-delay-12';

                  return (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => handleToggleColor(col.value)}
                      className={`flex items-center justify-between w-full py-2 text-left cursor-pointer group tuw-reveal-item ${delayClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-store-charcoal border-store-charcoal text-white'
                              : 'border-store-card-border bg-white group-hover:border-store-muted'
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-xs text-store-charcoal font-normal">
                          {col.name}
                        </span>
                      </div>
                      <span className="text-xs text-store-muted tabular-nums">
                        {countByColour(col.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: Price (Collapsed with '+' in Figma) */}
          <div className="border-b border-store-card-border/70">
            <button
              type="button"
              onClick={() => toggleSection('price')}
              className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-store-cream/40 transition-colors tuw-reveal-item tuw-delay-11"
            >
              <span className="text-sm font-medium text-store-charcoal">Price</span>
              {sectionsOpen.price ? (
                <Minus size={14} className="text-store-charcoal shrink-0" />
              ) : (
                <Plus size={14} className="text-store-charcoal shrink-0" />
              )}
            </button>

            {sectionsOpen.price && (
              <div className="px-6 pb-5 pt-1 space-y-1">
                {FIGMA_PRICE_RANGES.map((pr, idx) => {
                  const isChecked = filters.price === pr.value;
                  const delayClass = idx === 0 ? 'tuw-delay-11' : 'tuw-delay-12';

                  return (
                    <button
                      key={pr.value}
                      type="button"
                      onClick={() => handleTogglePrice(pr.value)}
                      className={`flex items-center justify-between w-full py-2 text-left cursor-pointer group tuw-reveal-item ${delayClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-store-charcoal border-store-charcoal text-white'
                              : 'border-store-card-border bg-white group-hover:border-store-muted'
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-xs text-store-charcoal font-normal">
                          {pr.label}
                        </span>
                      </div>
                      <span className="text-xs text-store-muted tabular-nums">
                        {countByPrice(pr.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
