'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

export interface FilterMenuOption {
  value: string;
  label: string;
}

interface FilterMenuProps {
  options: readonly FilterMenuOption[] | FilterMenuOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

// Dumb dropdown: trigger shows the active label; menu lists every option.
// Data (options + value) flows in via props — mock or live, the menu
// does not care. Fluid: relative wrapper, absolute menu, no fixed widths.
export function FilterMenu({ options, value, onChange, ariaLabel = 'Filter options' }: FilterMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        className={styles.filterSelectBtn}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        <span>{active?.label ?? value}</span>
        <ChevronDown size={14} />
      </button>
      {menuOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div role="menu" className={`${styles.rangeMenu} absolute right-0 top-full z-50 mt-2`}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.value === value}
                className={option.value === value ? styles.rangeMenuItemSelected : styles.rangeMenuItem}
                onClick={() => {
                  onChange(option.value);
                  setMenuOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
