'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface UnsavedNoticeProps {
  show: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
  message?: string;
}

/**
 * Floating bar alerting the user of unsaved changes in forms and settings
 */
export default function UnsavedNotice({
  show,
  onSave,
  onDiscard,
  isSaving = false,
  message = 'You have unsaved changes',
}: UnsavedNoticeProps) {
  if (!show) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--tuw-text-primary, #262626)',
        color: '#FFFFFF',
        padding: '12px 24px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        maxWidth: '90vw',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={18} style={{ color: 'var(--tuw-status-warning, #F59E0B)' }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            opacity: 0.8,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          Discard
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
