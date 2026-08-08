import { useState } from 'react';

/* Brand/logo image that falls back to coloured initials when the asset is
   missing. Replaces the source's onError innerHTML mutation with React state.
   `color` is a data-driven brand value (from mock-data), not a UI token. */
export default function Logo({
  src,
  text,
  color,
  className = '',
}: {
  src?: string;
  text: string;
  color: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        className={`grid place-items-center text-sm font-semibold text-white ${className}`}
        style={{ background: color }}
      >
        {text}
      </span>
    );
  }
  return (
    <span className={`grid place-items-center overflow-hidden bg-white ${className}`}>
      <img src={src} alt={text} onError={() => setFailed(true)} className="h-full w-full object-contain p-1.5" />
    </span>
  );
}
