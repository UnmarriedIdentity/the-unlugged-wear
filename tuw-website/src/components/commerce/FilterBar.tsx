'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';

export interface FilterState {
  category: string;
  size: string;
  color: string;
  sort: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  resultCount: number;
  availableCategories: { value: string; label: string }[];
  availableSizes: string[];
  availableColors: { value: string; name: string; hex: string }[];
}

export default function FilterBar({
  filters,
  onFilterChange,
  resultCount,
  availableCategories,
  availableSizes,
  availableColors,
}: FilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFiltersCount =
    (filters.category ? 1 : 0) + (filters.size ? 1 : 0) + (filters.color ? 1 : 0);

  const handleReset = () => {
    onFilterChange({
      category: '',
      size: '',
      color: '',
      sort: 'featured',
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-[#E2DDCF]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Desktop Category Pills */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          {availableCategories.map((cat) => {
            const isActive = filters.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onFilterChange({ ...filters, category: cat.value })}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet Filter Button */}
        <div className="lg:hidden flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            icon={<SlidersHorizontal size={14} />}
          >
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>

        {/* Right: Result Count & Sort Selector */}
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-xs text-[#8A8A8A] font-medium hidden sm:inline-block">
            Showing <strong className="text-[#1A1A1A]">{resultCount}</strong> garments
          </span>

          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
              className="h-9 pl-3 pr-8 rounded-full border border-[#E2DDCF] bg-white text-xs font-semibold tracking-wide appearance-none outline-none cursor-pointer focus:border-[#1A1A1A]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A8A]"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <span className="text-xs text-[#8A8A8A]">Active filters:</span>

          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-xs font-medium">
              Category: {availableCategories.find((c) => c.value === filters.category)?.label || filters.category}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, category: '' })}
                className="hover:opacity-75"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.size && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-xs font-medium">
              Size: {filters.size}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, size: '' })}
                className="hover:opacity-75"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.color && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-xs font-medium">
              Color: {availableColors.find((c) => c.value === filters.color)?.name || filters.color}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, color: '' })}
                className="hover:opacity-75"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-[#7539FF] hover:underline ml-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Responsive Filter Drawer for mobile/tablet */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Refine Catalog"
        subtitle={`${resultCount} pieces available`}
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col h-full justify-between gap-6">
          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] block mb-2.5">
                Garment Category
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, category: cat.value })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.category === cat.value
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F4F1EA] text-[#1A1A1A]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] block mb-2.5">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filters, size: filters.size === s ? '' : s })
                    }
                    className={`w-10 h-10 rounded-lg text-xs font-semibold border transition-all ${
                      filters.size === s
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-[#E2DDCF] bg-white text-[#1A1A1A]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] block mb-2.5">
                Palette & Dye
              </label>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filters, color: filters.color === c.value ? '' : c.value })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      filters.color === c.value
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-[#E2DDCF] bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex gap-2 pt-4 border-t border-[#E2DDCF]">
            <Button variant="secondary" size="md" fullWidth onClick={handleReset}>
              Reset
            </Button>
            <Button
              variant="dark"
              size="md"
              fullWidth
              onClick={() => setIsDrawerOpen(false)}
            >
              Show {resultCount} Pieces
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
