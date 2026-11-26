import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/layout/_shell.scss';

const NAV_ITEMS = [
  { to: '/feed', label: 'Feed' },
  { to: '/events', label: 'Events' },
  { to: '/places', label: 'Places' },
  { to: '/search', label: 'Search' },
  { to: '/profile', label: 'Profile' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close mobile nav on navigation
  const close = () => setOpen(false);

  const initial = (user?.nickname || user?.user_id || '?')[0]?.toUpperCase();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand" onClick={close}>
            <span className="app-header__logo">⛰</span>
            Extrovent
          </Link>

          <nav className={`app-header__nav ${open ? 'is-open' : ''}`} aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={close}
                className={({ isActive }) => `app-header__link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="app-header__actions">
            {user && (
              <div className="app-header__user">
                <span>{user.nickname || user.user_id}</span>
                <span className="app-header__avatar">{initial}</span>
              </div>
            )}
            <button type="button" onClick={() => void logout()} className="app-header__link" style={{ border: 'none', background: 'var(--bg-subtle)', cursor: 'pointer' }}>
              Logout
            </button>
            <button
              type="button"
              className="app-header__burger"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Extrovent — Explore outdoors, together.</span>
      </footer>
    </div>
  );
}
