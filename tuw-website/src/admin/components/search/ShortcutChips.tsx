'use client';

import React from 'react';
import type { SearchPrefix } from './types';

interface ShortcutChipsProps {
  prefixes: readonly SearchPrefix[] | SearchPrefix[];
  onPick: (token: string) => void;
}

// Prefix scope chips (S4): one config entry per scope, rendered by map.
// Clicking a chip seeds the query with its token; the parser scopes results.
export function ShortcutChips({ prefixes, onPick }: ShortcutChipsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '10px 16px',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        fontSize: '11px',
        fontFamily: 'var(--font-main)',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', letterSpacing: '0.04em' }}>
        SHORTCUTS:
      </span>
      {prefixes.map((p) => (
        <button
          key={p.token}
          type="button"
          title={p.hint}
          onClick={() => onPick(`${p.token} `)}
          style={{
            backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
            border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-main)',
            color: 'var(--tuw-action-primary, #7539FF)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--tuw-action-primary, #7539FF)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--tuw-border-subtle, #E5E7EB)')}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
