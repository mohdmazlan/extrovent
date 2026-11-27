import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listNotifications, normalizeType } from '../lib/notifications';
import type { NotificationItem } from '../lib/notifications';
import { friendRequest } from '../lib/friends';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import { formatTime } from '../lib/chat';
import styles from './NotificationsPage.module.scss';

function resolveTarget(n: NotificationItem): { label: string; to: string | null } {
  const t = normalizeType(n);
  // try to parse ids from various fields
  const raw = n.description ?? n.message ?? '';
  // invitation often contains event id in sid or description
  if (t === 'invitation') {
    const eid = (n.sid ?? n.id ?? '').toString();
    // try numeric from description
    const m = raw.match(/(\d+)/);
    const id = m ? m[1] : eid;
    if (id) return { label: 'View event', to: `/events/${id}` };
    return { label: 'View event', to: '/events' };
  }
  if (t === 'chat_message') {
    // room_id often in sid or user_ids
    const roomId = String(n.sid ?? n.user_ids ?? n.user_id ?? '0');
    return { label: 'Open chat', to: `/chat/${encodeURIComponent(roomId)}` };
  }
  if (t === 'comment') {
    const sid = String(n.sid ?? n.id);
    return { label: 'View comments', to: `/posts/${encodeURIComponent(sid)}/comments` };
  }
  if (t === 'friend_request') {
    const uid = String(n.user_id ?? n.user_ids ?? '');
    return { label: 'View profile', to: uid ? `/users/${encodeURIComponent(uid)}` : null };
  }
  return { label: 'Open', to: null };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [handled, setHandled] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listNotifications();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load notifications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFriend(n: NotificationItem, action: 'accept' | 'decline') {
    const uid = String(n.user_id ?? n.user_ids ?? '');
    if (!uid) return;
    setBusyId(n.id);
    const prev = new Set(handled);
    try {
      await friendRequest(action === 'accept' ? 'accept' : 'decline', uid);
      const next = new Set(prev);
      next.add(n.id);
      setHandled(next);
    } catch {
      // keep error silent? Show alert
      setError('Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Notifications</h1>
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 72 }}>
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Notifications</h1>
        <div className={styles.alert} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Notifications</h1>
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up." />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Notifications</h1>
      <ul className={styles.list}>
        {items.map((n) => {
          const t = normalizeType(n);
          const target = resolveTarget(n);
          const isHandled = handled.has(n.id);
          const text = n.description ?? n.message ?? `Notification #${n.id}`;
          const time = formatTime(n.datetime);
          return (
            <li
              key={n.id}
              className={`${styles.row} ${n.read ? '' : styles.unread}`}
              onClick={() => {
                if (target.to) navigate(target.to);
              }}
              role={target.to ? 'button' : undefined}
              tabIndex={target.to ? 0 : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && target.to) navigate(target.to);
              }}
            >
              <span className={styles.icon}>
                {t === 'friend_request' ? '👥' : t === 'invitation' ? '📅' : t === 'chat_message' ? '💬' : t === 'comment' ? '💭' : '🔔'}
              </span>
              <span className={styles.body}>
                <span className={styles.text}>{text}</span>
                <span className={styles.meta}>
                  <span className={styles.type}>{t}</span>
                  {time && <span className={styles.time}>{time}</span>}
                </span>
              </span>
              <span className={styles.actions} onClick={(e) => e.stopPropagation()}>
                {t === 'friend_request' && !isHandled ? (
                  <>
                    <Button variant="primary" size="sm" disabled={busyId === n.id} onClick={() => void handleFriend(n, 'accept')}>
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busyId === n.id} onClick={() => void handleFriend(n, 'decline')}>
                      Decline
                    </Button>
                  </>
                ) : t === 'friend_request' && isHandled ? (
                  <span className={styles.done}>Done</span>
                ) : target.to ? (
                  <Link to={target.to} className={styles.viewLink} onClick={(e) => e.stopPropagation()}>
                    {target.label}
                  </Link>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
