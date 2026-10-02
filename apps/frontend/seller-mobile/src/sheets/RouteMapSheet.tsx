import { MapPin, Navigation, Route, Zap } from 'lucide-react';
import { Button, Sheet } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
import { formatDay } from '../format';

/* "View on map" for ticked orders: the stops in delivery order (day, then
   beat), and one button that opens the whole route in Google Maps. Shops
   with no exact location can't be pinned, so they are left out and counted. */
export function RouteMapSheet({ orders, onClose }: { orders: SellerOrder[]; onClose: () => void }) {
  const { t } = useI18n();
  const stops = [...orders].sort(
    (a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || (a.beatName ?? '~').localeCompare(b.beatName ?? '~')
  );
  const located = stops.filter((o) => o.buyer.lat !== null && o.buyer.lng !== null);
  const skipped = stops.length - located.length;
  const at = (o: SellerOrder) => `${o.buyer.lat},${o.buyer.lng}`;
  const route =
    located.length > 0
      ? `https://www.google.com/maps/dir/?api=1&destination=${at(located[located.length - 1])}` +
        (located.length > 1 ? `&waypoints=${located.slice(0, -1).map(at).join('|')}` : '')
      : null;

  return (
    <Sheet
      open={orders.length > 0}
      onClose={onClose}
      size="tall"
      icon={<MapPin size={18} />}
      title={t('seller.map.title').replace('{n}', String(stops.length))}
      subtitle={t('seller.map.help')}
      footer={
        <div className="space-y-2">
          {skipped > 0 && <p className="text-center text-xs font-medium text-warning-foreground">{t('seller.map.skipped').replace('{n}', String(skipped))}</p>}
          <Button fullWidth disabled={!route} onClick={() => route && window.open(route, '_blank')}>
            <Navigation size={16} />
            {t('seller.map.open_route')}
          </Button>
        </div>
      }
    >
      <ol className="space-y-2">
        {stops.map((o, i) => {
          const pinned = o.buyer.lat !== null && o.buyer.lng !== null;
          return (
            <li key={o.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <span className={pinned ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground' : 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground-secondary'}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold leading-snug">{o.buyer.storeName}</div>
                <div className="text-xs text-foreground-secondary">
                  {o.buyer.area} · {o.buyer.pincode} · {formatDay(o.deliveryDate)}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  {o.beatName ? <Route size={12} className="text-primary" /> : <Zap size={12} className="text-warning-foreground" />}
                  {o.beatName ?? t('seller.orders.quick_delivery')}
                </div>
                {!pinned && <div className="mt-1 text-xs font-medium text-warning-foreground">{t('seller.map.no_location')}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}
