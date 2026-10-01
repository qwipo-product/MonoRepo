import type { ScreenId } from './review/screenIndex';
import type { AppliedFilter } from './data/filters';
import type { Distributor } from './data/home';
import type { Source } from './data/products';

/** Options a navigation can carry to the destination screen. */
export interface NavOpts {
  /** Applied filter context for a product list (category/brand/distributor). */
  applied?: AppliedFilter[];
  /** Initial tab for a browse screen (categories/brands/sellers). */
  tab?: string;
  /** The distributor whose storefront to open (Home tile / Sellers row). */
  distributor?: Distributor;
  /** Which side of the catalogue the destination covers (Reorder). */
  source?: Source;
}

/** App-wide navigate: jump to a screen, optionally carrying filter/back context. */
export type Navigate = (id: ScreenId, opts?: NavOpts) => void;
