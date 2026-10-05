// Drill-down dashboards for DigiDukaan · Buyer — one entity at a time, cards
// first: a distributor, a salesperson (BA) or a customer, plus the record
// lists that sit at the bottom of a drill (orders, customers, BAs,
// distributors). Lists show the latest few; the full table is a report.
import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Phone } from 'lucide-react';
import { Badge, Button, cn, type BadgeProps } from '@mockups/ui';
import { HBars, StackBar } from '@mockups/components';
import { Drawer, DrawerSection, useFlash } from './buyerKit';
import { BeatLegend, TargetMeters, ValueBars } from './buyerCharts';
import { BuyerDrillContext, type DrillItem } from './buyerDrillContext';
import { ago, dmy, dmyTime, downloadCsv, inr, kpiDelta, lakh, num, pctOf, rangeText } from './buyerFormat';
import { Delta } from './dashboard';
import {
  TODAY, buyerCustomers, buyerDistributors, customerStatus, ordersByCustomer, scopedOrders,
  type BuyerCustomer, type BuyerOrder, type CustomerStatus, type Kyc, type OrderStatus,
} from '../data/buyer';
import {
  PACE_LOW, PACE_OK, baStats, buckets, customerStats, distributorStats, summarize, type Summary,
} from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const orderBadge: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = { Active: 'info', 'In Transit': 'warning', Delivered: 'success', Cancelled: 'danger' };
const custBadge: Record<CustomerStatus, NonNullable<BadgeProps['variant']>> = { Active: 'success', Dormant: 'warning', 'Never ordered': 'neutral' };
const kycBadge: Record<Kyc, NonNullable<BadgeProps['variant']>> = { Verified: 'success', Pending: 'warning', Rejected: 'danger' };
const statusBg: Record<OrderStatus, string> = { Active: 'bg-info', 'In Transit': 'bg-warning', Delivered: 'bg-success', Cancelled: 'bg-error' };
const STATUSES: OrderStatus[] = ['Active', 'In Transit', 'Delivered', 'Cancelled'];

type Go = (p: Page | string) => void;

export function BuyerDrillProvider({ go, children }: { go: Go; children: React.ReactNode }) {
  const [stack, setStack] = useState<DrillItem[]>([]);
  // Moving to another page closes the drill.
  useEffect(() => {
    const onHash = () => setStack([]);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const api = useMemo(() => ({
    open: (d: DrillItem) => setStack([d]),
    push: (d: DrillItem) => setStack((s) => [...s, d]),
  }), []);
  const top = stack[stack.length - 1];
  const close = () => setStack([]);
  const leave: Go = (p) => { close(); go(p); };
  const back = stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : undefined;
  return (
    <BuyerDrillContext.Provider value={api}>
      {children}
      {top && <DrillDrawer key={stack.length} item={top} push={api.push} onBack={back} onClose={close} go={leave} />}
    </BuyerDrillContext.Provider>
  );
}

type DrawerProps = { push: (d: DrillItem) => void; onBack?: () => void; onClose: () => void; go: Go };

function DrillDrawer({ item, ...p }: DrawerProps & { item: DrillItem }) {
  switch (item.kind) {
    case 'distributor': return <DistributorDash name={item.name} {...p} />;
    case 'ba': return <BaDash name={item.name} {...p} />;
    case 'customer': return <CustomerDash id={item.id} {...p} />;
    case 'orders': return <OrdersList title={item.title} where={item.where} {...p} />;
    case 'customers': return <CustomersList item={item} {...p} />;
    case 'distributors': return <DistributorsList item={item} {...p} />;
    case 'bas': return <BasList item={item} {...p} />;
  }
}

/* ---------------------------------- pieces --------------------------------- */

type Cell = { label: string; value: string; note?: React.ReactNode; tone?: 'error' | 'warning' | 'success'; onClick?: () => void };

/** 3-across KPI cells at the top of a drill-down dashboard. */
function KpiGrid({ cells }: { cells: Cell[] }) {
  return (
    <div className="grid grid-cols-3 gap-px border-b border-border-subtle bg-border-subtle">
      {cells.map((c) => (
        <div
          key={c.label}
          className={cn('bg-card px-5 py-3', c.onClick && 'cursor-pointer hover:bg-muted')}
          onClick={c.onClick}
        >
          <div className="type-caption text-foreground-secondary">{c.label}</div>
          <div className={cn('type-h2 tabular-nums', c.tone === 'error' && 'text-error-foreground', c.tone === 'warning' && 'text-warning-foreground', c.tone === 'success' && 'text-success-foreground')}>{c.value}</div>
          {c.note && <div className="type-caption text-foreground-tertiary">{c.note}</div>}
        </div>
      ))}
    </div>
  );
}

function Change({ cur, prev, mode = 'pct', inverse, suffix }: { cur: number; prev: number | null | undefined; mode?: 'pct' | 'pts'; inverse?: boolean; suffix?: string }) {
  const d = kpiDelta(cur, prev, mode);
  if (d.change === '—') return <>{suffix ?? 'no earlier period'}</>;
  return <><Delta trend={d.trend} inverse={inverse}>{d.change}</Delta> vs previous{suffix ? ` · ${suffix}` : ''}</>;
}

/** Order status as one stacked bar; each part opens those orders. */
function StatusSplit({ s, onStatus }: { s: Summary; onStatus: (st: OrderStatus) => void }) {
  const n: Record<OrderStatus, number> = { Active: s.active, 'In Transit': s.transit, Delivered: s.delivered, Cancelled: s.cancelled };
  if (!s.orders) return <p className="type-caption text-foreground-secondary">No orders in this range.</p>;
  return (
    <>
      <StackBar
        parts={STATUSES.filter((k) => n[k] > 0).map((k) => ({ key: k, pct: (n[k] / s.orders) * 100, label: `${Math.round((n[k] / s.orders) * 100)}%`, bg: statusBg[k] }))}
        onPart={(k) => onStatus(k as OrderStatus)}
      />
      <div className="type-caption mt-2 grid grid-cols-4 gap-2">
        {STATUSES.map((k) => (
          <button key={k} type="button" onClick={() => onStatus(k)} className="-mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left hover:bg-muted">
            <i className={cn('h-2 w-2 shrink-0 rounded-full', statusBg[k])} />
            <span className="text-foreground-secondary">{k}</span>
            <b className="ml-auto font-semibold tabular-nums">{num(n[k])}</b>
          </button>
        ))}
      </div>
    </>
  );
}

/** Who cancelled — three small numbers, each a drill. */
function CancelSplit({ s, onSource }: { s: Summary; onSource: (src: 'BA' | 'Distributor' | 'Retailer') => void }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {([['BA', s.cBA], ['Distributor', s.cDist], ['Retailer', s.cRet]] as const).map(([k, v]) => (
        <button key={k} type="button" onClick={() => onSource(k)} className="rounded-md border border-border-subtle px-2.5 py-1.5 text-left hover:bg-muted">
          <span className="type-caption block text-foreground-secondary">Cancelled by {k}</span>
          <span className={cn('type-label tabular-nums', v > 0 && 'text-error-foreground')}>{num(v)}</span>
        </button>
      ))}
    </div>
  );
}

function ReportBtn({ go, report, label }: { go: Go; report: string; label: string }) {
  return <Button variant="secondary" size="sm" onClick={() => go(`reports/run:${report}`)}><FileSpreadsheet size={14} /> {label}</Button>;
}

/* ------------------------------- distributor ------------------------------- */

function DistributorDash({ name, push, onBack, onClose, go }: DrawerProps & { name: string }) {
  const { s: scope } = useBuyerScope();
  const all = useMemo(() => distributorStats({ ...scope, distributor: 'All' }), [scope]);
  const ranked = [...all].sort((a, b) => b.s.value - a.s.value);
  const me = all.find((d) => d.name === name);
  const d = me?.d ?? buyerDistributors.find((x) => x.name === name)!;
  const orders = useMemo(() => scopedOrders({ ...scope, distributor: name }), [scope, name]);
  const s = me?.s ?? summarize(orders);
  const prev = me?.prev;
  const mine = (w: (o: BuyerOrder) => boolean) => (o: BuyerOrder) => o.distributor === name && w(o);

  const byBa = topBy(orders, (o) => o.ba);
  const byCustomer = topBy(orders, (o) => o.customerId);

  return (
    <Drawer
      width="w-[640px]" onBack={onBack} onClose={onClose}
      title={<span className="flex items-center gap-2">{name} <Badge variant={s.orders ? 'success' : 'neutral'}>{s.orders ? 'Active' : 'Inactive'}</Badge></span>}
      sub={<>{d.locality}, {d.city}, {d.state} · {me ? `#${ranked.indexOf(me) + 1} of ${ranked.length} by value` : 'outside the current filters'} · {rangeText(scope)}</>}
      footer={<>
        <Button fullWidth size="sm" onClick={() => push({ kind: 'orders', title: `Orders · ${name}`, where: mine(() => true) })}>View {num(s.orders)} orders</Button>
        <ReportBtn go={go} report="buyer-distributors" label="Distributor report" />
      </>}
    >
      <KpiGrid cells={[
        { label: 'Orders', value: num(s.orders), note: <Change cur={s.orders} prev={prev?.orders} /> },
        { label: 'Order value', value: lakh(s.value), note: <Change cur={s.value} prev={prev?.value} /> },
        { label: 'Avg order value', value: inr(s.aov), note: <Change cur={s.aov} prev={prev?.aov} /> },
        { label: 'Beat orders', value: `${s.beatShare.toFixed(0)}%`, note: <>{num(s.beat)} on a planned visit</> },
        { label: 'Cancellation rate', value: `${s.cancelRate.toFixed(1)}%`, tone: s.cancelRate > 20 ? 'error' : undefined, note: <Change cur={s.cancelRate} prev={prev?.cancelRate} mode="pts" inverse />,
          onClick: () => push({ kind: 'orders', title: `Cancelled · ${name}`, where: mine((o) => o.status === 'Cancelled') }) },
        { label: 'Customers ordering', value: num(s.customers), note: <>of {num(me?.mapped ?? 0)} mapped outlets</> },
      ]} />

      <DrawerSection title="Order value · beat vs non-beat" right={<span className="type-caption text-foreground-tertiary">click a bar for its orders</span>}>
        <ValueBars data={buckets(orders, scope)} height={120}
          onBar={(b) => push({ kind: 'orders', title: `${name} · ${b.title}`, where: mine((o) => o.at >= b.from && o.at < b.to) })} />
        <BeatLegend beat={lakh(orders.filter((o) => o.beat).reduce((a, o) => a + o.value, 0))} nonBeat={lakh(orders.filter((o) => !o.beat).reduce((a, o) => a + o.value, 0))} />
      </DrawerSection>

      <DrawerSection title="Order status">
        <StatusSplit s={s} onStatus={(st) => push({ kind: 'orders', title: `${st} · ${name}`, where: mine((o) => o.status === st) })} />
        <CancelSplit s={s} onSource={(src) => push({ kind: 'orders', title: `Cancelled by ${src} · ${name}`, where: mine((o) => o.cancelledBy === src) })} />
      </DrawerSection>

      <DrawerSection title="Salespersons bringing the orders" right={<span className="type-caption text-foreground-tertiary">orders · value</span>}>
        {byBa.length ? (
          <HBars rows={byBa.slice(0, 6).map((r) => ({ label: r.key, n: r.n, value: lakh(r.v), barClass: 'bg-chart-indigo' }))}
            onRow={(l) => push({ kind: 'ba', name: l })} />
        ) : <p className="type-caption text-foreground-secondary">No orders in this range.</p>}
      </DrawerSection>

      <DrawerSection title="Top customers" right={<span className="type-caption text-foreground-tertiary">orders · value</span>}>
        {byCustomer.length ? (
          <HBars rows={byCustomer.slice(0, 6).map((r) => ({ label: custName(r.key), n: r.n, value: lakh(r.v), barClass: 'bg-chart-teal' }))}
            onRow={(l) => push({ kind: 'customer', id: byCustomer.find((r) => custName(r.key) === l)!.key })} />
        ) : <p className="type-caption text-foreground-secondary">No orders in this range.</p>}
      </DrawerSection>
    </Drawer>
  );
}

const custName = (id: string) => buyerCustomers.find((c) => c.id === id)?.name ?? id;

function topBy(orders: BuyerOrder[], key: (o: BuyerOrder) => string) {
  const m = new Map<string, { n: number; v: number }>();
  for (const o of orders) {
    const e = m.get(key(o)) ?? { n: 0, v: 0 };
    e.n++; e.v += o.value;
    m.set(key(o), e);
  }
  return [...m.entries()].map(([k, e]) => ({ key: k, ...e })).sort((a, b) => b.v - a.v);
}

/* ------------------------------- salesperson ------------------------------- */

function BaDash({ name, push, onBack, onClose, go }: DrawerProps & { name: string }) {
  const { s: scope } = useBuyerScope();
  const [toast, flash] = useFlash();
  // Rank against every BA in the geography, whatever the team filter says.
  const all = useMemo(() => baStats({ ...scope, team: 'All' }), [scope]);
  const ranked = [...all].sort((a, b) => b.s.value - a.s.value);
  const r = all.find((x) => x.name === name);
  const orders = useMemo(() => scopedOrders({ ...scope, team: 'All' }).filter((o) => o.ba === name), [scope, name]);
  const customers = useMemo(() => customerStats({ ...scope, team: 'All' }).filter((c) => c.c.ba === name), [scope, name]);
  if (!r) {
    return (
      <Drawer title={name} sub="Salesperson" onBack={onBack} onClose={onClose}>
        <p className="type-body px-5 py-6 text-foreground-secondary">{name} has no customers in the current filters — widen State, City or Distributor.</p>
      </Drawer>
    );
  }
  const ba = r.ba;
  const mine = (w: (o: BuyerOrder) => boolean) => (o: BuyerOrder) => o.ba === name && w(o);
  const revive = customers.filter((c) => c.status === 'Dormant').sort((a, b) => a.last!.getTime() - b.last!.getTime());
  const never = customers.filter((c) => c.status === 'Never ordered');
  const kyc = customers.filter((c) => c.c.kyc === 'Pending');
  const gap = r.target - r.s.value;
  const tone = r.achievement >= PACE_OK ? 'success' : r.achievement >= PACE_LOW ? 'warning' : 'error';

  return (
    <Drawer
      width="w-[640px]" onBack={onBack} onClose={onClose}
      title={<>{ba.name} <span className="type-caption font-normal text-foreground-secondary">· BA</span></>}
      sub={<>{ba.city}, {ba.state} · Team {ba.lead} · <span className="tabular-nums">{ba.mobile}</span> · #{ranked.indexOf(r) + 1} of {ranked.length} by value · {rangeText(scope)}</>}
      footer={<>
        <Button fullWidth size="sm" onClick={() => {
          downloadCsv(`call_list_${ba.name.replace(/ /g, '-')}_${dmy(scope.to)}.csv`,
            ['Customer', 'Customer ID', 'Mobile', 'Beat', 'Reason', 'Last Order'],
            [...revive.map((x) => [x.name, x.id, x.c.mobile, x.c.beat, 'No order in 30+ days', x.last ? dmy(x.last) : '']),
              ...never.map((x) => [x.name, x.id, x.c.mobile, x.c.beat, 'Never ordered', '']),
              ...kyc.map((x) => [x.name, x.id, x.c.mobile, x.c.beat, `KYC pending — ${x.c.kycNote}`, ''])]);
          flash(`Call list for ${ba.name} downloaded`);
        }}><Download size={14} /> Call list</Button>
        <ReportBtn go={go} report="buyer-ba-performance" label="BA report" />
      </>}
    >
      {toast}
      <KpiGrid cells={[
        { label: 'Revenue', value: lakh(r.s.value), tone, note: <Change cur={r.s.value} prev={r.prevValue} /> },
        { label: 'Orders', value: num(r.s.orders), note: <>avg {inr(r.s.aov)} per order</>,
          onClick: () => push({ kind: 'orders', title: `Orders · ${name}`, where: mine(() => true) }) },
        { label: 'Customers ordered', value: num(r.ordering), note: <>{r.coverage.toFixed(0)}% of {r.customers} customers</>,
          onClick: () => push({ kind: 'customers', title: `${name} · customers who ordered`, where: (c) => c.c.ba === name && c.orders > 0 }) },
        { label: 'New onboarded', value: num(r.newCustomers), note: 'outlets joined in the range',
          onClick: () => push({ kind: 'customers', title: `${name} · new outlets`, where: (c) => c.c.ba === name && c.isNew }) },
        { label: 'Beat orders', value: `${r.s.beatShare.toFixed(0)}%`, note: <>{num(r.s.beat)} on planned visits</> },
        { label: `Today · ${dmy(TODAY)}`, value: num(r.today), tone: r.today ? undefined : 'warning', note: r.today ? lakh(r.todayValue) : 'nothing booked yet',
          onClick: () => push({ kind: 'orders', title: `${name} · today`, where: mine((o) => o.at.toDateString() === TODAY.toDateString()) }) },
      ]} />

      <DrawerSection title="Target" right={<span className="type-caption text-foreground-tertiary">monthly {lakh(ba.target)} · prorated to the range</span>}>
        <TargetMeters head={false} rows={[{ key: name, label: 'Achieved', sub: `of ${lakh(r.target)} target`, pct: r.achievement, value: lakh(r.s.value) }]} />
        <p className={cn('type-caption mt-1.5', gap > 0 ? 'text-warning-foreground' : 'text-success-foreground')}>
          {gap > 0 ? `${lakh(gap)} short of target for this range` : `${lakh(-gap)} ahead of target`}
        </p>
      </DrawerSection>

      <DrawerSection title="Revenue · beat vs non-beat">
        <ValueBars data={buckets(orders, scope)} height={110}
          onBar={(b) => push({ kind: 'orders', title: `${name} · ${b.title}`, where: mine((o) => o.at >= b.from && o.at < b.to) })} />
      </DrawerSection>

      <DrawerSection title="Status of orders">
        <StatusSplit s={r.s} onStatus={(st) => push({ kind: 'orders', title: `${name} · ${st}`, where: mine((o) => o.status === st) })} />
      </DrawerSection>

      <DrawerSection title="Beats" right={<span className="type-caption text-foreground-tertiary">orders · value · customers ordered</span>}>
        <HBars
          rows={ba.beats.map((b) => {
            const os = orders.filter((o) => o.beatName === b.name);
            const cs = customers.filter((c) => c.c.beat === b.name);
            return { label: `${b.name} · ${b.days}`, n: os.length, value: `${lakh(os.reduce((a, o) => a + o.value, 0))} · ${cs.filter((c) => c.orders > 0).length}/${cs.length}`, barClass: 'bg-chart-indigo' };
          })}
          wideLabel
          onRow={(l) => { const beat = l.split(' · ')[0]; push({ kind: 'customers', title: `${beat} · ${name}`, where: (c) => c.c.ba === name && c.c.beat === beat }); }}
        />
      </DrawerSection>

      <DrawerSection title={`Customers to revive · ${revive.length}`} right={<span className="type-caption text-foreground-tertiary">no order in 30+ days · oldest first</span>}>
        <CallList items={revive.map((x) => ({ c: x.c, note: `last order ${dmy(x.last!)} · ${ago(x.last)}` }))} empty="Every customer ordered in the last 30 days." onPick={(id) => push({ kind: 'customer', id })} />
      </DrawerSection>
      <DrawerSection title={`KYC pending · ${kyc.length}`}>
        <CallList items={kyc.map((x) => ({ c: x.c, note: x.c.kycNote!, tone: 'warning' as const }))} empty="No KYC pending." onPick={(id) => push({ kind: 'customer', id })} />
      </DrawerSection>
      <DrawerSection title={`Never ordered · ${never.length}`}>
        <CallList items={never.map((x) => ({ c: x.c, note: `onboarded ${dmy(x.c.onboarded)}` }))} empty="Every customer has ordered at least once." onPick={(id) => push({ kind: 'customer', id })} />
      </DrawerSection>
    </Drawer>
  );
}

function CallList({ items, empty, onPick }: { items: { c: BuyerCustomer; note: string; tone?: 'warning' }[]; empty: string; onPick: (id: string) => void }) {
  if (!items.length) return <p className="type-caption text-foreground-secondary">{empty}</p>;
  return (
    <div className="flex flex-col">
      {items.slice(0, 6).map(({ c, note, tone }) => (
        <div key={c.id} className="-mx-2 flex cursor-pointer items-center gap-3 rounded-md border-t border-border-subtle px-2 py-2 first:border-t-0 hover:bg-muted" onClick={() => onPick(c.id)}>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="type-label block truncate">{c.name}</span>
            <span className={cn('type-caption block', tone === 'warning' ? 'text-warning-foreground' : 'text-foreground-secondary')}>{c.beat} · {note}</span>
          </span>
          <a href={`tel:${c.mobile.replace(/ /g, '')}`} onClick={(e) => e.stopPropagation()} className="type-caption flex items-center gap-1 whitespace-nowrap font-medium tabular-nums text-link">
            <Phone size={12} /> {c.mobile}
          </a>
        </div>
      ))}
      {items.length > 6 && <p className="type-caption pt-1 text-foreground-tertiary">+ {items.length - 6} more in the call list download</p>}
    </div>
  );
}

/* --------------------------------- customer -------------------------------- */

function CustomerDash({ id, push, onBack, onClose }: DrawerProps & { id: string }) {
  const { s: scope } = useBuyerScope();
  const [toast, flash] = useFlash();
  const c = buyerCustomers.find((x) => x.id === id)!;
  const st = customerStatus(c, scope.to);
  const history = ordersByCustomer.get(c.id) ?? [];
  const inRange = scopedOrders({ ...scope, state: 'All', city: 'All', distributor: 'All', team: 'All' }).filter((o) => o.customerId === id);
  const s = summarize(inRange);
  const lifetime = history.reduce((a, o) => a + o.value, 0);
  const recent = [...history].reverse().slice(0, 8);
  const fact = (l: string, v: React.ReactNode) => (
    <div key={l} className="flex justify-between gap-3 py-1">
      <span className="type-caption text-foreground-secondary">{l}</span>
      <span className="type-caption text-right font-medium">{v}</span>
    </div>
  );

  return (
    <Drawer
      onBack={onBack} onClose={onClose}
      title={c.name}
      sub={<>{c.id} · {c.owner} · <span className="tabular-nums">{c.mobile}</span></>}
      footer={<>
        <Button fullWidth size="sm" variant="secondary" onClick={() => flash(`Reminder sent to ${c.ba} to visit ${c.name}`)}>Nudge BA</Button>
        {c.kyc === 'Pending' && <Button fullWidth size="sm" onClick={() => flash(`KYC reminder sent to ${c.owner} on WhatsApp`)}>Send KYC reminder</Button>}
      </>}
    >
      {toast}
      <div className="flex flex-wrap gap-1.5 border-b border-border-subtle px-5 py-3">
        <Badge variant={custBadge[st.status]}>{st.status}</Badge>
        <Badge variant={kycBadge[c.kyc]}>KYC {c.kyc}</Badge>
        {c.onboarded >= scope.from && <Badge variant="accent">New</Badge>}
      </div>
      <KpiGrid cells={[
        { label: 'In range', value: inr(s.value), note: `${s.orders} orders · ${rangeText(scope)}` },
        { label: 'Lifetime', value: lakh(lifetime), note: `${history.length} orders since ${dmy(c.onboarded)}` },
        { label: 'Last order', value: st.last ? ago(st.last) : '—', note: st.last ? dmy(st.last) : 'never ordered' },
      ]} />
      {s.orders > 0 && (
        <DrawerSection title="Status of orders in range">
          <StatusSplit s={s} onStatus={(x) => push({ kind: 'orders', title: `${c.name} · ${x}`, where: (o) => o.customerId === id && o.status === x })} />
        </DrawerSection>
      )}
      <DrawerSection title="Profile">
        {fact('Address', `${c.locality}, ${c.city}, ${c.state} · ${c.pincode}`)}
        {fact('Beat', `${c.beat} · ${c.beatDays}`)}
        {fact('Onboarded', dmy(c.onboarded))}
        {fact('KYC', c.kyc === 'Verified' ? 'Verified' : <span className={c.kyc === 'Pending' ? 'text-warning-foreground' : 'text-error-foreground'}>{c.kyc} — {c.kycNote}</span>)}
      </DrawerSection>
      <DrawerSection title="Salesperson">
        <div className="-mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 hover:bg-muted" onClick={() => push({ kind: 'ba', name: c.ba })}>
          <span className="type-caption grid h-9 w-9 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-foreground">{c.ba.split(' ').map((w) => w[0]).join('')}</span>
          <span className="flex-1 leading-tight">
            <span className="type-label block">{c.ba}</span>
            <span className="type-caption block text-foreground-secondary">Team {c.lead} · open their dashboard</span>
          </span>
          <a href={`tel:${c.baMobile.replace(/ /g, '')}`} onClick={(e) => e.stopPropagation()} className="type-caption flex items-center gap-1 font-medium tabular-nums text-link"><Phone size={12} /> {c.baMobile}</a>
        </div>
      </DrawerSection>
      <DrawerSection title={`Discoverable distributors · ${c.discoverable.length}`} right={<span className="type-caption text-foreground-tertiary">orders in range</span>}>
        {c.discoverable.map((name) => {
          const d = buyerDistributors.find((x) => x.name === name)!;
          return (
            <div key={name} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md border-t border-border-subtle px-2 py-2 first:border-t-0 hover:bg-muted" onClick={() => push({ kind: 'distributor', name })}>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="type-label block">{name}</span>
                <span className="type-caption block text-foreground-secondary">{d.locality}, {d.city}{d.lastActive && ' · stopped taking orders'}</span>
              </span>
              {name === c.distributor && <Badge variant="info">Mapped</Badge>}
              <span className="type-caption w-10 text-right tabular-nums">{inRange.filter((o) => o.distributor === name).length}</span>
            </div>
          );
        })}
      </DrawerSection>
      <DrawerSection title="Recent orders">
        {recent.length ? recent.map((o) => <OrderLine key={o.id} o={o} />) : <p className="type-caption text-foreground-secondary">No orders yet — onboarded {dmy(c.onboarded)}.</p>}
      </DrawerSection>
    </Drawer>
  );
}

function OrderLine({ o, onClick }: { o: BuyerOrder; onClick?: () => void }) {
  return (
    <div className={cn('flex items-center gap-2 border-t border-border-subtle py-2 first:border-t-0', onClick && '-mx-2 cursor-pointer rounded-md px-2 hover:bg-muted')} onClick={onClick}>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="type-label block truncate">{onClick ? o.customer : o.id}</span>
        <span className="type-caption block truncate text-foreground-secondary">
          {onClick && <span className="tabular-nums">{o.id} · </span>}{dmyTime(o.at)} · {o.distributor} · {o.ba} · {o.beat ? 'Beat' : 'Non-beat'}
        </span>
      </span>
      <Badge variant={orderBadge[o.status]}>{o.cancelledBy ? `Cancelled · ${o.cancelledBy}` : o.status}</Badge>
      <span className="type-caption w-16 text-right tabular-nums">{inr(o.value)}</span>
    </div>
  );
}

/* ---------------------------------- lists ---------------------------------- */

const LIST_MAX = 40;

function OrdersList({ title, where, push, onBack, onClose, go }: DrawerProps & { title: string; where: (o: BuyerOrder) => boolean }) {
  const { s: scope } = useBuyerScope();
  const [st, setSt] = useState<OrderStatus | 'All'>('All');
  const all = useMemo(() => scopedOrders(scope).filter(where).sort((a, b) => b.at.getTime() - a.at.getTime()), [scope, where]);
  const s = summarize(all);
  const shown = st === 'All' ? all : all.filter((o) => o.status === st);
  const counts: Record<OrderStatus, number> = { Active: s.active, 'In Transit': s.transit, Delivered: s.delivered, Cancelled: s.cancelled };
  return (
    <Drawer
      width="w-[600px]" onBack={onBack} onClose={onClose}
      title={title}
      sub={<>{num(s.orders)} orders · {lakh(s.value)} · {s.beatShare.toFixed(0)}% beat · {rangeText(scope)}</>}
      footer={<ReportBtn go={go} report="buyer-customer-orders" label="Download the full list as a report" />}
    >
      <div className="flex flex-wrap gap-1.5 border-b border-border-subtle px-5 py-3">
        {(['All', ...STATUSES] as const).map((k) => (
          <button
            key={k} type="button" onClick={() => setSt(k)}
            className={cn('type-caption h-8 rounded-full border px-3 font-medium', st === k ? 'border-primary bg-primary-soft text-primary-soft-foreground' : 'border-border text-foreground-secondary hover:bg-muted')}
          >
            {k} <span className="tabular-nums text-foreground-tertiary">{num(k === 'All' ? s.orders : counts[k])}</span>
          </button>
        ))}
      </div>
      <div className="px-5 py-2">
        {shown.slice(0, LIST_MAX).map((o) => <OrderLine key={o.id} o={o} onClick={() => push({ kind: 'customer', id: o.customerId })} />)}
        {shown.length === 0 && <p className="type-caption py-8 text-center text-foreground-secondary">No orders here — try a wider date range.</p>}
        {shown.length > LIST_MAX && <p className="type-caption py-2 text-foreground-tertiary">Latest {LIST_MAX} of {num(shown.length)} · the report has every order</p>}
      </div>
    </Drawer>
  );
}

function ListShell({ title, sub, count, report, reportLabel, go, onBack, onClose, children }: {
  title: string; sub: string; count: number; report: string; reportLabel: string; go: Go; onBack?: () => void; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Drawer width="w-[560px]" onBack={onBack} onClose={onClose} title={title} sub={sub} footer={<ReportBtn go={go} report={report} label={reportLabel} />}>
      <div className="px-5 py-2">
        {children}
        {count === 0 && <p className="type-caption py-8 text-center text-foreground-secondary">Nothing here in this scope.</p>}
        {count > LIST_MAX && <p className="type-caption py-2 text-foreground-tertiary">Top {LIST_MAX} of {num(count)} · the report has all of them</p>}
      </div>
    </Drawer>
  );
}

function Row({ title, sub, right, badge, onClick }: { title: string; sub: string; right: React.ReactNode; badge?: React.ReactNode; onClick: () => void }) {
  return (
    <div className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md border-t border-border-subtle px-2 py-2 first:border-t-0 hover:bg-muted" onClick={onClick}>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="type-label block truncate">{title}</span>
        <span className="type-caption block truncate text-foreground-secondary">{sub}</span>
      </span>
      {badge}
      <span className="type-caption whitespace-nowrap text-right tabular-nums">{right}</span>
    </div>
  );
}

function CustomersList({ item, push, go, onBack, onClose }: DrawerProps & { item: Extract<DrillItem, { kind: 'customers' }> }) {
  const { s: scope } = useBuyerScope();
  const rows = useMemo(() => customerStats(scope).filter(item.where).sort((a, b) => b.value - a.value), [scope, item]);
  return (
    <ListShell title={item.title} sub={`${num(rows.length)} customers · ${lakh(rows.reduce((a, r) => a + r.value, 0))} in range · ${rangeText(scope)}`}
      count={rows.length} report="buyer-customer-db" reportLabel="Customer Database report" go={go} onBack={onBack} onClose={onClose}>
      {rows.slice(0, LIST_MAX).map((r) => (
        <Row key={r.id} title={r.name} sub={`${r.c.beat} · ${r.c.ba} · ${item.note ? item.note(r) : r.last ? `last order ${ago(r.last)}` : 'never ordered'}`}
          badge={<Badge variant={custBadge[r.status]}>{r.status}</Badge>} right={inr(r.value)} onClick={() => push({ kind: 'customer', id: r.id })} />
      ))}
    </ListShell>
  );
}

function DistributorsList({ item, push, go, onBack, onClose }: DrawerProps & { item: Extract<DrillItem, { kind: 'distributors' }> }) {
  const { s: scope } = useBuyerScope();
  const rows = useMemo(() => distributorStats(scope).filter(item.where).sort((a, b) => b.s.value - a.s.value), [scope, item]);
  return (
    <ListShell title={item.title} sub={`${num(rows.length)} distributors · ${rangeText(scope)}`}
      count={rows.length} report="buyer-distributors" reportLabel="Distributor Orders report" go={go} onBack={onBack} onClose={onClose}>
      {rows.slice(0, LIST_MAX).map((r) => (
        <Row key={r.name} title={r.name} sub={`${r.d.city} · ${item.note ? item.note(r) : `${num(r.s.orders)} orders · ${r.s.beatShare.toFixed(0)}% beat`}`}
          badge={r.growth != null ? <Badge variant={r.growth < 0 ? 'danger' : 'success'}>{r.growth < 0 ? '↓' : '↑'} {Math.abs(r.growth).toFixed(0)}%</Badge> : undefined}
          right={lakh(r.s.value)} onClick={() => push({ kind: 'distributor', name: r.name })} />
      ))}
    </ListShell>
  );
}

function BasList({ item, push, go, onBack, onClose }: DrawerProps & { item: Extract<DrillItem, { kind: 'bas' }> }) {
  const { s: scope } = useBuyerScope();
  const rows = useMemo(() => baStats(scope).filter(item.where).sort((a, b) => a.achievement - b.achievement), [scope, item]);
  return (
    <ListShell title={item.title} sub={`${num(rows.length)} BAs · ${rangeText(scope)}`}
      count={rows.length} report="buyer-ba-performance" reportLabel="BA Performance report" go={go} onBack={onBack} onClose={onClose}>
      {rows.slice(0, LIST_MAX).map((r) => (
        <Row key={r.name} title={r.name} sub={`${r.city} · Team ${r.lead} · ${item.note ? item.note(r) : `${pctOf(r.ordering, r.customers)} coverage`}`}
          badge={<Badge variant={r.achievement >= PACE_OK ? 'success' : r.achievement >= PACE_LOW ? 'warning' : 'danger'}>{r.achievement.toFixed(0)}% of target</Badge>}
          right={lakh(r.s.value)} onClick={() => push({ kind: 'ba', name: r.name })} />
      ))}
    </ListShell>
  );
}
