import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../lib/apiClient';
import { addComment, getComments } from '../lib/posts';
import type { PostComment } from '../lib/posts';
import Button from './Button';
import styles from './Comments.module.scss';

interface Props {
  postId: string;
  commentsCount?: number;
  defaultOpen?: boolean;
  onCountChange?: (next: number) => void;
}

export default function Comments({ postId, commentsCount, defaultOpen = false, onCountChange }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getComments(postId);
      setComments(data);
      if (onCountChange && typeof data.length === 'number') onCountChange(data.length);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not load comments.'); }
  }, [postId, onCountChange]);

  useEffect(() => { if (open && comments === null) void load(); }, [open, comments, load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await addComment(postId, draft.trim());
      setDraft('');
      await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not post comment.'); }
    finally { setBusy(false); }
  }

  return (
    <div className={styles.wrapper}>
      <button type="button" onClick={() => setOpen(v=>!v)} className={styles.toggle}>
        💬 Comments · {comments ? comments.length : (commentsCount ?? 0)}
      </button>
      {open && (
        <div className={styles.panel}>
          {error && <p className={styles.error}>{error}</p>}
          {comments && comments.length > 0 ? (
            <ul className={styles.list}>
              {comments.map((c,i)=> <li key={c.comment_id ?? i} className={styles.item}>{c.nickname || c.user_id}: {c.comment}</li>)}
            </ul>
          ) : comments && <p className={styles.empty}>No comments yet — be the first!</p>}
          <form onSubmit={submit} className={styles.form}>
            <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a comment…" className={styles.input} />
            <Button type="submit" size="sm" disabled={busy || !draft.trim()}>{busy ? 'Posting…' : 'Post'}</Button>
          </form>
        </div>
      )}
    </div>
  );
}
