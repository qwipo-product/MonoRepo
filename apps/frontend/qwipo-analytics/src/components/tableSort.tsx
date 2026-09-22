// Shared sortable-header helper for the entity tables (drawer, leaderboard).
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@mockups/ui';

export interface Sort<K extends string> { k: K; dir: 1 | -1 }

/** Returns a th-renderer bound to a sort state. */
export function makeTh<K extends string>(
  sort: Sort<K>,
  setSort: (fn: (s: Sort<K>) => Sort<K>) => void,
  defaultDir: (k: K) => 1 | -1 = () => -1,
) {
  return (k: K, label: string, right?: boolean) => (
    <th
      className={cn('cursor-pointer select-none py-2 pr-3 font-semibold hover:text-foreground', right && 'text-right')}
      onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : defaultDir(k) }))}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sort.k === k && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </span>
    </th>
  );
}
