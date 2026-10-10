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
}: DropdownMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anim = usePopoverAnimation(menuOpen, () => setMenuOpen(false));

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={anim.visible}>
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
              position: 'absolute',
              top: '100%',
              marginTop: 8,
              ...(align === 'right' ? { right: 0 } : { left: 0 }),
              zIndex: 50,
              minWidth: 180,
              padding: 6,
              borderRadius: 'var(--tuw-radius-card, 12px)',
              border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
              backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
              boxShadow: '0 12px 32px rgba(23, 28, 51, 0.16), 0 2px 6px rgba(23, 28, 51, 0.08)',
              animation:
                anim.phase === 'closing'
                  ? 'popoverOut 0.15s ease-in'
                  : 'popoverIn 0.18s ease-out',
            }}
          >
            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelect(item.value);
                  setMenuOpen(false);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = item.danger
                    ? 'var(--tuw-bg-error, #FEF4F4)'
                    : 'var(--tuw-bg-canvas, #F7F8F9)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--font-main)',
                  color: item.danger
                    ? 'var(--tuw-text-error, #C91818)'
                    : 'var(--tuw-text-primary, #262626)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.1s ease',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
