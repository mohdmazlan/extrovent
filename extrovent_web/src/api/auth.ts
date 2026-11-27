import { apiFetch } from '../lib/apiClient';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string; username: string; display_name: string; role?: string };
}

export function normalizeIdentifier(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const id = normalizeIdentifier(identifier);
  const res = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', json: { identifier: id, password } });
  return res;
}

export async function register(email: string, password: string, username: string, displayName: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', json: { email, password, username, display_name: displayName } });
  return res;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST', json: { refresh_token: refreshToken } });
}

export async function getSessions(): Promise<{ id: number; created_at: string; last_activity_at: string; expires_at: string }[]> {
  const res = await apiFetch<{ sessions: { id: number; created_at: string; last_activity_at: string; expires_at: string }[] }>('/auth/sessions');
  return res.sessions;
}

export async function revokeSession(id: number): Promise<void> {
  await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
}
