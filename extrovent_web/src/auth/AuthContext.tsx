import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, apiFetch, clearTokens, getRefreshToken, loginRequest, logoutRequest, setOnAuthFailure } from '../lib/apiClient';

export interface SessionUser {
  user_id: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (userId: string, password: string) => Promise<void>;
  register: (fields: { user_id: string; email: string; password: string; confirm_password: string; nickname?: string; gender?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forceLogoutView = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(forceLogoutView);
    // Startup session check: a stored refresh token means "maybe logged in".
    // Validate it with a light protected call; anything failing lands on login.
    (async () => {
      try {
        if (!getRefreshToken()) return;
        const me = await apiFetch<SessionUser>('/user/profile');
        setUser(me);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => setOnAuthFailure(() => {});
  }, [forceLogoutView]);

  const login = useCallback(async (userId: string, password: string) => {
    setError(null);
    try {
      await loginRequest(userId, password);
      const me = await apiFetch<SessionUser>('/user/profile');
      setUser(me);
    } catch (e) {
      clearTokens();
      setError(e instanceof ApiError ? e.message : 'Login failed. Please try again.');
      throw e;
    }
  }, []);

  const register = useCallback(async (fields: { user_id: string; email: string; password: string; confirm_password: string; nickname?: string; gender?: string }) => {
    setError(null);
    try {
      await apiFetch('/auth/signup', { method: 'POST', json: fields });
      // Auto-login after successful signup for a smooth first run.
      await login(fields.user_id, fields.password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Registration failed. Please try again.');
      throw e;
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
