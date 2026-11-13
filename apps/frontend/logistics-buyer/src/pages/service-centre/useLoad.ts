import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/services/crossDock.service';

/**
 * Loads data for a screen and keeps loading / error state. `reload()` refetches (keeping the old data on screen while
 * it loads, so lists don't flash empty after an action).
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const call = useRef(0);
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const reload = useCallback(async () => {
    const id = ++call.current;
    setLoading(true);
    setError(null);
    try {
      const d = await fnRef.current();
      if (id === call.current) setData(d);
    } catch (e) {
      if (id === call.current) setError(errorMessage(e, 'Could not load this page.'));
    } finally {
      if (id === call.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload, setData };
}
