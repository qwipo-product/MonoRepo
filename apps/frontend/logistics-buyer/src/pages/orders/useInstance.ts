import { useCallback, useState } from 'react';

/**
 * Angular-component-style mutable state for faithful ports of imperative async logic
 * (await chains, timers, Subjects) without stale-closure bugs: mutate the instance fields,
 * then call `update()` to re-render — the equivalent of Angular change detection.
 */
export function useInstance<T extends object>(init: () => T): [T, () => void] {
  const [instance] = useState(init);
  const [, setTick] = useState(0);
  const update = useCallback(() => setTick((t) => (t + 1) % 1_000_000), []);
  return [instance, update];
}

/** Angular `number` pipe (en-US, western grouping) with `minInt.minFrac-maxFrac` digits info. */
export function ngNumber(value: unknown, minFrac = 0, maxFrac = 3): string {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || isNaN(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac });
}
