import { apiFetch } from './apiClient';

export interface ChatRoom {
  room_id: string;
  user_id?: string;
  nickname?: string | null;
  avatar?: string | null;
  message?: string | null;
  lastMessage?: string | null;
  datetime?: string;
  sender?: string;
}

export interface ChatMessage {
  message_id?: number | string;
  room_id: string;
  user_id: string;
  message: string;
  nickname?: string | null;
  datetime?: string;
  type?: string | number;
}

export function listRooms(): Promise<ChatRoom[]> {
  return apiFetch<ChatRoom[]>('/chat/rooms');
}

export function listMessages(roomId: string): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/chat/messages?room_id=${encodeURIComponent(roomId)}`);
}

export function sendMessage(roomId: string, message: string): Promise<unknown> {
  return apiFetch('/chat/message', { method: 'POST', json: { room_id: roomId, message } });
}

export type NormalizedSocketMessage =
  | { kind: 'message'; room_id: string; user_id: string; message: string; raw: unknown }
  | { kind: 'typing'; room_id: string; user_id: string; raw: unknown }
  | { kind: 'stop_typing'; room_id: string; user_id: string; raw: unknown }
  | { kind: 'unknown'; raw: unknown };

export function normalizeSocketMessage(data: unknown): NormalizedSocketMessage {
  if (!data || typeof data !== 'object') return { kind: 'unknown', raw: data };
  const obj = data as Record<string, unknown>;
  const typeRaw = obj.type ?? obj.kind ?? obj.event;
  const typeStr = String(typeRaw ?? '').toLowerCase();
  const room_id = String(obj.room_id ?? obj.roomId ?? '0');
  const user_id = String(obj.user_id ?? obj.userId ?? obj.sender ?? '');

  if (typeStr === '1' || typeStr === 'message' || typeStr === 'new_message') {
    return { kind: 'message', room_id, user_id, message: String(obj.message ?? obj.text ?? ''), raw: data };
  }
  if (typeStr === '0' || typeStr === 'typing' || typeStr === 'start_typing') {
    return { kind: 'typing', room_id, user_id, raw: data };
  }
  if (typeStr === 'stop_typing' || typeStr === 'stop') {
    return { kind: 'stop_typing', room_id, user_id, raw: data };
  }
  // heuristic: if has message field treat as message
  if ('message' in obj && typeof obj.message === 'string') {
    return { kind: 'message', room_id, user_id, message: obj.message, raw: data };
  }
  return { kind: 'unknown', raw: data };
}

// Shared time helper mirroring app TimeStr.getTimeStr
export function formatTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
