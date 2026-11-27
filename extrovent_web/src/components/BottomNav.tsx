import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './BottomNav.module.scss';

const PRIMARY = [
  { to: '/explore', label: 'Explore', icon: '⌖' },
  { to: '/feed', label: 'Feed', icon: '▤' },
  { to: '/notifications', label: 'Notifications', icon: '◐' },
  { to: '/profile', label: 'Profile', icon: '◎' },
] as const;

const SHEET_GROUPS = [
  { title: 'Discover', items: [{ to: '/places', label: 'Places' }, { to: '/events', label: 'Events' }, { to: '/activities', label: 'Activities' }, { to: '/search', label: 'Search' }]},
  { title: 'Social', items: [{ to: '/chat', label: 'Chat' }, { to: '/friends/find', label: 'Friends' }, { to: '/friends', label: 'Contacts' }]},
  { title: 'You', items: [{ to: '/business', label: 'Business' }, { to: '/settings', label: 'Settings' }]},
] as const;

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className={styles.bottomNav} aria-label="Bottom">
        {PRIMARY.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
            <span className={styles.icon}>{item.icon}
              {item.to === '/notifications' && notifCount > 0 && <span className={styles.badge}>{notifCount}</span>}
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className={styles.item} aria-expanded={open} aria-label="More" onClick={() => setOpen((v)=>!v)}>
          <span className={styles.icon}>☰</span>
          <span className={styles.label}>More</span>
        </button>
      </nav>

      {open && (
        <div className={styles.sheetOverlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e)=>e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <span>More</span>
              <button type="button" onClick={() => setOpen(false)} className={styles.close}>✕</button>
            </div>
            {SHEET_GROUPS.map((g)=> (
              <div key={g.title} className={styles.sheetGroup}>
                <div className={styles.sheetTitle}>{g.title}</div>
                {g.items.map((it)=> (
                  <Link key={it.to} to={it.to} className={styles.sheetLink} onClick={() => setOpen(false)}>{it.label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
