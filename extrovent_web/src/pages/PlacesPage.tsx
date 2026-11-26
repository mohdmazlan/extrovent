import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getMyPlaces, listPlaces } from '../lib/places';
import type { Place } from '../lib/places';
import PlaceMap from '../components/PlaceMap';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './PlacesPage.module.scss';

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mine: boolean) => {
    setLoading(true);
    setError(null);
    try {
      setPlaces(mine ? await getMyPlaces() : await listPlaces());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load places.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(mineOnly);
  }, [load, mineOnly]);

  return (
    <div>
      <div className={styles.header}>
        <h1>Places</h1>
        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className={`${styles.tab} ${!mineOnly ? styles.active : ''}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className={`${styles.tab} ${mineOnly ? styles.active : ''}`}
          >
            Mine
          </button>
        </div>
        <Link to="/places/new" style={{ marginLeft: 'auto' }}>
          <Button variant="primary">+ New place</Button>
        </Link>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div>
          <div className={styles.mapWrapper} style={{ height: '320px', background: 'var(--bg-subtle)' }}>
            <Skeleton variant="image" />
          </div>
          <div className={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.card}>
                <Skeleton variant="title" />
                <Skeleton variant="text" width="60%" />
              </div>
            ))}
          </div>
        </div>
      ) : places.length === 0 && !error ? (
        <EmptyState
          icon="🗺️"
          title={mineOnly ? 'No places yet' : 'No places found'}
          description={mineOnly ? 'Create your first place to see it on the map.' : 'Be the first to add a place!'}
        />
      ) : (
        <>
          <div className={styles.mapWrapper}>
            <PlaceMap places={places} />
          </div>
          <div className={styles.grid}>
            {places.map((p) => (
              <Link key={p.id} to={`/places/${p.id}`} className={styles.card}>
                <Badge variant={p.category_location === 'restaurant' ? 'amber' : p.category_location === 'gym' ? 'sky' : 'forest'}>
                  {p.category_location || 'others'}
                </Badge>
                <h3 className={styles.cardTitle}>{p.name || `Place #${p.id}`}</h3>
                <div className={styles.meta} style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  📍 {p.coordinate || 'No coordinates'}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
