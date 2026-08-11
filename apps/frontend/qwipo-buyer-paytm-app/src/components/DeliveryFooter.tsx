import { formatInr } from '@mockups/components';
import { deliveryFor, dayLabel } from '../data/delivery';

/* Product-card footer: the distributor's delivery day(s) + per-day MOV. One row
   per option; MOV omitted when a day has none (e.g. Omkar). Shared by the
   Product List and Reorder so their cards stay identical. */
export function deliveryFooter(seller: string) {
  const d = deliveryFor(seller);
  return (
    <div className="flex w-full flex-col gap-1">
      {d.options.map((o, i) => (
        <div key={i} className="flex items-center justify-between">
          <span>{dayLabel(o)}</span>
          {o.mov != null && <span>MOV {formatInr(o.mov)}</span>}
        </div>
      ))}
    </div>
  );
}
