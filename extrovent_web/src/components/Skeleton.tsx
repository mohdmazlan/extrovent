import styles from './Skeleton.module.scss';

export function SkeletonText({ lines = 1, width }: { lines?: number; width?: string }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={styles.text} style={width ? { width } : i === lines - 1 ? { width: '80%' } : undefined} />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return <div className={styles.card} />;
}

export function SkeletonAvatar() {
  return <div className={styles.avatar} />;
}

export default function Skeleton({ width, height, variant = 'text' }: { width?: string; height?: string; variant?: 'text' | 'title' | 'card' | 'image' }) {
  const cls = variant === 'title' ? styles.title : variant === 'card' ? styles.card : variant === 'image' ? styles.image : styles.text;
  return <div className={cls} style={{ width, height }} />;
}
