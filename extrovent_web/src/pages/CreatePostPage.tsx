import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { createPostWithMedia, validatePostMedia, fileListToArray, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../lib/uploads';
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
  const [video, setVideo] = useState<File | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
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

  function kindOf(f: File): 'image' | 'video' | null {
    if (f.type.startsWith('image/')) return 'image';
    if (f.type.startsWith('video/')) return 'video';
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    return null;
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = fileListToArray(e.target.files);
    e.target.value = '';
    if (list.length === 0) return;
    const rejected = list.find((f) => kindOf(f) === null);
    if (rejected) {
      setError(`${rejected.name} is not a supported image or video.`);
      return;
    }
    const pickedImages = list.filter((f) => kindOf(f) === 'image');
    const pickedVideos = list.filter((f) => kindOf(f) === 'video');
    if (!video && pickedVideos.length > 1) {
      setError('Only one video can be attached.');
      return;
    }
    const combined = [...files, ...pickedImages];
    const nextVideo = video ?? pickedVideos[0] ?? null;
    const validation = validatePostMedia(combined, nextVideo);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setFiles(combined);
    if (!video && pickedVideos[0]) {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideo(pickedVideos[0]);
      setVideoPreview(URL.createObjectURL(pickedVideos[0]));
    }
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

  function removeVideo() {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim() && files.length === 0 && !video) {
      setError('Add a caption or at least one image.');
      return;
    }
    const validation = validatePostMedia(files, video);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const payload: Record<string, unknown> = { caption: caption.trim() };
      if (context.place_id) payload.place_id = context.place_id;
      if (context.activity_id) payload.activity_id = context.activity_id;
      if (context.event_id) payload.event_id = context.event_id;

      if (files.length === 0 && !video) {
        await apiFetch('/post/create', { method: 'POST', json: payload });
      } else {
        // caption + images[]/video go up in one multipart call with progress
        setProgress(0);
        await createPostWithMedia(payload, { images: files, video }, (r) => setProgress(r));
      }
      // cleanup previews
      previews.forEach((u) => URL.revokeObjectURL(u));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create post.');
      setProgress(null);
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
              <input type="file" accept="image/*,video/*" multiple onChange={onFiles} hidden disabled={busy} />
              <span className={styles.fileBtn}>＋ Add photos / video</span>
            </label>
            <span className={styles.hint}>Up to 5 images + 1 video (10MB / 50MB)</span>
          </div>

          {previews.length > 0 && (
            <div className={styles.previewWrap}>
              <ImageCarousel images={previews} />
              <div className={styles.fileList}>
                {files.map((f, i) => (
                  <span key={i} className={styles.fileTag}>
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)} aria-label="Remove image" disabled={busy}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {videoPreview && video && (
            <div className={styles.previewWrap}>
              <video src={videoPreview} controls className={styles.videoPreview} />
              <div className={styles.fileList}>
                <span className={styles.fileTag}>
                  {video.name}
                  <button type="button" onClick={removeVideo} aria-label="Remove video" disabled={busy}>
                    ×
                  </button>
                </span>
              </div>
            </div>
          )}

          {busy && progress !== null && (
            <div className={styles.progressWrap} role="status" aria-label="Upload progress">
              <div className={styles.progressMeta}>
                <span>Uploading media…</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? (progress !== null ? `Uploading… ${Math.round(progress * 100)}%` : 'Publishing…') : 'Publish post'}
          </Button>
        </form>
      </div>
    </div>
  );
}
