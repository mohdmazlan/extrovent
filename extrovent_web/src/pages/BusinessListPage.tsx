import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listBusinessProfiles, isApproved, getBusinessId, getBusinessName } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './BusinessListPage.module.scss';

export default function BusinessListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setProfiles(await listBusinessProfiles());
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load businesses.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className={styles.header}>
        <h1>Businesses</h1>
        <Link to="/business/new">
          <Button variant="primary">+ New business</Button>
        </Link>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.card}>
              <Skeleton variant="title" width="60%" />
              <div style={{ height: '8px' }} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      ) : profiles.length === 0 && !error ? (
        <EmptyState
          icon="🏢"
          title="No businesses yet"
          description="Create your first business profile to start managing places and events."
          actionLabel="+ New business"
          onAction={() => navigate('/business/new')}
        />
      ) : (
        <div className={styles.grid}>
          {profiles.map((bp) => {
            const bid = getBusinessId(bp);
            const name = getBusinessName(bp);
            const approved = isApproved(bp);
            const regNo = bp.reg_no ?? bp.registration_number ?? '—';
            return (
              <Link key={String(bid ?? name)} to={`/business/${bid}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <Badge variant={approved ? 'forest' : 'stone'}>{approved ? 'Verified' : 'Pending'}</Badge>
                  {bp.create_date && (
                    <span className={styles.date}>{new Date(bp.create_date).toLocaleDateString()}</span>
                  )}
                </div>
                <h3 className={styles.cardTitle}>{name}</h3>
                <div className={styles.meta}>{regNo}</div>
                {bp.description && <p className={styles.desc}>{bp.description}</p>}
              </Link>
            );
          })}
        </div>
      )}

      <Link to="/business/new" className={styles.fab} aria-label="New business">
        +
      </Link>
    </div>
  );
}
