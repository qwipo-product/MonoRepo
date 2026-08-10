import {
  ChevronRight,
  Briefcase,
  MapPin,
  CreditCard,
  Users,
  Bell,
  Settings,
  Languages,
  LifeBuoy,
  FileText,
  LogOut,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Repeat,
  Phone,
} from 'lucide-react';
import type { ScreenId } from '../review/screenIndex';
import { SALESPERSON } from '../data/salesperson';

/* My Account — the account hub. Profile card → Business Details, then grouped
   menu cards linking every account sub-page, and Logout. */

const PROFILE = {
  name: 'Rajesh Kumar',
  phone: '9876543210',
  business: 'Sri Venkateswara Kirana Store',
};

type Item = { icon: typeof Briefcase; label: string; to: ScreenId; badge?: number };

const ACCOUNT: Item[] = [
  { icon: Briefcase, label: 'My Orders', to: 'my-orders' },
  { icon: MapPin, label: 'Saved Addresses', to: 'sub:addresses' },
  { icon: CreditCard, label: 'Payments', to: 'sub:payment' },
  { icon: Users, label: 'Credit Partners', to: 'sub:credit' },
];

const PREFERENCES: Item[] = [
  { icon: Bell, label: 'Notifications', to: 'notifications', badge: 6 },
  { icon: Settings, label: 'Settings', to: 'settings' },
  { icon: Languages, label: 'Language', to: 'sub:language' },
];

const SUPPORT: Item[] = [
  { icon: LifeBuoy, label: 'Contact Us', to: 'sub:help' },
  { icon: FileText, label: 'Terms and Conditions', to: 'sub:terms' },
];

// Shown only to the salesperson persona — the beat-day features.
const SP_MENU: Item[] = [
  { icon: CalendarCheck, label: 'Attendance', to: 'sp:attendance' },
  { icon: ClipboardList, label: 'Tasks', to: 'sp:tasks' },
  { icon: Users, label: 'Customers', to: 'sp:customers' },
  { icon: TrendingUp, label: 'Performance', to: 'sp:performance' },
  { icon: ShoppingBag, label: 'Customer Orders', to: 'sp:orders' },
  { icon: Repeat, label: 'Switch Customer', to: 'sp:switch-customer' },
];

export function MyAccountScreen({
  onNavigate,
  onSignOut,
  salesperson = false,
}: {
  onNavigate: (id: ScreenId) => void;
  onSignOut: () => void;
  /** Salesperson persona → surface the Salesperson feature group. */
  salesperson?: boolean;
}) {
  const initials = PROFILE.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
        <h1 className="sr-only">My Account</h1>
        <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="h-6 dark:hidden" />
        <img src="/brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="hidden h-6 dark:block" />
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* profile — salesperson identity (with lead/manager) or customer */}
        {salesperson ? (
          <SalespersonProfile />
        ) : (
          <button
            onClick={() => onNavigate('sub:business-details')}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {initials}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-1">
                <span className="truncate text-sm font-semibold text-foreground">{PROFILE.name}</span>
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              </span>
              <span className="block truncate text-xs text-foreground-secondary">{PROFILE.phone}</span>
              <span className="block truncate text-xs text-foreground-secondary">{PROFILE.business}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
          </button>
        )}

        {salesperson && <MenuGroup title="Salesperson" items={SP_MENU} onNavigate={onNavigate} />}
        <MenuGroup title="Account" items={ACCOUNT} onNavigate={onNavigate} />
        <MenuGroup title="Preferences" items={PREFERENCES} onNavigate={onNavigate} />
        <MenuGroup title="Support" items={SUPPORT} onNavigate={onNavigate} />

        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-3.5 text-sm font-semibold text-error shadow-sm active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>

        <div className="pb-2 text-center text-[11px] text-foreground-tertiary">Qwipo · v2.0.0</div>
      </div>
    </div>
  );
}

function SalespersonProfile() {
  const sp = SALESPERSON;
  const initials = sp.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-foreground">{sp.name}</span>
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <div className="truncate text-xs text-foreground-secondary">{sp.code} · {sp.area}</div>
          <div className="truncate text-xs text-foreground-secondary">{sp.mobile}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <Contact role="Sales Lead" name={sp.salesLead.name} mobile={sp.salesLead.mobile} />
        <Contact role="Sales Manager" name={sp.salesManager.name} mobile={sp.salesManager.mobile} />
      </div>
    </div>
  );
}

function Contact({ role, name, mobile }: { role: string; name: string; mobile: string }) {
  return (
    <a href={`tel:${mobile}`} className="flex items-center gap-2 rounded-md bg-background-subtle p-2 active:scale-[0.98]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary">
        <Phone className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wider text-foreground-secondary">{role}</span>
        <span className="block truncate text-xs font-medium text-foreground">{name}</span>
      </span>
    </a>
  );
}

function MenuGroup({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: Item[];
  onNavigate: (id: ScreenId) => void;
}) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {items.map(({ icon: Icon, label, to, badge }) => (
          <button
            key={label}
            onClick={() => onNavigate(to)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
          >
            <Icon className="h-5 w-5 shrink-0 text-foreground-secondary" />
            <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
            {badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[11px] font-semibold text-white">
                {badge}
              </span>
            ) : null}
            <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
          </button>
        ))}
      </div>
    </section>
  );
}
