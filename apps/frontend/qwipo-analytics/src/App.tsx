import { useEffect, useState } from 'react';
import { Shell } from './components/Shell';
import Overview from './screens/Overview';
import type { Page } from './nav';

const fromHash = () => ((location.hash.slice(1) || 'overview') as Page);

export default function App() {
  const [page, setPage] = useState<Page>(fromHash);
  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (p: Page) => { location.hash = p; };

  return (
    <Shell page={page} onNavigate={go}>
      {page === 'overview' ? (
        <Overview go={go} />
      ) : (
        <div className="grid h-full place-items-center text-sm text-foreground-secondary">{page} — not ported yet</div>
      )}
    </Shell>
  );
}
