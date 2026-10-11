'use client';

import React, { useState } from 'react';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';

export interface DropdownMenuItem {
  value: string;
  label: string;
  /** Destructive actions render in error ink (Cancel / Refund). */
  danger?: boolean;
}

export interface DropdownMenuProps {
  /** Caller-owned trigger (e.g. a small Button with a chevron), rendered verbatim. */
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  onSelect: (value: string) => void;
  ariaLabel?: string;
  /** Menu alignment relative to the trigger. */
  align?: 'left' | 'right';
  /**
   * Open direction. 'down' drops below the trigger (default — Mark-as).
   * 'up' rises above it (pagination Rows, which sits at the page bottom).
   */
  direction?: 'down' | 'up';
  /**
   * Value-picker mode (e.g. page-size): the matching item renders the
   * FilterMenu selected treatment (selected wash + primary ink + 600) with
   * menuitemradio semantics. Omitted for pure action menus (Mark-as).
   */
  selectedValue?: string;
}

// Shared action menu (DM1): dumb, props-fed, mock/live agnostic. Follows the
// FilterMenu popover contract (overlay closer, stopPropagation, popoverIn/Out,
// reduced-motion instant) but with action semantics — no value state, the menu
// closes on every selection. Lives in ui/ so any page can attach it.
export default function DropdownMenu({
  trigger,
  items,
  onSelect,
  ariaLabel = 'Actions',
  align = 'left',
  selectedValue,
  direction = 'down',
}: DropdownMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anim = usePopoverAnimation(menuOpen, () => setMenuOpen(false));
  const opensUp = direction === 'up';
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = React.useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    vw: number;
    vh: number;
  } | null>(null);

  const toggle = () => {
    if (!menuOpen && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setAnchor({
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    }
    setMenuOpen((v) => !v);
  };

  // Fixed menus can't ride scrolling — close on any scroll/resize while open.
  React.useEffect(() => {
    if (!anim.visible) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anim.visible]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={toggle} aria-haspopup="menu" aria-expanded={anim.visible}>
        {trigger}
      </span>
      {anim.visible && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, cursor: 'default' }}
          />
          <div
            role="menu"
            aria-label={ariaLabel}
            onClick={(e) => e.stopPropagation()}
            style={{
              // Fixed (not absolute): escapes overflow containers so the menu
              // is never clipped and always paints above page content.
              position: 'fixed',
              ...(anchor
                ? opensUp
                  ? {
                      bottom: Math.max(8, anchor.vh - anchor.top + 8),
                      ...(align === 'right'
                        ? { right: Math.max(8, anchor.vw - anchor.right) }
                        : { left: anchor.left }),
                    }
                  : {
                      top: anchor.bottom + 8,
                      ...(align === 'right'
                        ? { right: Math.max(8, anchor.vw - anchor.right) }
                        : { left: anchor.left }),
                    }
                : { visibility: 'hidden' as const }),
              zIndex: 50,
              minWidth: 180,
              maxHeight: 'min(320px, calc(100vh - 32px))',
              overflowY: 'auto',
              padding: 6,
              borderRadius: 'var(--tuw-radius-card, 12px)',
              border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
              backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
              boxShadow: '0 12px 32px rgba(23, 28, 51, 0.16), 0 2px 6px rgba(23, 28, 51, 0.08)',
              willChange: 'opacity, transform',
              transform: 'translateZ(0)',
              animation:
                anim.phase === 'closing'
                  ? opensUp
                    ? 'popoverOutUp 0.15s ease-in both'
                    : 'popoverOut 0.15s ease-in both'
                  : opensUp
                    ? 'popoverInUp 0.18s ease-out both'
                    : 'popoverIn 0.18s ease-out both',
            }}
          >
            {items.map((item) => {
              const selected = selectedValue !== undefined && item.value === selectedValue;
              const restingBg = selected
                ? 'var(--tuw-bg-selected, #F8F5FF)'
                : 'transparent';
              return (
              <button
                key={item.value}
                type="button"
                role={selectedValue !== undefined ? 'menuitemradio' : 'menuitem'}
                aria-checked={selectedValue !== undefined ? selected : undefined}
                onClick={() => {
                  onSelect(item.value);
                  setMenuOpen(false);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = selected
                    ? restingBg
                    : item.danger
                      ? 'var(--tuw-bg-error, #FEF4F4)'
                      : 'var(--tuw-bg-canvas, #F7F8F9)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = restingBg)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: restingBg,
                  fontSize: 13,
                  fontWeight: selected ? 600 : 500,
                  fontFamily: 'var(--font-main)',
                  color: selected
                    ? 'var(--tuw-action-primary, #7539FF)'
                    : item.danger
                      ? 'var(--tuw-text-error, #C91818)'
                      : 'var(--tuw-text-primary, #262626)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.1s ease',
                }}
              >
                {item.label}
              </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
