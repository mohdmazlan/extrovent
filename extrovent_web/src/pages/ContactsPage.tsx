import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listFriends } from '../lib/friends';
import type { FriendUser } from '../lib/friends';
import { Input } from '../components/Input';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './FindFriendsPage.module.scss';

export default function ContactsPage() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listFriends();
        if (!cancelled) setUsers(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load contacts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const hay = `${u.nickname ?? ''} ${u.user_id ?? ''} ${u.email ?? ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [users, q]);

  return (
    <div className={styles.wrap}>
      <Link to="/find-friends" className={styles.breadcrumb}>
        ← Find Friends
      </Link>
      <div className={styles.header}>
        <h1>Contacts</h1>
        <p>Your friends — filter locally</p>
      </div>

      <div className={styles.searchBar}>
        <Input placeholder="Filter contacts…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter contacts" />
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.rowSkeleton}>
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📒" title="No contacts" description={q ? `No matches for "${q}"` : 'You have no contacts yet.'} />
      ) : (
        <ul className={styles.list}>
          {filtered.map((u) => {
            const display = u.nickname || u.user_id;
            const initial = display[0]?.toUpperCase() ?? '?';
            return (
              <li key={u.user_id} className={styles.row}>
                <Link to={`/users/${encodeURIComponent(u.user_id)}`} className={styles.rowLink}>
                  <span className={styles.avatar}>{u.avatar ? <img src={u.avatar} alt={display} /> : initial}</span>
                  <span className={styles.info}>
                    <span className={styles.name}>{display}</span>
                    <span className={styles.sub}>{u.email ?? `@${u.user_id}`}</span>
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
