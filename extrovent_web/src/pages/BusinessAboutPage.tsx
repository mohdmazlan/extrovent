import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getBusinessProfile, updateBusinessProfile, updateBusinessAvatar, getBusinessName } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import { resizeImageTo500 } from '../lib/uploads';
import { useAuth } from '../auth/AuthContext';
import { Input, Textarea } from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import styles from './BusinessAboutPage.module.scss';

export default function BusinessAboutPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = id ?? '';
  const { user } = useAuth();
  const [bp, setBp] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [description, setDescription] = useState('');

  const [savingField, setSavingField] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getBusinessProfile(numericId);
        setBp(p);
        setCompanyName(p.company_name ?? p.companyName ?? p.name ?? '');
        setRegNo(p.reg_no ?? p.registration_number ?? '');
        setDescription(p.description ?? '');
        if (p.avatar) setAvatarPreview(p.avatar);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load business profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [numericId]);

  const isOwner = Boolean(user && bp?.user_id && user.user_id === bp.user_id);

  const saveField = useCallback(
    async (field: 'company_name' | 'reg_no' | 'description') => {
      if (!isOwner || savingField) return;
      setSavingField(field);
      setError(null);
      setSuccess(null);
      try {
        const payload: Record<string, string> = {};
        if (field === 'company_name') payload.company_name = companyName.trim();
        if (field === 'reg_no') payload.reg_no = regNo.trim();
        if (field === 'description') payload.description = description.trim();
        await updateBusinessProfile(numericId, payload);
        setSuccess('Saved successfully!');
        const refreshed = await getBusinessProfile(numericId);
        setBp(refreshed);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not save changes.');
      } finally {
        setSavingField(null);
      }
    },
    [isOwner, savingField, companyName, regNo, description, numericId],
  );

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const base64 = await resizeImageTo500(file);
      setAvatarBase64(base64);
      setAvatarPreview(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    }
  }

  async function onAvatarUpload() {
    if (!avatarBase64) return;
    setAvatarBusy(true);
    setError(null);
    setSuccess(null);
    try {
      // Try base64 path first; fallback to FormData would also work via updateBusinessAvatar
      await updateBusinessAvatar(numericId, avatarBase64);
      setSuccess('Avatar updated!');
      const refreshed = await getBusinessProfile(numericId);
      setBp(refreshed);
      if (refreshed.avatar) setAvatarPreview(refreshed.avatar);
      setAvatarBase64(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not upload avatar.');
    } finally {
      setAvatarBusy(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton variant="title" width="40%" />
        <div style={{ height: '16px' }} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error && !bp) {
    return (
      <div className={styles.alert} role="alert">
        <p>{error ?? 'Business not found.'}</p>
        <Link to={`/business/${id}`} className={styles.breadcrumb} style={{ marginTop: '12px', justifyContent: 'center' }}>
          ← Back to Business
        </Link>
      </div>
    );
  }

  if (!bp) {
    return (
      <div className={styles.alert} role="alert">
        <p>Business not found.</p>
        <Link to="/business" className={styles.breadcrumb}>← Back to Businesses</Link>
      </div>
    );
  }

  const displayName = getBusinessName(bp);

  return (
    <div>
      <Link to={`/business/${id}`} className={styles.breadcrumb}>
        ← Back to {displayName}
      </Link>

      <Card variant="elevated" className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>Edit Business</h1>
          <Badge variant="stone">ID #{numericId}</Badge>
        </div>

        <div className={styles.body}>
          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className={styles.success} role="status">
              ✓ {success}
            </div>
          )}

          {!isOwner ? (
            <div className={styles.readonly}>
              <p>You do not have permission to edit this business.</p>
              <div className={styles.fieldDisplay}>
                <strong>Company Name:</strong> {companyName || '—'}
              </div>
              <div className={styles.fieldDisplay}>
                <strong>Registration No.:</strong> {regNo || '—'}
              </div>
              <div className={styles.fieldDisplay}>
                <strong>Description:</strong> {description || '—'}
              </div>
              {avatarPreview && <img src={avatarPreview} alt="avatar" className={styles.avatarPreview} />}
            </div>
          ) : (
            <>
              <div className={styles.fieldRow}>
                <div className={styles.fieldInput}>
                  <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Adventure Sdn Bhd" />
                </div>
                <Button variant="secondary" size="sm" onClick={() => void saveField('company_name')} disabled={savingField === 'company_name'}>
                  {savingField === 'company_name' ? 'Saving…' : 'Save'}
                </Button>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldInput}>
                  <Input label="Registration No." value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="202401012345" />
                </div>
                <Button variant="secondary" size="sm" onClick={() => void saveField('reg_no')} disabled={savingField === 'reg_no'}>
                  {savingField === 'reg_no' ? 'Saving…' : 'Save'}
                </Button>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldInput}>
                  <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about your business..." rows={3} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => void saveField('description')} disabled={savingField === 'description'}>
                  {savingField === 'description' ? 'Saving…' : 'Save'}
                </Button>
              </div>

              <div className={styles.avatarSection}>
                <h3>Avatar</h3>
                {avatarPreview && <img src={avatarPreview} alt="preview" className={styles.avatarPreview} />}
                <input type="file" accept="image/*" onChange={onAvatarChange} className={styles.fileInput} />
                {avatarBase64 && (
                  <Button variant="primary" size="sm" onClick={() => void onAvatarUpload()} disabled={avatarBusy}>
                    {avatarBusy ? 'Uploading…' : 'Upload Avatar'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
