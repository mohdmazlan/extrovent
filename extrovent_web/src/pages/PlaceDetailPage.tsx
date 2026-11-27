import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getPlace, parseCoordinate } from '../lib/places';
import type { Place } from '../lib/places';
import { getPlaceRatings, ratePlace } from '../lib/ratings';
import type { Rating } from '../lib/ratings';
import { apiFetch } from '../lib/apiClient';
import PlaceMap from '../components/PlaceMap';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import RatingDialog from '../components/RatingDialog';
import RatingList from '../components/RatingList';
import styles from './PlaceDetailPage.module.scss';

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showRate, setShowRate] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error('Missing id');
        setPlace(await getPlace(id));
        try { setRatings(await getPlaceRatings(id)); } catch { }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load place.');
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

  if (error || !place) {
    return (
      <div className={styles.alert} role="alert">
        <p>{error ?? 'Place not found.'}</p>
        <Link to="/places" className={styles.breadcrumb} style={{ marginTop: '12px', justifyContent: 'center' }}>
          ← Back to Places
        </Link>
      </div>
    );
  }

  const pos = parseCoordinate(place.coordinate);

  const avg = ratings.length ? (ratings.reduce((s, r) => s + (r.rating ?? r.stars ?? 0), 0) / ratings.length) : 0;

  return (
    <div>
      <Link to="/places" className={styles.breadcrumb}>
        ← Back to Places
      </Link>

      <Card variant="elevated">
        <div className={styles.header}>
          <div className={styles.meta} style={{ marginBottom: '12px' }}>
            <Badge variant={place.category_location === 'restaurant' ? 'amber' : place.category_location === 'gym' ? 'sky' : 'forest'}>
              {place.category_location || 'others'}
            </Badge>
            {place.company_name && <Badge variant="stone">{place.company_name}</Badge>}
          </div>
          <h1>{place.name}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/places/${id}/edit`)}>Edit</Button>
            <Link to={`/places/${id}/gallery`}><Button variant="ghost" size="sm">Gallery</Button></Link>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={async () => {
              if (!confirm('Delete this place?')) return;
              setDeleting(true);
              try { await apiFetch(`/place/delete?place_id=${id}`, { method: 'DELETE' }); navigate('/places'); } catch (e) { alert(e instanceof ApiError ? e.message : 'Delete failed'); } finally { setDeleting(false); }
            }}>{deleting ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>
        <div className={styles.body}>
          <p>{place.description}</p>
          {pos ? (
            <div className={styles.mapWrapper}>
              <PlaceMap places={[place]} center={pos} />
            </div>
          ) : (
            <div className={styles.emptyMap}>No map location available for this place.</div>
          )}
        </div>
      </Card>

      <div style={{ marginTop: '16px' }}>
        <Card variant="elevated">
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>Ratings {ratings.length ? `· ${avg.toFixed(1)} ★ (${ratings.length})` : '· No ratings yet'}</h3>
              <Button variant="primary" size="sm" onClick={() => setShowRate(true)}>Rate</Button>
            </div>
            <div style={{ marginTop: '16px' }}><RatingList ratings={ratings} /></div>
          </div>
        </Card>
      </div>
      <RatingDialog open={showRate} onClose={() => setShowRate(false)} onSubmit={async (r, c) => {
        if (!id) return;
        await ratePlace(id, r, c);
        setRatings(await getPlaceRatings(id));
      }} />
    </div>
  );
}
