import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/* The paging rail Home uses twice — the hero banners and Previously Ordered.
   Pages are the width of the rail and snap to it; a timer walks them, the last
   wrapping back to the first; the active dot counts the hold down so the move
   is never a surprise. */
export function useAutoAdvance(count: number, intervalMs: number) {
  const rail = useRef<HTMLDivElement>(null);
  /** The growing part of the active dot. */
  const fill = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  /* True while a finger is down on the rail, so a tick can't yank the page out
     from under a swipe in progress. */
  const dragging = useRef(false);
  /* A mouse press on the rail: where it started, where the rail was then, and
     whether it has moved far enough to be a drag rather than a tap. A finger
     scrolls the rail by itself; a mouse can't touch an overflow container, so
     on a desktop the pointer has to push it by hand — without it the banners
     only ever moved on the timer. */
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  /** Past this many pixels a press is a drag, not a tap on the card. */
  const DRAG_AT = 4;
  /* Reduced motion turns the whole thing off — both the movement and the bar
     counting down to it. Read once: it decides what the dots even render as. */
  const [autoplay] = useState(
    () => count > 1 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  /* The next index is read from the rail's own scrollLeft rather than from
     `index`, so a tick after a manual swipe carries on from where the buyer
     left it instead of from where the timer thought it was. */
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      const el = rail.current;
      if (!el || dragging.current) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, count, intervalMs]);

  /* Restart the fill whenever the page changes: snap it back to empty with no
     transition, force the reset to land, then let it grow across the hold.
     Driven here rather than by a CSS animation so it restarts on a manual
     swipe too, not only on a tick. */
  useEffect(() => {
    const el = fill.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.width = '0%';
    void el.offsetWidth;
    el.style.transition = `width ${intervalMs}ms linear`;
    el.style.width = '100%';
  }, [index, intervalMs]);

  /* Land on a whole page rather than wherever the mouse let go — half a
     banner showing is nobody's intent. A press that never moved is left
     alone, so the card under it still gets its click. */
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    const el = rail.current;
    const d = drag.current;
    drag.current = null;
    if (!d || !el) return;
    if (!d.moved) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    el.style.scrollSnapType = '';
    el.scrollTo({
      left: Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth,
      behavior: 'smooth',
    });
  };

  return {
    index,
    autoplay,
    fillRef: fill,
    /** Spread onto the scrolling element itself. */
    railProps: {
      ref: rail,
      onScroll: () => {
        const el = rail.current;
        if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
      },
      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
        dragging.current = true;
        const el = rail.current;
        if (e.pointerType !== 'mouse' || !el) return;
        /* Nothing is captured yet. Capturing on the press alone sends the
           click to the rail instead of the card inside it, which is how
           tapping a product on Home stopped opening its sheet. */
        drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
      },
      onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
        const el = rail.current;
        const d = drag.current;
        if (!d || !el) return;
        const dx = e.clientX - d.x;
        if (!d.moved) {
          if (Math.abs(dx) < DRAG_AT) return;
          d.moved = true;
          /* Now it is a drag: hold the pointer so leaving the rail doesn't
             end it, and stop mandatory snapping yanking the rail to the
             nearest page on every pixel. It goes back on at the end. */
          el.style.scrollSnapType = 'none';
          el.setPointerCapture(e.pointerId);
        }
        el.scrollLeft = d.left - dx;
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
