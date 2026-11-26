import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getEvent, joinEvent } from '../lib/events';
import type { EventItem } from '../lib/events';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import styles from './EventDetailPage.module.scss';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setEvent(await getEvent(Number(id)));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load event.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onJoin = useCallback(async () => {
    if (!id || joining) return;
    setJoining(true);
    setJoinMsg(null);
    try {
      await joinEvent(Number(id));
      setJoinMsg('Joined! See you on the trail 🎉');
    } catch (e) {
      setJoinMsg(e instanceof ApiError ? e.message : 'Could not join event.');
    } finally {
      setJoining(false);
    }
  }, [id, joining]);

  if (loading) {
    return (
      <div>
        <Skeleton variant="title" width="60%" />
        <div style={{ height: '12px' }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.alert} role="alert">
        <p>{error ?? 'Event not found.'}</p>
        <Link to="/events" className={styles.breadcrumb} style={{ marginTop: '12px' }}>
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/events" className={styles.breadcrumb}>
        ← Back to Events
      </Link>

      <Card variant="elevated">
        <div className={styles.heroImage}>⛺</div>
        <div className={styles.heroContent}>
          <div className={styles.badgeRow}>
            <Badge variant="amber">{event.category}</Badge>
            <Badge variant="stone">ID #{event.event_id}</Badge>
          </div>
          <h1 className={styles.title}>{event.title}</h1>
          <div className={styles.meta}>
            <span>📅 {event.start_date} at {event.start_time}</span>
            <span>💰 {event.fee ? `$${event.fee}` : 'Free'}</span>
            <span>👤 by {event.nickname || event.user_id}</span>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div className={styles.description}>{event.description}</div>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => void onJoin()} disabled={joining}>
              {joining ? 'Joining…' : 'Join this adventure'}
            </Button>
            {joinMsg && <span className={styles.joinMsg}>{joinMsg}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}
