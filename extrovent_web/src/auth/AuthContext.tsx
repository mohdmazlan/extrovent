import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, apiFetch, clearTokens, getRefreshToken, loginRequest, logoutRequest, setOnAuthFailure } from '../lib/apiClient';
import { validateToken } from '../lib/tokenStorage';

export interface SessionUser {
  id?: string;
  user_id?: string;
  username?: string;
  nickname?: string;
  display_name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (fields: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  // keep legacy register overload for backwards compat
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forceLogoutView = useCallback(() => {
    clearTokens();
    try { localStorage.removeItem('user'); } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(forceLogoutView);
    // hydrate + validate exp, then light profile check if refresh exists
    (async () => {
      try {
        const token = (() => { try { return localStorage.getItem('access_token'); } catch { return null; } })();
        if (token && !validateToken(token)) {
          // expired locally — will try refresh via apiFetch below if refresh exists
        }
        const storedUser = (() => { try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; } })();
        if (storedUser && token && validateToken(token)) {
          setUser(storedUser);
          setLoading(false);
          return;
        }
        if (!getRefreshToken()) {
          if (!storedUser) setUser(null);
          return;
        }
        const me = await apiFetch<SessionUser>('/users/me').catch(() => apiFetch<SessionUser>('/user/profile').catch(() => null));
        if (me) {
          setUser(me);
          try { localStorage.setItem('user', JSON.stringify(me)); } catch {}
        } else if (!token || !validateToken(token)) {
          clearTokens();
          setUser(null);
        }
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => setOnAuthFailure(() => {});
  }, [forceLogoutView]);

  const login = useCallback(async (identifier: string, password: string) => {
    setError(null);
    try {
      const id = identifier.trim().replace(/^@/, '').toLowerCase();
      await loginRequest(id, password);
      let me = await apiFetch<SessionUser>('/users/me').catch(() => apiFetch<SessionUser>('/user/profile').catch(() => null));
      // fallback to user already stored by loginRequest (covers new shape without extra fetch)
      if (!me) {
        try { const s = localStorage.getItem('user'); me = s ? JSON.parse(s) as SessionUser : null; } catch { me = null; }
      }
      if (me) {
        // normalize: backend may return {id, username} or legacy {user_id}; ensure both
        const raw = me as unknown as Record<string, unknown>;
        const uid = (raw['id'] as string) ?? (raw['user_id'] as string) ?? '';
        const uname = (raw['username'] as string) ?? (raw['user_id'] as string) ?? id;
        if (uid && !raw['id']) raw['id'] = uid;
        if (uname && !raw['username']) raw['username'] = uname;
        if (!raw['user_id']) raw['user_id'] = (uid || uname) as string; // compat
        const normalized = raw as unknown as SessionUser;
        setUser(normalized);
        try { localStorage.setItem('user', JSON.stringify(normalized)); } catch {}
        // also persist stable id for routing/key compat
        try { if (uid) localStorage.setItem('user_id', uid); } catch {}
      } else {
        setUser(null);
      }
    } catch (e) {
      clearTokens();
      setError(e instanceof ApiError ? e.message : 'Login failed. Please try again.');
      throw e;
    }
  }, []);

  const register = useCallback(async (fields: { email: string; password: string; username: string; displayName: string } & Record<string, string>) => {
    setError(null);
    try {
      // support both new shape and legacy shape {user_id,email,password,confirm_password,nickname}
      const email = fields.email;
      const password = fields.password;
      const username = fields.username || fields.user_id || email.split('@')[0];
      const displayName = fields.displayName || fields.nickname || username;
      // merpati-style register
      await apiFetch('/auth/register', { method: 'POST', json: { email, password, username, display_name: displayName } }).catch(async () => {
        // fallback to legacy signup if backend still expects /auth/signup
        await apiFetch('/auth/signup', { method: 'POST', json: { user_id: username, email, password, confirm_password: password, nickname: displayName } });
      });
      await login(username, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Registration failed. Please try again.');
      throw e;
    }
  }, [login]);

  const logout = useCallback(async () => {
    try { await logoutRequest(); } finally {
      try { localStorage.removeItem('user'); } catch {}
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, register: register as AuthContextValue['register'], logout }), [user, loading, error, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
