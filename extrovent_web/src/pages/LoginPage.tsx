import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Input } from '../components/Input';
import Button from '../components/Button';
import styles from './AuthPage.module.scss';

export default function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await login(identifier, password);
      navigate('/', { replace: true });
    } catch {
      // Error message already via AuthContext; 429 retry_after surfaced via ApiError
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>⛰</div>
          <h1>Welcome back</h1>
          <p>Log in to continue your adventure</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input label="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or username" required autoComplete="username" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <div className={styles.footer}>
          No account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
