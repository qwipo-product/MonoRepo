/* Demo state — review-only switch that forces every list on every screen to be
   empty, so the zero-data designs are actually reachable in the gallery.

   Without this, ~15 empty states are dead code: they only render when a data
   array is empty, and the mock fixtures never are. Reviewers could not see
   them at all.

   Screens don't read a flag and branch. They pipe their list through
   `useEmptyable()`, which hands back [] when the toggle is on — so the empty
   branch each screen already had is the thing that renders. One switch, no
   per-screen mock data. */

import { createContext, useContext, type ReactNode } from 'react';

const DemoStateContext = createContext(false);

export function DemoStateProvider({ empty, children }: { empty: boolean; children: ReactNode }) {
  return <DemoStateContext.Provider value={empty}>{children}</DemoStateContext.Provider>;
}

/** True when the review gallery's "Empty" toggle is on. */
export function useEmptyDemo(): boolean {
  return useContext(DemoStateContext);
}

/** Returns [] in empty-demo mode, otherwise the list untouched. */
export function useEmptyable<T>(items: T[]): T[] {
  const empty = useContext(DemoStateContext);
  return empty ? [] : items;
}
