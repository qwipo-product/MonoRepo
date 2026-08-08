import { UserCircle, ChevronRight, Briefcase, CreditCard, Users, Bell, LogOut } from 'lucide-react';
import { customer, notifications } from '../data';

/* Account hub — person row, menu (orders / payments / credit / notifications),
   footer links (contact, terms, logout). Parity port. */
export default function ProfileScreen({ onOpenSubPage, onOpenNotifications, onSignOut }: any) {
  const unread = (notifications as any[]).filter((n) => n.unread).length;
  const menu = [
    { icon: Briefcase, label: 'My Orders', go: () => onOpenSubPage('my-orders') },
    { icon: CreditCard, label: 'Payments', go: () => onOpenSubPage('sub:payment') },
    { icon: Users, label: 'Credit Partners', go: () => onOpenSubPage('sub:credit') },
    { icon: Bell, label: 'Notifications', badge: unread, go: onOpenNotifications },
  ];

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <div className="flex h-14 items-center px-4">
          <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="h-6" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <button onClick={() => onOpenSubPage('sub:business-details')} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <UserCircle className="h-8 w-8 text-primary" />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold">{(customer as any).name}</span>
            <span className="block text-xs text-muted-foreground">{(customer as any).phone}</span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {menu.map(({ icon: Icon, label, badge, go }, i) => (
            <button key={label} onClick={go} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-border' : ''}`}>
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">{badge}</span> : null}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <button onClick={() => onOpenSubPage('sub:help')} className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium shadow-sm">Contact Us</button>
          <button onClick={() => onOpenSubPage('sub:terms')} className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium shadow-sm">Terms and Conditions</button>
          <button onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-destructive shadow-sm"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </div>
  );
}
