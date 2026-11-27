import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getBusinessProfile, isApproved, getBusinessName } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import { useAuth } from '../auth/AuthContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import styles from './BusinessProfilePage.module.scss';

export default function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [bp, setBp] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error('Missing id');
        setBp(await getBusinessProfile(id));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load business profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Skeleton variant="title" width="40%" />
        <div style={{ height: '16px' }} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error || !bp) {
    return (
      <div className={styles.alert} role="alert">
        <p>{error ?? 'Business not found.'}</p>
        <Link to="/business" className={styles.breadcrumb} style={{ marginTop: '12px', justifyContent: 'center' }}>
          ← Back to Businesses
        </Link>
      </div>
    );
  }

  const approved = isApproved(bp);
  const name = getBusinessName(bp);
  const regNo = bp.reg_no ?? bp.registration_number ?? '—';
  const isOwner = Boolean(user && bp.user_id && user.user_id === bp.user_id);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div>
      <Link to="/business" className={styles.breadcrumb}>
        ← Back to Businesses
      </Link>

      <Card variant="elevated">
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            {bp.avatar ? (
              <img src={bp.avatar} alt={name} className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar}>{initial}</div>
            )}
          </div>
          <div className={styles.headerText}>
            <div className={styles.badgeRow}>
              <Badge variant={approved ? 'forest' : 'stone'}>{approved ? 'Verified' : 'Pending'}</Badge>
              {bp.create_date && <span className={styles.date}>{new Date(bp.create_date).toLocaleDateString()}</span>}
            </div>
            <h1>{name}</h1>
            <div className={styles.regNo}>Reg. No. {regNo}</div>
            {bp.description && <p className={styles.description}>{bp.description}</p>}
          </div>
          {isOwner && (
            <Link to={`/business/${id}/edit`} className={styles.editBtn}>
              <Button variant="secondary" size="sm">Edit</Button>
            </Link>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.placesSection}>
            <h3>Places</h3>
            {approved ? (
              <Link to={`/places?business=${id}`} className={styles.placesLink}>
                View places for this business →
              </Link>
            ) : (
              <div className={styles.pendingMsg}>Places will be available once your business is verified.</div>
            )}
            <div className={styles.mapPlaceholder}>🗺️ Places map placeholder</div>
            {approved && (
              <Link to={`/places?business=${id}`} className={styles.mapLink}>
                Open map view
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
