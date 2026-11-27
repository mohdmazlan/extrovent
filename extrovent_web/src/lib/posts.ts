import { apiFetch } from './apiClient';

export interface Post {
  post_id: string;
  caption: string;
  banner?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  user_id?: string;
  /** new DB field — prefer over user_id when present */
  username?: string;
  id?: string;
  total_likes?: number;
  total_comment?: number;
  sliked?: string | null;
  date?: string;
}

export interface PostComment {
  comment_id?: number;
  post_id: string;
  user_id: string;
  username?: string;
  comment: string;
  nickname?: string | null;
  avatar?: string | null;
  datetime?: string;
}

export function listPosts(page = 1): Promise<Post[]> {
  return apiFetch<Post[]>(`/post/list?page=${page}`);
}

export async function listUserPosts(userId: string, page = 1, limit = 20): Promise<Post[]> {
  const q = `user_id=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`;
  try {
    const data = await apiFetch<Post[]>(`/post/my?${q}`);
    if (Array.isArray(data)) return data;
  } catch {}
  try {
    const data = await apiFetch<Post[]>(`/post/list?${q}`);
    if (Array.isArray(data)) return data;
  } catch {}
  // fallback: client-filter global list
  const all = await listPosts(page);
  return all.filter((p) => (p.user_id || '') === userId);
}

export function toggleLike(postId: string): Promise<{ success: boolean }> {
  return apiFetch('/post/like', { method: 'POST', json: { post_id: postId } });
}

export function getComments(postId: string): Promise<PostComment[]> {
  return apiFetch<PostComment[]>(`/post/comments?post_id=${encodeURIComponent(postId)}`);
}

export function addComment(postId: string, comment: string): Promise<{ success: boolean }> {
  return apiFetch('/post/comment', { method: 'POST', json: { post_id: postId, comment } });
}
