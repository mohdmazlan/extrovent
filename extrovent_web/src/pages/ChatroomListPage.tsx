import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listRooms, formatTime } from '../lib/chat';
import type { ChatRoom } from '../lib/chat';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './ChatroomListPage.module.scss';

const GLOBAL_ROOM: ChatRoom = {
  room_id: '0',
  nickname: 'Public Chat',
  message: 'Global room — everyone can chat here',
  datetime: undefined,
};

export default function ChatroomListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listRooms();
        if (cancelled) return;
        // Ensure pinned Global room on top
        const hasGlobal = data.some((r) => String(r.room_id) === '0');
        const ordered = hasGlobal ? data : [GLOBAL_ROOM, ...data];
        // Sort: global first, then rest by datetime desc (fallback stable)
        ordered.sort((a, b) => {
          if (String(a.room_id) === '0') return -1;
          if (String(b.room_id) === '0') return 1;
          return 0;
        });
        setRooms(ordered);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Failed to load chats');
          // still show global
          setRooms([GLOBAL_ROOM]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Socket placeholder: on new_message append would be handled here when wiring socket.io

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Chat</h1>
        <p>Your conversations</p>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState icon="💬" title="No conversations yet" description="Start a chat from a friend's profile. Public Chat is always available." />
      ) : (
        <ul className={styles.list}>
          {rooms.map((r) => {
            const roomId = String(r.room_id);
            const isGlobal = roomId === '0';
            const title = isGlobal ? 'Public Chat' : r.nickname || r.user_id || `Room ${roomId}`;
            const last = r.message ?? r.lastMessage ?? '';
            const time = formatTime(r.datetime);
            const initial = title[0]?.toUpperCase() ?? '?';
            return (
              <li key={roomId} className={`${styles.row} ${isGlobal ? styles.pinned : ''}`}>
                <Link to={`/chat/${encodeURIComponent(roomId)}`} className={styles.rowLink}>
                  <span className={styles.avatar}>
                    {r.avatar ? <img src={r.avatar} alt={title} /> : isGlobal ? '🌍' : initial}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.titleRow}>
                      <span className={styles.title}>{title}</span>
                      {time && <span className={styles.time}>{time}</span>}
                    </span>
                    {last ? <span className={styles.last}>{last}</span> : <span className={styles.lastMuted}>{isGlobal ? 'Tap to open global chat' : 'No messages yet'}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
