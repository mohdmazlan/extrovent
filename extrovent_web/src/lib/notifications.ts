import { apiFetch } from './apiClient';

export type NotificationType = 'friend_request' | 'invitation' | 'chat_message' | 'comment' | 'custom' | string;

export interface NotificationItem {
  id: number;
  sid?: string | number;
  description?: string | null;
  user_id?: string;
  user_ids?: string;
  type?: string;
  notification_type?: string;
  datetime?: string;
  banner?: string | null;
  avatar?: string | null;
  read?: boolean | number;
  // app fields
  message?: string;
}

export function normalizeType(n: NotificationItem): string {
  const t = n.type ?? n.notification_type ?? 'custom';
  const map: Record<string, string> = {
    '1': 'friend_request',
    '2': 'invitation',
    '3': 'chat_message',
    '4': 'custom',
    '5': 'comment',
  };
  return map[t] ?? t;
}

export function listNotifications(): Promise<NotificationItem[]> {
  return apiFetch<NotificationItem[]>('/notifications');
}

export function getUnreadCount(items: NotificationItem[]): number {
  return items.filter((i) => !i.read).length;
}
