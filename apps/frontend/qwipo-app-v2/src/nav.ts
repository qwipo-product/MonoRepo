import type { ScreenId } from './review/screenIndex';
import type { AppliedFilter } from './data/filters';

/** Options a navigation can carry to the destination screen. */
export interface NavOpts {
  /** Applied filter context for a product list (category/brand/distributor). */
  applied?: AppliedFilter[];
  /** Where the destination screen's Back button should return to. */
  backTo?: ScreenId;
  /** Initial tab for a browse screen (categories/brands/sellers). */
  tab?: string;
}

/** App-wide navigate: jump to a screen, optionally carrying filter/back context. */
export type Navigate = (id: ScreenId, opts?: NavOpts) => void;
