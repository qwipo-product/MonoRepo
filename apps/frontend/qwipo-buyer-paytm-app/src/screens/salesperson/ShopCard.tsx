import { type ReactNode } from 'react';
import { Phone, MapPin } from 'lucide-react';

/* Shared shop/customer card — one look for both the Tasks and Customers lists.
   A numeric badge + name/owner/address, then a Call · Map · Details action row.
   `topRight` carries a status badge (Tasks); `footer` a last-order line
   (Customers). */
export function ShopCard({
  badge,
  title,
  subtitle,
  address,
  mobile,
  lat,
  lng,
  topRight,
  footer,
  onOpen,
}: {
  badge: ReactNode;
  title: string;
  subtitle: string;
  address: string;
  mobile: string;
  lat: number;
  lng: number;
  topRight?: ReactNode;
  footer?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <button onClick={onOpen} className="flex w-full items-start gap-3 text-left active:scale-[0.99]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-sm font-bold text-primary">
          {badge}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            {topRight}
          </span>
          <span className="mt-0.5 block truncate text-xs text-foreground-secondary">{subtitle}</span>
          <span className="mt-1 block text-xs text-foreground-secondary">{address}</span>
        </span>
      </button>

      <div className="mt-2.5 flex gap-2 border-t border-border pt-2.5">
        <a
          href={`tel:${mobile}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]"
        >
          <Phone size={14} /> Call
        </a>
        <a
          href={`https://maps.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]"
        >
          <MapPin size={14} /> Map
        </a>
        <button
          onClick={onOpen}
          className="flex flex-1 items-center justify-center rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground active:scale-[0.98]"
        >
          Details
        </button>
      </div>

      {footer && <div className="mt-2 border-t border-border pt-2">{footer}</div>}
    </div>
  );
}
