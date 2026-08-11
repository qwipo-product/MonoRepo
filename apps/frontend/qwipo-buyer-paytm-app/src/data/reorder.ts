import { PRODUCTS, type Product } from './products';

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

const HISTORY: { id: string; lastOrdered: string; timesOrdered: number }[] = [
  { id: 'p1', lastOrdered: '3 days ago', timesOrdered: 12 },
  { id: 'p10', lastOrdered: '1 week ago', timesOrdered: 9 },
  { id: 'p2', lastOrdered: '1 week ago', timesOrdered: 7 },
  { id: 'p4', lastOrdered: '2 weeks ago', timesOrdered: 5 },
  { id: 'p5', lastOrdered: '3 weeks ago', timesOrdered: 4 },
  { id: 'p8', lastOrdered: '1 month ago', timesOrdered: 3 },
];

export const REORDER_ITEMS: ReorderItem[] = HISTORY.flatMap((h) => {
  const product = PRODUCTS.find((p) => p.id === h.id);
  return product ? [{ product, lastOrdered: h.lastOrdered, timesOrdered: h.timesOrdered }] : [];
});
