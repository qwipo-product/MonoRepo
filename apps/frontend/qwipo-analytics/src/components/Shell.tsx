import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Bell, FileText, LineChart, PanelLeftClose, PanelLeftOpen, Settings, Truck, UsersRound } from 'lucide-react';
import { Badge, cn } from '@mockups/ui';
import { buyerPages, digiPages, opsPages, reportSections, titles, type Page } from '../nav';
import { reportDefs } from '../data/reports';
import { BOARDS } from '../buyerapp/boards';

interface Props {
  page: Page;
  /** second hash segment — picks the Reports section */
  drill?: string;
  onNavigate: (p: string) => void;
  children: React.ReactNode;
}

/** Reports → "Buyer app analytics" dropdown: every board lives here, not on the page. */
function AnalyticsMenu({ drill, onNavigate }: { drill?: string; onNavigate: (p: string) => void }) {
  const inside = !!drill?.startsWith('analytics');
  const board = inside ? drill!.split(':')[1] ?? 'overview' : '';
  const [open, setOpen] = useState(inside);
  const [screensOpen, setScreensOpen] = useState(inside && BOARDS.some((b) => b.path === `/${board}`));
  const go = (b: string) => onNavigate(`reports/analytics:${b}`);
  const leaf = (key: string, label: string, indent = false) => (
    <button
      key={key}
      type="button"
      onClick={() => go(key)}
      className={cn(
        'type-caption rounded-md py-1 pr-2.5 text-left hover:bg-primary-soft',
        indent ? 'pl-5' : 'pl-2.5',
        inside && board === key ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'text-foreground-secondary',
      )}
    >
      {label}
    </button>
  );
  const head = (label: string, isOpen: boolean, toggle: () => void, active: boolean) => (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={isOpen}
      className={cn(
        'type-caption flex items-center justify-between rounded-md px-2.5 py-1 text-left hover:bg-primary-soft',
        active ? 'font-medium text-primary-soft-foreground' : 'text-foreground-secondary',
      )}
    >
      {label}
      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
    </button>
  );
  return (
    <>
      {head('Buyer app analytics', open, () => setOpen((v) => !v), inside)}
      {open && (
        <div className="ml-2.5 flex flex-col gap-0.5 border-l border-border pl-1.5">
          {leaf('overview', 'Overview')}
          {head('App screens', screensOpen, () => setScreensOpen((v) => !v), BOARDS.some((b) => inside && b.path === `/${board}`))}
          {screensOpen && BOARDS.map((b) => leaf(b.path.slice(1), b.title, true))}
          {leaf('funnels', 'Funnels')}
          {leaf('recordings', 'Session recordings')}
        </div>
      )}
    </>
  );
}

function NavGroup({
  icon, label, active, items, isActive, onNavigate, extra,
}: {
  icon: React.ReactNode; label: string; active: boolean;
  items: { key: string; label: string; disabled?: string }[];
  isActive: (key: string) => boolean; onNavigate: (p: string) => void; extra?: React.ReactNode;
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
                isActive(it.key) ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'text-foreground-secondary'
              )}
            >
              {it.label}
            </button>
          )
        )}
        {extra}
      </div>
    </div>
  );
}

export function Shell({ page, drill, onNavigate, children }: Props) {
  const inDigi = digiPages.some((p) => p.key === page);
  const inOps = opsPages.some((p) => p.key === page);
  const inBuyer = buyerPages.some((p) => p.key === page);
  const isPage = (k: string) => page === k;
  // Reports section: explicit in the hash, else seller (a run: drill resolves inside Reports).
  const section = drill?.startsWith('run:')
    ? reportDefs.find((d) => d.key === drill.slice(4).split(':')[0])?.domain ?? 'seller'
    : drill?.startsWith('analytics') ? 'buyer'
    : reportSections.some((s) => s.key === drill) ? drill : 'seller';
  const [collapsed, setCollapsed] = useState(false);
  const rail = [
    { icon: <LineChart size={18} />, label: 'DigiDukaan · Seller', active: inDigi },
    { icon: <Truck size={18} />, label: 'Ops (Logistics)', active: inOps },
    { icon: <UsersRound size={18} />, label: 'DigiDukaan · Buyer', active: inBuyer },
    { icon: <FileText size={18} />, label: 'Reports', active: page === 'reports' },
    { icon: <Settings size={18} />, label: 'Settings', active: false },
  ];
  return (
    <div className="flex h-dvh bg-background-subtle text-foreground">
      <aside className={cn('flex shrink-0 flex-col border-r border-border bg-card transition-all', collapsed ? 'w-14' : 'w-56')}>
        <div className={cn('flex h-14 items-center border-b border-border', collapsed ? 'justify-center' : 'justify-between px-4')}>
          {!collapsed && <img src="/qwipo-logo.png" alt="Qwipo" className="h-6 object-contain" />}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {collapsed ? (
          <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto p-2">
            {rail.map((r) => (
              <button
                key={r.label}
                type="button"
                title={r.label}
                onClick={() => setCollapsed(false)}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-md hover:bg-muted',
                  r.active ? 'bg-primary-soft text-primary-soft-foreground' : 'text-foreground-secondary',
                )}
              >
                {r.icon}
              </button>
            ))}
          </nav>
        ) : (
          <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <NavGroup icon={<LineChart size={18} />} label="DigiDukaan · Seller" active={inDigi} items={digiPages} isActive={isPage} onNavigate={onNavigate} />
            <NavGroup icon={<Truck size={18} />} label="Ops (Logistics)" active={inOps} items={opsPages} isActive={isPage} onNavigate={onNavigate} />
            <NavGroup icon={<UsersRound size={18} />} label="DigiDukaan · Buyer" active={inBuyer} items={buyerPages} isActive={isPage} onNavigate={onNavigate} />
            <NavGroup
              icon={<FileText size={18} />} label="Reports" active={page === 'reports'}
              items={reportSections.map((s) => ({ key: `reports/${s.key}`, label: s.label }))}
              extra={<AnalyticsMenu drill={drill} onNavigate={onNavigate} />}
              isActive={(k) => page === 'reports' && !drill?.startsWith('analytics') && k === `reports/${section}`}
              onNavigate={onNavigate}
            />
            <div className="type-micro px-3 pt-2 text-foreground-tertiary">Administration</div>
            <div className="type-body flex items-center gap-3 px-3 py-2"><Settings size={18} />Settings</div>
          </nav>
        )}
        {!collapsed && <div className="type-caption border-t border-border px-4 py-3 text-foreground-secondary">Qwipo Analytics · mockup</div>}
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
