import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listUserPosts } from './posts';
import { clearTokens } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const store: Record<string,string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k]=v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for(const k of Object.keys(store)) delete store[k]; },
} as Storage);

beforeEach(() => {
  for(const k of Object.keys(store)) delete store[k];
  clearTokens();
  vi.restoreAllMocks();
});

describe('listUserPosts', () => {
  it('falls back to client filter when user_id endpoints 404', async () => {
    const allPosts = [{ post_id: 'uuid-1', user_id: 'alice', caption: 'a' }, { post_id: 'uuid-2', user_id: 'bob', caption: 'b' }];
    const fetchMock = vi.fn()
      // first try /post/my?user_id -> 404
      .mockResolvedValueOnce(jsonResponse({ success:false, data:null, error:'not found' }, 404))
      // second try /post/list?user_id -> 404
      .mockResolvedValueOnce(jsonResponse({ success:false, data:null, error:'not found' }, 404))
      // fallback /post/list?page= -> success
      .mockResolvedValueOnce(jsonResponse({ success:true, data: allPosts, error:null }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await listUserPosts('alice', 1);
    expect(res).toEqual([{ post_id: 'uuid-1', user_id: 'alice', caption: 'a' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns data from /post/my when available', async () => {
    const mine = [{ post_id: 'uuid-10', user_id: 'alice', caption: 'mine' }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success:true, data: mine, error:null }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await listUserPosts('alice', 1);
    expect(res).toEqual(mine);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0] as string).toContain('/post/my');
  });
});
