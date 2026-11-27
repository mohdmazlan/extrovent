import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageViewer.module.scss';

interface Props {
  src: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ImageViewer({ src, open, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, src, reset]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(4, Math.max(1, s + delta)));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || scale === 1) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onPointerUp() {
    dragging.current = false;
  }

  if (!open || !src) return null;

  const overlay = (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>
      <div
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img
          src={src}
          alt="preview"
          className={styles.image}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>
      <div className={styles.hint}>Scroll to zoom · Drag to pan · ESC to close</div>
    </div>
  );

  return createPortal(overlay, document.body);
}
