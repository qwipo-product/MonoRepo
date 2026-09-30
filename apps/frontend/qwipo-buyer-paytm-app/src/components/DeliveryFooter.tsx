import { formatInr } from '@mockups/components';
import { cn } from '@mockups/ui';
import { deliveryFor, dayLabel } from '../data/delivery';

/* Product-card footer: the distributor's delivery day(s) + per-day MOV. One row
   per option; MOV omitted when a day has none (e.g. Omkar). Shared by the
   Product List and Reorder so their cards stay identical.

   `boxed` gives each day its own outlined blue row. The seller card on
   Authorised Distributors uses it: there the terms are the reason to pick one
   seller over another, so they have to carry the card rather than sit under it
   as grey small print. On a product card they stay quiet — the product is the
   subject there, not the seller. */
export function deliveryFooter(seller: string, opts?: { boxed?: boolean }) {
  const d = deliveryFor(seller);
  const boxed = opts?.boxed;
  return (
    <div className={cn('flex w-full flex-col', boxed ? 'gap-1.5' : 'gap-1')}>
      {d.options.map((o, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-between',
            // Outline and blue text, no fill — the outline alone lifts the row
            // off the card without turning it into a filled block.
            boxed && 'rounded-md border border-primary px-2.5 py-1.5 font-medium text-primary'
          )}
        >
          <span>{dayLabel(o)}</span>
          {o.mov != null && <span>MOV {formatInr(o.mov)}</span>}
        </div>
      ))}
    </div>
  );
}
