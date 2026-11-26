import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, variant = 'elevated', interactive = false, className = '', onClick }: CardProps) {
  const classes = [styles.card, styles[variant], interactive ? styles.interactive : '', className].filter(Boolean).join(' ');
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}
