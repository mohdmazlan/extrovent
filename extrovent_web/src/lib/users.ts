import { apiFetch } from './apiClient';

export interface UserProfile {
  id: string;
  username: string;
  /** @deprecated alias to id — kept for one release compat */
  user_id?: string;
  nickname?: string | null;
  email?: string | null;
  avatar?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  no_phone?: string | null;
}

export type ProfileUpdate = Partial<
  Pick<UserProfile, 'nickname' | 'email' | 'first_name' | 'last_name' | 'no_phone'>
>;

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/user/profile');
}

export function updateProfile(data: ProfileUpdate): Promise<unknown> {
  return apiFetch('/user/update', { method: 'PUT', json: data });
}

export interface SearchResults {
  places: Array<{ id: string; title: string; description?: string; type: string }>;
  events: Array<{ id: string; title: string; description?: string; type: string }>;
  activities: Array<{ id: string; title: string; description?: string; type: string }>;
  users: Array<{ id?: string; user_id: string; username?: string; nickname?: string | null; type: string }>;
}

export function unifiedSearch(q: string): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q)}`);
}
