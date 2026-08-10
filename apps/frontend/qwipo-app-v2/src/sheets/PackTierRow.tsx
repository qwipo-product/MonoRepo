import { useState } from 'react';
import { Button, QtyStepper } from '@mockups/ui';
import { formatInr } from '@mockups/components';

/* One pack-tier row inside a selling-units sheet. Tapping "+ Add" swaps the
   button for a − Qty + stepper; the chosen pack count stays with this tier
   (local state) and each change reports the piece delta to the cart via
   `onDelta`. Shared by the distributor and wholesaler unit sheets. */
export function PackTierRow({
  label,
  pcs,
  unitPrice,
  onDelta,
}: {
  label: string;
  pcs: number;
  unitPrice: number;
  onDelta: (deltaPcs: number) => void;
}) {
  const [packs, setPacks] = useState(0);
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
          {packs > 0 && (
            <span className="font-medium text-foreground"> · {packs * pcs} pcs</span>
          )}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-xs tabular-nums text-foreground-secondary">{formatInr(unitPrice)}</div>
        <div className="text-sm font-bold tabular-nums text-foreground">{formatInr(unitPrice * pcs)}</div>
      </div>
      <div className="w-28 shrink-0">
        {packs > 0 ? (
          <QtyStepper value={packs} onChange={set} min={0} tone="soft" className="w-full" />
        ) : (
          <Button size="sm" className="w-full" onClick={() => set(1)}>
            + Add
          </Button>
        )}
      </div>
    </div>
  );
}
