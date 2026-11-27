import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { ACTIVITY_CATEGORIES, createActivity, getActivity, updateActivity } from '../lib/activities';
import { listBusinessProfiles, getBusinessId, getBusinessName } from '../lib/business';
import type { BusinessProfile } from '../lib/business';
import { validateImages, uploadGalleryImages } from '../lib/uploads';
import PlaceMap from '../components/PlaceMap';
import { Input, Textarea, Select } from '../components/Input';
import Button from '../components/Button';
import styles from './ActivityCreatePage.module.scss';

export default function ActivityCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(ACTIVITY_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [businessProfileId, setBusinessProfileId] = useState('');
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Prefill picked from ?lat=&lng=
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      const la = Number(lat);
      const ln = Number(lng);
      if (Number.isFinite(la) && Number.isFinite(ln)) {
        setPicked([la, ln]);
      }
    }
  }, [searchParams]);

  // Load business profiles
  useEffect(() => {
    void listBusinessProfiles()
      .then(setBusinessProfiles)
      .catch(() => {});
  }, []);

  // Load existing activity if editing
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingEdit(true);
    void getActivity(id)
      .then((a) => {
        setTitle(a.title ?? a.name ?? '');
        setCategory((a.category ?? a.category_activity ?? ACTIVITY_CATEGORIES[0]) as string);
        setDescription(a.description ?? '');
        setFee(a.fee !== null && a.fee !== undefined ? String(a.fee) : '');
        setPlaceId(a.place_id !== null && a.place_id !== undefined ? String(a.place_id) : '');
        setBusinessProfileId(a.business_profile_id !== null && a.business_profile_id !== undefined ? String(a.business_profile_id) : '');
        if (a.coordinate) {
          const parts = a.coordinate.split(',').map((s) => Number(s.trim()));
          if (parts.length === 2 && parts.every(Number.isFinite)) {
            setPicked([parts[0], parts[1]]);
          }
        }
      })
      .catch(() => setError('Could not load activity for editing.'))
      .finally(() => setLoadingEdit(false));
  }, [isEdit, id]);

  // Generate preview URLs for image grid
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (list.length === 0) return;
    const nextFiles = [...files, ...list];
    const validation = validateImages(nextFiles);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setFiles(nextFiles);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!category) errs.category = 'Category is required';
    if (!description.trim()) errs.description = 'Description is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const validation = files.length ? validateImages(files) : null;
    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        ...(picked ? { coordinate: `${picked[0]},${picked[1]}` } : {}),
        ...(placeId ? { place_id: placeId } : { place_id: null }),
        ...(fee !== '' ? { fee: Number(fee) } : {}),
        ...(businessProfileId ? { business_profile_id: businessProfileId } : { business_profile_id: null }),
      };

      let newId: string | undefined;

      if (isEdit && id) {
        await updateActivity(id, payload);
        newId = id;
        // upload gallery if new files after update
        if (files.length) {
          try {
            await uploadGalleryImages({ activity_id: newId }, files);
          } catch {
            // fallback via direct FormData to /activity/upload if gallery endpoint fails — try alternative path
            const fd = new FormData();
            fd.append('activity_id', String(newId));
            files.forEach((f) => fd.append('images[]', f));
            await apiFetch('/activity/upload', { method: 'POST', formData: fd });
          }
        }
        navigate(`/activities/${newId}`, { replace: true });
      } else {
        const res = (await createActivity(payload)) as unknown as { activity_id?: string; id?: string } | string;
        if (typeof res === 'string') newId = res;
        else if (res && typeof res === 'object' && 'activity_id' in res && typeof res.activity_id === 'string') newId = res.activity_id;
        else if (res && typeof res === 'object' && 'id' in res && typeof res.id === 'string') newId = res.id;

        // If creation returned an id, upload images. Otherwise try to fallback with response parsing
        if (newId !== undefined && files.length) {
          try {
            await uploadGalleryImages({ activity_id: newId }, files);
          } catch {
            const fd = new FormData();
            fd.append('activity_id', String(newId));
            files.forEach((f) => fd.append('images[]', f));
            await apiFetch('/activity/upload', { method: 'POST', formData: fd });
          }
        }

        if (newId !== undefined) {
          navigate(`/activities/${newId}`, { replace: true });
        } else {
          navigate('/activities', { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${isEdit ? 'update' : 'create'} activity.`);
    } finally {
      setBusy(false);
    }
  }

  if (loadingEdit) {
    return <p style={{ padding: '2rem' }}>Loading activity…</p>;
  }

  return (
    <div>
      <Link to={isEdit ? `/activities/${id}` : '/activities'} className={styles.breadcrumb}>
        ← Back to {isEdit ? 'Activity' : 'Activities'}
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>{isEdit ? 'Edit Activity' : 'New Activity'}</h1>
          <p>{isEdit ? 'Update your activity details' : 'Share your next adventure with the community'}</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input
            label="Activity Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning hike at Bukit Gasing"
            required
            error={fieldErrors.title}
          />

          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {fieldErrors.category && <span className={styles.fieldError}>{fieldErrors.category}</span>}

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell explorers what to expect..."
            required
            rows={4}
            error={fieldErrors.description}
          />

          <div className={styles.mapSection}>
            <div className={styles.mapHint}>📍 Click the map to set a location</div>
            <PlaceMap onPick={(lat, lng) => setPicked([lat, lng])} picked={picked} />
          </div>

          {picked && (
            <div className={styles.picked}>
              📍 {picked[0].toFixed(5)}, {picked[1].toFixed(5)}
            </div>
          )}

          <div className={styles.row}>
            <Input label="Place ID (optional)" type="text" value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="e.g. 123e4567-e89b-..."  />
            <Input label="Fee (optional)" type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" min={0} step="0.01" />
          </div>

          <Select label="Business Profile (optional)" value={businessProfileId} onChange={(e) => setBusinessProfileId(e.target.value)}>
            <option value="">No business profile</option>
            {businessProfiles.map((bp) => {
              const bid = getBusinessId(bp);
              return (
                <option key={bid} value={String(bid)}>
                  {getBusinessName(bp)}
                </option>
              );
            })}
          </Select>

          <div className={styles.uploadSection}>
            <label className={styles.uploadLabel}>Images (up to 5, 10MB each)</label>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className={styles.fileInput} />
            {previews.length > 0 && (
              <div className={styles.previewGrid}>
                {previews.map((src, idx) => (
                  <div key={idx} className={styles.previewItem}>
                    <img src={src} alt={`preview ${idx + 1}`} />
                    <button type="button" className={styles.removeBtn} onClick={() => removeFile(idx)} aria-label="Remove image">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {previews.length > 0 && (
              <div className={styles.dots}>
                {previews.map((_, idx) => (
                  <span key={idx} className={styles.dot} />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Activity'}
          </Button>
        </form>
      </div>
    </div>
  );
}
