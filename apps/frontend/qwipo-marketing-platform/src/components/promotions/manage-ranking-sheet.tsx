import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type StatusTone,
} from '@mockups/web-ui';

import { usePromotionStore } from '../../store/usePromotionStore';
import { brands, categories, cities, states } from '../../lib/mock-data';
import { deriveStatus, describeGeo, getEligibleForRanking, statusLabels, surfaceLabels, surfaceRankCap } from '../../lib/promotion-copy';
import type { PromotionRecord, PromotionStatus, PromotionSurface } from '../../types/campaign';

interface ManageRankingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RankOrders = Record<PromotionSurface, string[]>;

const ALL_STATES = 'All States';
const ALL_CITIES = 'All Cities';
const ALL_CATEGORIES = 'All Categories';
const ALL_BRANDS = 'All Brands';

interface ScopeFilters {
  state: string;
  city: string;
  category: string;
  brand: string;
}

const emptyFilters: ScopeFilters = { state: ALL_STATES, city: ALL_CITIES, category: ALL_CATEGORIES, brand: ALL_BRANDS };

const statusTone: Record<PromotionStatus, StatusTone> = {
  live: 'success',
  scheduled: 'info',
  draft: 'neutral',
  expired: 'warning',
  archived: 'neutral',
};

/** Compact toolbar select — local stand-in for the source app's `FilterSelect`, which has no
 * direct equivalent in @mockups/web-ui; built from the kit's own Select primitives. */
function ToolbarSelect({
  value,
  onChange,
  options,
  widthClassName = 'w-36',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  widthClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={widthClassName} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Reconciles a stored order against the live-eligible set: ranked ids that are still eligible
 * keep their position, then any newly-eligible-but-unranked campaign is appended — so every
 * eligible campaign always resolves to *some* rank, even before it's ever been explicitly moved. */
function resolveOrderedEligible(eligible: PromotionRecord[], order: string[]): PromotionRecord[] {
  const eligibleById = new Map(eligible.map((campaign) => [campaign.id, campaign]));
  const ordered: PromotionRecord[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const campaign = eligibleById.get(id);
    if (campaign && !seen.has(id)) {
      ordered.push(campaign);
      seen.add(id);
    }
  }
  for (const campaign of eligible) {
    if (!seen.has(campaign.id)) {
      ordered.push(campaign);
      seen.add(campaign.id);
    }
  }
  return ordered;
}

function matchesScope(campaign: PromotionRecord, filters: ScopeFilters): boolean {
  const matchesState = filters.state === ALL_STATES || campaign.geo.state_ids.includes(filters.state) || campaign.geo.state_ids.length === 0;
  const matchesCity = filters.city === ALL_CITIES || campaign.geo.city_ids.includes(filters.city) || campaign.geo.city_ids.length === 0;
  const matchesCategory = filters.category === ALL_CATEGORIES || campaign.product.category_ids.includes(filters.category);
  const matchesBrand = filters.brand === ALL_BRANDS || campaign.product.brand_ids.includes(filters.brand);
  return matchesState && matchesCity && matchesCategory && matchesBrand;
}

export function ManageRankingSheet({ open, onOpenChange }: ManageRankingSheetProps) {
  const campaigns = usePromotionStore((state) => state.campaigns);
  const rankings = usePromotionStore((state) => state.rankings);
  const setRankOrders = usePromotionStore((state) => state.setRankOrders);

  const [activeSurface, setActiveSurface] = useState<PromotionSurface>('home_carousel');
  const [draftOrders, setDraftOrders] = useState<RankOrders>(rankings);
  const [filters, setFilters] = useState<ScopeFilters>(emptyFilters);

  // Reseed from the persisted order every time the sheet opens, so a prior Cancel never leaks
  // into the next session. Adjusted during render (React's documented pattern for "reset state
  // when a prop changes") rather than in an effect, to avoid an extra cascading render pass.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraftOrders(rankings);
  }

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const cityOptions = useMemo(
    () => (filters.state === ALL_STATES ? cities : cities.filter((city) => city.stateId === filters.state)),
    [filters.state],
  );

  const handleMove = (surface: PromotionSurface, activeId: string, overId: string) => {
    setDraftOrders((prev) => {
      const eligible = getEligibleForRanking(campaigns, surface, today);
      const trueIds = resolveOrderedEligible(eligible, prev[surface]).map((campaign) => campaign.id);
      const oldIndex = trueIds.indexOf(activeId);
      const newIndex = trueIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [surface]: arrayMove(trueIds, oldIndex, newIndex) };
    });
  };

  const handleMoveToRank = (surface: PromotionSurface, id: string, rank: number) => {
    setDraftOrders((prev) => {
      const eligible = getEligibleForRanking(campaigns, surface, today);
      const trueIds = resolveOrderedEligible(eligible, prev[surface]).map((campaign) => campaign.id);
      const currentIndex = trueIds.indexOf(id);
      if (currentIndex === -1) return prev;
      const withoutItem = trueIds.filter((itemId) => itemId !== id);
      const targetIndex = Math.min(Math.max(Math.round(rank) - 1, 0), withoutItem.length);
      withoutItem.splice(targetIndex, 0, id);
      return { ...prev, [surface]: withoutItem };
    });
  };

  const handleCancel = () => onOpenChange(false);

  const handleSave = () => {
    setRankOrders(draftOrders);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-gray-200">
          <SheetTitle className="text-base font-semibold">Manage ranking</SheetTitle>
          <SheetDescription>
            Reorder which live and scheduled campaigns show first on each surface. Draft and expired campaigns are excluded automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-3">
          <ToolbarSelect
            value={filters.state}
            onChange={(value) => setFilters((prev) => ({ ...prev, state: value, city: ALL_CITIES }))}
            options={[{ value: ALL_STATES, label: ALL_STATES }, ...states.map((state) => ({ value: state.id, label: state.name }))]}
          />
          <ToolbarSelect
            value={filters.city}
            onChange={(value) => setFilters((prev) => ({ ...prev, city: value }))}
            options={[{ value: ALL_CITIES, label: ALL_CITIES }, ...cityOptions.map((city) => ({ value: city.id, label: city.name }))]}
          />
          <ToolbarSelect
            value={filters.category}
            onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
            options={[{ value: ALL_CATEGORIES, label: ALL_CATEGORIES }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
          />
          <ToolbarSelect
            value={filters.brand}
            onChange={(value) => setFilters((prev) => ({ ...prev, brand: value }))}
            options={[{ value: ALL_BRANDS, label: ALL_BRANDS }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
          />
        </div>

        <Tabs value={activeSurface} onValueChange={(value) => setActiveSurface(value as PromotionSurface)} className="flex min-h-0 flex-1 flex-col gap-0">
          <TabsList className="mx-4 mt-3 w-fit">
            {(['home_carousel', 'product_list', 'full_screen'] as const).map((surface) => (
              <TabsTrigger key={surface} value={surface}>
                {surfaceLabels[surface]} (max {surfaceRankCap[surface]})
              </TabsTrigger>
            ))}
          </TabsList>

          {(['home_carousel', 'product_list', 'full_screen'] as const).map((surface) => (
            <TabsContent key={surface} value={surface} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <SurfaceRankingTable
                surface={surface}
                campaigns={campaigns}
                order={draftOrders[surface]}
                filters={filters}
                today={today}
                onMove={(activeId, overId) => handleMove(surface, activeId, overId)}
                onMoveToRank={(id, rank) => handleMoveToRank(surface, id, rank)}
              />
            </TabsContent>
          ))}
        </Tabs>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save &amp; apply ranking
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SurfaceRankingTable({
  surface,
  campaigns,
  order,
  filters,
  today,
  onMove,
  onMoveToRank,
}: {
  surface: PromotionSurface;
  campaigns: PromotionRecord[];
  order: string[];
  filters: ScopeFilters;
  today: string;
  onMove: (activeId: string, overId: string) => void;
  onMoveToRank: (id: string, rank: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const cap = surfaceRankCap[surface];

  const eligible = useMemo(() => getEligibleForRanking(campaigns, surface, today), [campaigns, surface, today]);
  const ranked = useMemo(() => resolveOrderedEligible(eligible, order), [eligible, order]);
  const rankById = useMemo(() => new Map(ranked.map((campaign, index) => [campaign.id, index + 1])), [ranked]);
  const visible = useMemo(() => ranked.filter((campaign) => matchesScope(campaign, filters)), [ranked, filters]);

  if (ranked.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
        No live or scheduled campaigns are targeting {surfaceLabels[surface]} yet.
      </p>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          <tr>
            <th className="w-10 py-2"></th>
            <th className="w-16 py-2">Rank</th>
            <th className="py-2">Campaign</th>
            <th className="py-2">Territory</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <SortableContext items={visible.map((campaign) => campaign.id)} strategy={verticalListSortingStrategy}>
          <tbody className="divide-y divide-gray-200">
            {visible.map((campaign) => {
              const rank = rankById.get(campaign.id) ?? visible.length;
              const isQueued = rank > cap;
              return (
                <RankRow
                  key={campaign.id}
                  campaign={campaign}
                  rank={rank}
                  isQueued={isQueued}
                  showCapBoundary={rank === cap + 1}
                  effectiveStatus={deriveStatus(campaign.start_date, campaign.end_date, today)}
                  onMoveToRank={onMoveToRank}
                />
              );
            })}
          </tbody>
        </SortableContext>
      </table>
    </DndContext>
  );
}

function RankRow({
  campaign,
  rank,
  isQueued,
  showCapBoundary,
  effectiveStatus,
  onMoveToRank,
}: {
  campaign: PromotionRecord;
  rank: number;
  isQueued: boolean;
  showCapBoundary: boolean;
  effectiveStatus: PromotionStatus;
  onMoveToRank: (id: string, rank: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: campaign.id });
  const [rankInput, setRankInput] = useState(String(rank));

  // Keep the input in sync when a drag or another row's rank edit moves this row — adjusted
  // during render rather than in an effect, same reasoning as the sheet's reseed-on-open above.
  const [prevRank, setPrevRank] = useState(rank);
  if (rank !== prevRank) {
    setPrevRank(rank);
    setRankInput(String(rank));
  }

  const commitRank = () => {
    const parsed = Number(rankInput);
    if (Number.isFinite(parsed) && parsed >= 1) onMoveToRank(campaign.id, parsed);
    else setRankInput(String(rank));
  };

  return (
    <>
      {showCapBoundary && (
        <tr aria-hidden="true">
          <td colSpan={5} className="border-t-2 border-dashed border-red-200 p-0" />
        </tr>
      )}
      <tr
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={isDragging ? 'relative z-10 bg-white shadow-md' : isQueued ? 'bg-gray-50' : 'bg-white'}
      >
        <td className="py-2 pl-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 active:cursor-grabbing"
            aria-label={`Reorder ${campaign.campaign_title}`}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </td>
        <td className="py-2">
          <input
            type="number"
            min={1}
            value={rankInput}
            onChange={(event) => setRankInput(event.target.value)}
            onBlur={commitRank}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="h-8 w-14 rounded-md border border-gray-200 bg-input-background px-2 text-center text-sm outline-none transition-[color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </td>
        <td className="max-w-[220px] py-2 pr-2">
          <p className="truncate text-sm font-medium text-gray-900">{campaign.campaign_title || 'Untitled campaign'}</p>
          <p className="truncate text-xs text-gray-500">{campaign.display_name || '—'}</p>
        </td>
        <td className="max-w-[160px] py-2 pr-2 text-xs text-gray-500">
          <span className="truncate">{describeGeo(campaign.geo)}</span>
        </td>
        <td className="py-2">
          {isQueued ? (
            <StatusBadge tone="warning">Queued (exceeds cap)</StatusBadge>
          ) : (
            <StatusBadge tone={statusTone[effectiveStatus]}>{statusLabels[effectiveStatus]}</StatusBadge>
          )}
        </td>
      </tr>
    </>
  );
}
