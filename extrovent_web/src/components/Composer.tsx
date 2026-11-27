import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Avatar from './Avatar';
import styles from './Composer.module.scss';

export default function Composer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.display_name?.trim() ||
    user?.nickname?.trim() ||
    user?.username?.trim() ||
    (user?.user_id ? String(user.user_id).trim() : '') ||
    (user?.id ? String(user.id).trim() : '') ||
    'explorer';

  const profilePhoto = user?.avatar ?? null;
  const username = user?.username || (user?.user_id ? String(user.user_id) : undefined);
  const userId = (user?.id ?? user?.user_id) as string | number | undefined;

  function handleClick() {
    navigate('/feed/new');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/feed/new');
    }
  }

  return (
    <div
      className={styles.composer}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Create post"
    >
      <Avatar
        size={36}
        displayName={displayName}
        username={username}
        profilePhoto={profilePhoto}
        userId={userId}
      />
      <Link
        to="/feed/new"
        className={styles.pill}
        onClick={(e) => e.stopPropagation()}
      >
        What adventures, {displayName}? — Share a trail
      </Link>
    </div>
  );
}
