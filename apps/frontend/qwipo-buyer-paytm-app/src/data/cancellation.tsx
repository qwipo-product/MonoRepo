import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Order } from './orders';

/* Cancellation fee + wallet ledger.

   Rules (proposal: amount and cutoff time are still to be confirmed):
     • Cancel up to the night before the delivery date → free.
     • Cancel on the delivery date or later → ₹2 fee.
     • Seller-caused delay → never a fee.
   A fee is not charged on the spot. It sits in the wallet as an outstanding
   amount against the retailer + that seller, and is added to the retailer's
   next order with the same seller. */

export const CANCELLATION_FEE = 2;

/** The prototype's "today", fixed so the demo orders always land on the same
 *  side of the cutoff. Orders are dated around mid-June 2026. */
export const DEMO_TODAY = '2026-06-17';

/** Who the fee is owed to: the delivering distributor when there is one. */
export const feeSellerOf = (o: Pick<Order, 'seller' | 'distributor'>) => o.distributor ?? o.seller;

export type CancelKind = 'free' | 'fee' | 'seller_delay';

export interface CancelPolicy {
  kind: CancelKind;
  fee: number;
  /** Last moment a free cancellation is allowed, as a plain date (the night before delivery). */
  freeUntil?: string;
}

const dayBefore = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function cancellationPolicy(order: Order): CancelPolicy {
  if (order.sellerDelayed) return { kind: 'seller_delay', fee: 0 };
  if (!order.deliveryDate) return { kind: 'free', fee: 0 };
  // "Previous night" of the delivery date is the last free moment.
  if (order.deliveryDate > DEMO_TODAY) return { kind: 'free', fee: 0, freeUntil: dayBefore(order.deliveryDate) };
  return { kind: 'fee', fee: CANCELLATION_FEE };
}

export interface FeeEntry {
  id: string;
  seller: string;
  /** The cancelled order that raised the fee. */
  orderId: string;
  amount: number;
  raisedOn: string;
  status: 'outstanding' | 'collected';
  /** The order the fee was collected with. */
  collectedWith?: string;
  collectedOn?: string;
}

/* Seed ledger: one fee waiting on Sri Sai Krishna Traders (so the very next
   checkout with them shows the collection), and one already settled. */
const SEED: FeeEntry[] = [
  { id: 'f1', seller: 'Sri Sai Krishna Traders', orderId: 'QWIP2398101', amount: CANCELLATION_FEE, raisedOn: '2026-06-10', status: 'outstanding' },
  { id: 'f2', seller: 'Karnataka Soaps & Detergents', orderId: 'QWIP2397044', amount: CANCELLATION_FEE, raisedOn: '2026-05-22', status: 'collected', collectedWith: 'QWIP2399204', collectedOn: '2026-05-28' },
];

interface WalletValue {
  entries: FeeEntry[];
  /** Orders cancelled this session → the fee they were charged (0 = free). */
  cancelled: Record<string, number>;
  outstandingFor: (seller: string) => number;
  totalOutstanding: number;
  /** Cancel an order; any fee goes to the ledger as outstanding. */
  cancelOrder: (order: Order, fee: number) => void;
  /** A new order was placed: clear what those sellers were owed. Returns the amount cleared. */
  collectFor: (sellers: string[], withOrderId: string) => number;
}

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FeeEntry[]>(SEED);
  const [cancelled, setCancelled] = useState<Record<string, number>>({});

  const cancelOrder = useCallback((order: Order, fee: number) => {
    setCancelled((c) => (order.id in c ? c : { ...c, [order.id]: fee }));
    if (fee > 0) {
      setEntries((es) =>
        es.some((e) => e.orderId === order.orderId)
          ? es
          : [
              { id: `f-${order.id}`, seller: feeSellerOf(order), orderId: order.orderId, amount: fee, raisedOn: DEMO_TODAY, status: 'outstanding' },
              ...es,
            ]
      );
    }
  }, []);

  const collectFor = useCallback(
    (sellers: string[], withOrderId: string) => {
      const due = entries.filter((e) => e.status === 'outstanding' && sellers.includes(e.seller));
      if (due.length === 0) return 0;
      const ids = new Set(due.map((e) => e.id));
      setEntries((es) =>
        es.map((e) => (ids.has(e.id) ? { ...e, status: 'collected', collectedWith: withOrderId, collectedOn: DEMO_TODAY } : e))
      );
      return due.reduce((n, e) => n + e.amount, 0);
    },
    [entries]
  );

  const value = useMemo<WalletValue>(() => {
    const outstanding = entries.filter((e) => e.status === 'outstanding');
    return {
      entries,
      cancelled,
      outstandingFor: (seller) => outstanding.filter((e) => e.seller === seller).reduce((n, e) => n + e.amount, 0),
      totalOutstanding: outstanding.reduce((n, e) => n + e.amount, 0),
      cancelOrder,
      collectFor,
    };
  }, [entries, cancelled, cancelOrder, collectFor]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletValue {
  const v = useContext(WalletContext);
  if (!v) throw new Error('useWallet needs a WalletProvider');
  return v;
}
