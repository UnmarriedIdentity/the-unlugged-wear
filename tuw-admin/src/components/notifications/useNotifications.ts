'use client';

import React from 'react';
import type { Notification, NotificationRepository } from './types';

// Session-local repository (N1): read state lives in a Set, resets on
// reload like the rest of demo UI. Implements the repository contract, so
// a future database adapter slots in behind this same hook.
export function useNotifications(source: Notification[]): NotificationRepository {
  const [readIds, setReadIds] = React.useState<ReadonlySet<string>>(new Set());

  const unreadCount = source.filter((n) => !readIds.has(n.id)).length;

  return {
    all: source,
    unreadCount,
    isRead: (id: string) => readIds.has(id),
    markRead: (id: string) =>
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      }),
    markAllRead: () => setReadIds(new Set(source.map((n) => n.id))),
  };
}
