import { useEffect } from 'react';

/* Splash: brand mark fades in on the DS background, auto-advances after 2.7s,
   tap anywhere to skip. (Original lavender→white colour-morph simplified to a
   clean DS light surface; the brand SVG is kept as the source-of-truth mark.) */
const TOTAL_MS = 2700;

export default function SplashScreen({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const t = setTimeout(onContinue, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <button
      onClick={onContinue}
      aria-label="Tap to continue"
      className="flex h-full w-full items-center justify-center bg-background"
    >
      <img src="/brand/qwipo-primary.svg" alt="Qwipo" className="w-40" />
    </button>
  );
}
