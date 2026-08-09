import { useEffect } from 'react';
import { useTheme } from '@mockups/ui';

/* Brand mark on the DS background, auto-advances after 2.7s, tap to skip. */
export function SplashScreen({ onContinue }: { onContinue: () => void }) {
  const { isDark } = useTheme();
  useEffect(() => {
    const t = setTimeout(onContinue, 2700);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <button
      onClick={onContinue}
      aria-label="Tap to continue"
      className="flex h-full w-full items-center justify-center bg-background"
    >
      <img
        src={isDark ? '/brand/qwipo-primary-white.svg' : '/brand/qwipo-primary.svg'}
        alt="Qwipo"
        className="w-40"
      />
    </button>
  );
}
