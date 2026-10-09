import { useEffect } from 'react';

/* Color-morph splash: lavender bg + white mark scales in, then the background
   fades to white while the mark cross-fades into the colored primary. Auto-
   advances after 2.7s; tap to skip. Animation lives in index.css. */
export function SplashScreen({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2700);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <button
      onClick={onContinue}
      aria-label="Tap to continue"
      className="splash-screen-v2"
    >
      <span className="splash-stage" aria-hidden="true">
        <img className="splash-logo splash-logo-white" src="./brand/qwipo-primary-white.svg" alt="" />
        <img className="splash-logo splash-logo-primary" src="./brand/qwipo-primary.svg" alt="Qwipo" />
      </span>
    </button>
  );
}
