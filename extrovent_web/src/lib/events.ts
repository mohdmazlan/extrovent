import { apiFetch } from './apiClient';

export interface EventItem {
  event_id: number;
  category?: string;
  title?: string;
  place_id?: number | null;
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
  place_id: number;
  fee?: number;
  start_date: string;
  start_time: string;
  description: string;
  business_profile_id?: number;
}

export function listEvents(placeId?: number): Promise<EventItem[]> {
  const q = placeId !== undefined ? `?place_id=${placeId}` : '';
  return apiFetch<EventItem[]>(`/event/list${q}`);
}

export function getEvent(eventId: number): Promise<EventItem> {
  return apiFetch<EventItem>(`/event/get?event_id=${eventId}`);
}

export function createEvent(data: NewEvent): Promise<number | { success: boolean }> {
  return apiFetch('/event/create', { method: 'POST', json: data });
}

export function joinEvent(eventId: number): Promise<unknown> {
  return apiFetch('/event/join', { method: 'POST', json: { event_id: eventId } });
}

export function getLikedEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/event/liked');
}

export function getMyEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/event/my');
}
