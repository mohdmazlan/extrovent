import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { createPlace } from '../lib/places';
import PlaceMap from '../components/PlaceMap';
import { Input, Textarea, Select } from '../components/Input';
import Button from '../components/Button';
import styles from './PlaceCreatePage.module.scss';

export default function PlaceCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('others');
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createPlace({
        name: name.trim(),
        description: description.trim(),
        category_location: category,
        ...(picked ? { coordinate: `${picked[0]},${picked[1]}` } : {}),
      });
      navigate('/places', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create place.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/places" className={styles.breadcrumb}>
        ← Back to Places
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>New Place</h1>
          <p>Pin a new spot for explorers to discover</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input label="Place Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunset Hill Lookout" required />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this place special?" required rows={3} />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="restaurant">Restaurant</option>
            <option value="gym">Gym</option>
            <option value="others">Others</option>
          </Select>

          <div className={styles.mapSection}>
            <div className={styles.mapHint}>📍 Click the map to set a location</div>
            <PlaceMap onPick={(lat, lng) => setPicked([lat, lng])} picked={picked} />
          </div>

          {picked && <div className={styles.picked}>📍 {picked[0].toFixed(5)}, {picked[1].toFixed(5)}</div>}

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Creating…' : 'Create Place'}
          </Button>
        </form>
      </div>
    </div>
  );
}
