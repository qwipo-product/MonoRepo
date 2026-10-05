// DigiDukaan · Buyer — Sales Dashboard, for a sales head chasing a number.
// Reads top-down the way the team talks: how far are we from this month's
// target and what do we need per day; what came in today / this week / this
// month; the range's five numbers; then plain bar charts and pies — who is
// selling, which sellers (distributors vs wholesalers), how orders came in.
// No tables: row-level data is the Customer Orders / Distributor Orders reports.
import { useMemo } from 'react';
import { Badge, Card, cn } from '@mockups/ui';
import { KpiCard, Panel } from '../components/dashboard';
import { Handoff } from '../components/Handoff';
import { AttentionCard, BuyerScopeBar } from '../components/buyerKit';
import { Bars, Donut, RankBars, TargetBar, type Tone } from '../components/buyerCharts';
import { useBuyerDrill } from '../components/buyerDrillContext';
import { inr, kpiDelta, lakh, num } from '../components/buyerFormat';
import { TODAY, sellerTypeOf, scopedOrders, type BuyerOrder } from '../data/buyer';
import {
  PACE_LOW, PACE_OK, baStats, buckets, customerStats, distributorStats, monthPlan, previousScope, pulse, rangeDays, summarize,
} from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const DAY = 86400000;
const sum = (os: BuyerOrder[]) => os.reduce((a, o) => a + o.value, 0);
const isWholesale = (o: BuyerOrder) => sellerTypeOf.get(o.distributor) === 'Wholesaler';
const paceTone = (pct: number): Tone => (pct >= PACE_OK ? 'success' : pct >= PACE_LOW ? 'warning' : 'error');

export default function BuyerSales({ go }: { go: (p: Page | string) => void }) {
  const { s: scope } = useBuyerScope();
  const drill = useBuyerDrill();
  const orders = useMemo(() => scopedOrders(scope), [scope]);
  const s = useMemo(() => summarize(orders), [orders]);
  const before = useMemo(() => {
    const p = previousScope(scope);
    return p ? { s: summarize(scopedOrders(p)), newShops: customerStats(p).filter((c) => c.isNew).length } : null;
  }, [scope]);
  const prev = before?.s;
  const periods = useMemo(() => pulse(scope), [scope]);
  const plan = useMemo(() => monthPlan(scope), [scope]);
  const people = useMemo(() => baStats(scope), [scope]);
  const sellers = useMemo(() => distributorStats(scope), [scope]);
  const shops = useMemo(() => customerStats(scope), [scope]);
  const series = useMemo(() => buckets(orders, scope), [orders, scope]);

  const showOrders = (title: string, where: (o: BuyerOrder) => boolean, range?: [Date, Date]) => drill.open({ kind: 'orders', title, where, range });
  const prevNote = (v: string) => (prev ? `${v} before` : 'no earlier period');
  const newShops = shops.filter((c) => c.isNew).length;
  const sellerFiltered = scope.sellerType !== 'All' || scope.distributor !== 'All';

  // A goal line on the sales chart: the month's target spread evenly over its days.
  const days = rangeDays(scope);
  const perDayTarget = plan.target / (plan.daysGone + plan.daysLeft);
  const barGoal = days === 1 ? undefined : days > 45 ? perDayTarget * 7 : perDayTarget;

  const silentBAs = people.filter((r) => r.today === 0);
  const dormant = shops.filter((c) => c.status === 'Dormant');
  const waiting = orders.filter((o) => o.status === 'Active' && (TODAY.getTime() - o.at.getTime()) / DAY > 2);
  const cancelled = orders.filter((o) => o.status === 'Cancelled');

  const topPeople = [...people].sort((a, b) => b.s.value - a.s.value).slice(0, 8);
  const topSellers = sellers.filter((d) => d.s.orders > 0).sort((a, b) => b.s.value - a.s.value).slice(0, 8);
  const viaDist = orders.filter((o) => !isWholesale(o));
  const viaWhole = orders.filter(isWholesale);
  const cities = useMemo(() => {
    const m = new Map<string, { v: number; n: number }>();
    for (const o of orders) { const e = m.get(o.city) ?? { v: 0, n: 0 }; e.v += o.value; e.n++; m.set(o.city, e); }
    return [...m.entries()].sort((a, b) => b[1].v - a[1].v).slice(0, 8);
  }, [orders]);

  return (
    <div className="flex flex-col gap-5">
      <BuyerScopeBar />

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-7" title={`${plan.month} target`} subtitle={`Monthly targets of ${people.length} salesperson${people.length === 1 ? "" : "s"} in scope · day ${plan.daysGone} of ${plan.daysGone + plan.daysLeft}`}>
          {sellerFiltered ? (
            <div className="rounded-lg bg-background-subtle px-4 py-3">
              <div className="type-h1 tabular-nums">{lakh(plan.achieved)}</div>
              <p className="type-caption text-foreground-secondary">
                sold this month through {scope.distributor !== 'All' ? scope.distributor : `${scope.sellerType.toLowerCase()}s`} · {lakh(plan.perDay)} a day
              </p>
              <p className="type-caption mt-2 text-warning-foreground">Targets count sales through every seller — clear Seller type and Seller to track the {plan.month} target.</p>
            </div>
          ) : (
            <>
              <TargetBar achieved={plan.achieved} target={plan.target} expected={plan.expected}
                achievedText={lakh(plan.achieved)} targetText={lakh(plan.target)} expectedText={lakh(plan.expected)} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Big label="Still to go" value={plan.toGo ? lakh(plan.toGo) : 'Done'} note={`${plan.daysLeft} days left in ${plan.month}`} tone={plan.toGo ? undefined : 'success'} />
                <Big label="Needed per day" value={lakh(plan.needPerDay)} note="to hit target from tomorrow" tone={plan.needPerDay > plan.perDay * 1.15 ? 'error' : undefined} />
                <Big label="Doing per day" value={lakh(plan.perDay)} note={plan.perDay >= plan.needPerDay ? 'on track' : `${lakh(plan.needPerDay - plan.perDay)} a day short`} tone={plan.perDay >= plan.needPerDay ? 'success' : 'warning'} />
              </div>
            </>
          )}
        </Panel>

        <div className="col-span-5 grid grid-rows-3 gap-3">
          {periods.map((p) => (
            <Card
              key={p.key} variant="interactive" className="grid grid-cols-[96px_1fr_1fr_1fr] items-center gap-3 px-4 py-2.5"
              onClick={() => showOrders(`${p.label} · ${p.sub}`, () => true, [p.from, TODAY])}
            >
              <span className="leading-tight">
                <span className="type-label block">{p.label}</span>
                <span className="type-caption block text-foreground-tertiary">{p.sub}</span>
              </span>
              <Mini label="Orders" value={num(p.s.orders)} />
              <Mini label="Sales" value={lakh(p.s.value)} />
              <Mini label="Shops · new" value={`${num(p.s.customers)} · ${num(p.newShops)}`} />
            </Card>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Sales" value={lakh(s.value)} {...kpiDelta(s.value, prev?.value)} note={prevNote(lakh(prev?.value ?? 0))}
          onOpen={() => showOrders('All orders', () => true)} />
        <KpiCard label="Orders" value={num(s.orders)} {...kpiDelta(s.orders, prev?.orders)} note={prevNote(num(prev?.orders ?? 0))}
          onOpen={() => showOrders('All orders', () => true)} />
        <KpiCard label="Shops ordered" value={num(s.customers)} {...kpiDelta(s.customers, prev?.customers)} note={`of ${num(shops.length)} shops`}
          onOpen={() => drill.open({ kind: 'customers', title: 'Shops that ordered', where: (c) => c.orders > 0 })} />
        <KpiCard label="New shops onboarded" value={num(newShops)} {...kpiDelta(newShops, before?.newShops)} note={before ? `${num(before.newShops)} before` : 'joined in the range'}
          onOpen={() => drill.open({ kind: 'customers', title: 'New shops', where: (c) => c.isNew })} />
        <KpiCard label="Avg order value" value={inr(s.aov)} {...kpiDelta(s.aov, prev?.aov)} note={prevNote(inr(prev?.aov ?? 0))} />
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-8" title={`Sales per ${days === 1 ? 'hour' : days > 45 ? 'week' : 'day'}`} subtitle={`${lakh(s.value)} from ${num(s.orders)} orders · click a bar for its orders`}>
          <Bars
            height={190}
            items={series.map((b) => ({ key: b.title, label: b.label, title: b.title, value: b.beat + b.nonBeat, display: lakh(b.beat + b.nonBeat), note: `${b.orders} orders` }))}
            target={barGoal && !sellerFiltered ? { value: barGoal, label: `${days > 45 ? 'weekly' : 'daily'} target ${lakh(barGoal)}` } : undefined}
            onBar={(k) => { const b = series.find((x) => x.title === k)!; showOrders(`Orders · ${b.title}`, (o) => o.at >= b.from && o.at < b.to); }}
          />
        </Panel>

        <AttentionCard
          className="col-span-4"
          items={[
            { count: silentBAs.length, title: 'Salespersons with no order today', detail: `${people.length - silentBAs.length} of ${people.length} have booked today`, tone: 'error',
              onClick: () => drill.open({ kind: 'bas', title: 'No order today', where: (r) => r.today === 0 }) },
            { count: dormant.length, title: 'Shops not ordered in 30 days', detail: 'call them back this week', tone: 'warning',
              onClick: () => drill.open({ kind: 'customers', title: 'Shops not ordered in 30 days', where: (c) => c.status === 'Dormant' }) },
            { count: waiting.length, title: 'Orders waiting over 2 days', detail: `${lakh(sum(waiting))} not yet dispatched by the seller`, tone: 'warning',
              onClick: () => showOrders('Waiting over 2 days', (o) => o.status === 'Active' && (TODAY.getTime() - o.at.getTime()) / DAY > 2) },
            { count: cancelled.length, title: 'Orders cancelled', detail: `${lakh(sum(cancelled))} of sales lost`, tone: 'error',
              onClick: () => showOrders('Cancelled orders', (o) => o.status === 'Cancelled') },
          ]}
        />

        <Panel className="col-span-6" title="Salesperson leaderboard" subtitle="Sales in the range · tick = target due for these dates · click a name"
          onOpen={() => drill.open({ kind: 'bas', title: 'All salespersons', where: () => true })}>
          <RankBars
            rows={topPeople.map((r) => ({ key: r.name, label: r.name, sub: `${r.city} · ${r.achievement.toFixed(0)}% of what's due`, value: r.s.value, display: lakh(r.s.value), target: r.target, tone: paceTone(r.achievement) }))}
            onRow={(k) => drill.open({ kind: 'ba', name: k })}
          />
          <div className="type-caption mt-3 flex gap-4 text-foreground-secondary">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />On target</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-warning" />Slightly behind</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-error" />Behind</span>
          </div>
        </Panel>

        <Panel className="col-span-6" title="Top sellers" subtitle="Distributors and wholesalers by sales in the range · click a seller"
          onOpen={() => drill.open({ kind: 'distributors', title: 'All sellers', where: () => true })}>
          {topSellers.length ? (
            <RankBars
              rows={topSellers.map((d) => ({
                key: d.name, label: d.name, sub: `${d.d.city} · ${num(d.s.orders)} orders`, value: d.s.value, display: lakh(d.s.value),
                badge: <Badge variant={d.d.type === 'Wholesaler' ? 'accent' : 'info'}>{d.d.type === 'Wholesaler' ? 'W' : 'D'}</Badge>,
              }))}
              onRow={(k) => drill.open({ kind: 'distributor', name: k })}
            />
          ) : <p className="type-caption text-foreground-secondary">No orders in this scope.</p>}
          <p className="type-caption mt-3 text-foreground-secondary">D = distributor · W = wholesaler</p>
        </Panel>

        <Panel className="col-span-4" title="Distributors vs wholesalers" subtitle="Share of sales · click a slice">
          <Donut
            center={lakh(s.value)} centerLabel="total sales"
            parts={[
              { key: 'Distributor', label: 'Distributors', value: sum(viaDist), display: lakh(sum(viaDist)), colour: 'bg-chart-blue' },
              { key: 'Wholesaler', label: 'Wholesalers', value: sum(viaWhole), display: lakh(sum(viaWhole)), colour: 'bg-chart-violet' },
            ]}
            onPart={(k) => showOrders(`Sales via ${k.toLowerCase()}s`, (o) => isWholesale(o) === (k === 'Wholesaler'))}
          />
          <p className="type-caption mt-3 text-foreground-secondary">
            Avg order · distributor {inr(summarize(viaDist).aov)} · wholesaler {inr(summarize(viaWhole).aov)}
          </p>
        </Panel>

        <Panel className="col-span-4" title="How orders came in" subtitle="Booked by the salesperson on a beat visit, or placed by the shop in the app">
          <Donut
            center={num(s.orders)} centerLabel="orders"
            parts={[
              { key: 'beat', label: 'Beat visit', value: s.beat, display: num(s.beat), colour: 'bg-chart-teal' },
              { key: 'self', label: 'Shop self-order', value: s.orders - s.beat, display: num(s.orders - s.beat), colour: 'bg-chart-sky' },
            ]}
            onPart={(k) => showOrders(k === 'beat' ? 'Beat orders' : 'Shop self-orders', (o) => o.beat === (k === 'beat'))}
          />
        </Panel>

        <Panel className="col-span-4" title="Order status" subtitle="Where the orders in the range are now">
          <Donut
            center={num(s.orders)} centerLabel="orders"
            parts={[
              { key: 'Delivered', label: 'Delivered', value: s.delivered, display: num(s.delivered), colour: 'bg-success' },
              { key: 'open', label: 'On the way', value: s.active + s.transit, display: num(s.active + s.transit), colour: 'bg-info' },
              { key: 'Cancelled', label: 'Cancelled', value: s.cancelled, display: num(s.cancelled), colour: 'bg-error' },
            ]}
            onPart={(k) => showOrders(k === 'open' ? 'Orders on the way' : `${k} orders`, (o) => (k === 'open' ? o.status === 'Active' || o.status === 'In Transit' : o.status === k))}
          />
        </Panel>

        <Panel className="col-span-7" title="Sales by city" subtitle="Top cities in the range · click a city for its orders">
          {cities.length ? (
            <RankBars
              ranked={false}
              rows={cities.map(([city, e]) => ({ key: city, label: city, sub: `${num(e.n)} orders`, value: e.v, display: lakh(e.v) }))}
              onRow={(c) => showOrders(`Orders · ${c}`, (o) => o.city === c)}
            />
          ) : <p className="type-caption text-foreground-secondary">No orders in this scope.</p>}
        </Panel>

        <Handoff
          className="col-span-5"
          go={go}
          report="buyer-customer-orders"
          title="Need the order-level data?"
          body="Customer Orders (salesperson-wise) and Distributor Orders run with these filters and download as Excel."
          cta="Run Customer Orders report"
        />
      </div>
    </div>
  );
}

function Big({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'success' | 'warning' | 'error' }) {
  return (
    <div className="rounded-lg bg-background-subtle px-3 py-2.5">
      <div className="type-caption text-foreground-secondary">{label}</div>
      <div className={cn('type-h1 tabular-nums', tone === 'success' && 'text-success-foreground', tone === 'warning' && 'text-warning-foreground', tone === 'error' && 'text-error-foreground')}>{value}</div>
      <div className="type-caption text-foreground-tertiary">{note}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="leading-tight">
      <span className="type-caption block text-foreground-secondary">{label}</span>
      <span className="type-h3 block tabular-nums">{value}</span>
    </span>
  );
}
