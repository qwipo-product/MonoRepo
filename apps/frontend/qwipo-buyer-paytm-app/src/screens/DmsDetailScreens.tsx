import type { ReactNode } from 'react';
import { ChevronLeft, MapPin, Truck, Building2, Info } from 'lucide-react';
import { Button } from '@mockups/ui';
import { companyDistributors, type DmsCompany, type DmsDistributor, type DmsStatus } from '../data/dmsPartners';
import { DmsStatusPill } from './DmsPartnersScreen';

/* Detail pages between the Register to Order list and the registration form:
   – Company page (ITC): who you're registering with + the authorised
     distributors serving your area, each with its address (info only).
   – Distributor page (Balaji Enterprises): the distributor's profile and the
     companies / brands they supply; register with them directly. */

function DetailHeader({ title, subtitle, emoji, onBack }: { title: string; subtitle: string; emoji: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
      <button
        onClick={onBack}
        aria-label="Back"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
        <p className="truncate text-xs text-foreground-secondary">{subtitle}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-xl">
        {emoji}
      </span>
    </header>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-secondary" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-foreground-secondary">{label}</div>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

/** Full distributor info — address, contact, beat, delivery, MOV. */
function DistributorInfo({ d }: { d: DmsDistributor }) {
  return (
    <InfoRow icon={MapPin} label="Address">
      {d.address}
    </InfoRow>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
  );
}

export function DmsCompanyScreen({
  company,
  status,
  onBack,
  onRegister,
}: {
  company: DmsCompany;
  status: DmsStatus;
  onBack: () => void;
  onRegister: () => void;
}) {
  const dists = companyDistributors(company);
  return (
    <div className="flex h-full flex-col">
      <DetailHeader
        title={company.company}
        subtitle={`${company.products} products · ${company.brands.join(', ')}`}
        emoji={company.emoji}
        onBack={onBack}
      />
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        <div className="rounded-lg border border-primary/30 bg-primary-soft p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" /> Registering with {company.company}
            </span>
            {status !== 'none' && <DmsStatusPill status={status} />}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
            One registration with {company.company} unlocks its full catalogue. Orders are fulfilled by
            its authorised distributors below.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Authorised distributors in your area ({dists.length})
          </h2>
          <div className="space-y-3">
            {dists.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-xl">
                    {d.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{d.name}</div>
                    <div className="text-xs text-foreground-secondary">
                      {d.products} products · {d.distanceKm} km
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <DistributorInfo d={d} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {dists.length > 1 && (
          <p className="flex gap-2 text-xs leading-relaxed text-foreground-secondary">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {company.company} assigns your shop to the distributor that covers your address.
          </p>
        )}
      </div>
      <Footer>
        <Button size="lg" className="w-full" onClick={onRegister}>
          {status === 'none'
            ? `Register with ${company.company}`
            : status === 'rejected'
              ? 'View Rejection & Re-apply'
              : 'View Registration Status'}
        </Button>
      </Footer>
    </div>
  );
}

export function DmsDistributorScreen({
  distributor: d,
  status,
  onBack,
  onRegister,
}: {
  distributor: DmsDistributor;
  status: DmsStatus;
  onBack: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <DetailHeader
        title={d.name}
        subtitle={`Distributor for ${d.serves.join(', ')}`}
        emoji={d.emoji}
        onBack={onBack}
      />
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        <div className="rounded-lg border border-primary/30 bg-primary-soft p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="h-4 w-4 text-primary" /> Registering with {d.name}
            </span>
            {status !== 'none' && <DmsStatusPill status={status} />}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
            {d.name} runs its own customer system. Once they approve your shop you can order their
            full range on Qwipo.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Companies supplied</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.serves.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-soft-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <h3 className="mt-4 text-xs font-medium text-foreground-secondary">
            Brands · {d.products} products
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.brands.map((b) => (
              <span key={b} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground-secondary">
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Distributor details</h2>
          <DistributorInfo d={d} />
        </div>
      </div>
      <Footer>
        <Button size="lg" className="w-full" onClick={onRegister}>
          {status === 'none'
            ? `Register with ${d.name}`
            : status === 'rejected'
              ? 'View Rejection & Re-apply'
              : 'View Registration Status'}
        </Button>
      </Footer>
    </div>
  );
}
