import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { createEvent } from '../lib/events';
import { listBusinessProfiles } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import { Input, Textarea, Select } from '../components/Input';
import Button from '../components/Button';
import styles from './EventCreatePage.module.scss';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fields, setFields] = useState({
    category: '',
    title: '',
    place_id: '',
    fee: '0',
    start_date: '',
    start_time: '',
    description: '',
    business_profile_id: '',
  });
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      // prefill hint — user can pick place near coordinate via explore map
    }
    void listBusinessProfiles().then(setBusinesses).catch(() => {});
  }, [searchParams]);

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createEvent({
        category: fields.category.trim(),
        title: fields.title.trim(),
        place_id: fields.place_id.trim(),
        fee: Number(fields.fee || 0),
        start_date: fields.start_date,
        start_time: fields.start_time,
        description: fields.description.trim(),
        ...(fields.business_profile_id ? { business_profile_id: fields.business_profile_id } : {}),
      });
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create event.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/events" className={styles.breadcrumb}>
        ← Back to Events
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>Create Event</h1>
          <p>Share your next adventure with the community</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input label="Event Title" value={fields.title} onChange={(e) => set('title', e.target.value)} placeholder="Morning hike at Bukit Gasing" required />
          <div className={styles.row}>
            <Select label="Category" value={fields.category} onChange={(e) => set('category', e.target.value)} required>
              <option value="">Select category</option>
              <option value="concert">Concert</option>
              <option value="tournament">Tournament</option>
              <option value="others">Others</option>
            </Select>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <Input label="Place ID" type="text" value={fields.place_id} onChange={(e) => set('place_id', e.target.value)} required />
              <Link to="/explore" style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--accent)', alignSelf: 'center' }}>Pick on map</Link>
            </div>
          </div>
          <div className={styles.row}>
            <Input label="Fee" type="number" value={fields.fee} onChange={(e) => set('fee', e.target.value)} min={0} />
            <Select label="Business Profile (optional)" value={fields.business_profile_id} onChange={(e) => set('business_profile_id', e.target.value)}>
              <option value="">No business profile</option>
              {businesses.map((b) => (
                <option key={b.id ?? b.business_id} value={String(b.id ?? b.business_id)}>{b.company_name ?? b.name}</option>
              ))}
            </Select>
          </div>
          <div className={styles.row}>
            <Input label="Start Date" type="date" value={fields.start_date} onChange={(e) => set('start_date', e.target.value)} required />
            <Input label="Start Time" type="time" value={fields.start_time} onChange={(e) => set('start_time', e.target.value)} required />
          </div>
          <Textarea label="Description" value={fields.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell explorers what to expect..." required rows={4} />

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Creating…' : 'Create Event'}
          </Button>
        </form>
      </div>
    </div>
  );
}
