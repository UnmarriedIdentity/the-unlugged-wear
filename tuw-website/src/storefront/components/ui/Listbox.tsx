'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ListboxOption {
  value: string;
  label: string;
  /** Optional colour swatch shown before the label. */
  swatch?: string;
  disabled?: boolean;
  /** Small trailing note, e.g. "Sold out". */
  note?: string;
}

export interface ListboxProps {
  label: string;
  /** Show the label inside the trigger (e.g. "Size  M"); otherwise it is screen-reader only. */
  showLabel?: boolean;
  value: string;
  options: ListboxOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Storefront dropdown (replaces the browser's native select menu).
 * Keyboard: Enter/Space/↓ opens, ↑↓ move, Home/End jump, Enter selects, Esc closes.
 */
export default function Listbox({ label, showLabel = false, value, options, onChange, className = '' }: ListboxProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const single = options.length < 2;

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    listRef.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, options, value]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const move = (step: number) => {
    let next = active;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActive(next);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); buttonRef.current?.focus(); }
  };

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={showLabel ? undefined : `${label}: ${selected?.label}`}
        disabled={single}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
        }}
        className="inline-flex items-center gap-2 h-8 pl-2.5 pr-2 border border-store-card-border bg-store-surface text-xs text-store-charcoal hover:border-store-charcoal transition-colors cursor-pointer disabled:cursor-default disabled:hover:border-store-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
      >
        {showLabel && <span className="text-store-text-secondary">{label}</span>}
        {selected?.swatch && (
          <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border border-store-card-border shrink-0" style={{ backgroundColor: selected.swatch }} />
        )}
        <span className="font-medium whitespace-nowrap">{selected?.label}</span>
        {!single && (
          <ChevronDown size={14} aria-hidden="true" className={`text-store-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
          className="absolute left-0 top-full mt-1 z-30 min-w-full w-max max-h-64 overflow-y-auto py-1 bg-store-surface border border-store-card-border shadow-lg tuw-mega-in focus:outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer select-none ${
                  option.disabled ? 'text-store-text-secondary/60 cursor-not-allowed' : 'text-store-charcoal'
                } ${index === active && !option.disabled ? 'bg-store-cream' : ''}`}
              >
                {option.swatch && (
                  <span aria-hidden="true" className="w-4 h-4 rounded-full border border-store-card-border shrink-0" style={{ backgroundColor: option.swatch }} />
                )}
                <span className={`flex-1 whitespace-nowrap ${isSelected ? 'font-medium' : ''} ${option.disabled ? 'line-through' : ''}`}>
                  {option.label}
                </span>
                {option.note && <span className="text-xs text-store-text-secondary">{option.note}</span>}
                <Check size={14} aria-hidden="true" className={isSelected ? 'text-store-charcoal' : 'invisible'} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
