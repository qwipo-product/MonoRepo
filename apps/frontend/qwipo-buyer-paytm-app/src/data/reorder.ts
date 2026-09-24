import { PRODUCTS, type Product, type Source } from './products';

// Reorder history — a mix of distributor- and wholesaler-sourced items, so each
// card shows who it's from and whether that seller is a distributor or a
// wholesaler. (A real build reads the buyer's order history.)
export interface ReorderItem {
  product: Product;
  /** Human "last ordered" label, e.g. "3 days ago". */
  lastOrdered: string;
  /** How many times the buyer has ordered this item. */
  timesOrdered: number;
}

/* Deep enough that Home's Previously Ordered rail fills its four pages on the
   distributor side, and both sides carry a spread of counts to sort by. p17
   was bought once and is therefore below the bar the rail sets. */
const HISTORY: { id: string; lastOrdered: string; timesOrdered: number }[] = [
  { id: 'p1', lastOrdered: '3 days ago', timesOrdered: 12 },
  { id: 'p10', lastOrdered: '1 week ago', timesOrdered: 9 },
  // p3 (Fortune Besan) is wholesaler-sourced like the rest of this list and
  // carries two live offers (Case Bonus, Combo with p10) — needs a reachable
  // SKU screen now that the cart no longer seeds it in automatically.
  { id: 'p3', lastOrdered: '5 days ago', timesOrdered: 8 },
  { id: 'p2', lastOrdered: '1 week ago', timesOrdered: 7 },
  { id: 'p11', lastOrdered: '4 days ago', timesOrdered: 6 },
  { id: 'p13', lastOrdered: '2 weeks ago', timesOrdered: 5 },
  { id: 'p4', lastOrdered: '2 weeks ago', timesOrdered: 5 },
  { id: 'p39', lastOrdered: '6 days ago', timesOrdered: 4 },
  { id: 'p5', lastOrdered: '3 weeks ago', timesOrdered: 4 },
  { id: 'p8', lastOrdered: '1 month ago', timesOrdered: 3 },
  { id: 'p15', lastOrdered: '3 weeks ago', timesOrdered: 3 },
  { id: 'p18', lastOrdered: '2 weeks ago', timesOrdered: 3 },
  { id: 'p36', lastOrdered: '1 month ago', timesOrdered: 2 },
  { id: 'p9', lastOrdered: '1 month ago', timesOrdered: 2 },
  { id: 'p17', lastOrdered: '2 months ago', timesOrdered: 1 },
];

export const REORDER_ITEMS: ReorderItem[] = HISTORY.flatMap((h) => {
  const product = PRODUCTS.find((p) => p.id === h.id);
  return product ? [{ product, lastOrdered: h.lastOrdered, timesOrdered: h.timesOrdered }] : [];
});

/** Ordered at least this often to count as a repeat buy worth resurfacing. */
const REPEAT_THRESHOLD = 2;

/* What Home's Previously Ordered rail shows: repeat buys from one side of the
   catalogue, most-bought first. The distributor tab must never surface a
   wholesaler line or the other way round — the two are bought, priced and
   delivered separately. */
export const previouslyOrdered = (source: Source, max = 8): ReorderItem[] =>
  REORDER_ITEMS.filter((r) => r.product.source === source && r.timesOrdered >= REPEAT_THRESHOLD)
    .sort((a, b) => b.timesOrdered - a.timesOrdered)
    .slice(0, max);
