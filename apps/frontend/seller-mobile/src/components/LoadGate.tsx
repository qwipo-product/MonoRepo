import { useEffect, useState, type ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { Button, EmptyState } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';

// Read once: `?slow` shows the loading state on every page, `?fail` shows the
// error state (Retry then works). Without either, pages render straight away.
const PARAMS = new URLSearchParams(window.location.search);
const SLOW = PARAMS.has('slow');
const FAIL = PARAMS.has('fail');
const DELAY = 700;

type Phase = 'loading' | 'error' | 'ready';

/* Wraps a page so its loading and error states can be shown in a demo. A
   real phone is often on a weak network; every page has to say "loading"
   and "couldn't load — retry" rather than sit blank. */
export function LoadGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>(SLOW || FAIL ? 'loading' : 'ready');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (phase !== 'loading') return;
    const id = window.setTimeout(() => {
      // First attempt fails under ?fail; the retry succeeds.
      if (FAIL && !failed) {
        setFailed(true);
        setPhase('error');
      } else setPhase('ready');
    }, DELAY);
    return () => window.clearTimeout(id);
  }, [phase, failed]);

  if (phase === 'ready') return <>{children}</>;

  if (phase === 'error')
    return (
      <div className="grid h-full place-items-center bg-background-subtle p-6">
        <EmptyState
          icon={<WifiOff strokeWidth={1.75} />}
          title={t('seller.load.error_title')}
          description={t('seller.load.error_help')}
          action={<Button onClick={() => setPhase('loading')}>{t('seller.load.retry')}</Button>}
        />
      </div>
    );

  return (
    <div className="h-full space-y-3 bg-background-subtle p-3" aria-busy="true" aria-label={t('seller.load.loading')}>
      <div className="h-11 animate-pulse rounded-md bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
