/**
 * Plain token storage matching merpati/web/src/contexts/AuthContext.tsx:34
 * Keys: access_token / refresh_token / user
 * plus validateToken helper (decode exp) like hrms/secureStorage.ts:81
 */

export function validateToken(token: string): boolean {
  try {
    if (!token || token.trim() === '') return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return false;
    return true;
  } catch {
    return false;
  }
}

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user';
const LEGACY_REFRESH = 'extrovent_refresh_token';
const LEGACY_EX_PREFIXES = ['ext_', 'ess_'];

function migrateLegacy(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_REFRESH);
    if (legacy && !localStorage.getItem(REFRESH_KEY)) {
      localStorage.setItem(REFRESH_KEY, legacy);
      localStorage.removeItem(LEGACY_REFRESH);
    }
    // also migrate any ext_/ess_ prefixed refresh if present (first one)
    for (const prefix of LEGACY_EX_PREFIXES) {
      const keys: string[] = Object.keys(localStorage);
      for (const k of keys) {
        if (k === prefix + 'refresh_token' && !localStorage.getItem(REFRESH_KEY)) {
          const v = localStorage.getItem(k);
          if (v) {
            try { localStorage.setItem(REFRESH_KEY, atob(v) ); } catch { localStorage.setItem(REFRESH_KEY, v); }
            localStorage.removeItem(k);
          }
        }
      }
    }
  } catch {}
}

export const tokenStorage = {
  getAccessToken(): string | null {
    migrateLegacy();
    try {
      const t = localStorage.getItem(ACCESS_KEY);
      if (!t) return null;
      if (!validateToken(t)) {
        // expired — treat as missing, keep storage to let caller decide to clear
        return null;
      }
      return t;
    } catch { return null; }
  },
  getRawAccessToken(): string | null {
    try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
  },
  setAccessToken(token: string): void {
    try { localStorage.setItem(ACCESS_KEY, token); } catch {}
  },
  getRefreshToken(): string | null {
    migrateLegacy();
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
  },
  setRefreshToken(token: string | null): void {
    try {
      if (token === null) localStorage.removeItem(REFRESH_KEY);
      else localStorage.setItem(REFRESH_KEY, token);
    } catch {}
  },
  getUser(): unknown | null {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },
  setUser(user: unknown): void {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
  },
  clearAll(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LEGACY_REFRESH);
    } catch {}
  },
};
