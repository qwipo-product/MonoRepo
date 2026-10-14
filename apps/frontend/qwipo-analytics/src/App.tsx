import { useEffect, useState } from 'react';
import { Shell } from './components/Shell';
import Overview from './screens/Overview';
import Sales from './screens/Sales';
import Distributors from './screens/Distributors';
import Customers from './screens/Customers';
import Reports from './screens/Reports';
import OpsSummary from './screens/OpsSummary';
import OpsOrders from './screens/OpsOrders';
import OpsTrips from './screens/OpsTrips';
import BuyerSales from './screens/BuyerSales';
import BuyerBA from './screens/BuyerBA';
import BuyerCustomers from './screens/BuyerCustomers';
import { ALL, type Filters } from './components/filters';
import { BuyerScopeContext, ScopeContext } from './scope';
import { DEFAULT_SCOPE, type BuyerScope } from './data/buyer';
import type { Page } from './nav';
import BuyerAppAnalytics from './screens/BuyerAppAnalytics';
import { BuyerAppFiltersProvider } from './buyerapp/filters';
import { BuyerDrillProvider } from './components/buyerDrill';

// Hash holds the page and an optional drill segment, e.g. #sales/overdue —
// the URL carries the drill chips so the state can be shared.
const fromHash = () => {
  const [page, drill] = (location.hash.slice(1) || 'overview').split('/');
  // Old links: Buyer app analytics used to live under Reports (#reports/analytics:<board>).
  if (page === 'reports' && drill?.startsWith('analytics')) return { page: 'buyer-analytics' as Page, drill: drill.split(':').slice(1).join(':') };
  return { page: (page || 'overview') as Page, drill };
};

export default function App() {
  const [route, setRoute] = useState(fromHash);
  const [scope, setScope] = useState<Filters>(ALL);
  const [buyerScope, setBuyerScope] = useState<BuyerScope>(DEFAULT_SCOPE);
  useEffect(() => {
    const onHash = () => setRoute(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (p: string) => { location.hash = p; };

  return (
    <ScopeContext.Provider value={{ f: scope, setF: setScope }}>
    <BuyerScopeContext.Provider value={{ s: buyerScope, setS: setBuyerScope }}>
    <BuyerDrillProvider go={go}>
    <BuyerAppFiltersProvider>
      <Shell page={route.page} drill={route.drill} onNavigate={go}>
        {route.page === 'overview' ? (
          <Overview go={go} />
        ) : route.page === 'sales' ? (
          <Sales go={go} drilled={route.drill === 'overdue'} />
        ) : route.page === 'distributors' ? (
          <Distributors go={go} />
        ) : route.page === 'customers' ? (
          <Customers go={go} />
        ) : route.page === 'lg-summary' ? (
          <OpsSummary go={go} />
        ) : route.page === 'lg-orders' ? (
          <OpsOrders />
        ) : route.page === 'lg-trips' ? (
          <OpsTrips go={go} />
        ) : route.page === 'buyer-sales' ? (
          <BuyerSales go={go} />
        ) : route.page === 'buyer-ba' ? (
          <BuyerBA go={go} />
        ) : route.page === 'buyer-customers' ? (
          <BuyerCustomers go={go} />
        ) : route.page === 'buyer-analytics' ? (
          <BuyerAppAnalytics go={go} drill={route.drill} />
        ) : route.page === 'reports' ? (
          <Reports key={route.drill ?? ''} go={go} drill={route.drill} />
        ) : (
          <div className="grid h-full place-items-center text-sm text-foreground-secondary">{route.page} — not ported yet</div>
        )}
      </Shell>
    </BuyerAppFiltersProvider>
    </BuyerDrillProvider>
    </BuyerScopeContext.Provider>
    </ScopeContext.Provider>
  );
}
