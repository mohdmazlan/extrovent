import { apiFetch } from './apiClient';

export interface Activity {
  activity_id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  category_activity?: string | null;
  category_location?: string | null;
  coordinate?: string | null;
  place_id?: string | null;
  business_profile_id?: string | null;
  user_id?: string;
  nickname?: string | null;
  fee?: number | null;
  images?: string[];
  avg_rating?: number | null;
  count_rating?: number | null;
}

export interface CreateActivityPayload {
  title: string;
  description: string;
  category: string;
  coordinate?: string;
  place_id?: string | null;
  fee?: number | null;
  business_profile_id?: string | null;
}

export const ACTIVITY_CATEGORIES = [
  'Hangout',
  'Hiking',
  'Rafting',
  'Fishing',
  'Cycling',
  'Camping',
  'Gaming',
  'Racing',
  'Others',
] as const;

export function listActivities(category?: string, mine = false, joined = false): Promise<Activity[]> {
  if (mine) return apiFetch<Activity[]>('/activity/my');
  if (joined) return apiFetch<Activity[]>('/activity/joined');
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<Activity[]>(`/activity/list${q}`);
}

export function getActivity(activityId: string): Promise<Activity> {
  return apiFetch<Activity>(`/activity/get?activity_id=${encodeURIComponent(activityId)}`);
}

export function createActivity(data: CreateActivityPayload): Promise<{ activity_id: string } | string | { success: boolean }> {
  return apiFetch('/activity/create', { method: 'POST', json: data });
}

export function updateActivity(activityId: string, data: Partial<CreateActivityPayload>): Promise<unknown> {
  return apiFetch('/activity/update', { method: 'PUT', json: { activity_id: activityId, ...data } });
}

export function deleteActivity(activityId: string): Promise<unknown> {
  return apiFetch(`/activity/delete?activity_id=${encodeURIComponent(activityId)}`, { method: 'DELETE' });
}

export function getMyActivities(): Promise<Activity[]> {
  return apiFetch<Activity[]>('/activity/my');
}

export function getJoinedActivities(): Promise<Activity[]> {
  return apiFetch<Activity[]>('/activity/joined');
}

export function parseCoordinate(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => Number(s.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lat, lng] = parts as [number, number];
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export function getActivityId(a: Activity): string | undefined {
  return a.activity_id ?? a.id;
}

export function getActivityTitle(a: Activity): string {
  return a.title ?? a.name ?? `Activity #${getActivityId(a) ?? '?'}`;
}
