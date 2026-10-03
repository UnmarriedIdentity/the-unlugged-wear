'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DisclosureProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Accessible Disclosure / Accordion item component conforming to TUW Design System
 */
export default function Disclosure({
  title,
  subtitle,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  badge,
  icon,
  className = '',
  style = {},
}: DisclosureProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const next = !open;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
        ...style,
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {icon && (
            <span style={{ color: 'var(--tuw-action-primary, #7539FF)', display: 'inline-flex' }}>
              {icon}
            </span>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--tuw-text-primary, #262626)',
                }}
              >
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  margin: '2px 0 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          size={18}
          style={{
            color: 'var(--tuw-text-secondary, #5D6772)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          role="region"
          style={{
            padding: '0 20px 20px 20px',
            borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)',
            marginTop: 0,
            paddingTop: '16px',
            color: 'var(--tuw-text-secondary, #5D6772)',
            fontSize: '14px',
            lineHeight: '22px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
