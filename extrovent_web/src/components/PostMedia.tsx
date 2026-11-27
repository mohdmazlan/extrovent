import ImageCarousel from './ImageCarousel';
import VideoPlayer from './VideoPlayer';
import styles from './PostMedia.module.scss';

type MediaItem = string | { url: string; type: 'image' | 'video' };

interface Props {
  items: MediaItem[];
  onImageClick?: (e: React.MouseEvent) => void;
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0].split('#')[0];
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.m3u8') ||
    lower.endsWith('.ogv') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.3gp')
  );
}

function normalize(items: MediaItem[]): { url: string; isVideo: boolean }[] {
  return items
    .map((it) => {
      if (typeof it === 'string') {
        const url = it.trim();
        if (!url) return null;
        return { url, isVideo: isVideoUrl(url) };
      }
      if (it && typeof it === 'object' && typeof it.url === 'string') {
        const url = it.url.trim();
        if (!url) return null;
        const isVideo = it.type === 'video' || isVideoUrl(url);
        return { url, isVideo };
      }
      return null;
    })
    .filter(Boolean) as { url: string; isVideo: boolean }[];
}

export default function PostMedia({ items, onImageClick }: Props) {
  if (!items || items.length === 0) return null;

  const normalized = normalize(items);
  if (normalized.length === 0) return null;

  // Single item
  if (normalized.length === 1) {
    const { url, isVideo } = normalized[0];
    if (isVideo) {
      // Single video -> VideoPlayer (stopPropagation handled inside VideoPlayer wrapper)
      return (
        <div className={styles.media} onClick={(e) => e.stopPropagation()}>
          <VideoPlayer src={url} />
        </div>
      );
    }
    // Single image -> plain img with click
    return (
      <div className={`${styles.media} ${styles.single}`} onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt="post media"
          loading="lazy"
          decoding="async"
          onClick={(e) => {
            e.stopPropagation();
            if (onImageClick) onImageClick(e);
            else window.open(url, '_blank');
          }}
          className={onImageClick ? styles.clickable : undefined}
        />
      </div>
    );
  }

  // Multiple -> delegate to ImageCarousel
  // Extract urls for carousel; videos are not carousel-native, so filter images only for carousel
  // If any videos exist in multi-set, render a simple grid fallback instead
  const hasVideo = normalized.some((n) => n.isVideo);
  if (hasVideo) {
    // Mixed grid: render all as grid; videos with VideoPlayer inline, images with img
    // Fallback when carousel cannot handle videos
    return (
      <div className={styles.media} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grid}>
          {normalized.slice(0, 4).map((m, i) =>
            m.isVideo ? (
              <VideoPlayer key={i} src={m.url} />
            ) : (
              <img
                key={i}
                src={m.url}
                alt=""
                loading="lazy"
                decoding="async"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onImageClick) onImageClick(e);
                  else window.open(m.url, '_blank');
                }}
                className={`${styles.gridImg}${onImageClick ? ` ${styles.clickable}` : ''}`}
              />
            )
          )}
        </div>
      </div>
    );
  }

  const urls = normalized.map((n) => n.url);
  // Adapt ImageCarousel's (index:number)=>void to PostMedia's (e:React.MouseEvent)=>void
  const handleCarouselClick = onImageClick
    ? ((idx: number) => {
        // Synthesize a mouse event-like object for compatibility
        const synthetic = {
          preventDefault: () => {},
          stopPropagation: () => {},
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          button: 0,
          currentTarget: null,
          // carry index for callers that inspect it
          index: idx,
        } as unknown as React.MouseEvent;
        onImageClick(synthetic);
      }) as unknown as (index: number) => void
    : undefined;

  return (
    <div className={styles.media} onClick={(e) => e.stopPropagation()}>
      <ImageCarousel images={urls} onImageClick={handleCarouselClick} />
    </div>
  );
}
