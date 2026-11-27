import { useState, useEffect } from 'react';
import Button from './Button';
import styles from './RatingDialog.module.scss';

interface Props {
  open: boolean;
  initialRating?: number;
  initialComment?: string;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void> | void;
}

export default function RatingDialog({ open, initialRating = 0, initialComment = '', onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
      setError(null);
    }
  }, [open, initialRating, initialComment]);

  if (!open) return null;

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select 1-5 stars');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rating, comment.trim() || undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Rate this</h3>
        <div className={styles.stars} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s} star`}
              className={`${styles.star} ${s <= rating ? styles.filled : ''}`}
              onClick={() => setRating(s)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        {error && <div className={styles.error} role="alert">{error}</div>}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
        </div>
      </div>
    </div>
  );
}
