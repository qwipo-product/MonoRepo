import { useState } from 'react';
import { Package } from 'lucide-react';
import { Button, QtyStepper } from '@mockups/ui';
import { formatInr } from '@mockups/components';

/* One pack-tier row inside a selling-units sheet. Tapping "+ Add" swaps the
   button for a − Qty + stepper, and each change reports the piece delta to the
   cart via `onDelta`.

   `initialPacks` is what this tier already accounts for in the cart, worked out
   by the sheet when it opens — so reopening a product shows the packs that are
   in it and they can be stepped back down, including to none. Shared by the
   distributor and wholesaler unit sheets. */
export function PackTierRow({
  label,
  pcs,
  unitPrice,
  initialPacks = 0,
  onDelta,
}: {
  label: string;
  pcs: number;
  unitPrice: number;
  /** Packs of this tier already in the cart when the sheet opened. */
  initialPacks?: number;
  onDelta: (deltaPcs: number) => void;
}) {
  const [packs, setPacks] = useState(initialPacks);
  const set = (next: number) => {
    onDelta((next - packs) * pcs);
    setPacks(next);
  };

  /* No picture per row: every tier is the same product, so the same shot
     repeated down the sheet said nothing — the pack size and the price are
     what tell the tiers apart. The product's own picture is in the header.

     What the row does carry is the shape of the thing: a single piece or a
     case of them. The two sit together on the left behind a rule, with the
     control pushed to the far edge — before, the price was dragged across the
     row to sit against the button, leaving a gulf in the middle. */
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border p-3">
      {/* One glyph for every tier. What separates them is the pack size and
          the price beside it; a different picture per tier only invited the
          reader to look for a meaning that isn't there. */}
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Package size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-foreground-secondary">
          {pcs} {pcs === 1 ? 'Pc' : 'Pcs'}
        </div>
      </div>
      <div className="h-8 w-px shrink-0 bg-border" />
      <div className="min-w-0">
        <div className="text-xs tabular-nums text-foreground-secondary">{formatInr(unitPrice)}</div>
        <div className="text-sm font-bold tabular-nums text-foreground">{formatInr(unitPrice * pcs)}</div>
      </div>
      {/* Narrow enough that "+ Add" isn't swimming in its own button, wide
          enough for the stepper that replaces it — one width for both, so the
          row doesn't reflow when a tier goes into the cart. What this tier
          puts in the cart sits under the control that changes it, rather than
          beside the pack size it isn't. */}
      <div className="ml-auto w-22 shrink-0">
        {packs > 0 ? (
          <QtyStepper value={packs} onChange={set} min={0} tone="soft" className="w-full" />
        ) : (
          <Button size="sm" className="w-full" onClick={() => set(1)}>
            + Add
          </Button>
        )}
        {packs > 0 && (
          <div className="mt-1 text-center text-2xs font-medium text-foreground">
            {packs * pcs} pcs
          </div>
        )}
      </div>
    </div>
  );
}
