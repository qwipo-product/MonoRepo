import { useState, useEffect, useRef, type ReactNode } from 'react';

/* Auto-scrolling banner rail with manual swipe + dot indicators. Ported from
   qwipo-buyer-app; styling moved to DS tokens / Tailwind. Auto-advances every
   5s, pauses ~8s after a manual touch. */
export default function BannerCarousel({
  banners,
  renderBanner,
  autoScrollMs = 5000,
  pauseAfterTouchMs = 8000,
}: {
  banners: any[];
  renderBanner: (b: any) => ReactNode;
  autoScrollMs?: number;
  pauseAfterTouchMs?: number;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const lastUserActionRef = useRef(0);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    if (!banners?.length) return;
    const interval = setInterval(() => {
      if (Date.now() - lastUserActionRef.current < pauseAfterTouchMs) return;
      setActiveIdx((idx) => (idx + 1) % banners.length);
    }, autoScrollMs);
    return () => clearInterval(interval);
  }, [banners?.length, autoScrollMs, pauseAfterTouchMs]);

  useEffect(() => {
    const rail = railRef.current;
    const target = rail?.children[activeIdx] as HTMLElement | undefined;
    if (!rail || !target) return;
    if (Date.now() - lastUserActionRef.current < 800) return;
    programmaticScrollRef.current = true;
    rail.scrollTo({ left: target.offsetLeft - rail.offsetLeft, behavior: 'smooth' });
    const t = setTimeout(() => (programmaticScrollRef.current = false), 600);
    return () => clearTimeout(t);
  }, [activeIdx]);

  const handleScroll = () => {
    if (programmaticScrollRef.current) return;
    lastUserActionRef.current = Date.now();
    const rail = railRef.current;
    const first = rail?.children[0] as HTMLElement | undefined;
    if (!rail || !first) return;
    const childWidth = first.offsetWidth + 10;
    const idx = Math.round(rail.scrollLeft / childWidth);
    setActiveIdx(Math.min(Math.max(idx, 0), banners.length - 1));
  };

  const markTouch = () => {
    lastUserActionRef.current = Date.now();
  };

  return (
    <div className="space-y-2">
      <div
        ref={railRef}
        onScroll={handleScroll}
        onTouchStart={markTouch}
        onPointerDown={markTouch}
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((b) => (
          <div key={b.id} className="w-full flex-shrink-0 snap-start">
            {renderBanner(b)}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {banners.map((b, i) => (
          <span
            key={b.id}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIdx ? 'w-4 bg-primary' : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
