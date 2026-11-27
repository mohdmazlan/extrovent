import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.scss';

const PRIMARY = [
  { to: '/explore', label: 'Explore', icon: '⌖' },
  { to: '/feed', label: 'Feed', icon: '▤' },
  { to: '/notifications', label: 'Notifications', icon: '◐' },
  { to: '/profile', label: 'Profile', icon: '◎' },
] as const;

const GROUPS = [
  { title: 'Discover', items: [
    { to: '/places', label: 'Places', icon: '◈' },
    { to: '/events', label: 'Events', icon: '⬢' },
    { to: '/activities', label: 'Activities', icon: '⬣' },
    { to: '/search', label: 'Search', icon: '⌕' },
  ]},
  { title: 'Social', items: [
    { to: '/chat', label: 'Chat', icon: '✉' },
    { to: '/friends/find', label: 'Friends', icon: '☺' },
    { to: '/friends', label: 'Contacts', icon: '☰' },
  ]},
  { title: 'You', items: [
    { to: '/business', label: 'Business', icon: '🏢' },
    { to: '/settings', label: 'Settings', icon: '⚙' },
  ]},
] as const;

export default function Sidebar({ notifCount = 0 }: { notifCount?: number }) {
  return (
    <aside className={styles.sidebar} aria-label="Sidebar">
      <div className={styles.brand}>
        <span className={styles.logo}>⛰</span>
        <span className={styles.brandText}>Extrovent</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.primary}>
          {PRIMARY.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.link} ${styles.primaryLink} ${isActive ? styles.active : ''}`}>
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/notifications' && notifCount > 0 && (
                <span className={styles.badge}>{notifCount}</span>
              )}
            </NavLink>
          ))}
        </div>

        {GROUPS.map((g) => (
          <details key={g.title} className={styles.group} open>
            <summary className={styles.groupTitle}>{g.title}</summary>
            <div className={styles.groupItems}>
              {g.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
