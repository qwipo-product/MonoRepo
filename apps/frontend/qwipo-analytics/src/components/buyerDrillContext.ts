// Drill-down dashboards for the DigiDukaan · Buyer pages. Any card, bar, dot
// or search result opens one; drawers stack so a distributor can lead to its
// BA and on to one customer, with Back. Held in App.tsx so the scope bar's
// universal search and every page share it.
import { createContext, useContext } from 'react';
import type { BuyerOrder } from '../data/buyer';
import type { BaStat, CustStat, DistStat } from '../data/buyerMetrics';

export type DrillItem =
  | { kind: 'distributor'; name: string }
  | { kind: 'ba'; name: string }
  | { kind: 'customer'; id: string }
  /** the orders behind a number — the last level of a drill */
  | { kind: 'orders'; title: string; where: (o: BuyerOrder) => boolean; range?: [Date, Date] }
  | { kind: 'customers'; title: string; where: (c: CustStat) => boolean; note?: (c: CustStat) => string }
  | { kind: 'distributors'; title: string; where: (d: DistStat) => boolean; note?: (d: DistStat) => string }
  | { kind: 'bas'; title: string; where: (b: BaStat) => boolean; note?: (b: BaStat) => string };

export const BuyerDrillContext = createContext<{
  /** start a fresh drill (from a page) */
  open: (d: DrillItem) => void;
  /** go one level deeper (from inside a drawer) */
  push: (d: DrillItem) => void;
}>({ open: () => {}, push: () => {} });

export const useBuyerDrill = () => useContext(BuyerDrillContext);
