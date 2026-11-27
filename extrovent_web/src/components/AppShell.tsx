import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { listNotifications, getUnreadCount } from '../lib/notifications';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import HeaderMenu from './HeaderMenu';
import '../styles/layout/_shell.scss';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const fetchCount = async () => {
      try { const items = await listNotifications(); if (alive) setNotifCount(getUnreadCount(items)); } catch {}
    };
    void fetchCount();
    const id = window.setInterval(fetchCount, 15000);
    return () => { alive = false; window.clearInterval(id); };
  }, [user]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand">
            <span className="app-header__logo">⛰</span>
            Extrovent
          </Link>

          <div className="app-header__actions">
            <Link to="/search" className="app-header__search" aria-label="Search">⌕</Link>
            <HeaderMenu />
          </div>
        </div>
      </header>

      <div className="app-shell__body">
        <Sidebar notifCount={notifCount} />
        <main className="app-main">{children}</main>
      </div>

      <BottomNav notifCount={notifCount} />

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Extrovent — Explore outdoors, together.</span>
      </footer>
    </div>
  );
}
