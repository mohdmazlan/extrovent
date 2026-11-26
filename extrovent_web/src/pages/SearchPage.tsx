import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { unifiedSearch } from '../lib/users';
import type { SearchResults } from '../lib/users';
import { Input } from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import styles from './SearchPage.module.scss';

interface SearchItem {
  title?: string;
  nickname?: string | null;
  user_id?: string;
  id?: number;
  type: string;
}

const GROUPS: Array<{ label: string; key: 'places' | 'events' | 'activities' | 'users' }> = [
  { label: 'Places', key: 'places' },
  { label: 'Events', key: 'events' },
  { label: 'Activities', key: 'activities' },
  { label: 'Users', key: 'users' },
];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await unifiedSearch(q.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link to="/" className={styles.breadcrumb}>
        ← Back to Home
      </Link>

      <div className={styles.header}>
        <h1>Search</h1>
        <p>Find places, events, activities, and people</p>
      </div>

      <form onSubmit={onSubmit} className={styles.searchBar}>
        <Input
          placeholder="Search places, events, people…"
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={loading || !q.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {results ? (
        <div className={styles.results}>
          {GROUPS.map(({ label, key }) => {
            const items: SearchItem[] = results[key];
            return (
              <div key={label} className={styles.group}>
                <h2>
                  {label} <span>{items.length} found</span>
                </h2>
                {items.length === 0 ? (
                  <div className={styles.empty}>No {label.toLowerCase()} found.</div>
                ) : (
                  <ul>
                    {items.map((it, i) => (
                      <li key={`${label}-${it.id ?? it.user_id ?? i}`}>
                        <span>
                          {it.nickname ? `${it.nickname} (${it.user_id})` : it.title}
                        </span>
                        <Badge variant="stone">{it.type}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !error && <EmptyState icon="🔍" title="Start searching" description="Enter a keyword to search across places, events, activities, and users." />
      )}
    </div>
  );
}
