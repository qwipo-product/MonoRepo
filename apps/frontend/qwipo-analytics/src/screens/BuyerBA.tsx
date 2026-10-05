// DigiDukaan · Buyer — BA performance, the sales lead's view of the whole
// team. Team-level KPIs on top; then comparisons that answer "who is best at
// what" — target pace, coverage, beat discipline, onboarding, retention —
// instead of a 15-column table. One BA = search or click → their drill-down
// dashboard (orders, customers, revenue, onboarding, order status, call list).
import { useMemo } from 'react';
import { HBars } from '@mockups/components';
import { KpiCard, Panel } from '../components/dashboard';
import { Handoff } from '../components/Handoff';
import { AttentionCard, BuyerScopeBar } from '../components/buyerKit';
import { LeaderCard, Quadrant, TargetMeters } from '../components/buyerCharts';
import { useBuyerDrill } from '../components/buyerDrillContext';
import { dmy, kpiDelta, lakh, num, pctOf } from '../components/buyerFormat';
import { TODAY, leads } from '../data/buyer';
import { PACE_LOW, PACE_OK, baStats, type BaStat } from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

type Leader = {
  title: string; hint: string; accent: string; metric: (r: BaStat) => number; fmt: (r: BaStat) => string; sub: (r: BaStat) => string; avg: (rs: BaStat[]) => string;
  /** rate-based rankings only count BAs with enough orders to mean something */
  minOrders?: number;
};

export default function BuyerBA({ go }: { go: (p: Page | string) => void }) {
  const { s: scope, setS } = useBuyerScope();
  const drill = useBuyerDrill();
  const rows = useMemo(() => baStats(scope), [scope]);

  const k = useMemo(() => {
    const sum = (f: (r: BaStat) => number) => rows.reduce((a, r) => a + f(r), 0);
    const value = sum((r) => r.s.value), orders = sum((r) => r.s.orders);
    const prevValue = rows.some((r) => r.prevValue != null) ? sum((r) => r.prevValue ?? 0) : null;
    return {
      value, prevValue, target: sum((r) => r.target), orders,
      customers: sum((r) => r.customers), ordering: sum((r) => r.ordering),
      newCustomers: sum((r) => r.newCustomers),
      selling: rows.filter((r) => r.s.orders > 0).length,
      today: sum((r) => r.today), todayValue: sum((r) => r.todayValue), todayBAs: rows.filter((r) => r.today > 0).length,
      dormant: sum((r) => r.dormant), kyc: sum((r) => r.kycPending), cancel: sum((r) => r.s.cBA), never: sum((r) => r.never),
      beat: orders ? (sum((r) => r.s.beat) / orders) * 100 : 0,
    };
  }, [rows]);

  const ach = k.target ? (k.value / k.target) * 100 : 0;
  const openBa = (name: string) => drill.open({ kind: 'ba', name });
  const behind = rows.filter((r) => r.achievement < PACE_LOW);
  const silent = rows.filter((r) => r.today === 0);
  const byAch = [...rows].sort((a, b) => b.achievement - a.achievement);

  const leaderDefs: Leader[] = [
    { title: 'Revenue', hint: 'order value in range', accent: 'text-chart-blue', metric: (r) => r.s.value, fmt: (r) => lakh(r.s.value), sub: (r) => `${num(r.s.orders)} orders · ${r.achievement.toFixed(0)}% of target`, avg: (rs) => lakh(rs.reduce((a, r) => a + r.s.value, 0) / (rs.length || 1)) },
    { title: 'Customer coverage', hint: 'customers who ordered', accent: 'text-chart-teal', metric: (r) => r.coverage, fmt: (r) => `${r.coverage.toFixed(0)}%`, sub: (r) => `${r.ordering} of ${r.customers} customers`, avg: () => pctOf(k.ordering, k.customers) },
    { title: 'Beat discipline', hint: 'orders on planned visits', accent: 'text-chart-indigo', metric: (r) => r.s.beatShare, fmt: (r) => `${r.s.beatShare.toFixed(0)}%`, sub: (r) => `${num(r.s.beat)} of ${num(r.s.orders)} orders`, avg: () => `${k.beat.toFixed(0)}%`, minOrders: 5 },
    { title: 'New onboarding', hint: 'outlets joined in range', accent: 'text-chart-violet', metric: (r) => r.newCustomers, fmt: (r) => num(r.newCustomers), sub: (r) => `${r.kycPending} KYC pending · ${r.city}`, avg: (rs) => (rs.reduce((a, r) => a + r.newCustomers, 0) / (rs.length || 1)).toFixed(1) },
    { title: 'Customer retention', hint: 'ordered in last 30 days', accent: 'text-chart-cyan', metric: (r) => r.retention, fmt: (r) => `${r.retention.toFixed(0)}%`, sub: (r) => `${r.activeCustomers} active · ${r.dormant} to revive`, avg: (rs) => `${(rs.reduce((a, r) => a + r.retention, 0) / (rs.length || 1)).toFixed(0)}%` },
    { title: 'Fewest cancellations', hint: 'orders the BA cancelled', accent: 'text-chart-sky', metric: (r) => -(r.s.orders ? r.s.cBA / r.s.orders : 0), fmt: (r) => pctOf(r.s.cBA, r.s.orders), sub: (r) => `${r.s.cBA} of ${num(r.s.orders)} orders`, avg: () => pctOf(k.cancel, k.orders), minOrders: 5 },
  ];

  // Teams side by side: achievement and coverage per team lead.
  const teams = leads.map((l) => {
    const t = rows.filter((r) => r.lead === l);
    const value = t.reduce((a, r) => a + r.s.value, 0), target = t.reduce((a, r) => a + r.target, 0);
    const customers = t.reduce((a, r) => a + r.customers, 0), ordering = t.reduce((a, r) => a + r.ordering, 0);
    return { lead: l, n: t.length, value, ach: target ? (value / target) * 100 : 0, coverage: customers ? (ordering / customers) * 100 : 0 };
  }).filter((t) => t.n > 0);

  return (
    <div className="flex flex-col gap-5">
      <BuyerScopeBar />

      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Revenue vs target" value={lakh(k.value)} {...kpiDelta(k.value, k.prevValue)}
          note={`${ach.toFixed(0)}% of ${lakh(k.target)}`} target={ach < PACE_LOW ? 'error' : ach < PACE_OK ? 'warning' : undefined} />
        <KpiCard label="Orders" value={num(k.orders)} change={`${(k.orders / (rows.length || 1)).toFixed(0)}`} trend="flat" note="per BA on average"
          onOpen={() => drill.open({ kind: 'orders', title: 'All orders', where: () => true })} />
        <KpiCard label="BAs selling" value={`${k.selling} / ${rows.length}`} change={`${k.todayBAs}`} trend="flat" note={`booked today · ${dmy(TODAY)}`}
          onOpen={() => drill.open({ kind: 'bas', title: 'All salespersons', where: () => true })} />
        <KpiCard label="Customer coverage" value={pctOf(k.ordering, k.customers)} change={num(k.ordering)} trend="flat" note={`of ${num(k.customers)} customers ordered`}
          onOpen={() => drill.open({ kind: 'customers', title: 'Customers who ordered', where: (c) => c.orders > 0 })} />
        <KpiCard label="New outlets onboarded" value={num(k.newCustomers)} change={`${k.kyc}`} trend="flat" note="KYC still pending overall"
          onOpen={() => drill.open({ kind: 'customers', title: 'New outlets in range', where: (c) => c.isNew })} />
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-8" title="Target achievement" subtitle={`${rows.length} BAs · best first · target = monthly target prorated to the range · click a BA`}>
          {rows.length ? (
            <TargetMeters
              rows={byAch.map((r) => ({ key: r.name, label: r.name, sub: `${r.city} · Team ${r.lead}`, pct: r.achievement, value: lakh(r.s.value) }))}
              onRow={openBa} ok={PACE_OK} low={PACE_LOW}
            />
          ) : <p className="type-caption text-foreground-secondary">No BAs in this scope.</p>}
          <div className="type-caption mt-3 flex gap-4 text-foreground-secondary">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />On pace · {PACE_OK}%+</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-warning" />{PACE_LOW}–{PACE_OK}%</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-error" />Behind · under {PACE_LOW}%</span>
          </div>
        </Panel>

        <div className="col-span-4 flex flex-col gap-4">
          <AttentionCard
            items={[
              { count: behind.length, title: 'BAs behind target pace', detail: `under ${PACE_LOW}% · ${behind.slice(0, 2).map((r) => r.name).join(', ')}${behind.length > 2 ? ` +${behind.length - 2}` : ''}`, tone: 'error',
                onClick: () => drill.open({ kind: 'bas', title: 'Behind target pace', where: (r) => r.achievement < PACE_LOW, note: (r) => `${lakh(r.target - r.s.value)} short` }) },
              { count: silent.length, title: `No order booked today`, detail: `${k.todayBAs} of ${rows.length} BAs have booked · ${lakh(k.todayValue)} so far`, tone: 'warning',
                onClick: () => drill.open({ kind: 'bas', title: 'No order today', where: (r) => r.today === 0, note: (r) => (r.last ? `last order ${dmy(r.last)}` : 'no order in range') }) },
              { count: k.dormant, title: 'Customers to revive', detail: 'no order in 30+ days · on the BA call lists', tone: 'warning',
                onClick: () => drill.open({ kind: 'customers', title: 'Customers to revive', where: (c) => c.status === 'Dormant' }) },
              { count: k.never, title: 'Onboarded but never ordered', detail: 'first order still to come', tone: 'info',
                onClick: () => drill.open({ kind: 'customers', title: 'Never ordered', where: (c) => c.status === 'Never ordered' }) },
              { count: k.cancel, title: 'Orders cancelled by the BA', detail: `${pctOf(k.cancel, k.orders)} of orders`, tone: 'error',
                onClick: () => drill.open({ kind: 'orders', title: 'Cancelled by BA', where: (o) => o.cancelledBy === 'BA' }) },
            ]}
          />
          <Panel title="Teams compared" subtitle="Achievement per team lead · click a team to filter every page to it">
            <HBars
              wideLabel
              rows={teams.map((t) => ({ label: `Team ${t.lead}`, n: Math.round(t.ach), value: `% · ${t.n} BAs`, barClass: t.ach >= PACE_OK ? 'bg-success' : t.ach >= PACE_LOW ? 'bg-warning' : 'bg-error' }))}
              onRow={(l) => setS({ ...scope, team: l.replace('Team ', '') })}
            />
            <div className="mt-4 flex flex-col gap-1 border-t border-border-subtle pt-3">
              {teams.map((t) => (
                <div key={t.lead} className="type-caption flex justify-between text-foreground-secondary">
                  <span>{t.lead}</span><span className="tabular-nums">{lakh(t.value)} · {t.coverage.toFixed(0)}% coverage</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <section className="col-span-12">
          <div className="type-label mb-2.5">Who is best at what</div>
          <div className="grid grid-cols-3 gap-3">
            {leaderDefs.map((l) => {
              const sorted = rows.filter((r) => r.s.orders >= (l.minOrders ?? 0)).sort((a, b) => l.metric(b) - l.metric(a));
              const max = Math.max(...sorted.map((r) => Math.abs(l.metric(r))), 1);
              const low = sorted[sorted.length - 1];
              return (
                <LeaderCard
                  key={l.title} title={l.title} accent={l.accent}
                  rows={sorted.slice(0, 3).map((r) => ({ key: r.name, name: r.name, sub: l.sub(r), value: l.fmt(r), share: (Math.abs(l.metric(r)) / max) * 33 }))}
                  avg={l.avg(rows)}
                  last={sorted.length > 3 ? { key: low.name, name: low.name, value: l.fmt(low) } : undefined}
                  hint={l.minOrders ? `${l.hint} · 5+ orders` : l.hint}
                  onRow={openBa}
                />
              );
            })}
          </div>
        </section>

        <Panel className="col-span-8" title="Coverage against achievement" subtitle="Each dot is a BA · dot size = orders · dashed lines = target pace and team coverage">
          {rows.length ? (
            <Quadrant
              points={rows.map((r) => ({
                key: r.name, label: r.name, x: r.coverage, y: r.achievement, r: 5 + Math.sqrt(r.s.orders) * 0.55,
                tone: r.achievement >= PACE_OK ? 'success' : r.achievement >= PACE_LOW ? 'warning' : 'error',
                tip: `${r.achievement.toFixed(0)}% of target · ${r.coverage.toFixed(0)}% coverage · ${num(r.s.orders)} orders`,
              }))}
              xLabel="Customer coverage %" yLabel="Target achievement %"
              xMid={k.customers ? (k.ordering / k.customers) * 100 : 50} yMid={PACE_OK} xMax={100} yMax={Math.max(150, ...rows.map((r) => r.achievement + 10))}
              xMidLabel={`team ${pctOf(k.ordering, k.customers)}`} yMidLabel={`on pace · ${PACE_OK}%`}
              captions={['Few customers, big orders', 'Covering and converting', 'Needs a coaching visit', 'Wide but shallow']}
              onPick={openBa}
            />
          ) : <p className="type-caption text-foreground-secondary">No BAs in this scope.</p>}
        </Panel>

        <Handoff
          className="col-span-4"
          go={go}
          report="buyer-ba-performance"
          title="Need every BA's numbers in one sheet?"
          body="BA Performance runs with these filters: target, coverage, beat share, today, KYC and customers to revive for each salesperson, downloaded as Excel."
          cta="Run BA Performance report"
        />
      </div>
    </div>
  );
}
