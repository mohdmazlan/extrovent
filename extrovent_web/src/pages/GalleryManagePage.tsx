import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { uploadGalleryImages, validateImages } from '../lib/uploads';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import styles from './GalleryManagePage.module.scss';

interface GalleryImage {
  id?: number;
  image_id?: number;
  url?: string;
  uri?: string;
  image_url?: string;
  path?: string;
  gallery_id?: number;
}

function resolveUrl(img: GalleryImage): string {
  return img.url ?? img.uri ?? img.image_url ?? img.path ?? '';
}
function resolveId(img: GalleryImage): number | undefined {
  return img.id ?? img.image_id ?? img.gallery_id;
}

export default function GalleryManagePage() {
  const params = useParams<{ id?: string; type?: string }>();
  const location = useLocation();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // detect type/id from multiple route patterns
  // /gallery/:type/:id  -> params.type + params.id
  // /places/:id/gallery -> pathname includes places
  // /activities/:id/gallery -> etc
  let galleryType: 'place' | 'activity' | 'event' | null = null;
  let galleryId: string | null = null;

  if (params.type && params.id) {
    const t = params.type.toLowerCase();
    if (t.includes('place')) galleryType = 'place';
    else if (t.includes('activity')) galleryType = 'activity';
    else if (t.includes('event')) galleryType = 'event';
    galleryId = params.id;
  } else if (params.id) {
    // /places/:id/gallery or /activities/:id/gallery
    galleryId = params.id;
    if (location.pathname.includes('/places/')) galleryType = 'place';
    else if (location.pathname.includes('/activities/')) galleryType = 'activity';
    else if (location.pathname.includes('/events/')) galleryType = 'event';
    else galleryType = 'place';
  }

  const backLink = (() => {
    if (galleryType === 'place' && galleryId) return `/places/${encodeURIComponent(galleryId)}`;
    if (galleryType === 'activity' && galleryId) return `/activities/${encodeURIComponent(galleryId)}`;
    if (galleryType === 'event' && galleryId) return `/events/${encodeURIComponent(galleryId)}`;
    return '/';
  })();

  const title = galleryType === 'place' ? 'Place Gallery' : galleryType === 'activity' ? 'Activity Gallery' : galleryType === 'event' ? 'Event Gallery' : 'Gallery';

  const load = useCallback(async () => {
    if (!galleryId || !galleryType) return;
    setLoading(true);
    setError(null);
    // Try primary gallery endpoint, fallback to entity-specific
    const attempts: string[] = [];
    if (galleryType === 'place') {
      attempts.push(`/gallery/list?place_id=${galleryId}`);
      attempts.push(`/place/images?place_id=${galleryId}`);
      attempts.push(`/place/get?place_id=${galleryId}`);
    } else if (galleryType === 'activity') {
      attempts.push(`/gallery/list?activity_id=${galleryId}`);
      attempts.push(`/activity/images?activity_id=${galleryId}`);
    } else if (galleryType === 'event') {
      attempts.push(`/gallery/list?event_id=${galleryId}`);
      attempts.push(`/event/images?event_id=${galleryId}`);
    }
    let lastErr: unknown = null;
    for (const path of attempts) {
      try {
        const data = await apiFetch<GalleryImage[] | { images: GalleryImage[] } | Record<string, unknown>>(path);
        let list: GalleryImage[] = [];
        if (Array.isArray(data)) list = data as GalleryImage[];
        else if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          if (Array.isArray(obj.images)) list = obj.images as GalleryImage[];
          else if (Array.isArray(obj.data)) list = obj.data as GalleryImage[];
          else if (Array.isArray(obj.gallery)) list = obj.gallery as GalleryImage[];
          // if place/get returns single object with images field
          else if (Array.isArray(obj.photos)) list = obj.photos as GalleryImage[];
        }
        setImages(list);
        setError(null);
        setLoading(false);
        return;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    setError(lastErr instanceof ApiError ? lastErr.message : 'Could not load gallery.');
    setLoading(false);
  }, [galleryId, galleryType]);

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
      const target: { place_id?: string; activity_id?: string; event_id?: string } = {};
      if (galleryType === 'place' && galleryId) target.place_id = galleryId;
      if (galleryType === 'activity' && galleryId) target.activity_id = galleryId;
      // for event, gallery endpoint may still handle place_id? try generic
      try {
        await uploadGalleryImages(target, list);
      } catch {
        const fd = new FormData();
        if (galleryType === 'place' && galleryId) fd.append('place_id', String(galleryId));
        if (galleryType === 'activity' && galleryId) fd.append('activity_id', String(galleryId));
        if (galleryType === 'event' && galleryId) fd.append('event_id', String(galleryId));
        list.forEach((f) => fd.append('images[]', f));
        // try possible endpoints
        const uploadPaths = ['/gallery/upload', '/activity/upload', '/place/upload', '/event/upload'];
        let uploaded = false;
        let lastErr2: unknown;
        for (const p of uploadPaths) {
          try {
            await apiFetch(p, { method: 'POST', formData: fd });
            uploaded = true;
            break;
          } catch (err) {
            lastErr2 = err;
          }
        }
        if (!uploaded) throw lastErr2 ?? new Error('Upload failed');
      }
      await load();
    } catch (er) {
      setError(er instanceof ApiError ? er.message : 'Could not upload images.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onDelete(img: GalleryImage) {
    const id = resolveId(img);
    if (!id) return;
    try {
      await apiFetch(`/gallery/${id}`, { method: 'DELETE' });
      setImages((prev) => prev.filter((p) => resolveId(p) !== id));
    } catch {
      try {
        await apiFetch(`/gallery/delete?gallery_id=${id}`, { method: 'DELETE' });
        setImages((prev) => prev.filter((p) => resolveId(p) !== id));
      } catch (e2) {
        setError(e2 instanceof ApiError ? e2.message : 'Could not delete image.');
      }
    }
  }

  if (!galleryType || !galleryId) {
    return (
      <div className={styles.alert} role="alert">
        Invalid gallery route.
      </div>
    );
  }

  return (
    <div>
      <Link to={backLink} className={styles.breadcrumb}>
        ← Back
      </Link>

      <div className={styles.header}>
        <h1>{title}</h1>
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
        <EmptyState icon="🖼️" title="No images yet" description="Add images to showcase this gallery." />
      ) : (
        <div className={styles.grid}>
          {images.map((img, idx) => {
            const src = resolveUrl(img);
            const key = resolveId(img) ?? idx;
            return (
              <div key={key} className={styles.card}>
                {src ? <img src={src} alt={`gallery ${idx + 1}`} className={styles.image} /> : <div className={styles.fallback}>No image</div>}
                <button type="button" className={styles.deleteBtn} onClick={() => void onDelete(img)} aria-label="Delete image">
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
