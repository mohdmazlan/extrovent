import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FriendUser, FriendStatus } from '../lib/friends';
import { friendRequest, resolveFriendStatus } from '../lib/friends';
import { apiFetch } from '../lib/apiClient';
import Button from './Button';

interface Props {
  targetUser: FriendUser;
  viewerId: string;
  onChange?: () => void;
}

export default function FriendButton({ targetUser, viewerId, onChange }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FriendStatus>(() => resolveFriendStatus(targetUser, viewerId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep initial viewerId target; if parent changes we don't auto-reset to avoid flicker
  async function handle(action: 'add' | 'accept' | 'remove' | 'decline', optimistic: FriendStatus) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const prev = status;
    setStatus(optimistic);
    try {
      await friendRequest(action, targetUser.user_id);
      onChange?.();
    } catch (e) {
      setStatus(prev);
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleMessage() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Try to create/get private room
      try {
        const res = await apiFetch<{ room_id: string } | string>('/chat/room', {
          method: 'POST',
          json: { user_id: targetUser.user_id },
        });
        const roomId = typeof res === 'string' ? res : (res as { room_id: string }).room_id ?? String(res);
        if (roomId) {
          navigate(`/chat/${roomId}`);
          return;
        }
      } catch {
        // fallback
      }
      navigate('/chat');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '8px' }}>
          {error}
        </div>
      )}
      {status === 'none' && (
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void handle('add', 'pending_outgoing')}>
          {busy ? 'Sending…' : 'Add Friend'}
        </Button>
      )}
      {status === 'pending_outgoing' && (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handle('remove', 'none')}>
          {busy ? 'Cancelling…' : 'Cancel Request'}
        </Button>
      )}
      {status === 'pending_incoming' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void handle('accept', 'friends')}>
            Accept
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handle('decline', 'none')}>
            Decline
          </Button>
        </div>
      )}
      {status === 'friends' && (
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleMessage()}>
          Message
        </Button>
      )}
    </div>
  );
}
