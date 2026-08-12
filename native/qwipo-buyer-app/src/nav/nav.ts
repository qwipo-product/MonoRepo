import type { ScreenId } from './screenIndex';
import type { AppliedFilter } from '../data/filters';
import type { Distributor } from '../data/home';

/** Options a navigation can carry to the destination screen. */
export interface NavOpts {
  applied?: AppliedFilter[];
  backTo?: ScreenId;
  tab?: string;
  distributor?: Distributor;
}

export type Navigate = (id: ScreenId, opts?: NavOpts) => void;
