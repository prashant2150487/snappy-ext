import { useCallback, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { clamp, normalizeRect, type Point, type Rect } from '../utils/crop';

const MIN_SIZE = 6; // ignore accidental clicks

interface Options {
  onStart?: () => void;
  onComplete: (rect: Rect) => void;
}

export function useSelection(containerRef: RefObject<HTMLElement | null>, { onStart, onComplete }: Options) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<Point | null>(null);

  // Pointer position relative to the overlay, clamped so the selection can't leave the screenshot.
  const toLocal = (e: PointerEvent): Point | null => {
    const el = containerRef.current;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      x: clamp(e.clientX - b.left, 0, b.width),
      y: clamp(e.clientY - b.top, 0, b.height),
    };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = toLocal(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = p;
    setRect(null);
    setDragging(true);
    onStart?.();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const o = origin.current;
    const p = o && toLocal(e);
    if (o && p) setRect(normalizeRect(o, p));
  };

  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const o = origin.current;
    if (!o) return;
    origin.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const p = toLocal(e);
    if (cancelled || !p) return setRect(null);

    const r = normalizeRect(o, p);
    if (r.width < MIN_SIZE || r.height < MIN_SIZE) return setRect(null);

    setRect(r);
    onComplete(r);
  };

  const reset = useCallback(() => {
    origin.current = null;
    setRect(null);
    setDragging(false);
  }, []);

  return {
    rect,
    dragging,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: PointerEvent<HTMLDivElement>) => finish(e, false),
      onPointerCancel: (e: PointerEvent<HTMLDivElement>) => finish(e, true),
    },
  };
}