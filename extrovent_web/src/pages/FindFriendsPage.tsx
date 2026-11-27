import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { findUsers, listFriends } from '../lib/friends';
import type { FriendUser } from '../lib/friends';
import { Input } from '../components/Input';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './FindFriendsPage.module.scss';

export default function FindFriendsPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = debounced ? await findUsers(debounced) : await listFriends();
        // When no query, spec says listFriends vs findUsers(q) — fallback to findUsers if list empty
        if (!cancelled) setUsers(data);
      } catch (e) {
        if (!cancelled) {
          // fallback to findUsers without q if listFriends fails
          try {
            const fallback = await findUsers(debounced || undefined);
            if (!cancelled) setUsers(fallback);
          } catch {
            setError(e instanceof ApiError ? e.message : 'Failed to load users');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className={styles.wrap}>
      <Link to="/search" className={styles.breadcrumb}>
        ← Back to Search
      </Link>
      <div className={styles.header}>
        <h1>Find Friends</h1>
        <p>Discover people and add them as friends</p>
      </div>

      <div className={styles.searchBar}>
        <Input placeholder="Search by name or user id…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
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
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" description={debounced ? `No results for "${debounced}"` : 'No users available.'} />
      ) : (
        <ul className={styles.list}>
          {users.map((u) => {
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
