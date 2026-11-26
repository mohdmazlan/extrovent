import { apiFetch } from './apiClient';

export interface UserProfile {
  user_id: string;
  nickname?: string | null;
  email?: string | null;
  avatar?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  no_ic?: string | null;
  no_matrik?: string | null;
  no_phone?: string | null;
}

export type ProfileUpdate = Partial<
  Pick<UserProfile, 'nickname' | 'email' | 'first_name' | 'last_name' | 'no_ic' | 'no_matrik' | 'no_phone'>
>;

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/user/profile');
}

export function updateProfile(data: ProfileUpdate): Promise<unknown> {
  return apiFetch('/user/update', { method: 'PUT', json: data });
}

export interface SearchResults {
  places: Array<{ id: number; title: string; description?: string; type: string }>;
  events: Array<{ id: number; title: string; description?: string; type: string }>;
  activities: Array<{ id: number; title: string; description?: string; type: string }>;
  users: Array<{ user_id: string; nickname?: string | null; type: string }>;
}

export function unifiedSearch(q: string): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q)}`);
}
