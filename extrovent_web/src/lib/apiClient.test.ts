import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiFetch,
  clearTokens,
  loginRequest,
  setAccessToken,
  setOnAuthFailure,
  setRefreshToken,
} from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
} as Storage);

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal(
    'localStorage',
    {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    } as Storage,
  );
  for (const k of Object.keys(store)) delete store[k];
  clearTokens();
  setOnAuthFailure(() => {});
  vi.restoreAllMocks();
});

function makeToken(expOffsetSec = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'u', exp: Math.floor(Date.now()/1000) + expOffsetSec }));
  return `${header}.${payload}.sig`;
}

describe('apiClient', () => {
  it('attaches the Bearer header when a token is stored', async () => {
    const tok = makeToken();
    setAccessToken(tok);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { ok: 1 }, error: null }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/user/profile');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${tok}`);
  });

  it('resolves with envelope data and rejects with envelope error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { a: 1 }, error: null })));
    await expect(apiFetch('/x')).resolves.toEqual({ a: 1 });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: false, data: null, error: 'Nope' }, 400)),
    );
    await expect(apiFetch('/x')).rejects.toMatchObject({ message: 'Nope', status: 400 });
  });

  it('surfaces 429 messages with status intact', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: false, data: null, error: 'Too many attempts' }, 429)),
    );
    const err: unknown = await apiFetch('/auth/login').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(429);
  });

  it('refreshes once and retries on 401, then succeeds', async () => {
    setAccessToken(makeToken());
    setRefreshToken('refresh-abc');
    const newTok = makeToken();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'expired' }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { access_token: newTok, refresh_token: 'new-r' }, error: null }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { me: 1 }, error: null }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/user/profile')).resolves.toEqual({ me: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3); // original + refresh + retry
  });

  it('caps retries at one and forces re-login when refresh fails', async () => {
    setAccessToken(makeToken());
    setRefreshToken('dead');
    const onFailure = vi.fn();
    setOnAuthFailure(onFailure);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'revoked' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/user/profile')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2); // original + refresh attempt, no infinite loop
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('login stores the token pair', async () => {
    const tok = makeToken();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          data: { access_token: tok, refresh_token: 'r', token_type: 'Bearer', expires_in: 86400, user: { id: 'u', username: 'u' } },
          error: null,
        }),
      ),
    );
    const data = await loginRequest('u', 'p');
    expect(data.access_token).toBe(tok);

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: {}, error: null }));
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/user/profile');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${tok}`);
  });

  it('does not attempt refresh on login 401 (no stored token yet)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, data: null, error: 'Invalid password' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loginRequest('u', 'wrong')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not force JSON content-type when sending FormData', async () => {
    const fd = new FormData();
    fd.append('a', '1');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: {}, error: null }));
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/upload', { method: 'POST', formData: fd });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(init.body).toBe(fd);
  });

  it('still sends JSON content-type for json bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: {}, error: null }));
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/x', { method: 'POST', json: { a: 1 } });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});
