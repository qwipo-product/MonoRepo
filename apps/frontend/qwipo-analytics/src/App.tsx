import { useEffect, useState } from 'react';
import { Shell } from './components/Shell';
import Overview from './screens/Overview';
import Sales from './screens/Sales';
import type { Page } from './nav';

// Hash holds the page and an optional drill segment, e.g. #sales/overdue —
// the URL carries the drill chips so the state can be shared.
const fromHash = () => {
  const [page, drill] = (location.hash.slice(1) || 'overview').split('/');
  return { page: (page || 'overview') as Page, drill };
};

export default function App() {
  const [route, setRoute] = useState(fromHash);
  useEffect(() => {
    const onHash = () => setRoute(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (p: string) => { location.hash = p; };

  return (
    <Shell page={route.page} onNavigate={go}>
      {route.page === 'overview' ? (
        <Overview go={go} />
      ) : route.page === 'sales' ? (
        <Sales go={go} drilled={route.drill === 'overdue'} />
      ) : (
        <div className="grid h-full place-items-center text-sm text-foreground-secondary">{route.page} — not ported yet</div>
      )}
    </Shell>
  );
}
