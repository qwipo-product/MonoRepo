import { ChevronLeft, Clock, Mail, Phone, MapPin } from 'lucide-react';
import { CustomerCareCard } from '../components/CustomerCareCard';

/* Account · Contact Us — support details + the shop's business advisor. */

const CONTACT = [
  { icon: <Clock className="h-4 w-4" />, label: 'Office Timing', value: '09:00 AM to 6:00 PM · IST' },
  { icon: <Mail className="h-4 w-4" />, label: 'Email Address', value: 'info@qwipo.com' },
];

const ADVISOR = { name: 'Vinodkumar Musku', phone: '9100466765' };

export function ContactUsScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Contact Us</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        <div className="text-center">
          <p className="text-sm text-foreground-secondary">If you have any query or need any further help</p>
          <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="mx-auto mt-3 h-7 dark:hidden" />
          <img src="/brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="mx-auto mt-3 hidden h-7 dark:block" />
        </div>

        {/* Customer care leads: it sits above the timings and the address
            rather than inside that list. */}
        <CustomerCareCard />

        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {CONTACT.map((c) => (
            <div key={c.label} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground-secondary">
                {c.icon}
              </span>
              <div className="min-w-0">
                <div className="text-xs text-foreground-secondary">{c.label}</div>
                <div className="text-sm font-medium text-foreground">{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Your Business Advisor</h2>
          <div className="mt-2.5 flex items-center gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-foreground-secondary" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{ADVISOR.name}</div>
              <div className="text-xs text-foreground-secondary">{ADVISOR.phone}</div>
            </div>
            <a
              href={`tel:${ADVISOR.phone}`}
              aria-label={`Call ${ADVISOR.name}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
