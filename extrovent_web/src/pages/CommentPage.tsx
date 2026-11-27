import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../lib/apiClient';
import { addComment as addPostComment, getComments as getPostComments } from '../lib/posts';
import type { PostComment } from '../lib/posts';
import { formatTime } from '../lib/chat';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import styles from './CommentPage.module.scss';

interface EventComment {
  comment_id?: number;
  event_id?: string;
  post_id?: string;
  user_id: string;
  comment: string;
  nickname?: string | null;
  avatar?: string | null;
  datetime?: string;
}

export default function CommentPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEvent = location.pathname.includes('/events');
  const entityId = id ?? '';
  const [comments, setComments] = useState<(PostComment | EventComment)[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (isEvent) {
        try {
          const data = await apiFetch<EventComment[] | { comments: EventComment[] }>(`/event/comments?event_id=${encodeURIComponent(entityId)}`);
          const list = Array.isArray(data) ? data : Array.isArray((data as { comments: EventComment[] }).comments) ? (data as { comments: EventComment[] }).comments : [];
          setComments(list);
        } catch {
          const alt = await apiFetch<EventComment[]>(`/event/comment/list?event_id=${encodeURIComponent(entityId)}`);
          setComments(Array.isArray(alt) ? alt : []);
        }
      } else {
        const data = await getPostComments(entityId);
        setComments(data);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load comments.');
      setComments([]);
    }
  }, [entityId, isEvent]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setSending(true);
    setError(null);
    // optimistic
    const optimistic: PostComment | EventComment = {
      comment_id: Date.now(),
      post_id: isEvent ? undefined : entityId,
      event_id: isEvent ? entityId : undefined,
      user_id: 'you',
      comment: text,
      nickname: 'You',
      datetime: new Date().toISOString(),
    } as PostComment;
    setComments((prev) => (prev ? [...prev, optimistic] : [optimistic]));
    setDraft('');
    try {
      if (isEvent) {
        try {
          await apiFetch('/event/comment', { method: 'POST', json: { event_id: entityId, comment: text } });
        } catch {
          await apiFetch('/event/comments', { method: 'POST', json: { event_id: entityId, comment: text } });
        }
      } else {
        await addPostComment(entityId, text);
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post comment.');
      // remove optimistic on failure
      setComments((prev) => prev?.filter((c) => c.comment_id !== optimistic.comment_id) ?? null);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  const backLink = isEvent ? `/events/${entityId}` : '/feed';

  return (
    <div className={styles.page}>
      <Link to={backLink} className={styles.breadcrumb}>
        ← Back
      </Link>

      <h1 className={styles.title}>{isEvent ? 'Event Comments' : 'Post Comments'}</h1>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      <div ref={listRef} className={styles.list}>
        {comments === null ? (
          <>
            <Skeleton variant="text" />
            <div style={{ height: '12px' }} />
            <Skeleton variant="text" width="80%" />
          </>
        ) : comments.length === 0 ? (
          <p className={styles.empty}>No comments yet — be the first!</p>
        ) : (
          <ul className={styles.items}>
            {comments.map((c, i) => {
              const isOptimisticSending = sending && i === comments.length - 1 && c.nickname === 'You' && c.comment === comments[comments.length - 1]?.comment;
              return (
                <li key={c.comment_id ?? i} className={styles.item}>
                  <div className={styles.avatar}>{(c.nickname || c.user_id || '?')[0].toUpperCase()}</div>
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span className={styles.name}>{c.nickname || c.user_id}</span>
                      <span className={styles.time}>{isOptimisticSending && sending ? 'Sending...' : formatTime(c.datetime)}</span>
                    </div>
                    <p className={styles.text}>{c.comment}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={onSend} className={styles.composer}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          aria-label="Write a comment"
          className={styles.input}
        />
        <Button type="submit" size="md" disabled={sending || !draft.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
