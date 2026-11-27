type AvatarProps = {
  userId?: string | number;
  profilePhoto?: string | null;
  displayName?: string;
  username?: string;
  size?: number;
  online?: boolean;
  alt?: string;
};

export default function Avatar({
  userId,
  profilePhoto,
  displayName,
  username,
  size = 40,
  online = false,
}: AvatarProps) {
  const raw = displayName || username || (userId != null ? String(userId) : '') || '?';
  const initial = raw.trim()[0]?.toUpperCase() ?? '?';
  const dimension = size;

  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    width: dimension,
    height: dimension,
    flexShrink: 0,
    borderRadius: 9999,
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: Math.round(dimension * 0.42),
    lineHeight: 1,
    userSelect: 'none',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  };

  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: Math.max(8, Math.round(dimension * 0.28)),
    height: Math.max(8, Math.round(dimension * 0.28)),
    borderRadius: 9999,
    background: '#22c55e',
    border: '2px solid var(--bg-elevated)',
  };

  if (profilePhoto) {
    return (
      <div style={wrapStyle} aria-hidden={false} aria-label={displayName || username || String(userId ?? 'avatar')}>
        <img src={profilePhoto} alt={displayName || username || 'avatar'} style={imgStyle} loading="lazy" />
        {online ? <span style={dotStyle} aria-hidden /> : null}
      </div>
    );
  }

  return (
    <div style={wrapStyle} aria-label={displayName || username || String(userId ?? 'avatar')}>
      <span>{initial}</span>
      {online ? <span style={dotStyle} aria-hidden /> : null}
    </div>
  );
}
