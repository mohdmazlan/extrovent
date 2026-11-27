import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Input } from '../components/Input';
import Button from '../components/Button';
import styles from './AuthPage.module.scss';

export default function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ user_id: '', email: '', password: '', confirm_password: '', nickname: '' });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (fields.password !== fields.confirm_password) return;
    setBusy(true);
    try {
      const username = fields.user_id.trim() || fields.email.split('@')[0];
      await register({ email: fields.email.trim(), password: fields.password, username, displayName: fields.nickname.trim() || username });
      navigate('/', { replace: true });
    } catch {
      // Error message is already exposed via AuthContext.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🌲</div>
          <h1>Join Extrovent</h1>
          <p>Create your explorer account</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <Input label="User ID" value={fields.user_id} onChange={(e) => set('user_id', e.target.value)} placeholder="choose a username" required />
          <Input label="Email" type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
          <Input label="Nickname" value={fields.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="How should we call you?" />
          <Input
            label="Password"
            type="password"
            value={fields.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={fields.confirm_password}
            onChange={(e) => set('confirm_password', e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          {error && (
            <div className={styles.alert} role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
            {busy ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.footer}>
          Have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
