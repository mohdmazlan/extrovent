import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getLikedEvents, getMyEvents, listEvents } from '../lib/events';
import type { EventItem } from '../lib/events';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './EventsPage.module.scss';

type Tab = 'all' | 'liked' | 'mine';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        t === 'liked' ? await getLikedEvents() : t === 'mine' ? await getMyEvents() : await listEvents();
      setEvents(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Events</h1>
          <Link to="/events/new">
            <Button variant="primary">+ New event</Button>
          </Link>
        </div>
        <div className={styles.tabs}>
          {(['all', 'liked', 'mine'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`${styles.tab} ${tab === t ? styles.active : ''}`}
            >
              {t === 'all' ? 'All' : t === 'liked' ? 'Liked' : 'Mine'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.card}>
              <Skeleton variant="title" />
              <div style={{ height: '8px' }} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      ) : events.length === 0 && !error ? (
        <EmptyState
          icon="⛺"
          title={tab === 'liked' ? 'No liked events' : tab === 'mine' ? 'No events yet' : 'No events found'}
          description={
            tab === 'all'
              ? 'Be the first to create an outdoor adventure!'
              : tab === 'liked'
                ? 'Like events to save them here.'
                : 'Create your first event to see it here.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {events.map((e) => (
            <Link key={e.event_id} to={`/events/${e.event_id}`} className={styles.card}>
              <Badge variant="amber">{e.category}</Badge>
              <h3 className={styles.cardTitle}>{e.title}</h3>
              <div className={styles.meta}>
                <span>📅 {e.start_date} {e.start_time}</span>
                <span>·</span>
                <span>by {e.nickname || e.user_id}</span>
              </div>
              {e.description && <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
