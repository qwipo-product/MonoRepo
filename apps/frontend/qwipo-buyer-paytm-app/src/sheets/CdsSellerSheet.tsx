import { ChevronRight, Store } from 'lucide-react';
import { Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { CdsGroup } from '../data/cart';
import { CDS_SELLERS } from '../data/delivery';

/* "Add more" on a cross-dock card — which seller?

   Everywhere else in the cart that button has one answer, because the card is
   one seller. A CDS card stands for four, so pressing it has to ask: the
   catalogues are separate, the prices are each distributor's own, and dropping
   the buyer into a merged list would hide whose terms they are buying on.

   Sellers already in the cart come first and say what is in them, so the
   common case — topping up the order that is nearly at the minimum — is the
   one nearest the thumb. */
export function CdsSellerSheet({
  open,
  groups,
  onClose,
  onPick,
}: {
  open: boolean;
  /** The CDS card's per-seller breakdown; empty for sellers not yet shopped. */
  groups: CdsGroup[];
  onClose: () => void;
  onPick: (seller: string) => void;
}) {
  const inCart = new Map(groups.map((g) => [g.seller, g]));
  const ordered = [
    ...groups.map((g) => g.seller),
    ...CDS_SELLERS.filter((s) => !inCart.has(s)),
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Add more from">
      <p className="mb-3 text-xs text-foreground-secondary">
        Everything you add arrives in the same delivery — the cross-dock store packs it together.
      </p>
      <div className="space-y-2">
        {ordered.map((name) => {
          const g = inCart.get(name);
          return (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-soft-foreground">
                <Store className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                <span className="block text-xs text-foreground-secondary">
                  {g
                    ? `${g.items.length} ${g.items.length === 1 ? 'item' : 'items'} · ${formatInr(g.subtotal)}`
                    : 'Nothing added yet'}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
