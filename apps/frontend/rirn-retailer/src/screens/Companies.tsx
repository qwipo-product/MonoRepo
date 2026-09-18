import { useMemo, useState } from 'react';
import { BadgeCheck, LogOut, Search, Store } from 'lucide-react';
import { Badge, Chip, EmptyState, Input } from '@mockups/ui';
import { CompanyCard } from '../components/CompanyCard';
import { ClaimSheet } from '../components/ClaimSheet';
import { COMPANIES_BY_ID, searchCompanies, type Company } from '../lib/companies';
import { connectionFor, logout, useRetailerSession } from '../lib/retailer-session';

type Filter = 'all' | 'connected' | 'new';

/**
 * The main screen: who I am, and which companies I've given my ID to.
 *
 * Connected companies float to the top of the list. On a phone the retailer
 * cares first about what's already sorted — the rest is a task list.
 */
export function Companies() {
  const { retailer, connectedCount } = useRetailerSession();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<Company | null>(null);

  const results = useMemo(() => {
    const list = searchCompanies(query).filter((c) => {
      const conn = connectionFor(c.id);
      if (filter === 'connected') return !!conn;
      if (filter === 'new') return !conn;
      return true;
    });
    // Connected first, then pending, then the rest — alphabetical inside each.
    const rank = (c: Company) => {
      const conn = connectionFor(c.id);
      if (conn?.status === 'verified') return 0;
      if (conn?.status === 'pending') return 1;
      return 2;
    };
    return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    // connectedCount re-runs this when a claim lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, connectedCount]);

  if (!retailer) return null;

  return (
    <div className="flex min-h-full flex-col">
      {/* Identity header — what every ID below gets attached to. */}
      <div className="flex-shrink-0 bg-primary px-4 pb-5 pt-6 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs opacity-90">
              <Store className="h-3.5 w-3.5" />
              My shop
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold">{retailer.businessName}</h1>
            <p className="mt-0.5 text-xs opacity-90">
              {retailer.locality}, {retailer.city}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-xs">
            {retailer.nrid}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified business
          </span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex-shrink-0 space-y-3 border-b border-border bg-card px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or brand"
            className="h-12 pl-9 text-base"
          />
        </div>
        <div className="flex gap-2">
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          <Chip selected={filter === 'connected'} onClick={() => setFilter('connected')}>
            My companies
            {connectedCount > 0 && (
              <Badge variant="neutral" className="ml-1.5">
                {connectedCount}
              </Badge>
            )}
          </Chip>
          <Chip selected={filter === 'new'} onClick={() => setFilter('new')}>
            Not added
          </Chip>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2.5 bg-background-subtle px-4 py-4">
        {results.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No companies found"
            description={`Nothing matched "${query}". Try a brand name like Maggi or Surf Excel.`}
          />
        ) : (
          results.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              connection={connectionFor(c.id)}
              onPress={() => setActive(c)}
            />
          ))
        )}
      </div>

      <ClaimSheet
        company={active ? COMPANIES_BY_ID.get(active.id) ?? null : null}
        open={!!active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
