import { apiFetch } from './apiClient';

export interface Place {
  id: number;
  name?: string | null;
  description?: string | null;
  category_location?: string | null;
  coordinate?: string | null;
  business_profile_id?: number | null;
  company_name?: string | null;
}

export interface NewPlace {
  name: string;
  description: string;
  category_location?: string;
  coordinate?: string;
  business_profile_id?: number;
}

export function listPlaces(category?: string): Promise<Place[]> {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<Place[]>(`/place/list${q}`);
}

export function getPlace(placeId: number): Promise<Place> {
  return apiFetch<Place>(`/place/get?place_id=${placeId}`);
}

export function createPlace(data: NewPlace): Promise<number | { success: boolean }> {
  return apiFetch('/place/create', { method: 'POST', json: data });
}

export function getMyPlaces(): Promise<Place[]> {
  return apiFetch<Place[]>('/place/my');
}

/** Parse the backend's opaque coordinate string ("lat,lng") into a position, or null. */
export function parseCoordinate(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => Number(s.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lat, lng] = parts as [number, number];
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}
