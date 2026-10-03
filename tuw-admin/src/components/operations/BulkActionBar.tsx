'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Floating bulk action bar that displays when items in a table are selected
 */
export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className = '',
  style = {},
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={className}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--tuw-text-primary, #262626)',
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        animation: 'fadeInUp 0.2s ease',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            backgroundColor: 'var(--tuw-action-primary, #7539FF)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '9999px',
          }}
        >
          {selectedCount}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>
          {selectedCount === 1 ? 'item selected' : 'items selected'}
        </span>
      </div>

      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        aria-label="Clear selection"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          marginLeft: '4px',
          borderRadius: '4px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
