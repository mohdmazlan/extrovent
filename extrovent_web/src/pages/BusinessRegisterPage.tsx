import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { createBusinessProfile, getBusinessId } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import { Input, Textarea } from '../components/Input';
import Button from '../components/Button';
import styles from './BusinessRegisterPage.module.scss';

export default function BusinessRegisterPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = (await createBusinessProfile({
        company_name: companyName.trim(),
        reg_no: regNo.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      })) as BusinessProfile & { business_id?: string; profile_id?: string };
      const newId = (res.business_id as string | undefined) ?? (res.profile_id as string | undefined) ?? getBusinessId(res);
      if (newId !== undefined && newId !== null) {
        navigate(`/business/${newId}`, { replace: true });
      } else {
        navigate('/business', { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create business profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/business" className={styles.breadcrumb}>
        ← Back to Businesses
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>Register Business</h1>
          <p>Create a business profile to manage places and events</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Adventure Sdn Bhd"
            required
          />
          <Input
            label="Registration No."
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="202401012345"
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your business..."
            rows={4}
          />

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Creating…' : 'Create Business'}
          </Button>
        </form>
      </div>
    </div>
  );
}
