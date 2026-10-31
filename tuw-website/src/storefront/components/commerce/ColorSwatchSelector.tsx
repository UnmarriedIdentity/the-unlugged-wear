'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ProductColor } from '@/lib/types';

export interface ColorSwatchSelectorProps {
  colors?: ProductColor[];
  selectedColor?: ProductColor;
  onSelect: (color: ProductColor) => void;
  label?: string;
  className?: string;
}

export default function ColorSwatchSelector({
  colors,
  selectedColor,
  onSelect,
  label = 'Dye / Shade:',
  className = '',
}: ColorSwatchSelectorProps) {
  // Data-driven conditional guard: omit entirely if no colors provided
  if (!colors || colors.length === 0) {
    return null;
  }

  const active = selectedColor || colors[0];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
        <span className="text-store-text-secondary">
          {label}{' '}
          <strong className="text-store-text-primary font-bold">
            {active?.name}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-3" role="radiogroup" aria-label={label}>
        {colors.map((color) => {
          const isSelected = active?.value === color.value;
          const isLight =
            color.value === 'bone-white' ||
            color.value === 'raw-sand' ||
            color.value === 'raw-ecru' ||
            color.value === 'soft-heather';

          return (
            <button
              key={color.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(color)}
              aria-label={`Select shade ${color.name}`}
              className={`relative w-8 h-8 rounded-full border transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-store-charcoal ring-offset-2 scale-105 border-transparent'
                  : 'border-black/20 hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <Check
                  size={13}
                  className={`absolute inset-0 m-auto ${
                    isLight ? 'text-black' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

