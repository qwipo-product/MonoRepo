import { useState } from 'react';
import { Mail, Map, MapPin, MessageCircle, Phone, Route, Share2 } from 'lucide-react';
import { Badge, Button, InlineMessage, Sheet, cn } from '@mockups/ui';
import { OrderListCard } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerCustomer, SellerCustomerCompany, SellerOrder } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { InfoBlock, InfoRow } from '../components/InfoBlock';
import { MobileRow } from '../components/DeliveryPanel';
import { orderTotal } from '../orders';
import { customerShareText, shareToWhatsApp } from '../share';

/** "14 Mar 2026" */
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fullAddress = (a: SellerCustomer['addresses'][number]) => `${a.line}, ${a.area}, ${a.city}, ${a.state} ${a.pincode}`;

/* One customer. Where the goods go comes first: pick an address (the
   portal's address chips), see it in full, open its exact spot in Maps, and
   which company's beat delivers there. Then the companies they buy, with
   Block / Unblock as in the portal; then their recent orders. */
export function CustomerDetailScreen({
  customer: c,
  orders,
  onBack,
  onOpenOrder,
  onSetCompanyStatus,
  onToast,
}: {
  customer: SellerCustomer;
  orders: SellerOrder[];
  onBack: () => void;
  onOpenOrder: (orderId: string) => void;
  onSetCompanyStatus: (company: string, status: 'ACTIVE' | 'BLOCKED') => void;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const [target, setTarget] = useState<SellerCustomerCompany | null>(null);
  const [addrIdx, setAddrIdx] = useState(() => Math.max(0, c.addresses.findIndex((x) => x.primary)));
  const a = c.addresses[addrIdx] ?? c.addresses[0];
  const located = !!a && a.lat !== null && a.lng !== null;
  const blockedN = c.companies.filter((co) => co.status === 'BLOCKED').length;
  const overall = blockedN === 0 ? 'active' : blockedN === c.companies.length ? 'blocked' : 'partly';
  const mapsUrl = !a
    ? ''
    : located
      ? `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(a))}`;
  const theirOrders = orders
    .filter((o) => o.buyer.mobile === c.mobile)
    .sort((x, y) => y.placedAt.localeCompare(x.placedAt));

  const blocking = target?.status === 'ACTIVE';
  const fill = (key: string) => t(key).replace('{company}', target?.name ?? '');
  const confirm = () => {
    if (!target) return;
    onSetCompanyStatus(target.name, blocking ? 'BLOCKED' : 'ACTIVE');
    onToast(fill(blocking ? 'seller.customer.blocked_toast' : 'seller.customer.unblocked_toast'));
    setTarget(null);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={c.storeName} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {/* Who and where */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-bold leading-snug">{c.storeName}</div>
              <div className="mt-0.5 text-xs text-foreground-secondary">
                {t('seller.customer.owner')}: {c.ownerName}
              </div>
            </div>
            <Badge variant={overall === 'active' ? 'success' : overall === 'blocked' ? 'danger' : 'warning'} className="shrink-0">
              {t(`seller.customer.overall.${overall}`)}
            </Badge>
          </div>

          {/* One chip per address — the selected one drives the block below and "Delivery at". */}
          {c.addresses.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {c.addresses.map((x, i) => (
                <button
                  key={`${x.label}-${i}`}
                  onClick={() => setAddrIdx(i)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                    i === addrIdx ? 'border-primary bg-primary-soft text-primary-soft-foreground' : 'border-border bg-card text-foreground'
                  )}
                >
                  {x.label}
                  {x.primary && <Badge variant="info">{t('seller.customer.primary')}</Badge>}
                </button>
              ))}
            </div>
          )}

          <InfoBlock>
            {a && (
              <InfoRow
                icon={<MapPin size={14} className="text-primary" />}
                label={c.addresses.length > 1 ? `${t('seller.detail.address')} · ${a.label}` : t('seller.detail.address')}
                value={fullAddress(a)}
              />
            )}
            <MobileRow mobile={c.mobile} />
            {c.email && (
              <InfoRow icon={<Mail size={14} className="text-primary" />} label={t('seller.customer.email')} value={c.email} href={`mailto:${c.email}`} />
            )}
          </InfoBlock>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = `tel:${c.mobile}`)}>
              <Phone size={15} />
              {t('seller.detail.call')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(`https://wa.me/91${c.mobile}`, '_blank')}>
              <MessageCircle size={15} />
              {t('seller.customer.whatsapp')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!a}
              onClick={() => a && window.open(mapsUrl, '_blank')}
            >
              <Map size={15} />
              {t('seller.customer.maps')}
            </Button>
            {/* The selected address, as a WhatsApp message for a delivery agent. */}
            <Button variant="outlinePrimary" size="sm" disabled={!a} onClick={() => a && shareToWhatsApp(customerShareText(c, a, t))}>
              <Share2 size={15} />
              {t('seller.share.location')}
            </Button>
          </div>
        </section>

        {/* Delivery at the selected address — which company's beat serves it */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">
            {t('seller.customer.delivery_at').replace('{label}', a?.label ?? '')}
          </div>
          {!a ? null : !located ? (
            <div className="p-3">
              <InlineMessage variant="warning" title={t('seller.customer.no_location_title')} description={t('seller.customer.no_location')} />
            </div>
          ) : (
            <>
              {a.serviceability.length > 0 ? (
                <ul className="divide-y divide-border">
                  {a.serviceability.map((s) => (
                    <li key={`${s.company}-${s.beat}`} className={cn('flex gap-2 p-3', s.blocked && 'opacity-75')}>
                      <Route size={16} className="mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{s.beat}</span>
                          {s.blocked && <Badge variant="danger">{t('seller.customer.blocked')}</Badge>}
                        </div>
                        <div className="text-xs text-foreground-secondary">{s.company}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {s.days.map((d) => (
                            <Badge key={d} variant="info">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3">
                  <InlineMessage variant="warning" title={t('seller.customer.no_beat')} description={t('seller.customer.no_company_delivers')} />
                </div>
              )}
              {a.notServedBy.length > 0 && (
                <p className="border-t border-border px-3 py-2.5 text-xs text-foreground-secondary">
                  {t('seller.customer.not_served').replace('{companies}', a.notServedBy.join(', '))}
                </p>
              )}
            </>
          )}
        </section>

        {/* Companies with Block / Unblock */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">{t('seller.customer.companies')}</div>
          <ul className="divide-y divide-border">
            {c.companies.map((co) => (
              <li key={co.name} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{co.name}</span>
                    <Badge variant={co.status === 'ACTIVE' ? 'success' : 'danger'} className="shrink-0">
                      {t(co.status === 'ACTIVE' ? 'seller.customer.active' : 'seller.customer.blocked')}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-foreground-secondary">
                    {t('seller.customer.registered').replace('{date}', formatDate(co.registeredOn))}
                  </div>
                </div>
                <Button size="sm" variant={co.status === 'ACTIVE' ? 'secondary' : 'outlinePrimary'} className="shrink-0" onClick={() => setTarget(co)}>
                  {t(co.status === 'ACTIVE' ? 'seller.customer.block' : 'seller.customer.unblock')}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Business details */}
        <section className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-3 text-xs shadow-sm">
          <div className="col-span-2 text-sm font-semibold">{t('seller.customer.business')}</div>
          <Fact label={t('seller.customer.customer_id')} value={c.customerId} />
          <Fact label={t('seller.customer.gst')} value={c.gstn ?? t('seller.customer.gst_none')} />
        </section>

        {/* Recent orders */}
        <section className="space-y-2">
          <div className="px-1 text-sm font-semibold">{t('seller.customer.orders')}</div>
          {theirOrders.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-3 text-sm text-foreground-secondary">{t('seller.customer.no_orders')}</p>
          ) : (
            theirOrders.map((o) => (
              <OrderListCard
                key={o.id}
                title={o.buyer.storeName}
                orderId={o.id}
                status={o.status}
                statusLabel={t(`seller.status.${o.status}`)}
                total={orderTotal(o)}
                totalLabel={t('seller.orders.order_value')}
                onOpenDetails={() => onOpenOrder(o.id)}
                detailsLabel={t('seller.orders.details')}
              />
            ))
          )}
        </section>
      </div>

      <Sheet
        open={!!target}
        onClose={() => setTarget(null)}
        title={fill(blocking ? 'seller.customer.block_title' : 'seller.customer.unblock_title')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setTarget(null)}>
              {t('seller.action.go_back')}
            </Button>
            <Button variant={blocking ? 'destructive' : 'primary'} fullWidth onClick={confirm}>
              {t(blocking ? 'seller.customer.block_cta' : 'seller.customer.unblock_cta')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-secondary">{fill(blocking ? 'seller.customer.block_help' : 'seller.customer.unblock_help')}</p>
      </Sheet>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-foreground-secondary">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
