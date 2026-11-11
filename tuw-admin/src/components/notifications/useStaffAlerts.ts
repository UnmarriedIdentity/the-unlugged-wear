'use client';

import React from 'react';
import { listNotificationsAction, markAllNotificationsReadAction, markNotificationReadAction } from '@/server/notification-actions';
import type { Notification, RemoteReadState } from './types';

const PREFIX = 'db:';

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h`;
  return `${Math.floor(minutes / 1440)} d`;
}

/** Real alerts from the database, refreshed whenever the bell opens. */
export function useStaffAlerts(open: boolean): { items: Notification[]; remote: RemoteReadState } {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [readIds, setReadIds] = React.useState<ReadonlySet<string>>(new Set());

  React.useEffect(() => {
    let live = true;
    void listNotificationsAction({}).then((result) => {
      if (!live || !result.ok) return;
      setItems(result.data.map((n) => ({
        id: `${PREFIX}${n.id}`,
        category: 'inventory',
        tone: n.dedupeKey?.startsWith('inventory.out') ? 'error' : 'warning',
        title: n.title,
        body: n.body,
        time: timeAgo(n.createdAt),
        ...(n.link ? { href: n.link } : {}),
      })));
      setReadIds(new Set(result.data.filter((n) => n.read).map((n) => `${PREFIX}${n.id}`)));
    });
    return () => { live = false; };
  }, [open]);

  const remote: RemoteReadState = {
    readIds,
    markRead: (id) => {
      if (id.startsWith(PREFIX)) void markNotificationReadAction({ id: id.slice(PREFIX.length) });
    },
    markAllRead: () => { void markAllNotificationsReadAction({}); },
  };
  return { items, remote };
}
