import styles from './RatingList.module.scss';
import type { Rating } from '../lib/ratings';
import { formatTime } from '../lib/chat';

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value} stars`}>
      {[1,2,3,4,5].map(s => <span key={s} className={s <= value ? styles.filled : styles.empty}>★</span>)}
    </span>
  );
}

export default function RatingList({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) return <p className={styles.empty}>No ratings yet — be the first!</p>;
  return (
    <div className={styles.list}>
      {ratings.map((r, i) => (
        <div key={r.rating_id ?? i} className={styles.row}>
          <div className={styles.avatar}>{(r.nickname ?? r.user_id ?? '?')[0]?.toUpperCase()}</div>
          <div className={styles.body}>
            <div className={styles.head}>
              <span className={styles.name}>{r.nickname || r.user_id}</span>
              <Stars value={r.rating ?? r.stars ?? 0} />
              <span className={styles.date}>{formatTime(r.datetime ?? r.created_at)}</span>
            </div>
            {(r.comment ?? r.description) && <p className={styles.comment}>{r.comment ?? r.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
