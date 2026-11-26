import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './HomePage.module.scss';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>🌲 Outdoor Community</div>
          <h1 className={styles.heroTitle}>
            Explore outdoors, <span>together.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover trails, join adventures, and share places with explorers around you. Hello,{' '}
            <strong style={{ color: 'white' }}>{user?.nickname || user?.user_id}</strong> — your next journey starts
            here.
          </p>
          <div className={styles.heroActions}>
            <Link
              to="/feed"
              style={{
                background: 'white',
                color: '#1b4332',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Explore Feed →
            </Link>
            <Link
              to="/events"
              style={{
                background: 'rgba(255,255,255,0.14)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              Browse Events
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>500+</div>
              <div className={styles.statLabel}>Adventures</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>2.4k</div>
              <div className={styles.statLabel}>Explorers</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>120+</div>
              <div className={styles.statLabel}>Places</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Jump in</h2>
          <Link to="/search">Search all →</Link>
        </div>
        <div className={styles.grid}>
          <Link to="/feed" className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconFeed}`}>🌿</div>
            <div className={styles.featureTitle}>Feed</div>
            <div className={styles.featureDesc}>See posts, photos, and stories from fellow explorers in your area.</div>
          </Link>
          <Link to="/events" className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconEvents}`}>⛺</div>
            <div className={styles.featureTitle}>Events</div>
            <div className={styles.featureDesc}>Join hikes, camps, and outdoor gatherings — or create your own.</div>
          </Link>
          <Link to="/places" className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconPlaces}`}>🗺️</div>
            <div className={styles.featureTitle}>Places</div>
            <div className={styles.featureDesc}>Discover hidden gems and mark your favorite spots on the map.</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
