// App-wide scope: ONE set of filters shared by every page, held in App.tsx.
// Without this each page's ScopeBar owned a private copy and navigation
// silently reset the user's selections.
import { createContext, useContext } from 'react';
import { ALL, type Filters } from './components/filters';

export const ScopeContext = createContext<{ f: Filters; setF: (f: Filters) => void }>({
  f: ALL,
  setF: () => {},
});

export const useScope = () => useContext(ScopeContext);
