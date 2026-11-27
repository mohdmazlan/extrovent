/**
 * Single API client for the Extrovent backend — merpati parity.
 * - attaches `Authorization: Bearer <access_token>` from plain storage
 * - unwraps the `{success, data, error}` envelope
 * - queues parallel 401s, refreshes once via `POST /auth/refresh`
 *   without requiring access_token (merpati/backend/src/Auth/AuthController.php:259)
 * - dispatches `merpati:token-refreshed` so realtime can re-handshake
 * - 5-minute keep-alive extends sliding window (merpati/web/src/api/client.ts:94)
 */

import { tokenStorage, validateToken } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

let onAuthFailure: () => void = () => {};
export function setOnAuthFailure(cb: () => void): void { onAuthFailure = cb; }

// legacy shims — keep call-sites working, delegate to plain storage
export function setAccessToken(token: string | null): void {
  if (token === null) localStorage.removeItem('access_token');
  else localStorage.setItem('access_token', token);
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem('refresh_token') || localStorage.getItem('extrovent_refresh_token'); } catch { return null; }
}
export function setRefreshToken(token: string | null): void {
  try {
    if (token === null) localStorage.removeItem('refresh_token');
    else localStorage.setItem('refresh_token', token);
  } catch {}
}
export function clearTokens(): void {
  tokenStorage.clearAll();
  try { localStorage.removeItem('extrovent_refresh_token'); } catch {}
}

// refresh queue — single-flight like merpati/web/src/api/client.ts:25
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string | null) => void; reject: (e: unknown) => void }> = [];
function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost/api';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: Envelope<T>;
  try { body = (await res.json()) as Envelope<T>; } catch { throw new ApiError(`Invalid server response (HTTP ${res.status})`, res.status); }
  if (!res.ok || body.success === false) throw new ApiError(body.error ?? `Request failed (HTTP ${res.status})`, res.status, body.data);
  return body.data as T;
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken() || (() => { try { return localStorage.getItem('refresh_token'); } catch { return null; } })();
  // also try legacy key migration is handled inside tokenStorage
  const rt = refreshToken;
  if (!rt) return null;
  try {
    const res = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    const data = await parseEnvelope<{ access_token: string; refresh_token: string }>(res);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    tokenStorage.setUser(tokenStorage.getUser()); // keep user
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('merpati:token-refreshed'));
    return data.access_token;
  } catch {
    return null;
  }
}

export function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export interface ApiOptions extends Omit<RequestInit, 'headers' | 'body'> {
  json?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  _retried?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, formData, headers = {}, _retried = false, ...init } = options;

  // client-side expiry gate — don't send expired token
  const raw = localStorage.getItem('access_token');
  if (raw && !validateToken(raw)) {
    tokenStorage.clearAll();
    // let caller handle 401 surfacing
  }

  const doFetch = (): Promise<Response> => {
    const token = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
    // extra guard: if token is expired, omit header
    const effective = token && validateToken(token) ? token : null;
    const baseHeaders: Record<string, string> = {
      ...(effective ? { Authorization: `Bearer ${effective}` } : {}),
      ...headers,
    };
    if (!formData) baseHeaders['Content-Type'] = baseHeaders['Content-Type'] ?? 'application/json';
    return fetch(apiUrl(path), {
      ...init,
      headers: baseHeaders,
      body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
    });
  };

  try {
    return await parseEnvelope<T>(await doFetch());
  } catch (err) {
    const isAuthRefresh = path.includes('/auth/refresh');
    if (err instanceof ApiError && err.status === 401 && !_retried && !isAuthRefresh) {
      if (isRefreshing) {
        // queue (merpati/web/src/api/client.ts:40)
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken) => {
              // retry with new token
              const token = newToken || (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
              const retryHeaders = { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } as Record<string, string>;
              if (!formData) retryHeaders['Content-Type'] = retryHeaders['Content-Type'] ?? 'application/json';
              fetch(apiUrl(path), { ...init, headers: retryHeaders, body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined) })
                .then(r => parseEnvelope<T>(r).then(resolve).catch(reject))
                .catch(reject);
            },
            reject,
          });
        });
      }
      // try refresh once
      isRefreshing = true;
      const newToken = await refreshTokens();
      isRefreshing = false;
      if (newToken) {
        processQueue(null, newToken);
        return apiFetch<T>(path, { ...options, _retried: true });
      }
      processQueue(err, null);
      clearTokens();
      onAuthFailure();
      // surface retry_after if present
      throw err;
    }
    throw err;
  }
}

// keep-alive: 5m sliding window (merpati/web/src/api/client.ts:94)
if (typeof window !== 'undefined') {
  let keepAliveTimer: number | null = null;
  const start = () => {
    if (keepAliveTimer) window.clearInterval(keepAliveTimer);
    keepAliveTimer = window.setInterval(() => {
      const t = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
      if (!t) return;
      if (document.hidden) return;
      apiFetch('/users/me').catch(() => {});
    }, 5 * 60 * 1000) as unknown as number;
  };
  start();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
}

// Convenience wrappers
export async function loginRequest(identifier: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type?: string; expires_in: number; user: unknown; id?: string; username?: string }> {
  // normalize identifier — new DB uses `username` (or email) as login handle
  const id = identifier.trim().replace(/^@/, '').toLowerCase();
  // send `username` + `identifier` + `user_id` for one-release compat with old backend
  const payload: Record<string, string> = { username: id, identifier: id, user_id: id, password };
  const raw = await apiFetch<{ access_token: string; refresh_token: string; token_type?: string; expires_in: number; user: unknown; id?: string; username?: string } | { access_token: string; refresh_token: string; user: unknown } & Record<string, unknown>>('/auth/login', { method: 'POST', json: payload });
  const data = raw as { access_token: string; refresh_token: string; token_type?: string; expires_in: number; user: unknown; id?: string; username?: string };
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  // normalize user shape: backend may return {id, username} at top-level or inside `user`
  let userToStore: unknown = data.user;
  if (userToStore && typeof userToStore === 'object') {
    const u = userToStore as Record<string, unknown>;
    const uid = (u['id'] as string) ?? (u['user_id'] as string) ?? (data as Record<string, unknown>)['id'] as string | undefined;
    const uname = (u['username'] as string) ?? (u['user_id'] as string) ?? (data as Record<string, unknown>)['username'] as string | undefined ?? id;
    // ensure stable id + username present and keep legacy aliases
    if (uid && !u['id']) u['id'] = uid;
    if (uname && !u['username']) u['username'] = uname;
    if (uid && !u['user_id']) u['user_id'] = uid; // compat alias
    else if (uname && !u['user_id']) u['user_id'] = uname;
    // also store stable id in legacy key for routing compat
    try { localStorage.setItem('user_id', String(uid ?? uname ?? id)); } catch {}
  } else if (!userToStore) {
    // fallback if backend only returned top-level id/username
    const fallback: Record<string, string> = { id: (data.id as string) ?? id, username: (data.username as string) ?? id, user_id: (data.id as string) ?? id };
    userToStore = fallback;
  }
  localStorage.setItem('user', JSON.stringify(userToStore));
  return { access_token: data.access_token, refresh_token: data.refresh_token, token_type: data.token_type as string, expires_in: data.expires_in as number, user: userToStore as unknown as string } as never;
}

export async function logoutRequest(): Promise<void> {
  try {
    const rt = (() => { try { return localStorage.getItem('refresh_token'); } catch { return null; } })();
    if (rt) await apiFetch('/auth/logout', { method: 'POST', json: { refresh_token: rt }, _retried: true });
    else await apiFetch('/auth/logout', { method: 'POST', _retried: true });
  } finally { clearTokens(); }
}
