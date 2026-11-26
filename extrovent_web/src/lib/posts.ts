import { apiFetch } from './apiClient';

export interface Post {
  post_id: number;
  caption: string;
  banner?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  user_id?: string;
  total_likes?: number;
  total_comment?: number;
  sliked?: string | null;
  date?: string;
}

export interface PostComment {
  comment_id?: number;
  post_id: number;
  user_id: string;
  comment: string;
  nickname?: string | null;
  avatar?: string | null;
  datetime?: string;
}

export function listPosts(page = 1): Promise<Post[]> {
  return apiFetch<Post[]>(`/post/list?page=${page}`);
}

export function toggleLike(postId: number): Promise<{ success: boolean }> {
  return apiFetch('/post/like', { method: 'POST', json: { post_id: postId } });
}

export function getComments(postId: number): Promise<PostComment[]> {
  return apiFetch<PostComment[]>(`/post/comments?post_id=${postId}`);
}

export function addComment(postId: number, comment: string): Promise<{ success: boolean }> {
  return apiFetch('/post/comment', { method: 'POST', json: { post_id: postId, comment } });
}
