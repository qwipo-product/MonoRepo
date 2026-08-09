import { useMemo, useState } from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import { Chip } from '@mockups/ui';
import { NOTIFICATIONS, NOTIFICATION_TABS, type AppNotification } from '../data/notifications';

/* Notifications — filterable feed. Chip row filters by category; each card can
   be marked read on tap, or all at once from the header. */
export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<(typeof NOTIFICATION_TABS)[number]['key']>('all');
  const [notifs, setNotifs] = useState<AppNotification[]>(NOTIFICATIONS);

  const unread = notifs.filter((n) => n.unread).length;
  const filtered = useMemo(
    () => (tab === 'all' ? notifs : notifs.filter((n) => n.type === tab)),
    [tab, notifs]
  );

  const markAll = () => setNotifs((list) => list.map((n) => ({ ...n, unread: false })));
  const markRead = (id: string) =>
    setNotifs((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">Notifications</h1>
            <p className="text-xs text-foreground-secondary">{unread} unread</p>
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="shrink-0 text-sm font-semibold text-primary active:scale-[0.98]">
              Mark all read
            </button>
          )}
        </header>

        <div
          role="group"
          aria-label="Filter notifications"
          className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3"
        >
          {NOTIFICATION_TABS.map((t) => (
            <Chip
              key={t.key}
              selected={tab === t.key}
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto bg-background-subtle p-3">
        {filtered.length === 0 ? (
          <div className="pt-16 text-center">
            <div className="text-4xl">🔕</div>
            <div className="mt-2 text-base font-semibold text-foreground">All caught up</div>
            <div className="mt-1 text-sm text-foreground-secondary">No notifications in this category.</div>
          </div>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className="flex w-full gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground-secondary">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{n.title}</span>
                  {n.unread && (
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-foreground-secondary">{n.time}</div>
                <div className="mt-1 text-xs text-foreground-secondary">{n.body}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
