'use client';

import React from 'react';
import { ProductRadioGroup } from '@/lib/types';

export interface RadioOptionSelectorProps {
  group: ProductRadioGroup;
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  className?: string;
}

export default function RadioOptionSelector({
  group,
  selectedValue,
  onSelect,
  className = '',
}: RadioOptionSelectorProps) {
  // Data-driven conditional guard: omit entirely if group has no options
  if (!group || !group.options || group.options.length === 0) {
    return null;
  }

  const activeValue = selectedValue || group.defaultValue || group.options[0]?.id;

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-store-text-secondary block">
          {group.label}
        </span>
        {group.description && (
          <p className="text-xs text-store-muted mt-0.5">{group.description}</p>
        )}
      </div>

      <div
        className="flex flex-col gap-2.5"
        role="radiogroup"
        aria-label={group.label}
      >
        {group.options.map((option) => {
          const isSelected = activeValue === option.id;

          return (
            <label
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onSelect(option.id);
                }
              }}
              onClick={() => onSelect(option.id)}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-store-charcoal bg-store-cream/70 shadow-xs ring-1 ring-store-charcoal/20'
                  : 'border-store-card-border bg-store-surface hover:border-store-charcoal/40 hover:bg-store-canvas'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Radio Circle */}
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-store-charcoal bg-store-charcoal'
                      : 'border-store-card-border bg-store-surface'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-store-text-primary">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-store-charcoal text-white tracking-wide">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-store-text-secondary leading-relaxed">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Price Delta Pill */}
              {option.priceDeltaINR !== undefined && option.priceDeltaINR > 0 && (
                <span className="text-xs font-bold text-store-action-primary bg-store-cream px-2 py-1 rounded-lg shrink-0 border border-store-card-border">
                  +₹{option.priceDeltaINR.toLocaleString()}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

