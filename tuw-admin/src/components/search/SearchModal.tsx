'use client';

import React from 'react';
import { X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { localSearch } from './localSearch';
import { getPopularTargets } from './localSearch';
import { parseScopedQuery } from './types';
import { ShortcutChips } from './ShortcutChips';
import { SpotlightRow } from './SpotlightRow';
import { useFrequentQueries } from './useFrequentQueries';
import { SEARCH_PREFIXES, type ResultSection, type SpotlightResult } from './types';
import type { CustomerItem, OrderItem, ProductItem, ShipmentItem } from '@/mocks/fixtures';

interface SearchModalProps {
  orders: OrderItem[];
  products: ProductItem[];
  customers: CustomerItem[];
  shipments: ShipmentItem[];
  onNavigate: (href: string) => void;
  onClose: () => void;
}

// Island spotlight modal (S5): pill input row (dot + Ctrl+K badge + X),
// prefix shortcut chips, sectioned tile rows with Jump pills. Query state
// lives here; results come from the search adapter (local store today,
// database tomorrow). Overlay + entrance motion untouched.
export function SearchModal({ orders, products, customers, shipments, onNavigate, onClose }: SearchModalProps) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const sections: ResultSection[] = React.useMemo(
    () => localSearch({ orders, products, customers, shipments }, query),
    [orders, products, customers, shipments, query],
  );
  const frequent = useFrequentQueries();
  const popular = React.useMemo(() => getPopularTargets(), []);
  const showingHome = query.trim() === '';
  const matchTerm = parseScopedQuery(query).term;
  const hasFrequent = frequent.topQueries.length > 0 || frequent.frequentJumps.length > 0;

  // Shared section heading: sticky over the scroll list with surface blur.
  const sectionTitle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--tuw-text-secondary, #5D6772)',
    padding: '4px 12px 6px',
    position: 'sticky',
    top: -12,
    backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
    zIndex: 1,
  };

  const handleJump = (result: SpotlightResult) => {
    frequent.record(query, result);
    onNavigate(result.href);
    onClose();
  };

  // Arrow-key navigation across result rows (S6): moves DOM focus so the
  // focus-visible wash marks the active row; Enter jumps. Escape is
  // handled by the global header shortcut.
  const handleResultsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    const root = resultsRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLButtonElement>('.spotlightRow'));
    if (rows.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const at = rows.findIndex((el) => el === active);
    if (e.key === 'Enter') {
      if (at >= 0) {
        e.preventDefault();
        rows[at].click();
      }
      return;
    }
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (at + 1) % rows.length : (at - 1 + rows.length) % rows.length;
    rows[next].focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight search"
      onKeyDown={handleResultsKeyDown}
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        borderRadius: 'var(--tuw-radius-modal-lg, 24px)',
        width: '640px',
        maxWidth: '100%',
        maxHeight: '80vh',
        boxShadow: 'var(--shadow-spotlight)',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-main)',
        animation: 'commandSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 16px 16px 20px',
                  borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                  transition: 'border-color 0.15s ease',
                }}
                className="spot-inputrow"
              >
        <span
          aria-hidden="true"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: 'var(--tuw-action-primary, #7539FF)',
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Spotlight Jump: Search orders, jump anywhere..."
          aria-label="Spotlight search"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--tuw-text-primary, #262626)',
            fontFamily: 'var(--font-main)',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-main)',
            color: 'var(--tuw-text-secondary, #5D6772)',
            backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
            border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
            borderRadius: '6px',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          Ctrl+K
        </span>
        <button
          type="button"
          onClick={() => (query ? setQuery('') : onClose())}
          title={query ? 'Clear search' : 'Close (ESC)'}
          aria-label={query ? 'Clear search' : 'Close search'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--tuw-text-secondary, #5D6772)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <ShortcutChips prefixes={SEARCH_PREFIXES} onPick={(token) => setQuery(token)} />

      <div ref={resultsRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {showingHome ? (
          <>
            {hasFrequent ? (
              <>
                {frequent.topQueries.length > 0 && (
                  <div>
                  <div style={sectionTitle}>
                    Frequent Searches
                  </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 12px' }}>
                      {frequent.topQueries.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuery(q)}
                          style={{
                            backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
                            border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                            borderRadius: '9999px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'var(--font-main)',
                            color: 'var(--tuw-text-primary, #262626)',
                            cursor: 'pointer',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {frequent.frequentJumps.length > 0 && (
                  <div>
                  <div style={sectionTitle}>
                    Jump Back To
                  </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {frequent.frequentJumps.map((jump) => (
                        <SpotlightRow key={jump.id} result={jump} onJump={handleJump} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={sectionTitle}>
                  Jump To
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {popular.map((item) => (
                    <SpotlightRow key={item.id} result={item} onJump={handleJump} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : sections.length === 0 ? (
          <EmptyState
            title="No matches found"
            description={
              query.trim()
                ? `Nothing matches "${query.trim()}". Try a prefix like #orders or @customer.`
                : 'Type to search orders, products, customers, and shipments.'
            }
          />
        ) : (
          sections.map((section) => (
            <div key={section.key}>
              <div style={sectionTitle}>
                {section.title} · {section.items.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.items.map((item) => (
                  <SpotlightRow key={item.id} result={item} onJump={handleJump} highlight={matchTerm} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 20px',
          borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)',
          backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
          fontSize: '12px',
          color: 'var(--tuw-text-secondary, #5D6772)',
          fontFamily: 'var(--font-main)',
        }}
      >
        {[
          { k: '↑↓', label: 'navigate' },
          { k: 'Enter', label: 'jump' },
          { k: 'ESC', label: 'close' },
        ].map((hint) => (
          <span key={hint.k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <kbd
              style={{
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-main)',
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                borderRadius: '4px',
                padding: '1px 6px',
              }}
            >
              {hint.k}
            </kbd>
            {hint.label}
          </span>
        ))}
      </div>
    </div>
  );
}
