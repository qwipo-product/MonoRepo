import { ChevronLeft, Phone } from 'lucide-react';

/* Account · Terms & Conditions — numbered policy sections + support contact. */

const TERMS = [
  { title: '1. Acceptance', body: 'By using the Qwipo platform you agree to these terms and our privacy policy.' },
  { title: '2. Orders & Delivery', body: 'Orders are subject to seller minimum order value and stock. Delivery windows are indicative.' },
  { title: '3. Pricing', body: 'Prices are set by sellers and may change without notice. Taxes apply as per GST rules.' },
  { title: '4. Cancellations', body: 'Orders may be cancelled before the seller confirms dispatch. Refunds follow our policy.' },
  { title: '5. Liability', body: 'Qwipo connects buyers and sellers and is not liable for seller-side quality disputes.' },
];

const SUPPORT_PHONE = '+91 9121222836';

export function TermsScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Terms &amp; Conditions</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        <img src="./brand/qwipo-logo.svg" alt="Qwipo" className="h-7 dark:hidden" />
        <img src="./brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="hidden h-7 dark:block" />

        {TERMS.map((t) => (
          <section key={t.title} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{t.body}</p>
          </section>
        ))}

        <a
          href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
          aria-label={`Call Qwipo support at ${SUPPORT_PHONE}`}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground shadow-sm active:scale-[0.99]"
        >
          <Phone className="h-4 w-4 shrink-0 text-foreground-secondary" />
          {SUPPORT_PHONE}
        </a>

        <div className="pt-1 text-center text-xs text-foreground-tertiary">© Qwipo · B2B Commerce</div>
      </div>
    </div>
  );
}
