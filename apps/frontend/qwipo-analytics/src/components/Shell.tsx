import { Bell, FileText, LineChart, Settings, Truck } from 'lucide-react';
import { Badge, cn } from '@mockups/ui';
import { digiPages, opsPages, reportPages, titles, type Page } from '../nav';

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
          'type-body flex items-center gap-3 rounded-md px-3 py-2',
          active ? 'bg-primary-soft text-primary-soft-foreground font-medium' : 'text-foreground'
        )}
      >
        {icon}
        {label}
      </div>
      <div className="ml-[30px] mt-1 flex flex-col gap-0.5 border-l border-border pl-2">
        {items.map((it) =>
          it.disabled ? (
            <span key={it.key} className="type-caption px-2.5 py-1 text-foreground-tertiary">
              {it.label}
              <Badge variant="warning" className="ml-1.5 normal-case tracking-normal">
                {it.disabled}
              </Badge>
            </span>
          ) : (
            <button
              key={it.key}
              type="button"
              onClick={() => onNavigate(it.key)}
              className={cn(
                'type-caption rounded-md px-2.5 py-1 text-left hover:bg-primary-soft',
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
  const inDigi = digiPages.some((p) => p.key === page);
  const inOps = opsPages.some((p) => p.key === page);
  return (
    <div className="flex h-dvh bg-background-subtle text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <img src="/qwipo-logo.png" alt="Qwipo" className="h-6 object-contain" />
        </div>
        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <NavGroup icon={<LineChart size={18} />} label="DigiDukaan" active={inDigi} items={digiPages} page={page} onNavigate={onNavigate} />
          <NavGroup icon={<Truck size={18} />} label="Ops (Logistics)" active={inOps} items={opsPages} page={page} onNavigate={onNavigate} />
          <div className="type-micro px-3 pt-2 text-foreground-tertiary">Reports</div>
          <NavGroup icon={<FileText size={18} />} label="Reports" active={!inDigi && !inOps} items={reportPages} page={page} onNavigate={onNavigate} />
          <div className="type-micro px-3 pt-2 text-foreground-tertiary">Administration</div>
          <div className="type-body flex items-center gap-3 px-3 py-2"><Settings size={18} />Settings</div>
        </nav>
        <div className="type-caption border-t border-border px-4 py-3 text-foreground-secondary">Qwipo Analytics · mockup</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="type-h2">{titles[page]}</h1>
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-full text-foreground-secondary">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            </span>
            <span className="flex items-center gap-2">
              <span className="type-caption grid h-8 w-8 place-items-center rounded-full bg-accent font-medium text-primary-foreground">AK</span>
              <span className="leading-tight">
                <span className="type-label block">Anil Kumar</span>
                <span className="type-caption block text-foreground-secondary">Super Admin</span>
              </span>
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
