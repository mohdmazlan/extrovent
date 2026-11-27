type IconProps = {
  size?: number;
  filled?: boolean;
  active?: boolean;
  className?: string;
  title?: string;
};

/**
 * PostHeartIcon — outline vs filled heart.
 * Filled uses currentColor fill; outline uses stroke only.
 */
export function PostHeartIcon({ size = 18, filled, className, title }: IconProps) {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0}
        aria-hidden="true"
        className={className}
        role={title ? 'img' : undefined}
      >
        {title ? <title>{title}</title> : null}
        <path d="M12 21s-6.5-4.35-8.5-8.5C1.74 8.16 5.02 3.5 9.05 5.6c1.2.63 1.95 1.56 2.95 2.2 1-.64 1.75-1.57 2.95-2.2C19.0 3.5 22.26 8.16 20.5 12.5 18.5 16.65 12 21 12 21z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 21s-6.5-4.35-8.5-8.5C1.74 8.16 5.02 3.5 9.05 5.6c1.2.63 1.95 1.56 2.95 2.2 1-.64 1.75-1.57 2.95-2.2C19.0 3.5 22.26 8.16 20.5 12.5 18.5 16.65 12 21 12 21z" />
    </svg>
  );
}

/**
 * PostShareIcon — upward share arrow with tray (ios_share style).
 */
export function PostShareIcon({ size = 18, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {/* upward arrow */}
      <path d="M12 14V3" />
      <path d="M8.5 6.5L12 3l3.5 3.5" />
      {/* tray */}
      <path d="M4 14v6h16v-6" />
      <path d="M4 14h16" opacity={0} />
    </svg>
  );
}

/**
 * MoreIcon — 3 horizontal dots.
 */
export function MoreIcon({ size = 18, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
}

/**
 * VerifiedIcon — filled circle with white checkmark.
 * Uses currentColor for the circle fill; check is contrasting.
 */
export function VerifiedIcon({ size = 16, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M8.5 12.2l2.2 2.2 4.8-5.1"
        stroke="white"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Optional aliases for convenience
export const HeartIcon = PostHeartIcon;
export const ShareIcon = PostShareIcon;
