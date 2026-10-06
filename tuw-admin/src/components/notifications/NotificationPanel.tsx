'use client';

import React from 'react';
import FilterPills from '@/components/ui/FilterPills';
import EmptyState from '@/components/ui/EmptyState';
import { NotificationItem } from './NotificationItem';
import { NOTIFICATION_CATEGORIES, type Notification, type NotificationCategory, type NotificationRepository } from './types';

interface NotificationPanelProps {
  repo: NotificationRepository;
  onNavigate: (href: string) => void;
}

// Notification center panel (N2): header count + mark-all-read, category
// rail tabs, tone-washed item cards. Plug-and-play: drop it anywhere with
// a repository; mock items today, database feed tomorrow.
export function NotificationPanel({ repo, onNavigate }: NotificationPanelProps) {
  const [category, setCategory] = React.useState<NotificationCategory>(() => {
    const firstUnread = repo.all.find((n) => !repo.isRead(n.id));
    return firstUnread ? firstUnread.category : 'orders';
  });
  const visible = repo.all.filter((n) => n.category === category);
  const unreadLabel = repo.unreadCount === 1 ? '1 new' : `${repo.unreadCount} new`;

  const handleOpen = (item: Notification) => {
    repo.markRead(item.id);
    if (item.href) onNavigate(item.href);
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      style={{
        width: '100%',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        borderRadius: 'var(--tuw-radius-modal, 16px)',
        boxShadow: 'var(--shadow-popover, 0 8px 30px rgba(0, 0, 0, 0.12))',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: 'var(--font-main)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tuw-text-primary, #262626)' }}>
            Notifications
          </div>
          <div style={{ fontSize: '13px', fontWeight: 400, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: '2px' }}>
            {repo.unreadCount > 0 ? `You have ${unreadLabel}` : 'You are all caught up'}
          </div>
        </div>
        {repo.unreadCount > 0 && (
          <button
            type="button"
            onClick={() => repo.markAllRead()}
            style={{
              background: 'transparent',
              border: '1px solid var(--tuw-border-subtle, #E9E9E9)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--tuw-text-primary, #262626)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <FilterPills
        variant="rail"
        ariaLabel="Notification categories"
        options={NOTIFICATION_CATEGORIES.filter((c) => c.value !== 'all')}
        value={category}
        onChange={(v) => setCategory(v as NotificationCategory)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
        {visible.length === 0 ? (
          <EmptyState
            title="No notifications"
            description={`Nothing in ${NOTIFICATION_CATEGORIES.find((c) => c.value === category)?.label ?? category} right now.`}
          />
        ) : (
          visible.map((item) => (
            <NotificationItem key={item.id} item={item} read={repo.isRead(item.id)} onOpen={handleOpen} />
          ))
        )}
      </div>
    </div>
  );
}
