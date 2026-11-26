import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getPlace, parseCoordinate } from '../lib/places';
import type { Place } from '../lib/places';
import PlaceMap from '../components/PlaceMap';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import styles from './PlaceDetailPage.module.scss';

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPlace(await getPlace(Number(id)));
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
    </div>
  );
}
