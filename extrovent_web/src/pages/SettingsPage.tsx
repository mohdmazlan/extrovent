import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { getTheme, setTheme } from '../lib/theme';
import type { ThemeMode } from '../lib/theme';
import styles from './SettingsPage.module.scss';

export default function SettingsPage() {
  const [mode, setMode] = useState<ThemeMode>(() => getTheme());
  const [saved, setSaved] = useState(false);

  useEffect(() => { setMode(getTheme()); }, []);

  function choose(m: ThemeMode) {
    setMode(m);
    setTheme(m);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.container}>
      <Link to="/profile" className={styles.breadcrumb}>← Back to Profile</Link>
      <h1>Settings</h1>
      <Card variant="elevated">
        <div className={styles.section}>
          <h3>Appearance</h3>
          <p className={styles.hint}>Choose light, dark, or follow your system. Like OutdoorBuddy's settings.</p>
          <div className={styles.segment} role="radiogroup" aria-label="Theme">
            {(['light','dark','system'] as ThemeMode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode===m}
                className={`${styles.segBtn} ${mode===m?styles.active:''}`} onClick={() => choose(m)}>
                {m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>
          {saved && <div className={styles.saved} role="status">Saved ✓</div>}
        </div>
      </Card>
      <div style={{ marginTop: '16px' }}>
        <Link to="/profile"><Button variant="ghost">Back to Profile</Button></Link>
      </div>
    </div>
  );
}
