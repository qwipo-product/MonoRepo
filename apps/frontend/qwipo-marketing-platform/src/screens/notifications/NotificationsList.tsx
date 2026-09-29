import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Calendar, Eye, Link2, MapPin, MessageCircle, MessageSquare, Plus, Repeat, Search, Smartphone, Trash2, Zap } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  ListPagination,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  buttonVariants,
  paginate,
} from '@mockups/web-ui';
import type { StatusTone } from '@mockups/web-ui';

import { useNotificationStore } from '../../store/useNotificationStore';
import {
  categoryBadgeStyles,
  categoryLabels,
  categoryOptions,
  channelLabels,
  describeTrigger,
  formatCreatedAt,
  statusLabels,
  statusSortOrder,
} from '../../lib/notification-copy';
import { describeGeo } from '../../lib/promotion-copy';
import { formatRelativeTime } from '../../lib/relative-time';
import { ALL_ID, sellerTypeOptions, vendors } from '../../lib/mock-data';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationRecord,
  NotificationStatus,
  NotificationTrigger,
  TriggerType,
} from '../../types/notification';

const channelIcons: Record<NotificationChannel, typeof Bell> = {
  in_app: Bell,
  push: Smartphone,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

const triggerTypeIcons: Record<TriggerType, typeof Calendar> = {
  one_time: Calendar,
  recurring: Repeat,
  event: Zap,
};

/** StatusBadge tone per notification status. `recurring` reuses `info` — the tone set has no
 * dedicated purple/accent slot, so an inline class override is layered on top to keep the
 * purple accent from the Next.js source's `statusStyles`. */
const statusTones: Record<NotificationStatus, StatusTone> = {
  sent: 'success',
  scheduled: 'info',
  recurring: 'info',
  automated: 'warning',
};

function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <StatusBadge tone={statusTones[status]} className={status === 'recurring' ? 'border-purple-200 bg-purple-50 text-purple-700' : undefined}>
      {statusLabels[status]}
    </StatusBadge>
  );
}

function triggerTypeName(trigger: NotificationTrigger): string {
  if (trigger.type === 'one_time') return trigger.timing === 'scheduled' ? 'Scheduled' : 'Immediate';
  if (trigger.type === 'recurring') return 'Recurring';
  return 'Event-based';
}

const categoryFilterOptions: Array<'all' | NotificationCategory> = ['all', ...categoryOptions.map((option) => option.value)];

function describeAudience(record: NotificationRecord): string {
  const sellerType = record.geo.seller_type;
  const sellerTypeLabel = sellerType ? (sellerTypeOptions.find((option) => option.id === sellerType)?.label ?? 'All') : 'All seller types';
  const vendorIds = record.geo.vendor_ids;
  const vendorLabel = vendorIds.includes(ALL_ID)
    ? 'All vendors'
    : vendorIds
        .map((id) => vendors.find((vendor) => vendor.id === id)?.name)
        .filter((name): name is string => Boolean(name))
        .join(', ') || undefined;
  return vendorLabel ? `${sellerTypeLabel} · ${vendorLabel}` : sellerTypeLabel;
}

function CategoryBadge({ category }: { category: NotificationCategory }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeStyles[category]}`}>
      {categoryLabels[category]}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function NotificationSummary({ record }: { record: NotificationRecord }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={record.category} />
        <NotificationStatusBadge status={record.status} />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900">{record.title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">{record.body}</p>
        {record.ctaLink && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            {record.ctaLink}
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200 border-y border-gray-200">
        <SummaryRow label="Territory" value={describeGeo(record.geo)} />
        <SummaryRow label="Audience" value={describeAudience(record)} />
        <SummaryRow label="Trigger" value={`${triggerTypeName(record.trigger)} — ${describeTrigger(record.trigger)}`} />
        <SummaryRow label="Created" value={formatCreatedAt(record.createdAt)} />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-500">Delivery channels</p>
        <div className="flex flex-wrap gap-2">
          {record.channels.length === 0 ? (
            <span className="text-sm text-gray-500">No channels selected</span>
          ) : (
            record.channels.map((channel) => {
              const Icon = channelIcons[channel];
              return (
                <span
                  key={channel}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {channelLabels[channel]}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsList() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((state) => state.notifications);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | NotificationCategory>('all');
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = notifications.filter((record) => {
      const haystack = `${record.title} ${record.body} ${describeGeo(record.geo)}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesCategory = category === 'all' || record.category === category;
      return matchesSearch && matchesCategory;
    });

    // Newest first; ties break by status so ongoing/upcoming broadcasts surface before
    // already-delivered one-offs.
    return [...filtered].sort((first, second) => {
      const createdDiff = second.createdAt.localeCompare(first.createdAt);
      if (createdDiff !== 0) return createdDiff;
      return statusSortOrder[first.status] - statusSortOrder[second.status];
    });
  }, [notifications, search, category]);

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setPage(1);
  };

  const viewingRecord = notifications.find((record) => record.id === viewingId) ?? null;
  const deletingRecord = notifications.find((record) => record.id === deletingId) ?? null;

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = paginate(filteredNotifications, safePage, pageSize);

  const CreateButton = (
    <Button onClick={() => navigate('/notifications/create')}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Create notification
    </Button>
  );

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Notifications"
        description="Broadcast in-app, push, SMS and WhatsApp notifications to distributors and wholesalers."
        actions={CreateButton}
      />

      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-gray-200 bg-white px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search notifications..."
            aria-label="Search notifications"
            className="h-9 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value as typeof category);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryFilterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'all' ? 'All Categories' : categoryLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Broadcasts you create will appear here. Create one to notify distributors and wholesalers."
            action={CreateButton}
          />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No notifications found"
            description="Try adjusting your search or category filter."
            action={
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <DataTable className="min-w-[1100px]">
            <DataTableHead>
              <DataTableRow noHover>
                <DataTableHeader>Category</DataTableHeader>
                <DataTableHeader>Title &amp; message</DataTableHeader>
                <DataTableHeader>Location target</DataTableHeader>
                <DataTableHeader>Delivery channels</DataTableHeader>
                <DataTableHeader>Trigger type</DataTableHeader>
                <DataTableHeader>Created</DataTableHeader>
                <DataTableHeader align="right">Actions</DataTableHeader>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {pageRows.length === 0 ? (
                <DataTableEmpty colSpan={7}>
                  <EmptyState icon={Search} title="No notifications found" description="Try adjusting your search or category filter." compact />
                </DataTableEmpty>
              ) : (
                pageRows.map((record) => {
                  const TriggerIcon = triggerTypeIcons[record.trigger.type];
                  return (
                    <DataTableRow key={record.id}>
                      <DataTableCell className="align-top">
                        <CategoryBadge category={record.category} />
                      </DataTableCell>
                      <DataTableCell className="max-w-[280px] align-top">
                        <p className="text-sm font-medium text-gray-900">{record.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{record.body}</p>
                      </DataTableCell>
                      <DataTableCell className="max-w-[200px] align-top">
                        <span className="flex items-start gap-1.5 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                          <span className="truncate" title={describeGeo(record.geo)}>
                            {describeGeo(record.geo)}
                          </span>
                        </span>
                      </DataTableCell>
                      <DataTableCell className="align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {record.channels.length === 0 ? (
                            <span className="text-xs text-gray-500">—</span>
                          ) : (
                            record.channels.map((channel) => {
                              const Icon = channelIcons[channel];
                              return (
                                <span
                                  key={channel}
                                  title={channelLabels[channel]}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                                >
                                  <Icon className="h-3 w-3" aria-hidden="true" />
                                  {channelLabels[channel]}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell className="max-w-[220px] align-top">
                        <div className="flex items-start gap-1.5">
                          <TriggerIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{triggerTypeName(record.trigger)}</p>
                            <p className="truncate text-xs text-gray-500" title={describeTrigger(record.trigger)}>
                              {describeTrigger(record.trigger)}
                            </p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap align-top text-xs text-gray-500">
                        {formatRelativeTime(record.createdAt)}
                      </DataTableCell>
                      <DataTableCell className="align-top" align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingId(record.id)}
                            aria-label={`View ${record.title}`}
                            className="h-8 w-8 text-gray-500 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(record.id)}
                            aria-label={`Delete ${record.title}`}
                            className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })
              )}
            </DataTableBody>
          </DataTable>
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <ListPagination
          page={safePage}
          total={filteredNotifications.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="notification"
          className="border-t border-gray-200 px-6"
        />
      )}

      <Dialog open={Boolean(viewingRecord)} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewingRecord?.title ?? 'Notification'}</DialogTitle>
          </DialogHeader>
          {viewingRecord && <NotificationSummary record={viewingRecord} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingRecord)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRecord?.title ?? ''}"? This permanently removes it from your notifications list. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                if (deletingId) deleteNotification(deletingId);
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
