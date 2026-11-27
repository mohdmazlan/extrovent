import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { getProfileById } from '../lib/friends';
import type { FriendUser } from '../lib/friends';
import { useAuth } from '../auth/AuthContext';
import FriendButton from '../components/FriendButton';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { listUserPosts } from '../lib/posts';
import { mediaUrl } from '../lib/apiClient';
import type { Post } from '../lib/posts';
import styles from './ViewProfilePage.module.scss';

export default function ViewProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const effectiveId = userId ?? user?.user_id ?? user?.id ?? '';
  const [profile, setProfile] = useState<FriendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!effectiveId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getProfileById(effectiveId);
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveId]);

  const loadPosts = useCallback(async (p: number, append: boolean) => {
    if (!effectiveId) return;
    setLoadingPosts(true);
    try {
      const batch = await listUserPosts(effectiveId, p);
      setPosts((prev) => (append ? [...prev, ...batch] : batch));
      setHasMore(batch.length > 0);
      setPage(p);
    } catch {}
    finally { setLoadingPosts(false); }
  }, [effectiveId]);

  useEffect(() => { if (effectiveId && profile) void loadPosts(1, false); }, [effectiveId, profile, loadPosts]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <Skeleton variant="card" />
        <div style={{ height: 16 }} />
        <Skeleton variant="title" width="50%" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.wrap}>
        <Link to="/find-friends" className={styles.breadcrumb}>
          ← Back
        </Link>
        <div className={styles.notFound}>
          <h2>Profile not found</h2>
          <p>{error ?? 'User does not exist.'}</p>
          <Link to="/find-friends">Find friends</Link>
        </div>
      </div>
    );
  }

  const nickname = profile.nickname || profile.user_id;
  const initial = nickname[0]?.toUpperCase() ?? '?';
  const viewerId = user?.user_id ?? '';
  const totalPosts = profile.total_posts ?? profile.posts ?? 0;
  const totalFriends = profile.total_friends ?? profile.friends ?? 0;
  const isSelf = viewerId === profile.user_id;

  return (
    <div className={styles.wrap}>
      <Link to={isSelf ? "/" : "/find-friends"} className={styles.breadcrumb}>
        {isSelf ? "← Back to Home" : "← Back to Find Friends"}
      </Link>

      <div className={styles.header}>
        <div className={styles.banner} aria-hidden>
          <div className={styles.bannerBlur} />
        </div>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>{profile.avatar ? <img src={profile.avatar} alt={nickname} /> : initial}</div>
          <div className={styles.meta}>
            <h1 className={styles.nickname}>{nickname}</h1>
            <p className={styles.handle}>@{profile.user_id}</p>
            {profile.email && <p className={styles.email}>{profile.email}</p>}
            <div className={styles.counters}>
              <span>
                <strong>{totalPosts}</strong> posts
              </span>
              <span>
                <strong>{totalFriends}</strong> friends
              </span>
            </div>
            <div className={styles.actionsRow}>
              {isSelf ? (
                <Link to="/profile/edit" className={styles.linkBtn}>Edit profile</Link>
              ) : (
                <Link to={`/users/${encodeURIComponent(profile.user_id)}/posts`} className={styles.linkBtn}>
                  View posts
                </Link>
              )}
              <span className={styles.dot}>·</span>
              <Link to="/chat" className={styles.linkBtn}>
                Contact
              </Link>
            </div>
            {isSelf ? null : viewerId ? (
              <div className={styles.friendBtn}>
                <FriendButton targetUser={profile} viewerId={viewerId} onChange={() => window.location.reload()} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.postsSection}>
        <h3 className={styles.postsTitle}>Posts</h3>
        {loadingPosts && posts.length === 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <Skeleton variant="card" /><Skeleton variant="card" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon="📝" title={isSelf ? "You have no posts yet" : "No posts yet"} description={isSelf ? "Share your first adventure to see it here." : `${nickname} hasn't posted yet.`} />
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((p) => (
              <div key={p.post_id} className={styles.postCard}>
                {p.caption && <p className={styles.postCaption}>{p.caption}</p>}
                {p.banner && <img src={mediaUrl(p.banner)} alt="" className={styles.postImage} style={{ width: '100%', borderRadius: 8 }} />}
                <div className={styles.postMeta}>
                  <span>♥ {p.total_likes ?? 0}</span>
                  <span>💬 {p.total_comment ?? 0}</span>
                  <span>{p.date ? new Date(p.date).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button variant="secondary" onClick={() => void loadPosts(page + 1, true)} disabled={loadingPosts}>
                  {loadingPosts ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
