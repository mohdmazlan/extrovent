import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { uploadGalleryImages, validateImages } from '../lib/uploads';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import styles from './ActivityGalleryPage.module.scss';

interface GalleryImage {
  id?: number;
  image_id?: number;
  url?: string;
  uri?: string;
  image_url?: string;
  path?: string;
}

export default function ActivityGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const activityId = id ?? '';
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<GalleryImage[] | { images: GalleryImage[] }>(`/activity/images?activity_id=${encodeURIComponent(activityId)}`);
      const list = Array.isArray(data) ? data : Array.isArray((data as { images: GalleryImage[] }).images) ? (data as { images: GalleryImage[] }).images : [];
      setImages(list);
    } catch (e) {
      // Fallback to gallery endpoint
      try {
        const alt = await apiFetch<GalleryImage[] | { images: GalleryImage[] }>(`/gallery/list?activity_id=${encodeURIComponent(activityId)}`);
        const list2 = Array.isArray(alt) ? alt : Array.isArray((alt as { images: GalleryImage[] }).images) ? (alt as { images: GalleryImage[] }).images : [];
        setImages(list2);
        setError(null);
      } catch (e2) {
        setError(e2 instanceof ApiError ? (e2 as ApiError).message : e instanceof ApiError ? e.message : 'Could not load gallery.');
      }
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (list.length === 0) return;
    const validation = validateImages(list);
    if (validation) {
      setError(validation);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      try {
        await uploadGalleryImages({ activity_id: activityId }, list);
      } catch {
        const fd = new FormData();
        fd.append('activity_id', String(activityId));
        list.forEach((f) => fd.append('images[]', f));
        await apiFetch('/activity/upload', { method: 'POST', formData: fd });
      }
      await load();
    } catch (er) {
      setError(er instanceof ApiError ? er.message : 'Could not upload images.');
    } finally {
      setUploading(false);
      // reset input
      e.target.value = '';
    }
  }

  function resolveUrl(img: GalleryImage): string {
    return img.url ?? img.uri ?? img.image_url ?? img.path ?? '';
  }

  return (
    <div>
      <Link to={`/activities/${activityId}`} className={styles.breadcrumb}>
        ← Back to Activity
      </Link>

      <div className={styles.header}>
        <h1>Activity Gallery</h1>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPickFiles} disabled={uploading} hidden />
        <Button variant="primary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? 'Uploading…' : '+ Add images'}
        </Button>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="image" />
          ))}
        </div>
      ) : images.length === 0 && !error ? (
        <EmptyState icon="🖼️" title="No images yet" description="Add images to showcase this activity." />
      ) : (
        <div className={styles.grid}>
          {images.map((img, idx) => {
            const src = resolveUrl(img);
            const key = img.id ?? img.image_id ?? idx;
            return (
              <div key={key} className={styles.card}>
                {src ? <img src={src} alt={`gallery ${idx + 1}`} className={styles.image} /> : <div className={styles.fallback}>No image</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
