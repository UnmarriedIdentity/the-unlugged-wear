'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RANGE_PRESETS, type PresetKey } from '@/hooks/useCalendarRange';

interface PresetListProps {
  active: PresetKey | 'custom' | null;
  onSelect: (key: PresetKey) => void;
}

/**
 * Preset rail: Today / Yesterday / Last 7-90 days + Custom date indicator.
 */
export default function PresetList({ active, onSelect }: PresetListProps) {
  return (
    <div className="flex w-40 shrink-0 flex-col gap-1" role="listbox" aria-label="Date presets">
      {RANGE_PRESETS.map((p) => {
        const isActive = active === p.key;
        return (
          <button
            key={p.key}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(p.key)}
            className={cn(
              'flex h-10 items-center rounded-xl px-4 text-left text-[15px] transition-colors duration-150 cursor-pointer',
              isActive ? 'bg-selected font-semibold text-action-primary' : 'font-normal text-primary hover:bg-canvas'
            )}
          >
            {p.label}
          </button>
        );
      })}
      <div
        role="option"
        aria-selected={active === 'custom'}
        className={cn(
          'flex h-10 items-center justify-between rounded-xl px-4 text-[15px] transition-colors duration-150',
          active === 'custom' ? 'bg-selected font-semibold text-action-primary' : 'font-normal text-secondary'
        )}
      >
        <span>Custom date</span>
        {active === 'custom' && <Check size={16} strokeWidth={2.5} />}
      </div>
    </div>
  );
}
