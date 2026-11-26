import styles from './Badge.module.scss';

type Variant = 'forest' | 'amber' | 'sky' | 'stone' | 'success' | 'neutral';

export default function Badge({ children, variant = 'forest' }: { children: React.ReactNode; variant?: Variant }) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
