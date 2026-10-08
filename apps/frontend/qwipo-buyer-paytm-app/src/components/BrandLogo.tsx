import { useState } from 'react';
import { cn } from '@mockups/ui';

/* Brand logo on a white plate (brand marks are designed for white in both
   themes — the plate stays white by design). Falls back to initials if the
   image is missing. */
export function BrandLogo({
  src,
  alt,
  className,
  /** Inset around the mark. Defaults to `p-2`; a tile that wants the logo to
   *  fill its plate passes something tighter. */
  imgClassName = 'p-2',
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={cn('grid place-items-center bg-muted text-xs font-semibold text-foreground-secondary', className)}>
        {alt.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className={cn('grid place-items-center overflow-hidden bg-white', className)}>
      <img
        src={encodeURI(src)}
        alt={alt}
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-contain', imgClassName)}
      />
    </span>
  );
}
