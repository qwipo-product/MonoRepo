import { PRODUCTS, type Product, type Source } from './products';
import { WHOLESALER_PRODUCTS, type WholesalerProduct } from './wholesaler';
import { teaserFromProduct, teaserFromWholesale, type ProductTeaser } from './teaser';

/* Reorder history. The two sides of the catalogue are kept apart from here
   down: a distributor line is one seller's SKU at one price, a wholesale line
   is the same SKU quoted by several vendors, and they carry different cards.
   (A real build reads the buyer's order history.) */

interface History {
  id: string;
  /** Human "last ordered" label, e.g. "3 days ago". */
  lastOrdered: string;
  /** How many times the buyer has ordered this item. */
  timesOrdered: number;
}

export interface ReorderItem extends Omit<History, 'id'> {
  product: Product;
}
export interface WholesaleReorderItem extends Omit<History, 'id'> {
  product: WholesalerProduct;
}

/* Deep enough that Home's Previously Ordered rail fills its pages on both
   sides, with a spread of counts to sort by. The last entry of each list was
   bought once, so the twice-ordered floor the rail sets has something to
   exclude. */
const DISTRIBUTOR_HISTORY: History[] = [
  { id: 'p1', lastOrdered: '3 days ago', timesOrdered: 12 },
  { id: 'p2', lastOrdered: '1 week ago', timesOrdered: 7 },
  { id: 'p11', lastOrdered: '4 days ago', timesOrdered: 6 },
  { id: 'p13', lastOrdered: '2 weeks ago', timesOrdered: 5 },
  { id: 'p39', lastOrdered: '6 days ago', timesOrdered: 4 },
  { id: 'p5', lastOrdered: '3 weeks ago', timesOrdered: 4 },
  { id: 'p15', lastOrdered: '3 weeks ago', timesOrdered: 3 },
  { id: 'p18', lastOrdered: '2 weeks ago', timesOrdered: 3 },
  { id: 'p36', lastOrdered: '1 month ago', timesOrdered: 2 },
  { id: 'p17', lastOrdered: '2 months ago', timesOrdered: 1 },
];

const WHOLESALE_HISTORY: History[] = [
  { id: 'wp3', lastOrdered: '1 week ago', timesOrdered: 9 },
  { id: 'wp2', lastOrdered: '5 days ago', timesOrdered: 8 },
  { id: 'wp4', lastOrdered: '2 weeks ago', timesOrdered: 5 },
  { id: 'wp6', lastOrdered: '1 week ago', timesOrdered: 4 },
  { id: 'wp15', lastOrdered: '1 month ago', timesOrdered: 3 },
  { id: 'wp1', lastOrdered: '3 weeks ago', timesOrdered: 2 },
  { id: 'wp10', lastOrdered: '2 months ago', timesOrdered: 1 },
];

export const REORDER_ITEMS: ReorderItem[] = DISTRIBUTOR_HISTORY.flatMap((h) => {
  const product = PRODUCTS.find((p) => p.id === h.id);
  return product ? [{ product, lastOrdered: h.lastOrdered, timesOrdered: h.timesOrdered }] : [];
});

export const WHOLESALE_REORDER_ITEMS: WholesaleReorderItem[] = WHOLESALE_HISTORY.flatMap((h) => {
  const product = WHOLESALER_PRODUCTS.find((p) => p.id === h.id);
  return product ? [{ product, lastOrdered: h.lastOrdered, timesOrdered: h.timesOrdered }] : [];
});

/** Ordered at least this often to count as a repeat buy worth resurfacing. */
const REPEAT_THRESHOLD = 2;

/* What Home's Previously Ordered rail shows: repeat buys from one side of the
   catalogue, most-bought first. The distributor tab must never surface a
   wholesale line or the other way round — the two are bought, priced and
   delivered separately. */
export const previouslyOrdered = (source: Source, max = 8): ProductTeaser[] => {
  const ranked =
    source === 'wholesaler'
      ? WHOLESALE_REORDER_ITEMS.map((r) => ({ ...r, teaser: teaserFromWholesale(r.product) }))
      : REORDER_ITEMS.map((r) => ({ ...r, teaser: teaserFromProduct(r.product) }));
  return ranked
    .filter((r) => r.timesOrdered >= REPEAT_THRESHOLD)
    .sort((a, b) => b.timesOrdered - a.timesOrdered)
    .slice(0, max)
    .map((r) => r.teaser);
};
