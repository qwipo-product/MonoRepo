// Filters shared by every Buyer app analytics board. Mounted once in App so
// they survive moving between boards and the rest of Reports.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_FILTERS, model, type Filters } from './engine';

interface FilterCtx {
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
  reset: () => void;
}

const Ctx = createContext<FilterCtx | null>(null);

export function BuyerAppFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const value = useMemo<FilterCtx>(
    () => ({
      filters,
      set: (patch) => setFilters((f) => ({ ...f, ...patch })),
      reset: () => setFilters(DEFAULT_FILTERS),
    }),
    [filters],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFilters outside BuyerAppFiltersProvider');
  return c;
}

/** Filters plus the numbers model derived from them — what every board starts from. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBoard() {
  const { filters } = useFilters();
  const m = useMemo(() => model(filters), [filters]);
  return { f: filters, m };
}
