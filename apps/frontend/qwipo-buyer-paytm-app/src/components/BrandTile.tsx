import { cn } from '@mockups/ui';
import { BrandLogo } from './BrandLogo';

/* One brand tile — the logo on a framed plate with the brand's name inside it.
   Every surface that offers brands uses this: the Brands tab, the brand rail
   on a seller's card, Home's All Brands, and a storefront's Top brands. It
   carries no width of its own, so a grid cell or a `w-18` in a scrolling rail
   sizes it; everything else about it stays the same wherever it appears. */
export function BrandTile({
  name,
  logo,
  onClick,
  /** Override when the surrounding context matters, e.g. "Tata from Omkar". */
  ariaLabel,
  className,
}: {
  name: string;
  logo?: string;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? name}
      className={cn('rounded-lg border border-border bg-card p-1.5 active:scale-[0.98]', className)}
    >
      {/* No inset, and a little scale on top. The logo files are square
          300x300 but the mark inside them only fills 66-87% — the rest is
          whitespace baked into the PNG — so padding on our side just shrank
          it further. The widest mark measures 87%, so 1.1x still leaves it
          inside the plate; the plate clips anyway. */}
      <BrandLogo
        src={logo}
        alt={name}
        className="aspect-square w-full rounded"
        imgClassName="p-0 scale-110"
      />
      <span className="mt-1 block truncate text-center text-[11px] text-foreground">{name}</span>
    </button>
  );
}
