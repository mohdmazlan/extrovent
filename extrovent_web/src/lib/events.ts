import { apiFetch } from './apiClient';

export interface EventItem {
  event_id: string;
  category?: string;
  title?: string;
  place_id?: string | null;
  fee?: number;
  start_date?: string;
  start_time?: string;
  description?: string;
  user_id?: string;
  nickname?: string | null;
}

export interface NewEvent {
  category: string;
  title: string;
  place_id: string;
  fee?: number;
  start_date: string;
  start_time: string;
  description: string;
  business_profile_id?: string;
}

export function listEvents(placeId?: string): Promise<EventItem[]> {
  const q = placeId !== undefined ? `?place_id=${encodeURIComponent(placeId)}` : '';
  return apiFetch<EventItem[]>(`/event/list${q}`);
}

export function getEvent(eventId: string): Promise<EventItem> {
  return apiFetch<EventItem>(`/event/get?event_id=${encodeURIComponent(eventId)}`);
}

export function createEvent(data: NewEvent): Promise<string | { success: boolean }> {
  return apiFetch('/event/create', { method: 'POST', json: data });
}

export function joinEvent(eventId: string): Promise<unknown> {
  return apiFetch('/event/join', { method: 'POST', json: { event_id: eventId } });
}

export function getLikedEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/event/liked');
}

export function getMyEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/event/my');
}
