export type NotificationTone = 'info' | 'success' | 'warning' | 'error';

export type NotificationCategory = 'orders' | 'inventory' | 'payment' | 'system' | 'marketing';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  tone: NotificationTone;
  title: string;
  body: string;
  time: string;
  href?: string;
}

export const NOTIFICATION_CATEGORIES: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'orders', label: 'Order & Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'payment', label: 'Payment' },
  { value: 'system', label: 'System' },
  { value: 'marketing', label: 'Marketing' },
];

// Repository contract (N1): components consume this shape only. Today it is
// backed by session-local read state over store-derived items; tomorrow a
// database adapter implements the same interface and nothing upstream moves.
export interface NotificationRepository {
  all: NotificationItem[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}
