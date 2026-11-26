/**
 * Single API client for the Extrovent backend.
 *
 * Owns all auth behavior so screens never touch tokens:
 * - attaches `Authorization: Bearer <access_token>`
 * - unwraps the `{success, data, error}` envelope
 * - on 401: refreshes once, retries the original request once,
 *   then forces re-login (never loops)
 * - surfaces 429 / validation messages via ApiError
 */

const REFRESH_STORAGE_KEY = 'extrovent_refresh_token';

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

// Access token lives in memory (short-lived, never persisted).
let accessToken: string | null = null;

// Called when the session is dead (refresh rejected) — the app routes to login.
let onAuthFailure: () => void = () => {};

export function setOnAuthFailure(cb: () => void): void {
  onAuthFailure = cb;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    } else {
      localStorage.setItem(REFRESH_STORAGE_KEY, token);
    }
  } catch {
    // Private mode etc. — in-memory fallback keeps the session alive for this tab.
  }
}

export function clearTokens(): void {
  accessToken = null;
  setRefreshToken(null);
}

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost/api';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Invalid server response (HTTP ${res.status})`, res.status);
  }
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error ?? `Request failed (HTTP ${res.status})`, res.status, body.data);
  }
  return body.data as T;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await parseEnvelope<{ access_token: string; refresh_token: string }>(res);
    accessToken = data.access_token;
    setRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'headers' | 'body'> {
  /** JSON-serializable body; sent as application/json. */
  json?: unknown;
  /** Extra headers. Authorization is managed by the client — do not set it manually. */
  headers?: Record<string, string>;
  /** Internal: skip the refresh-and-retry cycle (used for the refresh call itself). */
  _retried?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, headers = {}, _retried = false, ...init } = options;

  const doFetch = (): Promise<Response> =>
    fetch(apiUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });

  try {
    return await parseEnvelope<T>(await doFetch());
  } catch (err) {
    // Single transparent refresh-and-retry on 401 — never loop.
    if (err instanceof ApiError && err.status === 401 && !_retried && accessToken) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, _retried: true });
      }
      clearTokens();
      onAuthFailure();
    }
    throw err;
  }
}

// Convenience wrappers for the auth endpoints (used by the login/logout screens).
export async function loginRequest(userId: string, password: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
}> {
  const data = await apiFetch<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: string;
  }>('/auth/login', { method: 'POST', json: { user_id: userId, password } });
  accessToken = data.access_token;
  setRefreshToken(data.refresh_token);
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST', _retried: true });
  } finally {
    clearTokens();
  }
}
