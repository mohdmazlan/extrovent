import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getProfile, updateProfile } from '../lib/users';
import type { ProfileUpdate } from '../lib/users';
import { Input } from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import styles from './ProfilePage.module.scss';

const FIELDS: Array<{ key: keyof ProfileUpdate; label: string }> = [
  { key: 'nickname', label: 'Nickname' },
  { key: 'email', label: 'Email' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'no_ic', label: 'No. IC' },
  { key: 'no_matrik', label: 'No. Matrik' },
  { key: 'no_phone', label: 'Phone' },
];

export default function ProfilePage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initial, setInitial] = useState('?');

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setInitial((p.nickname || p.user_id || '?')[0].toUpperCase());
        setForm({
          nickname: p.nickname ?? '',
          email: p.email ?? '',
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          no_ic: p.no_ic ?? '',
          no_matrik: p.no_matrik ?? '',
          no_phone: p.no_phone ?? '',
        });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      setError(null);
      setSaved(false);
      try {
        const update: ProfileUpdate = {};
        for (const { key } of FIELDS) {
          const v = form[key]?.trim();
          if (v) update[key] = v;
        }
        await updateProfile(update);
        const refreshed = await getProfile();
        setForm({
          nickname: refreshed.nickname ?? '',
          email: refreshed.email ?? '',
          first_name: refreshed.first_name ?? '',
          last_name: refreshed.last_name ?? '',
          no_ic: refreshed.no_ic ?? '',
          no_matrik: refreshed.no_matrik ?? '',
          no_phone: refreshed.no_phone ?? '',
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not save profile.');
      } finally {
        setBusy(false);
      }
    },
    [busy, form],
  );

  if (loading) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <Skeleton variant="title" width="40%" />
        <div style={{ height: '16px' }} />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className={styles.breadcrumb}>
        ← Back to Home
      </Link>

      <Card variant="elevated" className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.headerText}>
            <h1>Profile</h1>
            <p>Update your personal information</p>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className={styles.form}>
          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}
          {saved && <div className={styles.success}>✓ Saved successfully!</div>}

          <div className={styles.grid}>
            {FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                value={form[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            ))}
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
