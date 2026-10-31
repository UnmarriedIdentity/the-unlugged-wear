'use client';

import React from 'react';
import { Ruler, Check, AlertCircle } from 'lucide-react';
import { ProductSize } from '@/lib/types';

export interface VariantPillSelectorProps {
  sizes?: ProductSize[];
  selectedSize?: ProductSize | null;
  onSelect: (size: ProductSize) => void;
  label?: string;
  onSizeGuideClick?: () => void;
  sizeGuideLabel?: string;
  columns?: 2 | 3 | 4 | 5 | 6 | 'auto';
  validationError?: string | null;
  className?: string;
}

export default function VariantPillSelector({
  sizes,
  selectedSize,
  onSelect,
  label = 'Size:',
  onSizeGuideClick,
  sizeGuideLabel = 'Size Guide',
  columns = 'auto',
  validationError,
  className = '',
}: VariantPillSelectorProps) {
  // Data-driven conditional guard: omit entirely if no sizes/capacities declared
  if (!sizes || sizes.length === 0) {
    return null;
  }

  // Resolve grid class
  let gridClass = 'grid gap-2';
  if (columns === 2) {
    gridClass = 'grid grid-cols-2 gap-3';
  } else if (columns === 3) {
    gridClass = 'grid grid-cols-3 gap-2';
  } else if (columns === 4) {
    gridClass = 'grid grid-cols-2 sm:grid-cols-4 gap-2';
  } else if (columns === 5) {
    gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2';
  } else if (columns === 6) {
    gridClass = 'grid grid-cols-6 gap-2';
  } else {
    // Auto resolution based on item count and text length
    const hasLongText = sizes.some((s) => s.size.length > 5);
    if (sizes.length <= 2) {
      gridClass = 'grid grid-cols-2 gap-3';
    } else if (hasLongText || sizes.length === 5) {
      gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2';
    } else if (sizes.length <= 4) {
      gridClass = 'grid grid-cols-2 sm:grid-cols-4 gap-2';
    } else {
      gridClass = 'grid grid-cols-6 gap-2';
    }
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
        <span className="text-store-text-secondary">
          {label}{' '}
          <strong className="text-store-text-primary font-bold">
            {selectedSize ? selectedSize.size : 'Select option'}
          </strong>
        </span>

        {onSizeGuideClick && (
          <button
            type="button"
            onClick={onSizeGuideClick}
            className="flex items-center gap-1.5 text-xs font-medium text-store-action-primary hover:text-store-gold transition-colors cursor-pointer lowercase first-letter:uppercase"
          >
            <Ruler size={13} />
            <span>{sizeGuideLabel}</span>
          </button>
        )}
      </div>

      <div className={gridClass} role="radiogroup" aria-label={label}>
        {sizes.map((s) => {
          const isSelected = selectedSize?.size === s.size;
          const isLong = s.size.length > 4;

          return (
            <button
              key={s.size}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!s.inStock}
              onClick={() => onSelect(s)}
              className={`${
                isLong ? 'h-12 px-3 py-1.5' : 'h-11'
              } rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center justify-center cursor-pointer border ${
                !s.inStock
                  ? 'opacity-40 cursor-not-allowed bg-store-canvas border-store-card-border line-through text-store-muted'
                  : isSelected
                  ? 'border-store-charcoal bg-store-charcoal text-white shadow-xs'
                  : 'border-store-card-border bg-store-surface text-store-text-primary hover:border-store-charcoal'
              }`}
            >
              <span className="text-center truncate w-full">{s.size}</span>
            </button>
          );
        })}
      </div>

      {/* Stock allocation message */}
      {selectedSize && (
        <div className="mt-2 text-xs flex items-center gap-1.5">
          {selectedSize.inStock ? (
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <Check size={13} />
              Printed to order • usually dispatched within a few business days
            </span>
          ) : (
            <span className="text-red-700 font-medium flex items-center gap-1">
              <AlertCircle size={13} />
              Out of stock in {selectedSize.size}
            </span>
          )}
        </div>
      )}

      {/* Validation alert */}
      {validationError && (
        <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

