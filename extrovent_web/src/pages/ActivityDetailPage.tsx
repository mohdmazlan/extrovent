import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { deleteActivity, getActivity, getActivityId, getActivityTitle, parseCoordinate } from '../lib/activities';
import type { Activity } from '../lib/activities';
import { useAuth } from '../auth/AuthContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import PlaceMap from '../components/PlaceMap';
import styles from './ActivityDetailPage.module.scss';

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) throw new Error('Missing id');
        const data = await getActivity(id);
        setActivity(data);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load activity.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onDelete = useCallback(async () => {
    if (!id || deleting) return;
    if (!window.confirm('Delete this activity? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteActivity(id);
      navigate('/activities', { replace: true });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not delete activity.');
      setDeleting(false);
    }
  }, [id, deleting, navigate]);

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

  if (error || !activity) {
    return (
      <div className={styles.alert} role="alert">
        <p>{error ?? 'Activity not found.'}</p>
        <Link to="/activities" className={styles.breadcrumb} style={{ marginTop: '12px' }}>
          ← Back to Activities
        </Link>
      </div>
    );
  }

  const aid = getActivityId(activity);
  const title = getActivityTitle(activity);
  const cat = activity.category ?? activity.category_activity ?? 'Others';
  const pos = parseCoordinate(activity.coordinate);
  const isOwner = !!user && !!activity.user_id && user.user_id === activity.user_id;

  return (
    <div>
      <Link to="/activities" className={styles.breadcrumb}>
        ← Back to Activities
      </Link>

      <Card variant="elevated">
        <div className={styles.heroImage}>🎯</div>
        <div className={styles.heroContent}>
          <div className={styles.badgeRow}>
            <Badge variant="amber">{cat}</Badge>
            {aid !== undefined && <Badge variant="stone">ID #{aid}</Badge>}
          </div>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            {activity.coordinate && <span>📍 {activity.coordinate}</span>}
            {activity.fee !== null && activity.fee !== undefined && <span>💰 {activity.fee ? `$${activity.fee}` : 'Free'}</span>}
            <span>👤 by {activity.nickname || activity.user_id || 'Unknown'}</span>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {activity.description && <div className={styles.description}>{activity.description}</div>}

          {pos ? (
            <div className={styles.mapWrapper}>
              <PlaceMap picked={pos} center={pos} />
            </div>
          ) : null}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Ratings</h3>
            <p className={styles.placeholderText}>No ratings yet. Be the first to rate this activity.</p>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Posts</h3>
            <p className={styles.placeholderText}>No posts yet for this activity.</p>
          </div>

          <div className={styles.ownerActions}>
            <Link to={`/activities/${aid}/gallery`}>
              <Button variant="secondary" size="sm">View gallery</Button>
            </Link>
            {isOwner && (
              <>
                <Link to={`/activities/${aid}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => void onDelete()} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
