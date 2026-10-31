'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SurfaceCard from './SurfaceCard';
import type { SurfaceCardProps } from './SurfaceCard';

export type DrawerCardTone = 'neutral' | 'selected' | 'warning';

export interface DrawerCardProps
  extends Omit<SurfaceCardProps, 'children' | 'title' | 'padding' | 'gap' | 'onToggle'> {
  /** Numbered card heading, e.g. "1. Basic Information". */
  title: React.ReactNode;
  /** Short explanation of what belongs in this card. */
  description?: React.ReactNode;
  /** Optional status/count shown opposite the heading. */
  badge?: React.ReactNode;
  /** Optional action shown opposite the heading. */
  action?: React.ReactNode;
  /** Semantic header emphasis. Neutral is the default; use colour only when meaningful. */
  tone?: DrawerCardTone;
  /** Vertical rhythm between fields inside the card body. */
  bodyGap?: number;
  /** Makes the header a disclosure button and lets the body collapse. */
  collapsible?: boolean;
  /** Initial open state for an uncontrolled collapsible card. Default false. */
  defaultOpen?: boolean;
  /** Controlled open state. When provided, onToggle is required to change it. */
  isOpen?: boolean;
  /** Notified when a collapsible header is activated. */
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
}

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--tuw-type-heading-card-size, 18px)',
  lineHeight: 'var(--tuw-type-heading-card-line-height, 26px)',
  fontWeight: 'var(--tuw-type-heading-card-weight, 600)',
  color: 'var(--tuw-text-primary, #262626)',
  fontFamily: 'var(--font-main)',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 'var(--tuw-type-body-default-size, 14px)',
  lineHeight: 'var(--tuw-type-body-default-line-height, 22px)',
  fontWeight: 400,
  color: 'var(--tuw-text-secondary, #5D6772)',
  fontFamily: 'var(--font-main)',
};

const rightClusterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 'var(--tuw-radius-pill, 9999px)',
  flexShrink: 0,
  marginTop: 9,
};

// Product-editor card stack (PEDIT v2): a white surface on the drawer canvas,
// with a full-bleed header divider while expanded. The header owns the
// title/description and optional badge/action; the body owns field rhythm. No
// nested cards.
export default function DrawerCard({
  title,
  description,
  badge,
  action,
  tone = 'neutral',
  bodyGap = 14,
  collapsible = false,
  defaultOpen = false,
  isOpen,
  onToggle,
  style = {},
  children,
  ...props
}: DrawerCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [toggleFocused, setToggleFocused] = useState(false);
  const controlled = isOpen !== undefined;
  const open = collapsible ? (controlled ? isOpen : internalOpen) : true;
  const titleId = useId();
  const descriptionId = useId();
  const bodyId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    // Return focus to the header only when the card closes; opening keeps the
    // user on the toggle so they can tab into the revealed fields.
    if (wasOpen.current && !open) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const headerBg =
    tone === 'selected'
      ? 'var(--tuw-bg-selected, #F8F5FF)'
      : tone === 'warning'
        ? 'var(--tuw-bg-warning, #FEFBF5)'
        : 'var(--tuw-bg-surface, #FFFFFF)';
  const dotColor =
    tone === 'warning'
      ? 'var(--tuw-text-warning, #856300)'
      : 'var(--tuw-action-primary, #7539FF)';

  const handleToggle = () => {
    if (!collapsible) return;
    const next = !open;
    if (!controlled) setInternalOpen(next);
    onToggle?.(next);
  };

  const body = (
    <div
      style={
        {
          display: 'flex',
          flexDirection: 'column',
          gap: bodyGap,
          minWidth: 0,
          padding: 16,
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          animation: collapsible && open ? 'popoverIn 0.18s ease-out both' : undefined,
          // Card-scoped field-label context: Input, FormSelect, SearchableSelect
          // and FormTextarea inherit 14/600 without per-call props. The 24px
          // row keeps a hinted field aligned with its paired field. Outside
          // a DrawerCard each primitive keeps its existing legacy fallback.
          '--tuw-field-label-size': 'var(--tuw-type-label-control-size, 14px)',
          '--tuw-field-label-weight': '600',
          '--tuw-field-label-row-height': '24px',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );

  return (
    <SurfaceCard
      padding="0"
      gap="0"
      {...props}
      style={{ overflow: 'hidden', boxShadow: 'none', ...style }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: 16,
          backgroundColor: headerBg,
          borderBottom:
            collapsible && !open
              ? 'none'
              : '1px solid var(--tuw-border-subtle, #E9E9E9)',
        }}
      >
        {collapsible ? (
          <h4 style={{ margin: 0, flex: 1, minWidth: 0 }}>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              onClick={handleToggle}
              onFocus={() => setToggleFocused(true)}
              onBlur={() => setToggleFocused(false)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                minWidth: 0,
                padding: 0,
                border: 'none',
                borderRadius: 6,
                backgroundColor: 'transparent',
                color: 'inherit',
                fontFamily: 'var(--font-main)',
                textAlign: 'left',
                outline: 'none',
                boxShadow: toggleFocused
                  ? '0 0 0 3px rgba(117, 57, 255, 0.12)'
                  : 'none',
                transition: 'box-shadow 0.15s ease',
              }}
            >
              {tone !== 'neutral' ? (
                <span
                  aria-hidden="true"
                  style={{ ...dotStyle, backgroundColor: dotColor }}
                />
              ) : null}
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span id={titleId} style={titleStyle}>
                  {title}
                </span>
                {description ? (
                  <span id={descriptionId} style={{ ...descriptionStyle, display: 'block' }}>
                    {description}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  transform: open ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.18s ease',
                }}
              />
            </button>
          </h4>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
            {tone !== 'neutral' ? (
              <span
                aria-hidden="true"
                style={{ ...dotStyle, backgroundColor: dotColor }}
              />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <h4 style={{ margin: 0, ...titleStyle }}>{title}</h4>
              {description ? (
                <p style={{ margin: '4px 0 0', ...descriptionStyle }}>{description}</p>
              ) : null}
            </div>
          </div>
        )}
        {badge || action ? (
          <div style={rightClusterStyle}>
            {badge}
            {action}
          </div>
        ) : null}
      </div>
      {collapsible ? (
        <div id={bodyId} role="region" aria-labelledby={titleId} hidden={!open}>
          {open ? body : null}
        </div>
      ) : (
        body
      )}
    </SurfaceCard>
  );
}
