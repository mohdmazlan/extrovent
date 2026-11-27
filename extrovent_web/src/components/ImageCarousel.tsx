import { useState } from 'react';
import styles from './ImageCarousel.module.scss';

interface Props {
  images: string[];
  onImageClick?: (index: number) => void;
}

export default function ImageCarousel({ images, onImageClick }: Props) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className={styles.single}>
        <img
          src={images[0]}
          alt="post image"
          className={styles.image}
          onClick={() => onImageClick?.(0)}
          style={onImageClick ? { cursor: 'pointer' } : undefined}
        />
      </div>
    );
  }
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  return (
    <div className={styles.wrap}>
      <div className={styles.viewport}>
        <img
          src={images[idx]}
          alt={`slide ${idx + 1}`}
          className={styles.image}
          onClick={() => onImageClick?.(idx)}
          style={onImageClick ? { cursor: 'pointer' } : undefined}
        />
        <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={prev} aria-label="Previous image">
          ‹
        </button>
        <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={next} aria-label="Next image">
          ›
        </button>
      </div>
      <div className={styles.dots}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.dot} ${i === idx ? styles.active : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
