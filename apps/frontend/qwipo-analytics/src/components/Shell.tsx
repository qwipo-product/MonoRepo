import { Bell, FileText, LineChart, Settings } from 'lucide-react';
import { cn } from '@mockups/ui';
import { analyticsPages, reportPages, titles, type Page } from '../nav';

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  children: React.ReactNode;
}

function NavGroup({
  icon, label, active, items, page, onNavigate,
}: {
  icon: React.ReactNode; label: string; active: boolean;
  items: { key: Page; label: string; disabled?: string }[];
  page: Page; onNavigate: (p: Page) => void;
}) {
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
          active ? 'bg-primary-soft text-primary-soft-foreground font-medium' : 'text-foreground'
        )}
      >
        {icon}
        {label}
      </div>
      <div className="ml-[30px] mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
        {items.map((it) =>
          it.disabled ? (
            <span key={it.key} className="px-2.5 py-1 text-[13px] text-foreground-tertiary">
              {it.label}
              <span className="ml-1.5 rounded border border-warning-border bg-warning-subtle px-1 text-[10px] text-warning-foreground">
                {it.disabled}
              </span>
            </span>
          ) : (
            <button
              key={it.key}
              type="button"
              onClick={() => onNavigate(it.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-left text-[13px] hover:bg-primary-soft',
                page === it.key ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'text-foreground-secondary'
              )}
            >
              {it.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function Shell({ page, onNavigate, children }: Props) {
  const inAnalytics = !['reports', 'history'].includes(page);
  return (
    <div className="flex h-dvh bg-background-subtle text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <img src="/qwipo-logo.png" alt="Qwipo" className="h-6 object-contain" />
        </div>
        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">Analytics</div>
          <NavGroup icon={<LineChart size={18} />} label="Analytics" active={inAnalytics} items={analyticsPages} page={page} onNavigate={onNavigate} />
          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">Reports</div>
          <NavGroup icon={<FileText size={18} />} label="Reports" active={!inAnalytics} items={reportPages} page={page} onNavigate={onNavigate} />
          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">Administration</div>
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-foreground"><Settings size={18} />Settings</div>
        </nav>
        <div className="border-t border-border px-4 py-3 text-xs text-foreground-secondary">DigiDukaan Analytics · mockup</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-lg font-semibold">{titles[page]}</h1>
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-full text-foreground-secondary">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            </span>
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-medium text-white">AK</span>
              <span className="leading-tight">
                <span className="block text-sm font-medium">Anil Kumar</span>
                <span className="block text-xs text-foreground-secondary">Super Admin</span>
              </span>
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
