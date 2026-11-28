import { useCallback, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { clamp, normalizeRect, type Point, type Rect } from '../utils/crop';

const MIN_SIZE = 6; // ignore accidental clicks

interface Options {
  onStart?: () => void;
  onComplete: (rect: Rect) => void;
}

type Interaction =
  | { mode: 'draw'; start: Point }
  | { mode: 'move' | 'resize'; start: Point; rect: Rect; edge: string | null };

export function useSelection(containerRef: RefObject<HTMLElement | null>, { onStart, onComplete }: Options) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);
  const interaction = useRef<Interaction | null>(null);

  // Pointer position relative to the overlay, clamped so the selection can't leave the screenshot.
  const toLocal = (e: PointerEvent<HTMLElement>): Point | null => {
    const el = containerRef.current;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      x: clamp(e.clientX - b.left, 0, b.width),
      y: clamp(e.clientY - b.top, 0, b.height),
    };
  };

  const onDrawPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = toLocal(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    interaction.current = { mode: 'draw', start: p };
    setRect(null);
    setDragging(true);
    onStart?.();
  };

  const onSelectionPointerDown = (e: PointerEvent<HTMLElement>, edge: string | null) => {
    if (e.button !== 0 || !rect) return;
    const p = toLocal(e);
    if (!p) return;
    e.preventDefault();
    e.stopPropagation();
    const selection = e.currentTarget.closest<HTMLElement>('.ss-selection') ?? e.currentTarget;
    selection.setPointerCapture(e.pointerId);
    interaction.current = { mode: edge ? 'resize' : 'move', start: p, rect, edge };
    setDragging(true);
    onStart?.();
  };

  const updateRect = (active: Interaction, point: Point): Rect => {
    if (active.mode === 'draw') return normalizeRect(active.start, point);

    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return active.rect;

    const { rect: initial, start, edge } = active;
    if (active.mode === 'move') {
      return {
        ...initial,
        x: clamp(initial.x + point.x - start.x, 0, bounds.width - initial.width),
        y: clamp(initial.y + point.y - start.y, 0, bounds.height - initial.height),
      };
    }

    let left = initial.x;
    let right = initial.x + initial.width;
    let top = initial.y;
    let bottom = initial.y + initial.height;
    if (edge?.includes('w')) left = clamp(point.x, 0, right - MIN_SIZE);
    if (edge?.includes('e')) right = clamp(point.x, left + MIN_SIZE, bounds.width);
    if (edge?.includes('n')) top = clamp(point.y, 0, bottom - MIN_SIZE);
    if (edge?.includes('s')) bottom = clamp(point.y, top + MIN_SIZE, bounds.height);
    return { x: left, y: top, width: right - left, height: bottom - top };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const active = interaction.current;
    const point = active && toLocal(e);
    if (active && point) setRect(updateRect(active, point));
  };

  const finish = (e: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const active = interaction.current;
    if (!active) return;
    interaction.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const point = toLocal(e);
    if (cancelled || !point) {
      setRect(active.mode === 'draw' ? null : active.rect);
      return;
    }

    const r = updateRect(active, point);
    if (active.mode === 'draw' && (r.width < MIN_SIZE || r.height < MIN_SIZE)) {
      setRect(null);
      return;
    }

    setRect(r);
    onComplete(r);
  };

  const reset = useCallback(() => {
    interaction.current = null;
    setRect(null);
    setDragging(false);
  }, []);

  return {
    rect,
    dragging,
    reset,
    selectionHandlers: {
      onPointerDown: onSelectionPointerDown,
      onPointerMove,
      onPointerUp: (e: PointerEvent<HTMLElement>) => finish(e, false),
      onPointerCancel: (e: PointerEvent<HTMLElement>) => finish(e, true),
    },
    handlers: {
      onPointerDown: onDrawPointerDown,
      onPointerMove,
      onPointerUp: (e: PointerEvent<HTMLDivElement>) => finish(e, false),
      onPointerCancel: (e: PointerEvent<HTMLDivElement>) => finish(e, true),
    },
  };
}