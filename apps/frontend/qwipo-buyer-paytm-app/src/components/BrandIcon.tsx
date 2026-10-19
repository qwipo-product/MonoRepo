import { cn } from '@mockups/ui';
import { brandLogo } from '../data/beatSchedule';
import { Wordmark } from './Wordmark';

/* One brand as an icon: its logo on a white plate, or a wordmark tile where
   the app has no logo yet, with the name underneath. The plate is a square
   that fills its grid cell, so it shrinks with a small phone's screen
   instead of staying a fixed size — and on a normal one it's big. */
export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const logo = brandLogo(name);
  return (
    <span className={cn('flex w-full min-w-0 flex-col items-center', className)}>
      <span
        className={cn(
          'grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-border',
          logo ? 'bg-white' : 'bg-card'
        )}
      >
        {logo ? (
          <img src={encodeURI(logo)} alt="" className="h-full w-full scale-110 object-contain" />
        ) : (
          <Wordmark text={name} className="p-2" />
        )}
      </span>
      <span className="mt-1.5 line-clamp-2 w-full text-center text-xs leading-tight text-foreground">{name}</span>
    </span>
  );
}
