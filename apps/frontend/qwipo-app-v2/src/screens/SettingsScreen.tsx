import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { Switch, useTheme } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';

/* Account · Settings — appearance (dark mode → theme), notification
   preferences (toggles), and general (language). */

const NOTIF_ROWS = [
  { key: 'orderUpdates', title: 'Order updates', sub: 'Dispatch, delivery, delays' },
  { key: 'promotions', title: 'Promotions & offers', sub: 'Distributor and brand offers' },
  { key: 'stockAlerts', title: 'Stock alerts', sub: 'When favourite SKUs are restocked' },
  { key: 'priceDrops', title: 'Price drops', sub: 'Alerts when prices fall on saved items' },
  { key: 'creditReminders', title: 'Credit reminders', sub: 'Due date and limit alerts' },
  { key: 'weeklyDigest', title: 'Weekly digest', sub: 'Summary of your savings and orders' },
] as const;

type PrefKey = (typeof NOTIF_ROWS)[number]['key'];

export function SettingsScreen({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (id: ScreenId) => void;
}) {
  const { isDark, toggleTheme } = useTheme();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    orderUpdates: true,
    promotions: true,
    stockAlerts: true,
    priceDrops: false,
    creditReminders: true,
    weeklyDigest: false,
  });

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Settings</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto bg-background-subtle p-4">
        <Section title="Appearance">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <SettingRow
              icon={<Moon className="h-5 w-5 text-foreground-secondary" />}
              title="Dark mode"
              sub="Switch the whole app theme"
              control={<Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="Dark mode" />}
            />
          </div>
        </Section>

        <Section title="Notification preferences">
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {NOTIF_ROWS.map((r) => (
              <SettingRow
                key={r.key}
                title={r.title}
                sub={r.sub}
                control={
                  <Switch
                    checked={prefs[r.key]}
                    onCheckedChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))}
                    aria-label={r.title}
                  />
                }
              />
            ))}
          </div>
        </Section>

        <Section title="General">
          <button
            onClick={() => onNavigate('sub:language')}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 text-left shadow-sm active:scale-[0.99]"
          >
            <span className="flex-1 text-sm font-medium text-foreground">Language</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SettingRow({
  icon,
  title,
  sub,
  control,
}: {
  icon?: ReactNode;
  title: string;
  sub: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-foreground-secondary">{sub}</div>
      </div>
      {control}
    </div>
  );
}
