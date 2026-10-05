// DigiDukaan · Buyer — Sales Dashboard: sales across every distributor, read
// at a glance. KPIs first, then the comparisons a sales head decides on —
// who wins on beat vs non-beat, who is growing, who cancels — and every mark
// drills into a distributor, BA or customer dashboard. No tables here: the
// row-level data is the Distributor Orders / Customer Orders reports.
import { useMemo } from 'react';
import { Badge, cn } from '@mockups/ui';
import { Columns, HBars, Stat, StackBar } from '@mockups/components';
import { KpiCard, Panel } from '../components/dashboard';
import { Handoff } from '../components/Handoff';
import { AttentionCard, BuyerScopeBar } from '../components/buyerKit';
import { BeatLegend, Quadrant, SplitBars, ValueBars } from '../components/buyerCharts';
import { useBuyerDrill } from '../components/buyerDrillContext';
import { ago, inr, kpiDelta, lakh, num } from '../components/buyerFormat';
import { TODAY, scopedOrders, type BuyerOrder, type OrderStatus } from '../data/buyer';
import { buckets, distributorStats, previousScope, rangeDays, summarize, type DistStat } from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const DAY = 86400000;
const statusBg: Record<OrderStatus, string> = { Active: 'bg-info', 'In Transit': 'bg-warning', Delivered: 'bg-success', Cancelled: 'bg-error' };
const sourceBg = { BA: 'bg-chart-indigo', Distributor: 'bg-error', Retailer: 'bg-warning' } as const;

export default function BuyerSales({ go }: { go: (p: Page | string) => void }) {
  const { s: scope } = useBuyerScope();
  const drill = useBuyerDrill();
  const orders = useMemo(() => scopedOrders(scope), [scope]);
  const s = useMemo(() => summarize(orders), [orders]);
  const prev = useMemo(() => { const p = previousScope(scope); return p ? summarize(scopedOrders(p)) : null; }, [scope]);
  const dists = useMemo(() => distributorStats(scope), [scope]);
  const series = useMemo(() => buckets(orders, scope), [orders, scope]);

  const showOrders = (title: string, where: (o: BuyerOrder) => boolean) => drill.open({ kind: 'orders', title, where });
  const showDist = (name: string) => drill.open({ kind: 'distributor', name });
  const prevNote = (v: string) => (prev ? `${v} before` : 'no earlier period');
  const days = rangeDays(scope);

  // Attention: what a sales head should chase today.
  const quiet = dists.filter((d) => !d.lastEver || (scope.to.getTime() - d.lastEver.getTime()) / DAY > 7);
  const stuck = orders.filter((o) => o.status === 'Active' && (TODAY.getTime() - o.at.getTime()) / DAY > 2);
  const highCancel = dists.filter((d) => d.s.orders >= 10 && d.s.cancelRate > s.cancelRate + 5);
  const names = (xs: DistStat[]) => xs.slice(0, 2).map((d) => d.name).join(', ') + (xs.length > 2 ? ` +${xs.length - 2} more` : '');

  const active = dists.filter((d) => d.s.orders > 0);
  const byBeat = [...active].sort((a, b) => b.s.beatShare - a.s.beatShare);
  const splitRows = (xs: DistStat[]) => xs.map((d) => ({ key: d.name, label: d.name, sub: d.d.city, a: d.s.beat, b: d.s.orders - d.s.beat }));
  const leaders = [...dists].sort((a, b) => b.s.value - a.s.value);
  const top = leaders.slice(0, 5);
  const tail = leaders.slice(5);
  const growth = active.filter((d) => d.growth != null);
  const gMax = Math.min(200, Math.max(20, Math.ceil(Math.max(...growth.map((d) => d.growth!), 0) / 10) * 10));
  const gMin = Math.max(-80, Math.min(-20, Math.floor(Math.min(...growth.map((d) => d.growth!), 0) / 10) * 10));
  const vMax = Math.max(1, ...active.map((d) => d.s.value / 100000)) * 1.08;
  const vMid = active.length ? [...active].sort((a, b) => a.s.value - b.s.value)[Math.floor(active.length / 2)].s.value / 100000 : 0;
  const cancelWorst = active.filter((d) => d.s.orders >= 10).sort((a, b) => b.s.cancelRate - a.s.cancelRate).slice(0, 6);
  const closed = s.delivered + s.cancelled;

  return (
    <div className="flex flex-col gap-5">
      <BuyerScopeBar />

      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Orders" value={num(s.orders)} {...kpiDelta(s.orders, prev?.orders)} note={prevNote(num(prev?.orders ?? 0))}
          onOpen={() => showOrders('All orders', () => true)} />
        <KpiCard label="Order value" value={lakh(s.value)} {...kpiDelta(s.value, prev?.value)} note={prevNote(lakh(prev?.value ?? 0))}
          onOpen={() => showOrders('All orders', () => true)} />
        <KpiCard label="Avg order value" value={inr(s.aov)} {...kpiDelta(s.aov, prev?.aov)} note={prevNote(inr(prev?.aov ?? 0))} />
        <KpiCard label="Beat orders" value={`${s.beatShare.toFixed(1)}%`} {...kpiDelta(s.beatShare, prev?.beatShare, 'pts')} note={`${num(s.beat)} on planned visits`}
          onOpen={() => showOrders('Beat orders', (o) => o.beat)} />
        <KpiCard label="Cancellation rate" value={`${s.cancelRate.toFixed(1)}%`} {...kpiDelta(s.cancelRate, prev?.cancelRate, 'pts')} inverse
          note={`${num(s.cancelled)} cancelled`} target={s.cancelRate > 20 ? 'error' : s.cancelRate > 15 ? 'warning' : undefined}
          onOpen={() => showOrders('Cancelled orders', (o) => o.status === 'Cancelled')} />
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-8"
          title={`Order value per ${days === 1 ? 'hour' : days > 45 ? 'week' : 'day'}`}
          subtitle={`${lakh(s.value)} · ${num(s.orders)} orders · click a bar for its orders`}
        >
          <ValueBars data={series} onBar={(b) => showOrders(`Orders · ${b.title}`, (o) => o.at >= b.from && o.at < b.to)} />
          <BeatLegend beat={lakh(orders.filter((o) => o.beat).reduce((a, o) => a + o.value, 0))} nonBeat={lakh(orders.filter((o) => !o.beat).reduce((a, o) => a + o.value, 0))} />
        </Panel>

        <AttentionCard
          className="col-span-4"
          items={[
            { count: quiet.length, title: `Distributors with no order in 7 days`, detail: names(quiet), tone: 'error',
              onClick: () => drill.open({ kind: 'distributors', title: 'Distributors gone quiet', where: (d) => quiet.some((q) => q.name === d.name), note: (d) => (d.lastEver ? `last order ${ago(d.lastEver)}` : 'never ordered') }) },
            { count: stuck.length, title: 'Orders not dispatched after 2 days', detail: `${lakh(stuck.reduce((a, o) => a + o.value, 0))} waiting · still Active`, tone: 'warning',
              onClick: () => showOrders('Not dispatched after 2 days', (o) => o.status === 'Active' && (TODAY.getTime() - o.at.getTime()) / DAY > 2) },
            { count: highCancel.length, title: 'Distributors cancelling far above average', detail: `over ${(s.cancelRate + 5).toFixed(0)}% vs ${s.cancelRate.toFixed(1)}% overall · ${names(highCancel)}`, tone: 'error',
              onClick: () => drill.open({ kind: 'distributors', title: 'High cancellation', where: (d) => highCancel.some((h) => h.name === d.name), note: (d) => `${d.s.cancelRate.toFixed(1)}% cancelled · ${d.s.cDist} by distributor` }) },
            { count: s.cDist, title: 'Orders cancelled by the distributor', detail: `${lakh(orders.filter((o) => o.cancelledBy === 'Distributor').reduce((a, o) => a + o.value, 0))} lost · usually stock-outs`, tone: 'warning',
              onClick: () => showOrders('Cancelled by distributor', (o) => o.cancelledBy === 'Distributor') },
          ]}
        />

        <Panel
          className="col-span-7"
          title="Beat vs non-beat by distributor"
          subtitle={`Dashed line = ${s.beatShare.toFixed(0)}% beat overall · click a distributor for its dashboard`}
        >
          {active.length === 0 ? <p className="type-caption text-foreground-secondary">No orders in this scope.</p> : active.length <= 10 ? (
            <SplitBars rows={splitRows(byBeat)} avg={s.beatShare} onRow={showDist} />
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <div className="type-caption mb-1 font-medium text-chart-blue">Strongest on beat visits</div>
                <SplitBars rows={splitRows(byBeat.slice(0, 5))} avg={s.beatShare} onRow={showDist} />
              </div>
              <div>
                <div className="type-caption mb-1 font-medium text-foreground-secondary">Leaning on non-beat (self / off-beat) orders</div>
                <SplitBars rows={splitRows(byBeat.slice(-5).reverse())} avg={s.beatShare} onRow={showDist} />
              </div>
            </div>
          )}
        </Panel>

        <Panel
          className="col-span-5"
          title="Order status"
          subtitle={`${num(s.orders)} orders · click a bar`}
          onOpen={() => showOrders('All orders', () => true)}
        >
          <Columns
            items={(['Active', 'In Transit', 'Delivered', 'Cancelled'] as const).map((k) => ({
              label: k, bg: statusBg[k],
              n: k === 'Active' ? s.active : k === 'In Transit' ? s.transit : k === 'Delivered' ? s.delivered : s.cancelled,
            }))}
            onBar={(l) => showOrders(`${l} orders`, (o) => o.status === l)}
          />
          <div className="mt-5 flex gap-5">
            <Stat label="Delivery rate" value={closed ? `${((s.delivered / closed) * 100).toFixed(1)}%` : '—'} note={<>{num(s.delivered)} of {num(closed)} closed</>}
              onClick={() => showOrders('Delivered orders', (o) => o.status === 'Delivered')} />
            <Stat label="In flight" value={num(s.active + s.transit)} note={<>Active {num(s.active)} · In Transit {num(s.transit)}</>}
              onClick={() => showOrders('Open orders', (o) => o.status === 'Active' || o.status === 'In Transit')} />
          </div>
          {s.cancelled > 0 && (
            <div className="mt-5 border-t border-border-subtle pt-4">
              <div className="type-caption mb-2 font-medium text-foreground-secondary">Who cancelled the {num(s.cancelled)}</div>
              <StackBar
                parts={([['BA', s.cBA], ['Distributor', s.cDist], ['Retailer', s.cRet]] as const).filter(([, n]) => n > 0).map(([k, n]) => ({
                  key: k, pct: (n / s.cancelled) * 100, label: `${k} ${Math.round((n / s.cancelled) * 100)}%`, bg: sourceBg[k],
                }))}
                onPart={(k) => showOrders(`Cancelled by ${k}`, (o) => o.cancelledBy === k)}
              />
            </div>
          )}
        </Panel>

        <Panel
          className="col-span-5"
          title="Distributor leaderboard"
          subtitle={`${active.length} of ${dists.length} distributors ordering · ${lakh(s.value)}`}
          onOpen={() => drill.open({ kind: 'distributors', title: 'All distributors', where: () => true })}
        >
          {top.map((d, i) => (
            <div key={d.name} className="-mx-1.5 flex cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted" onClick={(e) => { e.stopPropagation(); showDist(d.name); }}>
              <i className="type-caption w-3.5 shrink-0 not-italic text-foreground-tertiary">{i + 1}</i>
              <span className="min-w-0 flex-1">
                <span className="type-body block truncate">{d.name}</span>
                <span className="type-caption block text-foreground-tertiary">{d.d.city} · {num(d.s.orders)} orders · {d.s.beatShare.toFixed(0)}% beat</span>
              </span>
              <b className="type-price-sm">{lakh(d.s.value)}</b>
              {d.growth != null && <Badge variant={d.growth < 0 ? 'danger' : 'success'}>{d.growth < 0 ? '↓' : '↑'} {Math.abs(d.growth).toFixed(0)}%</Badge>}
            </div>
          ))}
          {tail.length > 0 && (
            <div className="type-caption mt-1.5 flex justify-between border-t border-dashed border-border pt-1.5 text-foreground-secondary">
              <span>{tail.length} others</span>
              <span className="tabular-nums">{lakh(tail.reduce((a, d) => a + d.s.value, 0))}</span>
            </div>
          )}
          <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full">
            {top.slice(0, 3).map((d, i) => (
              <i key={d.name} className={cn('block bg-chart-blue', i === 1 && 'opacity-70', i === 2 && 'opacity-45')} style={{ width: `${s.value ? (d.s.value / s.value) * 100 : 0}%` }} />
            ))}
            <i className="block flex-1 bg-background-sunken" />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Size against momentum" subtitle="Order value × growth vs the previous period · dot size = orders · click a dot">
          {growth.length ? (
            <Quadrant
              points={growth.map((d) => ({
                key: d.name, label: d.name.replace(/^(Sri|Shree|Om Sri) /, ''), x: d.s.value / 100000, y: d.growth!,
                r: 5 + Math.sqrt(d.s.orders) * 0.7, tone: d.growth! >= 0 ? 'success' : 'error',
                tip: `${lakh(d.s.value)} · ${num(d.s.orders)} orders · ${d.growth! < 0 ? '↓' : '↑'} ${Math.abs(d.growth!).toFixed(0)}%`,
              }))}
              xLabel="Order value" yLabel="Growth" xMid={vMid} yMid={0} xMax={vMax} yMax={gMax} yMin={gMin}
              xMidLabel={`median ${lakh(vMid * 100000)}`} yMidLabel="no growth"
              captions={['Small, growing', 'Big and growing', 'Small and slipping', 'Big but slipping']}
              onPick={showDist}
            />
          ) : <p className="type-caption text-foreground-secondary">Nothing earlier to compare with — pick a shorter date range.</p>}
        </Panel>

        <Panel className="col-span-7" title="Highest cancellation rate" subtitle={`Distributors with 10+ orders · ${s.cancelRate.toFixed(1)}% overall · click a distributor`}>
          {cancelWorst.length ? (
            <HBars
              wideLabel
              rows={cancelWorst.map((d) => ({
                label: d.name, n: d.s.cancelled, value: `${d.s.cancelRate.toFixed(1)}%`,
                barClass: d.s.cancelRate > s.cancelRate + 5 ? 'bg-error' : d.s.cancelRate > s.cancelRate ? 'bg-warning' : 'bg-border-strong',
              }))}
              onRow={showDist}
            />
          ) : <p className="type-caption text-foreground-secondary">No distributor has 10+ orders in this scope.</p>}
          <p className="type-caption mt-3 text-foreground-secondary">Bar = cancelled orders · red when more than 5 pts above the overall rate.</p>
        </Panel>

        <Handoff
          className="col-span-5"
          go={go}
          report="buyer-customer-orders"
          title="Need the order-level data?"
          body="The tables live in Reports now: Customer Orders (BA-wise) and Distributor Orders run with these filters and download as Excel."
          cta="Run Customer Orders report"
        />
      </div>
    </div>
  );
}
