'use client';

import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopoverAnimation } from '@admin/hooks/usePopoverAnimation';
import { computeTooltipPosition } from '@admin/lib/tooltipPosition';
import type { TooltipPosition, TooltipSide } from '@admin/lib/tooltipPosition';

export interface TooltipProps {
  /** Short, supplementary copy. Do not use for validation or essential instructions. */
  content: React.ReactNode;
  /** The focusable trigger. A native button is recommended. */
  children: React.ReactNode;
  /** Preferred side; flips automatically when the viewport is tight. */
  position?: TooltipSide;
  /** Hover delay in ms. Focus opens immediately. */
  delay?: number;
  /** Maximum width in px. */
  maxWidth?: number;
}

// Shared tooltip (TT1): a portal-based, token-only hint. Portaling escapes
// DrawerCard's overflow clipping; fixed positioning keeps it attached to the
// trigger without taking layout space. Hover/focus/tap all open it, and the
// trigger keeps its native accessible name. The tooltip itself is never
// interactive, so it stays out of the tab order and cannot trap focus.
export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 120,
  maxWidth = 240,
}: TooltipProps) {
  const tooltipId = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const [placement, setPlacement] = useState<TooltipPosition | null>(null);
  const anim = usePopoverAnimation(open, undefined, 140);

  const clearShowTimer = () => {
    if (showTimer.current !== null) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  };

  const openNow = () => {
    clearShowTimer();
    setOpen(true);
  };

  const closeNow = () => {
    clearShowTimer();
    setOpen(false);
  };

  const scheduleOpen = () => {
    clearShowTimer();
    showTimer.current = setTimeout(() => {
      showTimer.current = null;
      setOpen(true);
    }, delay);
  };

  React.useEffect(() => () => clearShowTimer(), []);

  // Measure after mount so the tooltip can flip before it becomes visible.
  React.useEffect(() => {
    if (!anim.visible) {
      setPlacement(null);
      return;
    }
    if (typeof window === 'undefined') return;

    const measure = () => {
      const triggerEl = wrapRef.current;
      const tooltipEl = tooltipRef.current;
      if (!triggerEl || !tooltipEl) return;
      const triggerRect = triggerEl.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      setPlacement(
        computeTooltipPosition({
          trigger: {
            top: triggerRect.top,
            bottom: triggerRect.bottom,
            left: triggerRect.left,
            width: triggerRect.width,
            height: triggerRect.height,
          },
          tooltip: { width: tooltipRect.width, height: tooltipRect.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          preferred: position,
        })
      );
    };

    measure();
  }, [anim.visible, content, maxWidth, position]);

  // Dismiss on scroll, resize, outside press, or Escape while visible.
  React.useEffect(() => {
    if (!anim.visible) return;

    const dismiss = () => {
      setPinned(false);
      setOpen(false);
    };
    const handleScroll = () => dismiss();
    const handleResize = () => dismiss();
    const handlePointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      dismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anim.visible]);

  const handlePointerEnter = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== 'touch') scheduleOpen();
  };

  const handlePointerLeave = () => {
    if (!pinned && !focused) closeNow();
  };

  const handleFocus = () => {
    setFocused(true);
    openNow();
  };

  const handleBlur = (event: React.FocusEvent<HTMLSpanElement>) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setFocused(false);
    if (!pinned) closeNow();
  };

  const handleClick = () => {
    if (pinned) {
      setPinned(false);
      closeNow();
    } else {
      setPinned(true);
      openNow();
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    // Touch has no hover; a tap pins the hint so it can be read and dismissed
    // with a second tap/outside press. Mouse and pen keep hover/focus behaviour.
    if (event.pointerType === 'touch') handleClick();
  };

  const child = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ 'aria-describedby'?: string }>,
        {
          'aria-describedby':
            [
              (children as React.ReactElement<{ 'aria-describedby'?: string }>).props[
                'aria-describedby'
              ],
              anim.visible ? tooltipId : undefined,
            ]
              .filter(Boolean)
              .join(' ') || undefined,
        }
      )
    : children;

  return (
    <>
      <span
        ref={wrapRef}
        style={{ display: 'inline-flex', verticalAlign: 'middle' }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocusCapture={handleFocus}
        onBlurCapture={handleBlur}
        onPointerUp={handlePointerUp}
      >
        {child}
      </span>
      {anim.visible && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              style={{
                position: 'fixed',
                top: placement?.top ?? 0,
                left: placement?.left ?? 0,
                visibility: placement ? 'visible' : 'hidden',
                zIndex: 1200,
                width: 'max-content',
                maxWidth,
                padding: '8px 10px',
                borderRadius: 'var(--tuw-radius-control, 8px)',
                border: '1px solid var(--tuw-border-control, #E9E9E9)',
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                color: 'var(--tuw-text-primary, #262626)',
                boxShadow: 'var(--shadow-popover, 0 8px 30px rgba(0, 0, 0, 0.12))',
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--tuw-type-caption-default-size, 12px)',
                lineHeight: 'var(--tuw-type-caption-default-line-height, 18px)',
                fontWeight: 'var(--tuw-type-label-control-weight, 500)',
                textAlign: 'left',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                pointerEvents: 'none',
                boxSizing: 'border-box',
                animation: placement
                  ? anim.phase === 'closing'
                    ? 'popoverOut 0.12s ease-in both'
                    : 'popoverIn 0.14s ease-out both'
                  : 'none',
                willChange: 'opacity',
              }}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
