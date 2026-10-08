import type { RefObject } from 'react';
import { cn } from '@mockups/ui';

/* The page indicator for a `useAutoAdvance` rail. The active dot is a track the
   hold counts down inside, so the next move is visible before it happens; with
   reduced motion it's a plain filled pill and nothing counts. */
export function CarouselDots({
  count,
  index,
  autoplay,
  fillRef,
  className,
}: {
  count: number;
  index: number;
  autoplay: boolean;
  fillRef: RefObject<HTMLSpanElement | null>;
  className?: string;
}) {
  return (
    <div className={cn('mt-2 flex justify-center gap-1.5', className)}>
      {Array.from({ length: count }, (_, j) => (
        <span
          key={j}
          className={cn(
            'h-1.5 overflow-hidden rounded-full transition-all',
            j === index
              ? autoplay
                ? 'w-6 bg-primary/25' // track the fill runs along
                : 'w-6 bg-primary'
              : 'w-1.5 bg-foreground-secondary/30'
          )}
        >
          {j === index && autoplay && (
            <span ref={fillRef} className="block h-full w-0 rounded-full bg-primary" />
          )}
        </span>
      ))}
    </div>
  );
}
