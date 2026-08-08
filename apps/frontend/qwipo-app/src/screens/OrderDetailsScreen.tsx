import { MapPin } from 'lucide-react';
import { products, customer } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import CopyText from '../components/CopyText';

function findProduct(itemName: string) {
  const key = itemName.toLowerCase();
  return (products as any[]).find((p) => key.includes(p.name.toLowerCase().split(' ')[0]) || key.includes(p.brand.toLowerCase()));
}

const STATUS_TINT: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-700', in_transit: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-50 text-amber-700', delivered: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-red-50 text-red-700',
};

export default function OrderDetailsScreen({ order, onBack }: any) {
  if (!order) return null;
  const itemsTotal = order.total - 200;
  const niceOrderId = `QWIP${order.id.replace(/[^0-9]/g, '')}204`;
  const addr = (customer as any).address;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Order Details" subtitle={niceOrderId} onBack={onBack} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: order.sellerColor }}>{order.sellerLogo}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{order.seller}</div>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TINT[order.status] || 'bg-muted'}`}>{order.statusLabel}</span>
          </div>
        </div>

        <Section title="Order Summary">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <SumRow label="Order ID" value={<CopyText value={niceOrderId} />} />
            <SumRow label="Order Date" value={order.placedAt} />
            <SumRow label="Expected Delivery Date" value={order.eta} />
            <SumRow label="Order Status" value={order.statusLabel} />
            <SumRow label="Items Total" value={`₹${itemsTotal.toLocaleString('en-IN')}.00`} />
            <SumRow label="Delivery Fee" value="₹200.00" />
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total Amount</span><span>₹{order.total.toLocaleString('en-IN')}.00</span>
            </div>
          </div>
        </Section>

        <Section title={`Items (${order.items.length})`}>
          <div className="space-y-2">
            {order.items.map((itemName: string, i: number) => {
              const prod = findProduct(itemName);
              const variant = prod?.variants[0];
              return (
                <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg text-2xl" style={{ background: prod?.bgColor || '#f3f4f6' }}>
                    {prod?.images?.[0] ? <img src={prod.images[0]} alt={itemName} className="h-full w-full object-contain p-1" /> : <span>{prod?.image || '📦'}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium uppercase text-muted-foreground">{prod?.brand || 'BRAND'}</div>
                    <div className="text-sm font-medium">{itemName}</div>
                    {variant && <div className="text-xs text-muted-foreground">{variant.size} · {variant.casePack}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">₹{variant?.sellingPrice || '—'}</div>
                    {variant && <div className="text-xs text-muted-foreground line-through">₹{variant.mrp}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Delivery Address">
          <div className="flex gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{(customer as any).businessName}</div>
              <div className="text-xs text-muted-foreground">{addr.line}, {addr.city}, {addr.state} – {addr.pincode}</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}
function SumRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
