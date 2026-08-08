import { useState } from 'react';
import { Bell } from 'lucide-react';
import { notifications as initial } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';

const TABS = [{ key: 'all', label: 'All' }, { key: 'order', label: 'Orders' }, { key: 'promo', label: 'Offers' }, { key: 'stock', label: 'Stock' }, { key: 'system', label: 'System' }];

export default function NotificationsScreen({ onBack }: any) {
  const [tab, setTab] = useState('all');
  const [notifs, setNotifs] = useState(initial as any[]);
  const filtered = tab === 'all' ? notifs : notifs.filter((n) => n.type === tab);
  const unread = notifs.filter((n) => n.unread).length;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader
          title="Notifications"
          subtitle={`${unread} unread`}
          onBack={onBack}
          right={unread > 0 ? <button onClick={() => setNotifs(notifs.map((n) => ({ ...n, unread: false })))} className="text-sm font-medium text-primary">Mark all read</button> : undefined}
        />
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${tab === t.key ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {filtered.map((n) => (
          <button key={n.id} onClick={() => setNotifs(notifs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))} className={`flex w-full gap-3 rounded-xl border p-3 text-left shadow-sm ${n.unread ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Bell className="h-4.5 w-4.5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                {n.unread && <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary-foreground">New</span>}
              </div>
              <div className="text-[11px] text-muted-foreground">{n.time}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="pt-16 text-center">
            <div className="text-4xl">🔕</div>
            <div className="mt-2 text-base font-semibold">All caught up</div>
            <div className="mt-1 text-sm text-muted-foreground">No notifications in this category.</div>
          </div>
        )}
      </div>
    </div>
  );
}
