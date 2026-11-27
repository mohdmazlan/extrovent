import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/apiClient';
import { listPosts } from '../lib/posts';
import type { Post } from '../lib/posts';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import styles from './FeedPage.module.scss';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePostChange = (updated: Post) =>
    setPosts((prev) => prev.map((p) => (p.post_id === updated.post_id ? { ...p, ...updated } : p)));

  if (loading) {
    return (
      <div>
        <div className={styles.header}>
          <h1>Feed</h1>
          <p>Stories from the trail</p>
        </div>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.postCard}>
              <Skeleton variant="title" />
              <div className={styles.skeletonSpacer} />
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

      <Composer />

      {posts.length === 0 && !error ? (
        <EmptyState icon="🌿" title="No posts yet" description="Be the first to share your adventure!" />
      ) : (
        <div className={styles.grid}>
          {posts.map((p) => (
            <PostCard key={p.post_id} post={p} onPostChange={handlePostChange} />
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
