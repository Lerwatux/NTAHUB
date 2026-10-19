import { useRef, useState } from 'react';
import type React from 'react';

/**
 * Balayage horizontal au doigt (téléphone / tablette) :
 * - suit le doigt pendant le geste (offset en px)
 * - déclenche onPrev / onNext au-delà du seuil
 * - laisse le défilement vertical normal de la page
 */
export function useHorizontalSwipe(onPrev: () => void, onNext: () => void, threshold = 60) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'h' | 'v' | null>(null);
  const [offset, setOffset] = useState(0);
  const [lastDirection, setLastDirection] = useState<'prev' | 'next' | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);

  const reset = () => {
    start.current = null;
    axis.current = null;
    setOffset(0);
  };

  const handlers: Pick<
    React.HTMLAttributes<HTMLElement>,
    'onTouchStart' | 'onTouchMove' | 'onTouchEnd' | 'onTouchCancel'
  > = {
    onTouchStart: (e) => {
      if (e.touches.length !== 1) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      axis.current = null;
    },
    onTouchMove: (e) => {
      if (!start.current) return;
      const dx = e.touches[0].clientX - start.current.x;
      const dy = e.touches[0].clientY - start.current.y;
      if (!axis.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      if (axis.current === 'h') setOffset(dx);
    },
    onTouchEnd: () => {
      if (axis.current === 'h' && Math.abs(offset) > threshold) {
        const direction = offset < 0 ? 'next' : 'prev';
        setLastDirection(direction);
        setSwipeCount((c) => c + 1);
        if (direction === 'next') onNext();
        else onPrev();
      }
      reset();
    },
    onTouchCancel: reset,
  };

  const style: React.CSSProperties = {
    transform: offset ? `translateX(${offset * 0.5}px)` : undefined,
    opacity: offset ? Math.max(0.5, 1 - Math.abs(offset) / 600) : undefined,
    transition: offset ? 'none' : 'transform 200ms ease-out, opacity 200ms ease-out',
  };

  /** Classe d'animation d'entrée après un balayage (vide sinon) */
  const enterClass =
    lastDirection === 'next' ? 'animate-swipe-in-right' : lastDirection === 'prev' ? 'animate-swipe-in-left' : '';

  return { handlers, style, enterClass, swipeCount };
}
