import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/* The paging rail Home uses twice — the hero banners and Previously Ordered.
   Pages are the width of the rail and snap to it; a timer walks them, the last
   wrapping back to the first; the active dot counts the hold down so the move
   is never a surprise.

   The timer gives way to the buyer. Touch the rail — swipe it, drag it, open
   a product from it — and it stops, then waits five seconds after you are
   done before it starts walking again. Nothing is more irritating than a rail
   that slides the thing you were reaching for out from under you. */
export function useAutoAdvance(
  count: number,
  intervalMs: number,
  /** True while something of this rail's is holding the screen — the
   *  add-to-cart sheet opened from one of its cards. The rail stays still
   *  until it closes, and then for the usual five seconds after. */
  paused = false
) {
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

  /** How long the rail waits after the buyer is finished with it. */
  const RESUME_MS = 5000;

  /* Whether the rail is held is a ref rather than state: the only thing that
     renders it is the dot's fill, and that is painted by hand anyway, so
     holding costs no re-render and never rebuilds the interval. */
  const held = useRef(false);
  const holdTimer = useRef<number | undefined>(undefined);

  /* Draw the active dot for where things stand: empty and still while the
     rail is held, because nothing is counting down; otherwise growing across
     one interval, so the bar filling and the page moving are one moment. */
  const paintFill = useCallback(() => {
    const el = fill.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.width = '0%';
    void el.offsetWidth;
    if (held.current) return;
    el.style.transition = `width ${intervalMs}ms linear`;
    el.style.width = '100%';
  }, [intervalMs]);

  const setHold = (on: boolean) => {
    held.current = on;
    paintFill();
  };
  /** Stop the rail, and start it again `ms` from now. */
  const hold = (ms: number = RESUME_MS) => {
    window.clearTimeout(holdTimer.current);
    setHold(true);
    holdTimer.current = window.setTimeout(() => setHold(false), ms);
  };
  /** Stop the rail with no end in sight — something else will release it. */
  const holdOpen = () => {
    window.clearTimeout(holdTimer.current);
    setHold(true);
  };

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  /* While the sheet is up the rail stands still; when it closes the buyer is
     looking at the card they came back to, so it waits the usual five seconds
     before moving again. The ref keeps the first render from counting as a
     sheet that just closed. */
  const wasPaused = useRef(paused);
  useEffect(() => {
    if (paused) holdOpen();
    else if (wasPaused.current) hold();
    wasPaused.current = paused;
    // `hold`/`holdOpen` are rebuilt every render; listing them would re-run
    // this on each one and restart the wait. Only the flag matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  /* The next index is read from the rail's own scrollLeft rather than from
     `index`, so a tick after a manual swipe carries on from where the buyer
     left it instead of from where the timer thought it was. */
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      const el = rail.current;
      if (!el || dragging.current || held.current) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, count, intervalMs]);

  /* Repaint on every page change — a manual swipe as much as a tick — rather
     than leaving it to a CSS animation, which would only restart on one. */
  useEffect(() => {
    paintFill();
  }, [index, paintFill]);

  /* Land on a whole page rather than wherever the mouse let go — half a
     banner showing is nobody's intent. A press that never moved is left
     alone, so the card under it still gets its click. */
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    const el = rail.current;
    const d = drag.current;
    drag.current = null;
    hold();
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
    /** Stop the rail and resume five seconds later — for a caller that knows
     *  about an interaction this hook can't see. */
    hold,
    /** Spread onto the scrolling element itself. */
    railProps: {
      ref: rail,
      onScroll: () => {
        const el = rail.current;
        if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
      },
      /* A trackpad or a shift-wheel scrolls the rail without a pointer ever
         going down, so the wheel counts as touching it too. */
      onWheel: () => hold(),
      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
        dragging.current = true;
        holdOpen();
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
