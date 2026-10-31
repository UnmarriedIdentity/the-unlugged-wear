'use client';

import React from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  style = {},
}: EmptyStateProps) {
  const buttonLabel = actionLabel || actionText;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            padding: '16px',
            borderRadius: '50%',
            backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
            marginBottom: '16px',
            color: 'var(--tuw-text-secondary, #5D6772)',
          }}
        >
          {icon}
        </div>
      )}

      <h4
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--tuw-text-primary, #262626)',
          margin: '0 0 6px 0',
          fontFamily: 'var(--font-urbanist, Urbanist), sans-serif',
        }}
      >
        {title}
      </h4>

      {description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--tuw-text-secondary, #5D6772)',
            maxWidth: '380px',
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {buttonLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
