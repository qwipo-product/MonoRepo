import { useMemo, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import {
  Button,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mockups/web-ui';
import { RetailerMap, MapLegend } from '../components/retailer-map';
import { RetailerCard } from '../components/retailer-card';
import { RetailerDetailSheet } from '../components/retailer-detail-sheet';
import {
  ALL_LOCALITIES,
  RETAILERS_BY_NRID,
  VERIFICATION_RANK,
  searchRetailers,
  type VerificationLevel,
} from '../lib/retailer-base';
import { mappingFor, useCompanySession } from '../lib/company-session';

/** How many results are ever rendered at once. See the note by the header. */
const PAGE_SIZE = 12;

const MIN_VERIFICATION: { value: string; label: string }[] = [
  { value: 'any', label: 'Any verification' },
  { value: 'business', label: 'Business verified or better' },
  { value: 'company', label: 'Company verified or better' },
  { value: 'multi', label: 'Multi-participant verified' },
];

/**
 * Discovery: search a place, see who's there, decide who to map.
 *
 * Shaped like a property search because that pattern is well understood —
 * search bar, map, result rail — but the disclosure runs the opposite way. A
 * property portal reveals everything to hold your attention; this reveals the
 * minimum until you contribute something back.
 */
export function DiscoverPage() {
  const session = useCompanySession();
  // Default to the whole city so the map opens dense — a company should see
  // the base is real before being asked to contribute to it.
  const [query, setQuery] = useState('Hyderabad');
  const [submitted, setSubmitted] = useState('Hyderabad');
  const [minVerification, setMinVerification] = useState('any');
  const [hideMapped, setHideMapped] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // `revision` forces the map to recompute pin state, which lives in the
  // session store rather than in props.
  const revision = session.unlockedCount + session.mappedCount;

  const results = useMemo(() => {
    let list = searchRetailers(submitted);
    if (minVerification !== 'any') {
      const floor = VERIFICATION_RANK[minVerification as VerificationLevel];
      list = list.filter((r) => VERIFICATION_RANK[r.verification] >= floor);
    }
    if (hideMapped) list = list.filter((r) => !mappingFor(r.nrid));
    return list.sort(
      (a, b) => VERIFICATION_RANK[b.verification] - VERIFICATION_RANK[a.verification],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, minVerification, hideMapped, revision]);

  const visible = results.slice(0, shown);

  const runSearch = () => {
    setSubmitted(query);
    setShown(PAGE_SIZE);
    setSelected(null);
  };

  /** Rail card, or the popup's CTA — opens the full detail panel. */
  const openRetailer = (nrid: string) => {
    setSelected(nrid);
    setSheetOpen(true);
  };

  /** Pin click — just selects. Leaflet pops the card open itself. */
  const selectRetailer = (nrid: string) => setSelected(nrid);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <div className="relative min-w-64 flex-1 max-w-md">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="City, locality or PIN code — Hyderabad, Kondapur, 500084"
            className="pl-9"
          />
        </div>
        <Button onClick={runSearch}>
          <Search /> Search
        </Button>

        <Select value={minVerification} onValueChange={setMinVerification}>
          <SelectTrigger className="w-56">
            <SlidersHorizontal className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MIN_VERIFICATION.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={hideMapped ? 'default' : 'outline'}
          onClick={() => setHideMapped((v) => !v)}
        >
          Not yet mapped
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Map */}
        <div className="relative min-w-0 flex-1">
          {results.length > 0 ? (
            <RetailerMap
              retailers={results}
              selectedNrid={selected ?? undefined}
              onSelect={selectRetailer}
              onOpenDetail={openRetailer}
              revision={revision}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100">
              <p className="text-sm text-gray-500">No area selected</p>
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm">
            <MapLegend />
          </div>
        </div>

        {/* Result rail */}
        <div className="flex w-full max-w-sm flex-shrink-0 flex-col border-l border-gray-200 bg-white">
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              {submitted || 'Search an area'}
            </p>
            {/*
              Deliberately "showing N", never a total. PRD §32: exposing the
              full count for a searchable query hands over an enumeration
              oracle — you can binary-search the base without ever unlocking.
            */}
            <p className="text-xs text-gray-500">
              Showing {visible.length}
              {results.length > visible.length && ' · more available'}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {visible.length === 0 ? (
              <EmptyState
                compact
                icon={Search}
                title="Nothing here"
                description={`No retailers matched "${submitted}". Try a locality like ${ALL_LOCALITIES[0]}, or a PIN code.`}
              />
            ) : (
              <>
                {visible.map((r) => (
                  <RetailerCard
                    key={r.nrid}
                    retailer={r}
                    selected={r.nrid === selected}
                    onClick={() => openRetailer(r.nrid)}
                  />
                ))}
                {results.length > visible.length && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShown((n) => n + PAGE_SIZE)}
                  >
                    Show more
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <RetailerDetailSheet
        retailer={selected ? RETAILERS_BY_NRID.get(selected) ?? null : null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onChanged={() => setShown((n) => n)}
      />
    </div>
  );
}
