"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useNavigate } from "react-router";

import { MotionContext } from "../lib/motion-context";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  // Motion starts on for each visit. Pausing stays in place across client navigation.
  const [enabled, setEnabled] = useState(true);
  const scroller = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.dataset.motion = enabled ? "full" : "reduced";
    if (!enabled) return;
    const lenis = new Lenis({
      autoRaf: false,
      anchors: false,
      duration: 1.15,
      smoothWheel: true,
      respectReducedMotion: false,
      stopInertiaOnNavigate: true,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
    scroller.current = lenis;
    const tick = (seconds: number) => lenis.raf(seconds * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      scroller.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        return;
      let id: string;
      try {
        id = decodeURIComponent(url.hash.slice(1));
      } catch {
        return;
      }
      const target = [...document.querySelectorAll<HTMLElement>("[id]")].find(
        (element) => element.id === id && element.getClientRects().length > 0,
      );
      if (!target) return;
      event.preventDefault();
      // Let the router record section history while Lenis owns the scroll.
      if (location.hash !== url.hash)
        void navigate({ search: url.search, hash: url.hash }, { preventScrollReset: true });
      const focus = () => {
        const hadTabIndex = target.hasAttribute("tabindex");
        if (!hadTabIndex) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        if (!hadTabIndex)
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            { once: true },
          );
      };
      if (scroller.current && id !== "main") {
        scroller.current.resize();
        scroller.current.scrollTo(target, { duration: 1.2, onComplete: focus });
      } else {
        target.scrollIntoView({ behavior: "instant", block: "start" });
        focus();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return (
    <MotionContext.Provider value={enabled}>
      {children}
      <div className="motion-toolbar">
        <button
          className="motion-control"
          onClick={() => setEnabled((value) => !value)}
          aria-pressed={!enabled}
          aria-label={enabled ? "Pause motion" : "Enable motion"}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <path d={enabled ? "M4 2v8M8 2v8" : "M3 2l7 4-7 4V2Z"} />
          </svg>
          {enabled ? "Pause motion" : "Enable motion"}
        </button>
      </div>
    </MotionContext.Provider>
  );
}
