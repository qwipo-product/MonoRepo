import { useState } from 'react';
import { Building2, ChevronRight, MapPin, Search, Users } from 'lucide-react';
import { Badge, Chip, EmptyState, Input } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import type { SellerCustomer } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { InfoBlock, InfoPair, InfoRow } from '../components/InfoBlock';
import { BeatRow, MobileRow } from '../components/DeliveryPanel';

type CustomerFilter = 'all' | 'blocked';

const primaryAddress = (c: SellerCustomer) => c.addresses.find((a) => a.primary) ?? c.addresses[0];
const blockedCount = (c: SellerCustomer) => c.companies.filter((co) => co.status === 'BLOCKED').length;

/* Customers — the shops that buy from this distributor. Each card leads with
   what delivery needs: the beat, the area and the mobile number. */
export function CustomersScreen({ customers, onOpen }: { customers: SellerCustomer[]; onOpen: (customerId: string) => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');

  const q = query.trim().toLowerCase();
  const matches = (c: SellerCustomer) => {
    if (!q) return true;
    const a = primaryAddress(c);
    return [
      c.storeName,
      c.ownerName,
      c.mobile,
      a?.area,
      a?.pincode,
      ...(a?.serviceability.map((s) => s.beat) ?? []),
    ].some((v) => v?.toLowerCase().includes(q));
  };
  const inFilter = (c: SellerCustomer) => filter === 'all' || blockedCount(c) > 0;
  const shown = customers.filter((c) => inFilter(c) && matches(c));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.customers.title')} />

      <div className="space-y-2 border-b border-border bg-card px-3 pb-3 pt-2">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('seller.customers.search')}
            aria-label={t('seller.customers.search')}
            className="pl-9"
          />
        </label>
        <div className="flex gap-2">
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
            {t('seller.customers.filter.all')} ({customers.length})
          </Chip>
          <Chip selected={filter === 'blocked'} onClick={() => setFilter('blocked')}>
            {t('seller.customers.filter.blocked')} ({customers.filter((c) => blockedCount(c) > 0).length})
          </Chip>
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {shown.length === 0 ? (
          <EmptyState
            icon={<Users strokeWidth={1.75} />}
            title={customers.length === 0 ? t('seller.customers.empty') : t('seller.customers.no_match')}
            description={customers.length === 0 ? t('seller.customers.empty_help') : undefined}
          />
        ) : (
          shown.map((c) => <CustomerCard key={c.customerId} customer={c} onOpen={() => onOpen(c.customerId)} />)
        )}
      </div>
    </div>
  );
}

function CustomerCard({ customer: c, onOpen }: { customer: SellerCustomer; onOpen: () => void }) {
  const { t } = useI18n();
  const a = primaryAddress(c);
  const blocked = blockedCount(c);
  const companies = c.companies.length;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <button onClick={onOpen} className="flex w-full items-start gap-2 text-left active:scale-[0.99]">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{c.storeName}</span>
          <span className="block text-xs text-foreground-secondary">{c.ownerName}</span>
        </span>
        <ChevronRight size={18} className="mt-0.5 shrink-0 text-foreground-secondary" />
      </button>

      <div className="mt-2">
        <InfoBlock>
          <InfoPair>
            <BeatRow beat={a?.serviceability[0]?.beat ?? null} />
            <InfoRow
              icon={<MapPin size={14} className="text-primary" />}
              label={t('seller.detail.area')}
              value={a ? `${a.area} · ${a.pincode}` : '—'}
            />
          </InfoPair>
          <InfoPair>
            <MobileRow mobile={c.mobile} />
            <InfoRow
              icon={<Building2 size={14} className="text-primary" />}
              label={t('seller.customers.companies')}
              value={companies === 1 ? t('seller.customers.companies_one') : t('seller.customers.companies_n').replace('{n}', String(companies))}
            />
          </InfoPair>
        </InfoBlock>
      </div>

      {blocked > 0 && (
        <Badge variant="danger" className="mt-2">
          {blocked === 1 ? t('seller.customers.blocked_one') : t('seller.customers.blocked_many').replace('{n}', String(blocked))}
        </Badge>
      )}
    </div>
  );
}
