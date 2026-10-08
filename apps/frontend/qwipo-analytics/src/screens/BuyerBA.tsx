// DigiDukaan · Buyer — BA performance, for the sales lead running a team.
// The questions a lead asks every day: is the team on target, who has booked
// today, how many shops did each salesperson onboard, how many orders did
// they bring this week. KPIs, one scoreboard that switches between those
// numbers, star performers, teams side by side. One salesperson = search or
// click → their dashboard (today / week / month, target, orders, call list).
import { useMemo, useState } from 'react';
import { SegmentedControl } from '@mockups/ui';
import { KpiCard, Panel } from '../components/dashboard';
import { Handoff } from '../components/Handoff';
import { AttentionCard, BuyerScopeBar } from '../components/buyerKit';
import { Bars, RankBars, TopThree, type Tone } from '../components/buyerCharts';
import { useBuyerDrill } from '../components/buyerDrillContext';
import { dmy, kpiDelta, lakh, num, pctOf } from '../components/buyerFormat';
import { TODAY, leads } from '../data/buyer';
import { PACE_LOW, PACE_OK, baStats, customerStats, rangeDays, type BaStat } from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const DAY = 86400000;
const paceTone = (pct: number): Tone => (pct >= PACE_OK ? 'success' : pct >= PACE_LOW ? 'warning' : 'error');

type Metric = 'sales' | 'orders' | 'today' | 'newShops' | 'shops';
const METRICS: { key: Metric; label: string; value: (r: BaStat) => number; display: (r: BaStat) => string; sub: (r: BaStat) => string }[] = [
  { key: 'sales', label: 'Sales vs target', value: (r) => r.s.value, display: (r) => `${lakh(r.s.value)} · ${r.achievement.toFixed(0)}%`, sub: (r) => `${r.city} · ${lakh(r.target)} due` },
  { key: 'orders', label: 'Orders', value: (r) => r.s.orders, display: (r) => num(r.s.orders), sub: (r) => `${r.city} · avg ${lakh(r.s.aov)}` },
  { key: 'today', label: 'Orders today', value: (r) => r.today, display: (r) => `${r.today} · ${lakh(r.todayValue)}`, sub: (r) => `${r.city} · ${r.last ? `last order ${dmy(r.last)}` : 'no order in range'}` },
  { key: 'newShops', label: 'New shops', value: (r) => r.newCustomers, display: (r) => num(r.newCustomers), sub: (r) => `${r.city} · ${r.kycPending} KYC pending` },
  { key: 'shops', label: 'Shops ordered', value: (r) => r.ordering, display: (r) => `${r.ordering} of ${r.customers}`, sub: (r) => `${r.city} · ${r.coverage.toFixed(0)}% of their shops` },
];

export default function BuyerBA({ go }: { go: (p: Page | string) => void }) {
  const { s: scope, setS } = useBuyerScope();
  const drill = useBuyerDrill();
  const [metric, setMetric] = useState<Metric>('sales');
  const rows = useMemo(() => baStats(scope), [scope]);
  const shops = useMemo(() => customerStats(scope), [scope]);
  const openBa = (name: string) => drill.open({ kind: 'ba', name });

  const k = useMemo(() => {
    const sum = (f: (r: BaStat) => number) => rows.reduce((a, r) => a + f(r), 0);
    return {
      value: sum((r) => r.s.value), target: sum((r) => r.target),
      prevValue: rows.some((r) => r.prevValue != null) ? sum((r) => r.prevValue ?? 0) : null,
      orders: sum((r) => r.s.orders), customers: sum((r) => r.customers), ordering: sum((r) => r.ordering),
      newShops: sum((r) => r.newCustomers), kyc: sum((r) => r.kycPending), dormant: sum((r) => r.dormant),
      today: sum((r) => r.today), todayValue: sum((r) => r.todayValue), bookedToday: rows.filter((r) => r.today > 0).length,
    };
  }, [rows]);
  const ach = k.target ? (k.value / k.target) * 100 : 0;
  // Targets count sales through every seller, so a seller filter makes "% of target" meaningless.
  const sellerFiltered = scope.sellerType !== 'All' || scope.distributor !== 'All';
  const behind = rows.filter((r) => r.achievement < PACE_LOW);
  const silent = rows.filter((r) => r.today === 0);
  const noNewShop = rows.filter((r) => r.newCustomers === 0);

  const m = METRICS.find((x) => x.key === metric)!;
  const board = [...rows].sort((a, b) => m.value(b) - m.value(a));
  const top3 = (f: (r: BaStat) => number, fmt: (r: BaStat) => string, sub: (r: BaStat) => string) =>
    [...rows].filter((r) => f(r) > 0).sort((a, b) => f(b) - f(a)).slice(0, 3).map((r) => ({ key: r.name, name: r.name, sub: sub(r), value: fmt(r) }));

  const teams = leads.map((l) => {
    const t = rows.filter((r) => r.lead === l);
    const value = t.reduce((a, r) => a + r.s.value, 0), target = t.reduce((a, r) => a + r.target, 0);
    return { lead: l, n: t.length, value, ach: target ? (value / target) * 100 : 0 };
  }).filter((t) => t.n > 0);

  // New shops onboarded per week of the range (per day for a short range).
  const step = rangeDays(scope) <= 10 ? 1 : 7;
  const start = new Date(scope.from.getFullYear(), scope.from.getMonth(), scope.from.getDate());
  const weeks = Array.from({ length: Math.min(14, Math.ceil(rangeDays(scope) / step)) }, (_, i) => {
    const from = new Date(start.getTime() + i * step * DAY);
    const to = new Date(Math.min(from.getTime() + step * DAY, scope.to.getTime() + DAY));
    return { key: `${from.getDate()}/${from.getMonth() + 1}`, from, to, n: shops.filter((c) => c.c.onboarded >= from && c.c.onboarded < to).length };
  });

  return (
    <div className="flex flex-col gap-5">
      <BuyerScopeBar />

      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Team sales vs target" value={lakh(k.value)} {...kpiDelta(k.value, k.prevValue)}
          note={sellerFiltered ? 'targets count every seller — clear the seller filters' : `${ach.toFixed(0)}% of ${lakh(k.target)} due for these dates`}
          target={sellerFiltered ? undefined : ach < PACE_LOW ? 'error' : ach < PACE_OK ? 'warning' : undefined}
          onOpen={() => drill.open({ kind: 'orders', title: 'All orders', where: () => true })} />
        <KpiCard label="Orders" value={num(k.orders)} change={(k.orders / (rows.length || 1)).toFixed(0)} trend="flat" note="per salesperson"
          onOpen={() => drill.open({ kind: 'orders', title: 'All orders', where: () => true })} />
        <KpiCard label="Booked today" value={`${k.bookedToday} / ${rows.length}`} change={num(k.today)} trend="flat" note={`orders today · ${lakh(k.todayValue)}`}
          target={k.bookedToday < rows.length / 2 ? 'warning' : undefined}
          onOpen={() => drill.open({ kind: 'orders', title: `Today · ${dmy(TODAY)}`, where: () => true, range: [TODAY, TODAY] })} />
        <KpiCard label="New shops onboarded" value={num(k.newShops)} change={num(k.kyc)} trend="flat" note="still KYC pending"
          onOpen={() => drill.open({ kind: 'customers', title: 'New shops', where: (c) => c.isNew })} />
        <KpiCard label="Shops ordered" value={num(k.ordering)} change={pctOf(k.ordering, k.customers)} trend="flat" note={`of ${num(k.customers)} shops`}
          onOpen={() => drill.open({ kind: 'customers', title: 'Shops that ordered', where: (c) => c.orders > 0 })} />
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-8"
          title="Salesperson scoreboard"
          subtitle={`${rows.length} salespersons · best first · click a name for their dashboard`}
        >
          <SegmentedControl className="mb-3" options={METRICS.map((x) => ({ value: x.key, label: <span className="whitespace-nowrap">{x.label}</span> }))} value={metric} onChange={(v) => setMetric(v as Metric)} />
          {rows.length ? (
            <RankBars
              rows={board.map((r) => ({
                key: r.name, label: r.name, sub: m.sub(r), value: m.value(r), display: m.display(r),
                target: metric === 'sales' ? r.target : undefined,
                tone: metric === 'sales' ? paceTone(r.achievement) : metric === 'today' && r.today === 0 ? 'muted' : 'brand',
              }))}
              onRow={openBa}
            />
          ) : <p className="type-caption text-foreground-secondary">No salespersons in this scope.</p>}
          {metric === 'sales' && sellerFiltered && (
            <p className="type-caption mt-3 text-warning-foreground">Targets count sales through every seller — with a seller filter on, the colours understate everyone.</p>
          )}
          {metric === 'sales' && !sellerFiltered && (
            <div className="type-caption mt-3 flex gap-4 text-foreground-secondary">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />On target · {PACE_OK}%+</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-warning" />{PACE_LOW}–{PACE_OK}%</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-error" />Behind · under {PACE_LOW}%</span>
              <span className="ml-auto">tick = target due for these dates</span>
            </div>
          )}
        </Panel>

        <div className="col-span-4 flex flex-col gap-4">
          <AttentionCard
            items={[
              { count: silent.length, title: 'No order booked today', detail: `${k.bookedToday} of ${rows.length} salespersons have booked`, tone: 'error',
                onClick: () => drill.open({ kind: 'bas', title: 'No order today', where: (r) => r.today === 0, note: (r) => (r.last ? `last order ${dmy(r.last)}` : 'no order in range') }) },
              { count: behind.length, title: 'Behind target', detail: `under ${PACE_LOW}% of the target due for these dates`, tone: 'error',
                onClick: () => drill.open({ kind: 'bas', title: 'Behind target', where: (r) => r.achievement < PACE_LOW, note: (r) => `${lakh(Math.max(0, r.target - r.s.value))} to go` }) },
              { count: noNewShop.length, title: 'No new shop onboarded', detail: 'in the selected range', tone: 'warning',
                onClick: () => drill.open({ kind: 'bas', title: 'No new shop onboarded', where: (r) => r.newCustomers === 0 }) },
              { count: k.dormant, title: 'Shops to call back', detail: 'no order in 30+ days', tone: 'warning',
                onClick: () => drill.open({ kind: 'customers', title: 'Shops to call back', where: (c) => c.status === 'Dormant' }) },
            ]}
          />
          <Panel title="Teams compared" subtitle="% of target per team lead · click a team to filter every page">
            <Bars
              height={130}
              items={teams.map((t) => ({ key: t.lead, label: t.lead.split(' ')[0], title: `Team ${t.lead}`, value: t.ach, display: `${t.ach.toFixed(0)}%`, note: `${lakh(t.value)} · ${t.n} salespersons` }))}
              target={{ value: 100, label: 'target' }}
              onBar={(lead) => setS({ ...scope, team: lead })}
            />
          </Panel>
        </div>

        <section className="col-span-12">
          <div className="type-label mb-2.5">Star performers · {dmy(scope.from)} to {dmy(scope.to)}</div>
          <div className="grid grid-cols-4 gap-3">
            <TopThree title="Highest sales" accent="text-chart-blue" onRow={openBa}
              rows={top3((r) => r.s.value, (r) => lakh(r.s.value), (r) => `${r.achievement.toFixed(0)}% of target`)} />
            <TopThree title="Most orders" accent="text-chart-teal" onRow={openBa}
              rows={top3((r) => r.s.orders, (r) => num(r.s.orders), (r) => `${r.city} · ${r.today} today`)} />
            <TopThree title="Most new shops" accent="text-chart-violet" onRow={openBa}
              rows={top3((r) => r.newCustomers, (r) => num(r.newCustomers), (r) => `${r.city} · ${r.kycPending} KYC pending`)} />
            <TopThree title="Most shops ordering" accent="text-chart-indigo" onRow={openBa}
              rows={top3((r) => r.ordering, (r) => num(r.ordering), (r) => `${r.coverage.toFixed(0)}% of their shops`)} />
          </div>
        </section>

        <Panel className="col-span-7" title={`New shops onboarded per ${step === 1 ? 'day' : 'week'}`} subtitle={`${num(k.newShops)} in the range · click a bar for the shops`}>
          <Bars
            height={150}
            tone="success"
            items={weeks.map((w) => ({ key: w.key, label: w.key, title: `From ${dmy(w.from)}`, value: w.n, display: num(w.n) }))}
            onBar={(key) => {
              const w = weeks.find((x) => x.key === key)!;
              drill.open({ kind: 'customers', title: `Onboarded from ${dmy(w.from)}`, where: (c) => c.c.onboarded >= w.from && c.c.onboarded < w.to, note: (c) => `onboarded ${dmy(c.c.onboarded)} · ${c.c.ba}` });
            }}
          />
        </Panel>

        <Handoff
          className="col-span-5"
          go={go}
          report="buyer-ba-performance"
          title="Need every salesperson's numbers in one sheet?"
          body="BA Performance runs with these filters: target, achievement, orders, today, new shops and shops to call back for each salesperson, downloaded as Excel."
          cta="Run BA Performance report"
        />
      </div>
    </div>
  );
}
