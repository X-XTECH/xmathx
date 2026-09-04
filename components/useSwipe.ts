'use client';
import { useRef, type PointerEvent } from 'react';

/** Horizontal swipe. Left goes forward, right goes back. Pointer events only, no library. */
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  return {
    onPointerDown(e: PointerEvent) { if (e.pointerType === 'mouse' && e.button !== 0) return; start.current = { x: e.clientX, y: e.clientY, t: Date.now() }; },
    onPointerUp(e: PointerEvent) {
      const s = start.current; start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.t > 700) return;
      if (dx < 0) onLeft(); else onRight();
    },
    onPointerCancel() { start.current = null; },
  };
}
