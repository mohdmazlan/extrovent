import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listActivities, getActivityTitle, getActivityId } from '../lib/activities';
import type { Activity } from '../lib/activities';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './ActivitiesPage.module.scss';

type Tab = 'all' | 'mine' | 'joined';

function badgeVariant(category?: string | null): 'forest' | 'amber' | 'sky' {
  const c = (category ?? '').toLowerCase();
  if (['hiking', 'camping', 'cycling', 'hangout'].includes(c)) return 'forest';
  if (['rafting', 'fishing'].includes(c)) return 'sky';
  return 'amber';
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        t === 'mine' ? await listActivities(undefined, true, false) : t === 'joined' ? await listActivities(undefined, false, true) : await listActivities(undefined, false, false);
      setActivities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load activities.');
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
          <h1>Activities</h1>
          <Link to="/activities/new">
            <Button variant="primary">+ New activity</Button>
          </Link>
        </div>
        <div className={styles.tabs}>
          {(['all', 'mine', 'joined'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`${styles.tab} ${tab === t ? styles.active : ''}`}
            >
              {t === 'all' ? 'All' : t === 'mine' ? 'Mine' : 'Joined'}
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
      ) : activities.length === 0 && !error ? (
        <EmptyState
          icon="🎯"
          title={tab === 'mine' ? 'No activities yet' : tab === 'joined' ? 'No joined activities' : 'No activities found'}
          description={
            tab === 'all'
              ? 'Be the first to create an outdoor activity!'
              : tab === 'mine'
                ? 'Create your first activity to see it here.'
                : 'Join activities to see them here.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {activities.map((a) => {
            const aid = getActivityId(a);
            const title = getActivityTitle(a);
            const cat = a.category ?? a.category_activity ?? 'Others';
            return (
              <Link key={aid ?? title} to={aid ? `/activities/${aid}` : '/activities'} className={styles.card}>
                <Badge variant={badgeVariant(cat)}>{cat}</Badge>
                <h3 className={styles.cardTitle}>{title}</h3>
                <div className={styles.meta}>
                  {a.coordinate ? <span>📍 {a.coordinate}</span> : a.business_profile_id ? <span>🏢 Business #{a.business_profile_id}</span> : <span>📍 No location</span>}
                </div>
                {a.description && (
                  <p className={styles.cardDesc}>{a.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
