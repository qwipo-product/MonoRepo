import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, BellOff, Copy, Eye, Filter, ListOrdered, Megaphone, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  ListPagination,
  paginate,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  type StatusTone,
} from '@mockups/web-ui';

import { usePromotionStore } from '../../store/usePromotionStore';
import { brands, categories, companies } from '../../lib/mock-data';
import { describeGeo, formatCreatedAt, formatDateRange, formatShortDate, statusLabels, statusSortOrder, surfaceLabels } from '../../lib/promotion-copy';
import { formatRelativeTime } from '../../lib/relative-time';
import type { PromotionRecord, PromotionStatus, PromotionSurface } from '../../types/campaign';
import { PhoneSimulator } from '../../components/wizard/phone-simulator';
import { ManageRankingSheet } from '../../components/promotions/manage-ranking-sheet';
import { SkuViewModal } from '../../components/promotions/sku-upload-modal';

const statusFilterOptions: Array<'All Statuses' | PromotionStatus> = ['All Statuses', 'live', 'scheduled', 'draft', 'expired', 'archived'];
const surfaceFilterOptions: Array<'All surfaces' | PromotionSurface> = ['All surfaces', 'full_screen', 'home_carousel', 'product_list'];

const statusTone: Record<PromotionStatus, StatusTone> = {
  live: 'success',
  scheduled: 'info',
  draft: 'neutral',
  expired: 'warning',
  archived: 'neutral',
};

function CreatePromotionButton({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const resetDraft = usePromotionStore((state) => state.resetDraft);

  const createPromotion = () => {
    resetDraft();
    navigate('/promotions/create');
  };

  return (
    <Button type="button" onClick={createPromotion} className={compact ? 'px-3.5' : undefined}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Create promotion
    </Button>
  );
}

export default function PromotionsList() {
  const navigate = useNavigate();
  const campaigns = usePromotionStore((state) => state.campaigns);
  const startEditing = usePromotionStore((state) => state.startEditing);
  const cloneCampaign = usePromotionStore((state) => state.cloneCampaign);
  const deleteCampaign = usePromotionStore((state) => state.deleteCampaign);
  const togglePushNotification = usePromotionStore((state) => state.togglePushNotification);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All Statuses' | PromotionStatus>('All Statuses');
  const [surface, setSurface] = useState<'All surfaces' | PromotionSurface>('All surfaces');
  const [page, setPage] = useState(1);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);

  const filteredPromotions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = campaigns.filter((campaign) => {
      const haystack = `${campaign.campaign_title} ${campaign.display_name} ${describeGeo(campaign.geo)}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = status === 'All Statuses' || campaign.status === status;
      const matchesSurface = surface === 'All surfaces' || campaign.surface === surface;
      return matchesSearch && matchesStatus && matchesSurface;
    });

    // Newest first regardless of campaign start date; ties (e.g. seed data created in the same
    // batch) break by status so the most actionable campaigns surface first.
    return [...filtered].sort((first, second) => {
      const createdDiff = second.created_at.localeCompare(first.created_at);
      if (createdDiff !== 0) return createdDiff;
      return statusSortOrder[first.status] - statusSortOrder[second.status];
    });
  }, [campaigns, search, status, surface]);

  const resetFilters = () => {
    setSearch('');
    setStatus('All Statuses');
    setSurface('All surfaces');
    setPage(1);
  };

  const handleEdit = (id: string) => {
    startEditing(id);
    navigate('/promotions/create');
  };

  const viewingRecord = campaigns.find((campaign) => campaign.id === viewingId) ?? null;
  const deletingRecord = campaigns.find((campaign) => campaign.id === deletingId) ?? null;

  const activeFilterCount = (status !== 'All Statuses' ? 1 : 0) + (surface !== 'All surfaces' ? 1 : 0);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = paginate(filteredPromotions, safePage, pageSize);

  return (
    <section className="flex h-full flex-col bg-gray-50">
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-gray-200 bg-white px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Search promotions</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search promotions..."
            className="pl-9"
          />
        </label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => setRankingOpen(true)}>
            <ListOrdered className="h-4 w-4" aria-hidden="true" />
            Manage ranking
          </Button>
          <CreatePromotionButton />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredPromotions.length === 0 ? (
          <div className="h-full bg-white">
            <EmptyState
              icon={Megaphone}
              title="No promotions found"
              description="Try adjusting your filters, or create a new promotion to get your next campaign moving."
              action={
                <div className="flex items-center justify-center gap-3">
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                  <CreatePromotionButton compact />
                </div>
              }
            />
          </div>
        ) : (
          <div className="min-w-full bg-white">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="sticky top-0 z-20 bg-gray-50 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Campaign name</th>
                  <th className="px-4 py-3">Geo scope</th>
                  <th className="px-4 py-3">Start date</th>
                  <th className="px-4 py-3">End date</th>
                  <th className="px-4 py-3">Surface type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageRows.map((campaign) => (
                  <PromotionRow
                    key={campaign.id}
                    campaign={campaign}
                    onView={() => setViewingId(campaign.id)}
                    onEdit={() => handleEdit(campaign.id)}
                    onClone={() => cloneCampaign(campaign.id)}
                    onDelete={() => setDeletingId(campaign.id)}
                    onTogglePush={() => togglePushNotification(campaign.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredPromotions.length > 0 && (
        <ListPagination
          page={safePage}
          total={filteredPromotions.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="campaign"
          className="border-t border-gray-200 px-6"
        />
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex flex-col gap-0">
          <SheetHeader className="border-b border-gray-200">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as typeof status);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'All Statuses' ? 'All statuses' : statusLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">Surface type</label>
              <Select
                value={surface}
                onValueChange={(value) => {
                  setSurface(value as typeof surface);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {surfaceFilterOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'All surfaces' ? option : surfaceLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={resetFilters}>
              Clear
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(viewingRecord)} onOpenChange={(next) => !next && setViewingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingRecord?.campaign_title ?? 'Promotion'}</DialogTitle>
          </DialogHeader>
          {viewingRecord && <PromotionSummary campaign={viewingRecord} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingRecord)} onOpenChange={(next) => !next && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promotion</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deletingRecord?.campaign_title ?? ''}" from your promotions list. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) deleteCampaign(deletingId);
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManageRankingSheet open={rankingOpen} onOpenChange={setRankingOpen} />
    </section>
  );
}

function PromotionRow({
  campaign,
  onView,
  onEdit,
  onClone,
  onDelete,
  onTogglePush,
}: {
  campaign: PromotionRecord;
  onView: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onTogglePush: () => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{campaign.campaign_title || 'Untitled campaign'}</p>
        <p className="mt-1 text-xs text-gray-500">{campaign.display_name || '—'}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{describeGeo(campaign.geo)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatShortDate(campaign.start_date)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatShortDate(campaign.end_date)}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{campaign.surface ? surfaceLabels[campaign.surface] : '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone[campaign.status]}>
            <span className="mr-0.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {statusLabels[campaign.status]}
          </StatusBadge>
          {campaign.push_notification_enabled ? (
            <Bell className="h-3.5 w-3.5 text-blue-600" aria-label="Push notification on" />
          ) : (
            <BellOff className="h-3.5 w-3.5 text-gray-400" aria-label="Push notification off" />
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs leading-5 text-gray-600">
        <span title={formatCreatedAt(campaign.created_at)}>{formatRelativeTime(campaign.created_at)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <ActionsMenu campaign={campaign} onView={onView} onEdit={onEdit} onClone={onClone} onDelete={onDelete} onTogglePush={onTogglePush} />
      </td>
    </tr>
  );
}

function ActionsMenu({
  campaign,
  onView,
  onEdit,
  onClone,
  onDelete,
  onTogglePush,
}: {
  campaign: PromotionRecord;
  onView: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onTogglePush: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" aria-label={`More options for ${campaign.campaign_title}`}>
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 text-gray-500" aria-hidden="true" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4 text-gray-500" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onClone}>
          <Copy className="h-4 w-4 text-gray-500" aria-hidden="true" />
          Clone
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePush} className="justify-between">
          <span className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-gray-500" aria-hidden="true" />
            Push notification
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wider ${campaign.push_notification_enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
            {campaign.push_notification_enabled ? 'On' : 'Off'}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function PromotionSummary({ campaign }: { campaign: PromotionRecord }) {
  const [skuViewOpen, setSkuViewOpen] = useState(false);
  const companyNames = campaign.product.company_ids.map((id) => companies.find((company) => company.id === id)?.name).filter(Boolean);
  const categoryNames = campaign.product.category_ids.map((id) => categories.find((category) => category.id === id)?.name).filter(Boolean);
  const brandNames = campaign.product.brand_ids.map((id) => brands.find((brand) => brand.id === id)?.name).filter(Boolean);
  const skuCount = campaign.product.sku_ids.length;

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
      <div className="divide-y divide-gray-200">
        <SummaryRow label="Display name" value={campaign.display_name || '—'} />
        <SummaryRow label="Status" value={statusLabels[campaign.status]} />
        <SummaryRow label="Timeline" value={formatDateRange(campaign.start_date, campaign.end_date)} />
        <SummaryRow label="Geo scope" value={describeGeo(campaign.geo)} />
        <SummaryRow label="Companies" value={companyNames.length > 0 ? companyNames.join(', ') : 'All'} />
        <SummaryRow label="Categories" value={categoryNames.length > 0 ? categoryNames.join(', ') : 'All'} />
        <SummaryRow label="Brands" value={brandNames.length > 0 ? brandNames.join(', ') : 'All'} />
        <SummaryRow label="Promotion surface" value={campaign.surface ? surfaceLabels[campaign.surface] : '—'} />
        <SummaryRow label="Push notification" value={campaign.push_notification_enabled ? 'On' : 'Off'} />
        <SummaryRow label="Created" value={formatCreatedAt(campaign.created_at)} />
        {skuCount > 0 && (
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-gray-500">SKUs</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setSkuViewOpen(true)}>
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              View uploaded SKUs ({skuCount})
            </Button>
          </div>
        )}
      </div>
      <div className="sm:w-[320px]">
        <PhoneSimulator surface={campaign.surface} imageUrl={campaign.asset.data_url} emptyLabel="No banner uploaded for this campaign yet." />
      </div>

      <SkuViewModal
        open={skuViewOpen}
        onOpenChange={setSkuViewOpen}
        skuIds={campaign.product.sku_ids}
        title={`Uploaded SKUs — ${campaign.campaign_title || 'Untitled campaign'}`}
      />
    </div>
  );
}
