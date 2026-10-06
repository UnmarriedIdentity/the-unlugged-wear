'use client';

import React from 'react';
import type { Notification, NotificationTone } from './types';

const TONE_STYLES: Record<NotificationTone, { wash: string; ink: string; dot: string }> = {
  info: {
    wash: 'var(--tuw-bg-info, #F4F9FE)',
    ink: 'var(--tuw-text-info, #175CD3)',
    dot: 'var(--tuw-text-info, #175CD3)',
  },
  success: {
    wash: 'var(--tuw-bg-success, #F4FBF7)',
    ink: 'var(--tuw-text-success, #187343)',
    dot: 'var(--tuw-text-success, #187343)',
  },
  warning: {
    wash: 'var(--tuw-bg-warning, #FEFBF5)',
    ink: 'var(--tuw-text-warning, #856300)',
    dot: 'var(--tuw-text-warning, #856300)',
  },
  error: {
    wash: 'var(--tuw-bg-error, #FEF4F4)',
    ink: 'var(--tuw-text-error, #C91818)',
    dot: 'var(--tuw-text-error, #C91818)',
  },
};

interface NotificationItemProps {
  item: Notification;
  read: boolean;
  onOpen: (item: Notification) => void;
}

// One notification row (N2): unread renders in its tone wash with a dot
// (crash/error = red highlight div); read renders white with a border.
// Dumb and data-fed — tones come from tokens, content from props.
export function NotificationItem({ item, read, onOpen }: NotificationItemProps) {
  const tone = TONE_STYLES[item.tone];
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        border: read ? '1px solid var(--tuw-border-subtle, #E9E9E9)' : '1px solid transparent',
        backgroundColor: read ? 'var(--tuw-bg-surface, #FFFFFF)' : tone.wash,
        cursor: 'pointer',
        fontFamily: 'var(--font-main)',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {!read && (
        <span
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            marginTop: '5px',
            flexShrink: 0,
            backgroundColor: tone.dot,
          }}
        />
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: read ? 500 : 600,
            color: read ? 'var(--tuw-text-primary, #262626)' : tone.ink,
            lineHeight: 1.35,
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--tuw-text-secondary, #5D6772)',
            lineHeight: 1.45,
            marginTop: '2px',
          }}
        >
          {item.body}
        </span>
      </span>
      <span
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--tuw-text-secondary, #5D6772)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {item.time}
      </span>
    </button>
  );
}
