// App-wide scope: ONE set of filters shared by every page, held in App.tsx.
// Without this each page's ScopeBar owned a private copy and navigation
// silently reset the user's selections.
import { createContext, useContext } from 'react';
import { ALL, type Filters } from './components/filters';
import { DEFAULT_SCOPE, type BuyerScope } from './data/buyer';

export const ScopeContext = createContext<{ f: Filters; setF: (f: Filters) => void }>({
  f: ALL,
  setF: () => {},
});

export const useScope = () => useContext(ScopeContext);

// Buyer-side scope — date range + State / City / Distributor, shared by the
// DigiDukaan · Buyer pages so moving between them keeps the selection.
export const BuyerScopeContext = createContext<{ s: BuyerScope; setS: (s: BuyerScope) => void }>({
  s: DEFAULT_SCOPE,
  setS: () => {},
});

export const useBuyerScope = () => useContext(BuyerScopeContext);
