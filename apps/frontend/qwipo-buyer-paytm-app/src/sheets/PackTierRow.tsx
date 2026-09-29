import { useState } from 'react';
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

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-base">📦</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-foreground-secondary">
          {pcs} {pcs === 1 ? 'Pc' : 'Pcs'}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-xs tabular-nums text-foreground-secondary">{formatInr(unitPrice)}</div>
        <div className="text-sm font-bold tabular-nums text-foreground">{formatInr(unitPrice * pcs)}</div>
      </div>
      {/* Narrow enough that "+ Add" isn't swimming in its own button, wide
          enough for the stepper that replaces it — one width for both, so the
          row doesn't reflow when a tier goes into the cart. What this tier
          puts in the cart sits under the control that changes it, rather than
          beside the pack size it isn't. */}
      <div className="w-22 shrink-0">
        {packs > 0 ? (
          <QtyStepper value={packs} onChange={set} min={0} tone="soft" className="w-full" />
        ) : (
          <Button size="sm" className="w-full" onClick={() => set(1)}>
            + Add
          </Button>
        )}
        {packs > 0 && (
          <div className="mt-1 text-center text-[11px] font-medium text-foreground">
            {packs * pcs} pcs
          </div>
        )}
      </div>
    </div>
  );
}
