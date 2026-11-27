import { useState } from 'react';
import { Link } from 'react-router-dom';
import MapExplorer from '../components/MapExplorer';
import GeolocateButton from '../components/GeolocateButton';
import Button from '../components/Button';
import styles from './ExplorePage.module.scss';

type Mode = 'places' | 'events' | 'activities';

export default function ExplorePage() {
  const [mode, setMode] = useState<Mode>('places');
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleLocate(pos: [number, number]) {
    setCenter(pos);
    setPicked(pos);
    setGeoError(null);
    setToast('Centered to your location');
    window.setTimeout(() => setToast(null), 3000);
  }

  function handlePick(lat: number, lng: number) {
    setPicked([lat, lng]);
    setGeoError(null);
  }

  const addHref =
    picked
      ? mode === 'places'
        ? `/places/new?lat=${picked[0]}&lng=${picked[1]}`
        : mode === 'activities'
          ? `/activities/new?lat=${picked[0]}&lng=${picked[1]}`
          : `/events/new?lat=${picked[0]}&lng=${picked[1]}`
      : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Explore</h1>
        <div className={styles.headerActions}>
          <GeolocateButton
            onLocate={handleLocate}
            onError={(msg) => {
              setGeoError(msg);
              setToast(msg);
              window.setTimeout(() => setToast(null), 3000);
            }}
          />
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Explore mode">
        {(['places', 'events', 'activities'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`${styles.tab} ${mode === m ? styles.active : ''}`}
            onClick={() => setMode(m)}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {geoError && (
        <div className={styles.alert} role="alert">
          {geoError}
        </div>
      )}

      {toast && !geoError && (
        <div className={styles.alert} role="status" style={{ background: 'var(--bg-subtle)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          {toast}
        </div>
      )}

      <div className={styles.mapWrapper}>
        <MapExplorer mode={mode} onPick={handlePick} picked={picked} center={center} />
      </div>

      {picked && addHref && (
        <div className={styles.addHereBar}>
          <span className={styles.pickedLabel}>
            📍 {picked[0].toFixed(5)}, {picked[1].toFixed(5)}
          </span>
          <Link to={addHref} style={{ marginLeft: 'auto' }}>
            <Button variant="primary" size="sm">
              + Add {mode === 'places' ? 'place' : mode === 'activities' ? 'activity' : 'event'} here
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
            Clear pin
          </Button>
        </div>
      )}
    </div>
  );
}
