import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './HeaderMenu.module.scss';

export default function HeaderMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const initial = (user?.nickname || user?.user_id || user?.username || '?')[0]?.toUpperCase() ?? '?';
  const display = user?.nickname || user?.display_name || user?.username || user?.user_id || 'User';

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;

  const close = () => {
    setOpen(false);
    // return focus
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.name}>{display}</span>
        <span className={styles.avatar} aria-hidden>{initial}</span>
        <span className={styles.caret} aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden />
          <div className={styles.menu} role="menu">
            <Link to="/profile" role="menuitem" className={styles.item} onClick={close}>View profile</Link>
            <Link to="/settings" role="menuitem" className={styles.item} onClick={close}>Settings</Link>
            <button type="button" role="menuitem" className={styles.item} onClick={() => { close(); void logout(); }}>Logout</button>
          </div>
        </>
      )}
    </div>
  );
}
