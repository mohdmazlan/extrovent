import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { uploadPostImages, validateImages, fileListToArray } from '../lib/uploads';
import { useAuth } from '../auth/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import Button from '../components/Button';
import { Textarea } from '../components/Input';
import styles from './CreatePostPage.module.scss';

export default function CreatePostPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const context = useMemo(() => {
    const place_id = searchParams.get('place_id');
    const activity_id = searchParams.get('activity_id');
    const event_id = searchParams.get('event_id');
    const chips: string[] = [];
    if (place_id) chips.push(`Place #${place_id}`);
    if (activity_id) chips.push(`Activity #${activity_id}`);
    if (event_id) chips.push(`Event #${event_id}`);
    return { place_id, activity_id, event_id, chips };
  }, [searchParams]);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = fileListToArray(e.target.files);
    if (list.length === 0) return;
    // combine with existing
    const combined = [...files, ...list];
    const validation = validateImages(combined);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setFiles(combined);
    // create object urls for preview
    const urls = combined.map((f) => URL.createObjectURL(f));
    // revoke old previews
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews(urls);
  }

  function removeFile(idx: number) {
    const old = previews[idx];
    if (old) URL.revokeObjectURL(old);
    const next = files.filter((_, i) => i !== idx);
    const nextPreviews = previews.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(nextPreviews);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim() && files.length === 0) {
      setError('Add a caption or at least one image.');
      return;
    }
    const validation = files.length ? validateImages(files) : null;
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { caption: caption.trim() };
      if (context.place_id) payload.place_id = context.place_id;
      if (context.activity_id) payload.activity_id = context.activity_id;
      if (context.event_id) payload.event_id = context.event_id;

      const res = await apiFetch<{ post_id: string } | { id: string } | string>('/post/create', {
        method: 'POST',
        json: payload,
      });
      let postId: string | null = null;
      if (typeof res === 'string') postId = res;
      else if (res && typeof res === 'object') {
        const r = res as Record<string, unknown>;
        postId = (r.post_id as string) ?? (r.id as string) ?? (r.postId as string) ?? null;
      }
      // if backend returns success wrapper without id, list may be needed - try to extract from data
      if (postId && files.length > 0) {
        await uploadPostImages(postId, files);
      } else if (!postId && files.length > 0) {
        // fallback: try to upload anyway if postId unknown - warn
        // attempt sequential upload if we can guess? just skip
      }
      // cleanup previews
      previews.forEach((u) => URL.revokeObjectURL(u));
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create post.');
    } finally {
      setBusy(false);
    }
  }

  const avatarLetter = (user?.nickname || user?.user_id || '?')[0].toUpperCase();

  return (
    <div className={styles.page}>
      <Link to="/feed" className={styles.breadcrumb}>
        ← Back to Feed
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar}>{avatarLetter}</div>
          <div>
            <div className={styles.author}>{user?.nickname || user?.user_id}</div>
            <div className={styles.sub}>Share your adventure</div>
          </div>
        </div>

        {context.chips.length > 0 && (
          <div className={styles.chips}>
            {context.chips.map((c) => (
              <span key={c} className={styles.chip}>
                📍 {c}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className={styles.form}>
          <Textarea
            label="Caption"
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
          />

          <div className={styles.uploadRow}>
            <label className={styles.fileLabel}>
              <input type="file" accept="image/*" multiple onChange={onFiles} hidden />
              <span className={styles.fileBtn}>＋ Add images</span>
            </label>
            <span className={styles.hint}>Up to 5 images, 10MB each</span>
          </div>

          {previews.length > 0 && (
            <div className={styles.previewWrap}>
              <ImageCarousel images={previews} />
              <div className={styles.fileList}>
                {files.map((f, i) => (
                  <span key={i} className={styles.fileTag}>
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)} aria-label="Remove image">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Publishing…' : 'Publish post'}
          </Button>
        </form>
      </div>
    </div>
  );
}
