import { useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toggleLike } from '../lib/posts';
import { mediaUrl } from '../lib/apiClient';
import type { Post } from '../lib/posts';
import Avatar from './Avatar';
import Comments from './Comments';
import PostMedia from './PostMedia';
import { MoreIcon, PostHeartIcon, PostShareIcon, VerifiedIcon } from './icons';
import styles from './PostCard.module.scss';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 1) return '0s';
  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(n?: number): string {
  if (!n) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function hasTextSelection(root: HTMLElement | null): boolean {
  const sel = window.getSelection();
  if (!sel || sel.toString().length === 0) return false;
  if (!root || !sel.anchorNode) return true;
  return root.contains(sel.anchorNode) || (!!sel.focusNode && root.contains(sel.focusNode));
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('a, button, video');
}

function getPostImageList(
  post: Post & { images?: string[]; image_urls?: string[]; media_type?: string; type?: string; video?: string },
): string[] {
  if (Array.isArray(post.images) && post.images.length > 0) return post.images.filter(Boolean);
  if (Array.isArray(post.image_urls) && post.image_urls.length > 0) return post.image_urls.filter(Boolean);
  if (post.video) return [];
  if (!post.banner) return [];
  const raw = String(post.banner).trim();
  if (!raw) return [];
  if (raw.includes(',')) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter(Boolean).map(String);
    } catch {
      // fallthrough
    }
  }
  return [raw];
}

function getPostImages(
  post: Post & { images?: string[]; image_urls?: string[]; media_type?: string; type?: string; video?: string },
): string[] {
  return getPostImageList(post).map(mediaUrl).filter((u) => u.length > 0);
}

interface Props {
  post: Post;
  onPostChange?: (updated: Post) => void;
  defaultOpenComments?: boolean;
  basePath?: string;
}

function PostCard({ post: initialPost, onPostChange, defaultOpenComments, basePath = '' }: Props) {
  const [post, setPost] = useState<Post>(initialPost);
  // no realtime in extrovent — stub to false per spec
  const isUserOnline = (_id: unknown) => false;
  const navigate = useNavigate();
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  function update(p: Post) {
    setPost(p);
    onPostChange?.(p);
  }

  function openPost(e: React.MouseEvent) {
    const url = `${basePath}/post/${post.post_id}`;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      window.open(url, '_blank');
      return;
    }
    navigate(url);
  }

  function handleCardClick(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if (isInteractive(e.target)) return;
    if (hasTextSelection(articleRef.current)) return;
    openPost(e);
  }

  function handleCardAuxClick(e: React.MouseEvent) {
    if (e.button !== 1) return;
    if (isInteractive(e.target)) return;
    if (hasTextSelection(articleRef.current)) return;
    window.open(`${basePath}/post/${post.post_id}`, '_blank');
  }

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const isLiked = !!post.sliked;
    try {
      await toggleLike(post.post_id);
      update({
        ...post,
        total_likes: Math.max(0, (post.total_likes ?? 0) + (isLiked ? -1 : 1)),
        sliked: isLiked ? null : '1',
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/post/${post.post_id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Extrovent post', url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else window.open(url, '_blank');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  }

  // Extrovent -> merpati display mapping (supports new id/username + legacy user_id)
  const id = post.post_id;
  const content = post.caption;
  const handle = (post as unknown as { username?: string }).username ?? post.user_id ?? 'unknown';
  const displayName = post.nickname || handle || 'Unknown';
  const username = handle;
  const profilePhoto = post.avatar ?? null;
  const likes_count = post.total_likes ?? 0;
  const comments_count = post.total_comment ?? 0;
  const is_liked = !!post.sliked;
  const mediaItems = getPostImages(post);
  const verified = (post as unknown as { verified?: boolean; is_verified?: boolean; author_verified?: boolean }).verified
    ?? (post as unknown as { is_verified?: boolean }).is_verified
    ?? (post as unknown as { author_verified?: boolean }).author_verified;
  const timeLabel = post.date ? formatTime(post.date) : 'Just now';
  const userPath = handle && handle !== 'unknown' ? `/users/${encodeURIComponent(handle)}` : '/find-friends';
  const postPath = `${basePath}/post/${id}`;

  return (
    <article
      ref={articleRef}
      className={styles.postCard}
      onClick={handleCardClick}
      onAuxClick={handleCardAuxClick}
    >
      <Link to={userPath} onClick={(e) => e.stopPropagation()} className={styles.avatarLink}>
        <Avatar
          userId={(handle as unknown as number)}
          profilePhoto={profilePhoto}
          displayName={displayName}
          username={username}
          size={40}
          online={isUserOnline(post.user_id ?? handle)}
        />
      </Link>
      <div className={styles.postBody}>
        <div className={styles.postHeader}>
          <Link to={userPath} className={styles.authorName} onClick={(e) => e.stopPropagation()}>
            {displayName}
          </Link>
          {verified && (
            <span className={styles.badgeVerified} title="Verified">
              <VerifiedIcon size={16} />
            </span>
          )}
          <span className={styles.handle}>@{username}</span>
          <span className={styles.separator}>·</span>
          <Link
            to={postPath}
            className={styles.time}
            onClick={(e) => {
              if (hasTextSelection(articleRef.current)) e.preventDefault();
            }}
          >
            {timeLabel}
          </Link>
          <button className={styles.more} onClick={(e) => e.stopPropagation()} aria-label="More">
            <MoreIcon size={18} />
          </button>
        </div>
        <Link
          to={postPath}
          className={styles.contentLink}
          onClick={(e) => {
            e.stopPropagation();
            if (hasTextSelection(articleRef.current)) e.preventDefault();
          }}
        >
          <p className={styles.content}>{content}</p>
        </Link>
        <PostMedia items={mediaItems} onImageClick={openPost} />
        <div className={styles.actionsBar}>
          <Comments
            postId={id}
            commentsCount={comments_count}
            defaultOpen={defaultOpenComments}
            onCountChange={(next: number) => update({ ...post, total_comment: next })}
          />
          <button
            className={`${styles.action} ${is_liked ? styles.liked : ''}`}
            onClick={handleLike}
            aria-label="Like"
          >
            <span className={styles.actionIcon}>
              <PostHeartIcon size={18} filled={is_liked} />
            </span>
            <span className={styles.actionCount}>{formatCount(likes_count)}</span>
          </button>
          <button className={`${styles.action} ${styles.iconOnly}`} onClick={handleShare} aria-label="Share">
            <span className={styles.actionIcon}>
              <PostShareIcon size={18} />
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(PostCard);
