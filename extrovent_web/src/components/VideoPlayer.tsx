import { useEffect, useRef, useState } from 'react';
import styles from './VideoPlayer.module.scss';

interface Props {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${isFullscreen ? styles.fullscreen : ''}`}
      onDoubleClick={toggleFullscreen}
    >
      <video ref={ref} src={src} poster={poster} controls preload="metadata" className={styles.video} playsInline />
      <button type="button" className={styles.fsBtn} onClick={toggleFullscreen} aria-label="Toggle fullscreen">
        {isFullscreen ? '⤓ Exit' : '⛶ Fullscreen'}
      </button>
    </div>
  );
}
