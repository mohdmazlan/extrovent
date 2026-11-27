import { apiFetch } from './apiClient';

export interface FriendUser {
  user_id: string;
  user_id1?: string;
  nickname?: string | null;
  email?: string | null;
  avatar?: string | null;
  approved?: number | string | null;
  total_posts?: number;
  total_friends?: number;
  posts?: number;
  friends?: number;
}

export type FriendStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends';

export function resolveFriendStatus(u: FriendUser, viewerId: string): FriendStatus {
  const approved = u.approved;
  if (approved === 1 || approved === '1' || approved === 1.0) return 'friends';
  if (approved == null) return 'none';
  // app ViewProfileActivity: pending + user_id == user_id1 -> incoming else outgoing
  const isIncoming = u.user_id === u.user_id1;
  // we fallback to interpreting approved as pending string
  if (String(approved).toLowerCase().includes('pending')) {
    return isIncoming ? 'pending_incoming' : 'pending_outgoing';
  }
  // If viewer is the requester (u.user_id1 == viewerId) then outgoing
  if (u.user_id1 && u.user_id1 === viewerId) return 'pending_outgoing';
  return 'pending_incoming';
}

export function getProfileById(userId: string): Promise<FriendUser> {
  return apiFetch<FriendUser>(`/user/view?user_id=${encodeURIComponent(userId)}`);
}

export function listFriends(): Promise<FriendUser[]> {
  return apiFetch<FriendUser[]>('/friend/list');
}

export function findUsers(q?: string): Promise<FriendUser[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<FriendUser[]>(`/friend/find${qs}`);
}

export function listContacts(): Promise<FriendUser[]> {
  return apiFetch<FriendUser[]>('/friend/list');
}

export function friendRequest(action: 'add' | 'accept' | 'remove' | 'decline', targetUserId: string): Promise<unknown> {
  const map: Record<string, string> = { add: 'add', accept: 'accept', remove: 'remove', decline: 'remove' };
  return apiFetch('/friend/request', {
    method: 'POST',
    json: { action: map[action], user_id: targetUserId },
  });
}

export function inviteToEvent(eventId: string, userId: string): Promise<unknown> {
  return apiFetch('/event/invite', { method: 'POST', json: { event_id: eventId, user_id: userId } });
}
