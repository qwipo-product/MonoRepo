import { PRODUCTS, type Source } from './products';
import { WHOLESALER_PRODUCTS } from './wholesaler';
import { teaserFromProduct, teaserFromWholesale, type ProductTeaser } from './teaser';

/* Trending — what the buyer's own area is buying, as opposed to what the
   buyer bought. Ranked by how many orders each SKU drew inside the delivering
   pincode over the last 30 days, highest first.

   A real build runs that count per pincode; these stand in for one
   neighbourhood's answer — 500032, Gachibowli, the delivering address — so
   switching the delivery address won't reshuffle them yet. */

interface Trend {
  id: string;
  /** Orders placed for this SKU inside the pincode, last 30 days. */
  ordersNearby: number;
}

const DISTRIBUTOR_TRENDING: Trend[] = [
  { id: 'p1', ordersNearby: 342 },
  { id: 'p39', ordersNearby: 318 },
  { id: 'p2', ordersNearby: 287 },
  { id: 'p36', ordersNearby: 265 },
  { id: 'p33', ordersNearby: 241 },
  { id: 'p35', ordersNearby: 228 },
  { id: 'p37', ordersNearby: 203 },
  { id: 'p12', ordersNearby: 196 },
  { id: 'p31', ordersNearby: 174 },
];

const WHOLESALE_TRENDING: Trend[] = [
  { id: 'wp1', ordersNearby: 410 },
  { id: 'wp6', ordersNearby: 376 },
  { id: 'wp5', ordersNearby: 352 },
  { id: 'wp10', ordersNearby: 318 },
  { id: 'wp2', ordersNearby: 295 },
  { id: 'wp3', ordersNearby: 268 },
  { id: 'wp11', ordersNearby: 233 },
  { id: 'wp4', ordersNearby: 219 },
];

/* Busiest first, capped the way the rail is. Each tab draws only from its own
   side of the catalogue — the distributor list skips a SKU that turns out to
   be wholesale-sourced rather than showing it under the wrong tab. */
export const trendingNearby = (source: Source, max = 8): ProductTeaser[] => {
  const ranked =
    source === 'wholesaler'
      ? WHOLESALE_TRENDING.flatMap((t) => {
          const p = WHOLESALER_PRODUCTS.find((x) => x.id === t.id);
          return p ? [{ ...t, teaser: teaserFromWholesale(p) }] : [];
        })
      : DISTRIBUTOR_TRENDING.flatMap((t) => {
          const p = PRODUCTS.find((x) => x.id === t.id && x.source === 'distributor');
          return p ? [{ ...t, teaser: teaserFromProduct(p) }] : [];
        });
  return ranked
    .sort((a, b) => b.ordersNearby - a.ordersNearby)
    .slice(0, max)
    .map((t) => t.teaser);
};
