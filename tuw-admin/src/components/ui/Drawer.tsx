'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Expand, Shrink, Maximize2, Minimize2 } from 'lucide-react';
import PanelLayout from './PanelLayout';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Panel width. Per-content variance is deliberate: 480px media preview,
   * 520px default, 540px page forms, 560px support threads. */
  width?: string | number;
  /** Elastic workspace: matrix (880px) + full-canvas modes with header
   * controls. Off by default — all existing drawers behave byte-identically. */
  expandable?: boolean;
  /** Extra header row under the title (tabs, visibility controls). */
  headerExtra?: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '520px',
  expandable = false,
  headerExtra,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  // Exit plays through the shared popover contract (180ms drawer rhythm);
  // render follows visibility so the slide-out completes before unmount.
  const anim = usePopoverAnimation(isOpen, undefined, 180);
  // Elastic sizes: compact (width prop) → matrix 880 → full canvas.
  // width:100% + maxWidth auto-clamps below 920px viewports.
  const [expanded, setExpanded] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // Focus trap: focus the panel on open, cycle Tab within it, and return
  // focus to the invoker on close. Paint-free (programmatic focus never
  // matches :focus-visible, so no ring appears).
  const invokerRef = useRef<Element | null>(null);
  useEffect(() => {
    if (!anim.visible) return;
    invokerRef.current = document.activeElement;
    drawerRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root = drawerRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      const invoker = invokerRef.current as HTMLElement | null;
      invoker?.focus?.();
    };
  }, [anim.visible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!anim.visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: fullScreen ? '100vw' : expanded ? 880 : width,
          height: '100%',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          borderLeft: fullScreen
            ? 'none'
            : '1px solid var(--tuw-border-subtle, #E5E7EB)',
          transition: 'max-width 0.2s ease',
          animation:
            anim.phase === 'closing'
              ? 'slideOutRight 0.18s ease-in'
              : 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <PanelLayout
          header={
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
            backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--tuw-text-primary, #262626)',
                margin: 0,
                fontFamily: 'var(--font-urbanist, Urbanist), sans-serif',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  margin: '4px 0 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {expandable ? (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-label={expanded ? 'Compact view' : 'Expanded matrix view'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    padding: '6px',
                    borderRadius: 'var(--tuw-radius-control, 8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {expanded ? <Shrink size={18} /> : <Expand size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFullScreen((v) => !v)}
                  aria-label={fullScreen ? 'Exit full canvas' : 'Full canvas view'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    padding: '6px',
                    borderRadius: 'var(--tuw-radius-control, 8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </>
            ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tuw-text-secondary, #5D6772)',
              padding: '6px',
              borderRadius: 'var(--tuw-radius-control, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
          </div>
          </div>
          {headerExtra ? <div style={{ marginTop: 16 }}>{headerExtra}</div> : null}
        </div>
          }
          footer={
            footer ? (
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)',
            backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          {footer}
        </div>
            ) : undefined
          }
        >
          <div
            style={{
              padding: '24px',
              color: 'var(--tuw-text-primary, #262626)',
              fontSize: '14px',
            }}
          >
            {children}
          </div>
        </PanelLayout>
      </div>
    </div>
  );
}
