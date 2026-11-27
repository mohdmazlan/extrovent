import { apiFetch } from './apiClient';

export interface Rating {
  rating_id?: number;
  user_id?: string;
  nickname?: string | null;
  avatar?: string | null;
  rating?: number;
  stars?: number;
  comment?: string | null;
  description?: string | null;
  datetime?: string;
  created_at?: string;
}

export function getPlaceRatings(placeId: string): Promise<Rating[]> {
  return apiFetch<Rating[]>(`/place/ratings?place_id=${encodeURIComponent(placeId)}`);
}

export function getActivityRatings(activityId: string): Promise<Rating[]> {
  return apiFetch<Rating[]>(`/activity/ratings?activity_id=${encodeURIComponent(activityId)}`);
}

export function getEventRatings(eventId: string): Promise<Rating[]> {
  return apiFetch<Rating[]>(`/event/ratings?event_id=${encodeURIComponent(eventId)}`);
}

export function getMyRating(target: { place_id?: string; activity_id?: string; event_id?: string }): Promise<Rating | null> {
  const q = target.place_id ? `place_id=${encodeURIComponent(target.place_id)}` : target.activity_id ? `activity_id=${encodeURIComponent(target.activity_id)}` : target.event_id ? `event_id=${encodeURIComponent(target.event_id)}` : '';
  return apiFetch<Rating | null>(`/rating/my?${q}`);
}

export function ratePlace(placeId: string, rating: number, comment?: string): Promise<unknown> {
  return apiFetch('/place/rate', { method: 'POST', json: { place_id: placeId, rating, comment } });
}

export function rateActivity(activityId: string, rating: number, comment?: string): Promise<unknown> {
  return apiFetch('/activity/rate', { method: 'POST', json: { activity_id: activityId, rating, comment } });
}

export function rateEvent(eventId: string, rating: number, comment?: string): Promise<unknown> {
  return apiFetch('/event/rate', { method: 'POST', json: { event_id: eventId, rating, comment } });
}
