import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { Button } from '@mockups/ui';
import {
  CURRENT_PLACE_ID,
  PLACES,
  formatPlace,
  nearestPlace,
  placeById,
  searchPlaces,
  type Place,
} from '../data/places';

/* Select delivery location — the map step shared by onboarding and
   Saved Addresses → Add new address.

   The pin is fixed at the centre and the map moves under it, which is the
   pattern every delivery app uses: it keeps the drop point under the thumb and
   removes any question of what you're aiming at. Panning reverse-geocodes to
   the nearest known locality, so dragging actually changes the address.

   The map itself is drawn (SVG), not tiled — see data/places.ts for where a
   real Places/Geocoding API would slot in. */

const VIEW = 1000; // map grid is 0–1000 on both axes

export function LocationPickerScreen({
  title = 'Select delivery location',
  onBack,
  onConfirm,
}: {
  title?: string;
  onBack: () => void;
  onConfirm: (place: Place) => void;
}) {
  // Centre of the viewport in map coordinates — what the pin is pointing at.
  const start = placeById(CURRENT_PLACE_ID);
  const [centre, setCentre] = useState({ x: start.x, y: start.y });
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);

  const place = nearestPlace(centre.x, centre.y);
  const results = searchPlaces(query);

  // Pointer drag pans the map; the pin never moves.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current || !surfaceRef.current) return;
      const r = surfaceRef.current.getBoundingClientRect();
      // px per map unit — the surface shows a 420-unit window
      const scale = r.width / 420;
      setCentre({
        x: clamp(drag.current.cx - (e.clientX - drag.current.px) / scale),
        y: clamp(drag.current.cy - (e.clientY - drag.current.py) / scale),
      });
    };
    const up = () => {
      drag.current = null;
      setDragging(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, cx: centre.x, cy: centre.y };
    setDragging(true);
  };

  const goTo = (p: Place) => {
    setCentre({ x: p.x, y: p.y });
    setQuery('');
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">{title}</h1>
      </header>

      {/* map + overlays */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-background-sunken">
        <div
          ref={surfaceRef}
          onPointerDown={onPointerDown}
          className={`absolute inset-0 touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <MapCanvas centre={centre} />
        </div>

        {/* centre pin — sits above the map, never moves */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin
            className={`h-10 w-10 text-primary drop-shadow transition-transform ${dragging ? '-translate-y-1.5' : ''}`}
            fill="currentColor"
            strokeWidth={1.5}
          />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/30" />

        {/* search */}
        <div className="absolute inset-x-0 top-0 p-3">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 shadow-md">
            <Search className="h-4 w-4 shrink-0 text-foreground-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search area, locality or landmark"
              aria-label="Search for a location"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className="text-foreground-secondary">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goTo(p)}
                  className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-2.5 text-left last:border-0 active:bg-muted"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-foreground-secondary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                    <span className="block truncate text-xs text-foreground-secondary">
                      {p.locality}, {p.city}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {query && results.length === 0 && (
            <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground-secondary shadow-lg">
              No place matches “{query}”.
            </div>
          )}
        </div>

        {/* use current location */}
        <button
          onClick={() => goTo(placeById(CURRENT_PLACE_ID))}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-primary shadow-lg active:scale-[0.98]"
        >
          <LocateFixed className="h-4 w-4" />
          Use current location
        </button>
      </div>

      {/* resolved address + confirm */}
      <div className="border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{place.name}</div>
            <div className="text-xs leading-snug text-foreground-secondary">{formatPlace(place)}</div>
          </div>
        </div>
        <Button size="lg" className="mt-3 w-full" onClick={() => onConfirm(place)}>
          Confirm location
        </Button>
      </div>
    </div>
  );
}

const clamp = (n: number) => Math.max(0, Math.min(VIEW, n));

/* Drawn map — blocks, roads, a lake and a park, plus a dot for every known
   locality so panning has landmarks to aim at. Purely decorative: the address
   comes from `nearestPlace`, not from anything drawn here.

   Every surface is a token rather than a hex, so the map follows the theme
   into dark mode like the rest of the app. */
function MapCanvas({ centre }: { centre: { x: number; y: number } }) {
  const half = 210; // half of the 420-unit window
  return (
    <svg
      viewBox={`${centre.x - half} ${centre.y - half} ${half * 2} ${half * 2}`}
      className="h-full w-full select-none"
      aria-hidden
    >
      <defs>
        <pattern id="blocks" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" className="fill-background-subtle" />
          <rect x="6" y="6" width="30" height="26" rx="3" className="fill-border" />
          <rect x="44" y="6" width="30" height="26" rx="3" className="fill-border" />
          <rect x="6" y="46" width="30" height="26" rx="3" className="fill-border" />
          <rect x="44" y="46" width="30" height="26" rx="3" className="fill-border" />
        </pattern>
      </defs>

      <rect x="-200" y="-200" width="1400" height="1400" fill="url(#blocks)" />

      {/* water + green, so the map has orientation cues while panning */}
      <ellipse cx="760" cy="640" rx="150" ry="90" className="fill-info-subtle" />
      <rect x="120" y="700" width="220" height="150" rx="16" className="fill-success-subtle" />

      {/* arterial roads */}
      <g className="stroke-card" strokeLinecap="round" fill="none">
        <path d="M-200 300 H1200" strokeWidth="18" />
        <path d="M-200 560 H1200" strokeWidth="14" />
        <path d="M400 -200 V1200" strokeWidth="18" />
        <path d="M700 -200 V1200" strokeWidth="12" />
        <path d="M-200 120 H1200" strokeWidth="10" />
        <path d="M180 -200 V1200" strokeWidth="10" />
      </g>

      {/* locality markers */}
      {PLACES.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r="4" className="fill-foreground/30" />
          <text
            x={p.x + 9}
            y={p.y + 4}
            className="fill-foreground/60"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {p.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
