import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getEvent } from '../lib/events';
import type { EventItem } from '../lib/events';
import { inviteToEvent, listContacts } from '../lib/friends';
import type { FriendUser } from '../lib/friends';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import styles from './InvitePage.module.scss';

export default function InvitePage() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ?? '';
  const [event, setEvent] = useState<EventItem | null>(null);
  const [contacts, setContacts] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid event id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [ev, ct] = await Promise.all([getEvent(eventId), listContacts()]);
        if (!cancelled) {
          setEvent(ev);
          setContacts(ct);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : 'Failed to load';
          // Distinguish 404 for event validation
          if (e instanceof ApiError && e.status === 404) setError('Event not found (404)');
          else setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, eventId]);

  async function handleInvite(userId: string) {
    if (busyId) return;
    setBusyId(userId);
    setInviteError(null);
    const prev = new Set(invited);
    const next = new Set(prev);
    next.add(userId);
    setInvited(next);
    try {
      await inviteToEvent(eventId, userId);
    } catch (e) {
      setInvited(prev);
      setInviteError(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <Skeleton variant="title" width="40%" />
        <div style={{ height: 16 }} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.wrap}>
        <Link to="/events" className={styles.breadcrumb}>
          ← Back to Events
        </Link>
        <div className={styles.notFound}>
          <h2>Event not found</h2>
          <p>{error ?? 'This event does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Link to={`/events/${eventId}`} className={styles.breadcrumb}>
        ← Back to Event
      </Link>
      <div className={styles.header}>
        <h1>Invite to {event.title ?? `Event #${eventId}`}</h1>
        <p>Choose contacts to invite</p>
      </div>

      {inviteError && (
        <div className={styles.alert} role="alert">
          {inviteError}
        </div>
      )}

      {contacts.length === 0 ? (
        <div className={styles.empty}>No contacts to invite.</div>
      ) : (
        <ul className={styles.list}>
          {contacts.map((u) => {
            const display = u.nickname || u.user_id;
            const initial = display[0]?.toUpperCase() ?? '?';
            const isInvited = invited.has(u.user_id);
            return (
              <li key={u.user_id} className={styles.row}>
                <Link to={`/users/${encodeURIComponent(u.user_id)}`} className={styles.userLink}>
                  <span className={styles.avatar}>{u.avatar ? <img src={u.avatar} alt={display} /> : initial}</span>
                  <span className={styles.info}>
                    <span className={styles.name}>{display}</span>
                    <span className={styles.sub}>{u.email ?? `@${u.user_id}`}</span>
                  </span>
                </Link>
                {isInvited ? (
                  <Button variant="secondary" size="sm" disabled>
                    Invited
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" disabled={busyId === u.user_id} onClick={() => void handleInvite(u.user_id)}>
                    {busyId === u.user_id ? 'Inviting…' : 'Invite'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
