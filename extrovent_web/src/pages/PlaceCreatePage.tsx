import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { createPlace } from '../lib/places';
import { listBusinessProfiles } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import PlaceMap from '../components/PlaceMap';
import { Input, Textarea, Select } from '../components/Input';
import Button from '../components/Button';
import styles from './PlaceCreatePage.module.scss';

export default function PlaceCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('others');
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) setPicked([lat, lng]);
  }, [searchParams]);

  useEffect(() => {
    void listBusinessProfiles().then(setBusinesses).catch(() => {});
  }, []);

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
        ...(businessId ? { business_profile_id: businessId } : {}),
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
            <option value="mall">Mall</option>
            <option value="hall">Hall</option>
            <option value="others">Others</option>
          </Select>
          {businesses.length > 0 && (
            <Select label="Business Profile (optional)" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              <option value="">No business profile</option>
              {businesses.map((b) => (
                <option key={b.id ?? b.business_id ?? b.profile_id} value={String(b.id ?? b.business_id ?? b.profile_id)}>
                  {b.company_name ?? b.name ?? `Business #${b.id ?? b.business_id}`}
                </option>
              ))}
            </Select>
          )}

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
