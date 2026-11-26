import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../lib/apiClient';
import { addComment, getComments, listPosts, toggleLike } from '../lib/posts';
import type { Post, PostComment } from '../lib/posts';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import styles from './FeedPage.module.scss';

function Comments({ postId }: { postId: number }) {
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setComments(await getComments(postId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load comments.');
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addComment(postId, draft.trim());
      setDraft('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post comment.');
    } finally {
      setBusy(false);
    }
  }

  if (comments === null && !error) {
    return (
      <div className={styles.comments}>
        <Skeleton variant="text" width="100%" />
        <div style={{ height: '8px' }} />
        <Skeleton variant="text" width="80%" />
      </div>
    );
  }

  return (
    <div className={styles.comments}>
      {error && <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      {comments && comments.length > 0 ? (
        <ul>
          {comments.map((c, i) => (
            <li key={c.comment_id ?? i}>
              <strong>{c.nickname || c.user_id}:</strong> {c.comment}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>No comments yet — be the first!</p>
      )}
      <form onSubmit={submit} className={styles.commentForm}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          aria-label="Write a comment"
        />
        <Button type="submit" size="sm" disabled={busy || !draft.trim()}>
          {busy ? 'Posting…' : 'Post'}
        </Button>
      </form>
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});

  const loadPage = useCallback(
    async (p: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const batch = await listPosts(p);
        if (batch.length === 0) setExhausted(true);
        setPosts((prev) => (append ? [...prev, ...batch] : batch));
        setPage(p);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load feed.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  async function onLike(post: Post) {
    try {
      await toggleLike(post.post_id);
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === post.post_id
            ? { ...p, sliked: p.sliked ? null : '1', total_likes: (p.total_likes ?? 0) + (p.sliked ? -1 : 1) }
            : p,
        ),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not like post.');
    }
  }

  if (loading) {
    return (
      <div>
        <div className={styles.header}>
          <h1>Feed</h1>
          <p>Stories from the trail</p>
        </div>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.postCard} style={{ padding: '24px' }}>
              <Skeleton variant="title" />
              <div style={{ height: '12px' }} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1>Feed</h1>
        <p>Stories, photos, and moments from fellow explorers</p>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {posts.length === 0 && !error ? (
        <EmptyState icon="🌿" title="No posts yet" description="Be the first to share your adventure!" />
      ) : (
        <div className={styles.grid}>
          {posts.map((p) => (
            <article key={p.post_id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.avatar}>{(p.nickname || p.user_id || '?')[0].toUpperCase()}</div>
                <div>
                  <div className={styles.author}>{p.nickname || p.user_id}</div>
                  <div className={styles.date}>{p.date ? new Date(p.date).toLocaleDateString() : 'Just now'}</div>
                </div>
              </div>
              {p.caption && <div className={styles.postBody}><p>{p.caption}</p></div>}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => void onLike(p)}
                  className={`${styles.actionBtn} ${p.sliked ? styles.liked : ''}`}
                >
                  ♥ {p.sliked ? 'Liked' : 'Like'} · {p.total_likes ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenComments((o) => ({ ...o, [p.post_id]: !o[p.post_id] }))}
                  className={styles.actionBtn}
                >
                  💬 Comments · {p.total_comment ?? 0}
                </button>
              </div>
              {openComments[p.post_id] && <Comments postId={p.post_id} />}
            </article>
          ))}
        </div>
      )}

      {!exhausted && posts.length > 0 && (
        <div className={styles.loadMore}>
          <Button variant="secondary" onClick={() => void loadPage(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more adventures'}
          </Button>
        </div>
      )}
    </div>
  );
}
