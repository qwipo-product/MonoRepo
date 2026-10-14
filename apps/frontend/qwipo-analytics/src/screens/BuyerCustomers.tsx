// DigiDukaan · Buyer — Customers: the health of the outlet base, not the
// outlet list. KPIs, the customer journey from onboarding to regular, where
// customers go quiet, who the top buyers are and what blocks KYC. Every bar
// and stage opens the customers behind it, and each customer opens their
// dashboard. The full list is the Customer Database report.
import { useMemo } from 'react';
import { Badge, cn } from '@mockups/ui';
import { Columns, HBars } from '@mockups/components';
import { KpiCard, Panel } from '../components/dashboard';
import { Funnel } from '../components/Funnel';
import { Handoff } from '../components/Handoff';
import { AttentionCard, BuyerScopeBar } from '../components/buyerKit';
import { useBuyerDrill } from '../components/buyerDrillContext';
import { ago, dmy, kpiDelta, lakh, num, pctOf } from '../components/buyerFormat';
import { stateCode, type CustomerStatus } from '../data/buyer';
import { customerStats, previousScope, rangeDays, type CustStat } from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const DAY = 86400000;
const statusBg: Record<CustomerStatus, string> = { Active: 'bg-success', Dormant: 'bg-warning', 'Never ordered': 'bg-border-strong' };
const STATUSES: CustomerStatus[] = ['Active', 'Dormant', 'Never ordered'];

export default function BuyerCustomers({ go }: { go: (p: Page | string) => void }) {
  const { s: scope } = useBuyerScope();
  const drill = useBuyerDrill();
  const rows = useMemo(() => customerStats(scope), [scope]);
  const prevRows = useMemo(() => { const p = previousScope(scope); return p ? customerStats(p) : null; }, [scope]);
  const list = (title: string, where: (c: CustStat) => boolean, note?: (c: CustStat) => string) => drill.open({ kind: 'customers', title, where, note });

  const count = (xs: CustStat[] | null, f: (c: CustStat) => boolean) => (xs ? xs.filter(f).length : null);
  const k = {
    total: rows.length, prevTotal: prevRows?.length ?? null,
    active: count(rows, (c) => c.status === 'Active')!, prevActive: count(prevRows, (c) => c.status === 'Active'),
    dormant: count(rows, (c) => c.status === 'Dormant')!, prevDormant: count(prevRows, (c) => c.status === 'Dormant'),
    isNew: count(rows, (c) => c.isNew)!, prevNew: count(prevRows, (c) => c.isNew),
    kyc: count(rows, (c) => c.c.kyc === 'Pending')!,
    ordering: count(rows, (c) => c.orders > 0)!,
    value: rows.reduce((a, c) => a + c.value, 0),
  };
  const activeShare = k.total ? (k.active / k.total) * 100 : 0;
  const prevActiveShare = prevRows && k.prevTotal ? (k.prevActive! / k.prevTotal) * 100 : null;

  // Journey: every stage is a subset of the one before it.
  const stages: { label: string; n: number; where: (c: CustStat) => boolean }[] = [
    { label: 'Onboarded', n: 0, where: () => true },
    { label: 'First order', n: 0, where: (c) => c.lifetime >= 1 },
    { label: 'Repeat (2+)', n: 0, where: (c) => c.lifetime >= 2 },
    { label: 'Regular (5+)', n: 0, where: (c) => c.lifetime >= 5 },
    { label: 'Active now', n: 0, where: (c) => c.lifetime >= 5 && c.status === 'Active' },
  ];
  for (const st of stages) st.n = rows.filter(st.where).length;

  const never = rows.filter((c) => c.status === 'Never ordered');
  const lostRegulars = rows.filter((c) => c.status === 'Dormant' && c.lifetime >= 5);
  const kycStale = rows.filter((c) => c.c.kyc === 'Pending' && (scope.to.getTime() - c.c.onboarded.getTime()) / DAY > 7);
  const newNoOrder = rows.filter((c) => c.isNew && c.lifetime === 0);

  const cities = useMemo(() => {
    const m = new Map<string, { state: string; n: Record<CustomerStatus, number>; total: number }>();
    for (const c of rows) {
      const e = m.get(c.c.city) ?? { state: c.c.state, n: { Active: 0, Dormant: 0, 'Never ordered': 0 }, total: 0 };
      e.n[c.status]++; e.total++;
      m.set(c.c.city, e);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  }, [rows]);

  // New outlets per week (per day for a short range), by onboarding date.
  const weeks = useMemo(() => {
    const step = rangeDays(scope) <= 10 ? 1 : 7;
    const start = new Date(scope.from.getFullYear(), scope.from.getMonth(), scope.from.getDate());
    const n = Math.min(14, Math.ceil(rangeDays(scope) / step));
    return Array.from({ length: n }, (_, i) => {
      const from = new Date(start.getTime() + i * step * DAY);
      const to = new Date(Math.min(from.getTime() + step * DAY, scope.to.getTime() + DAY));
      return { label: `${from.getDate()}/${from.getMonth() + 1}`, from, to, n: rows.filter((c) => c.c.onboarded >= from && c.c.onboarded < to).length };
    });
  }, [rows, scope]);

  const top = [...rows].filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const kycReasons = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of rows) if (c.c.kyc === 'Pending') m.set(c.c.kycNote!, (m.get(c.c.kycNote!) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <div className="flex flex-col gap-5">
      <BuyerScopeBar />

      <section className="grid grid-cols-5 gap-3">
        <KpiCard label="Customers" value={num(k.total)} {...kpiDelta(k.total, k.prevTotal)} note={`${num(k.ordering)} ordered · ${lakh(k.value)}`}
          onOpen={() => list('All customers', () => true)} />
        <KpiCard label="Active" value={num(k.active)} {...kpiDelta(activeShare, prevActiveShare, 'pts')} note={`${activeShare.toFixed(1)}% ordered in 30 days`}
          onOpen={() => list('Active customers', (c) => c.status === 'Active')} />
        <KpiCard label="New onboarded" value={num(k.isNew)} {...kpiDelta(k.isNew, k.prevNew)} note={k.prevNew != null ? `${num(k.prevNew)} before` : 'joined in the range'}
          onOpen={() => list('New outlets in range', (c) => c.isNew, (c) => `onboarded ${dmy(c.c.onboarded)}`)} />
        <KpiCard label="Dormant" value={num(k.dormant)} {...kpiDelta(k.dormant, k.prevDormant)} inverse note="no order in 30+ days" target={k.total && k.dormant / k.total > 0.2 ? 'warning' : undefined}
          onOpen={() => list('Dormant customers', (c) => c.status === 'Dormant', (c) => `last order ${ago(c.last)}`)} />
        <KpiCard label="KYC pending" value={num(k.kyc)} change={pctOf(k.kyc, k.total)} trend="flat" note="of customers · COD only"
          onOpen={() => list('KYC pending', (c) => c.c.kyc === 'Pending', (c) => c.c.kycNote ?? '')} />
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-7" title="Customer journey" subtitle={`From onboarding to regular buyer · ${num(k.total)} customers onboarded by ${dmy(scope.to)} · click a stage`}>
          {k.total ? (
            <Funnel stages={stages} onStage={(i) => list(`Customers · ${stages[i].label}`, stages[i].where)} />
          ) : <p className="type-caption text-foreground-secondary">No customers in this scope.</p>}
          <p className="type-caption mt-2 text-foreground-secondary">
            <b className="text-foreground">{num(stages[1].n - stages[2].n)}</b> ordered once and stopped · <b className="text-foreground">{num(stages[3].n - stages[4].n)}</b> regulars not seen in 30 days
          </p>
        </Panel>

        <AttentionCard
          className="col-span-5"
          items={[
            { count: lostRegulars.length, title: 'Regular buyers gone quiet', detail: '5+ orders before, nothing in 30 days', tone: 'error',
              onClick: () => list('Regulars gone quiet', (c) => c.status === 'Dormant' && c.lifetime >= 5, (c) => `${c.lifetime} orders · last ${ago(c.last)}`) },
            { count: never.length, title: 'Onboarded, never ordered', detail: 'the BA has to land a first order', tone: 'warning',
              onClick: () => list('Never ordered', (c) => c.status === 'Never ordered', (c) => `onboarded ${dmy(c.c.onboarded)}`) },
            { count: newNoOrder.length, title: 'New this range, no first order yet', detail: `of ${num(k.isNew)} onboarded in the range`, tone: 'info',
              onClick: () => list('New, no first order', (c) => c.isNew && c.lifetime === 0, (c) => `onboarded ${dmy(c.c.onboarded)}`) },
            { count: kycStale.length, title: 'KYC pending over 7 days', detail: 'can only order cash on delivery', tone: 'warning',
              onClick: () => list('KYC pending over 7 days', (c) => c.c.kyc === 'Pending' && (scope.to.getTime() - c.c.onboarded.getTime()) / DAY > 7, (c) => c.c.kycNote ?? '') },
          ]}
        />

        <Panel className="col-span-7" title="Where customers go quiet" subtitle="Top cities · active, dormant and never ordered · click a city">
          <div className="flex flex-col gap-1.5">
            {cities.map(([city, e]) => (
              <div
                key={city}
                className="type-caption -mx-1 grid cursor-pointer grid-cols-[150px_1fr_92px] items-center gap-2.5 rounded-md px-1 py-0.5 hover:bg-muted"
                onClick={() => list(`Customers · ${city}`, (c) => c.c.city === city)}
              >
                <span className="truncate">{city} · {stateCode[e.state]}</span>
                <span className="flex h-3.5 overflow-hidden rounded-sm bg-background-sunken">
                  {STATUSES.map((st) => <i key={st} className={cn('block h-full', statusBg[st])} style={{ width: `${(e.n[st] / e.total) * 100}%` }} />)}
                </span>
                <span className="text-right tabular-nums">
                  <b className={cn('font-semibold', e.n.Active / e.total < 0.5 && 'text-warning-foreground')}>{Math.round((e.n.Active / e.total) * 100)}%</b>
                  <span className="ml-1.5 text-foreground-tertiary">{e.total}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="type-caption mt-3 flex gap-4 text-foreground-secondary">
            {STATUSES.map((st) => <span key={st} className="flex items-center gap-1.5"><i className={cn('h-2.5 w-2.5 rounded-sm', statusBg[st])} />{st}</span>)}
            <span className="ml-auto text-foreground-tertiary">% active · customers</span>
          </div>
        </Panel>

        <Panel className="col-span-5" title={`New outlets per ${weeks.length && weeks[1] && weeks[1].from.getTime() - weeks[0].from.getTime() === DAY ? 'day' : 'week'}`} subtitle={`${num(k.isNew)} onboarded in the range · click a bar`}>
          <Columns
            items={weeks.map((w) => ({ label: w.label, n: w.n, bg: 'bg-chart-violet' }))}
            onBar={(l) => {
              const w = weeks.find((x) => x.label === l)!;
              list(`Onboarded from ${dmy(w.from)}`, (c) => c.c.onboarded >= w.from && c.c.onboarded < w.to, (c) => `onboarded ${dmy(c.c.onboarded)} · KYC ${c.c.kyc}`);
            }}
          />
        </Panel>

        <Panel
          className="col-span-5"
          title="Top customers"
          subtitle={`${num(top.length)} ordering · ${lakh(k.value)} in range`}
          onOpen={() => list('Customers who ordered', (c) => c.orders > 0)}
        >
          {top.slice(0, 5).map((c, i) => (
            <div key={c.id} className="-mx-1.5 flex cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted" onClick={(e) => { e.stopPropagation(); drill.open({ kind: 'customer', id: c.id }); }}>
              <i className="type-caption w-3.5 shrink-0 not-italic text-foreground-tertiary">{i + 1}</i>
              <span className="min-w-0 flex-1">
                <span className="type-body block truncate">{c.name}</span>
                <span className="type-caption block text-foreground-tertiary">{c.c.locality}, {c.c.city} · {c.c.ba} · {c.orders} orders</span>
              </span>
              <b className="type-price-sm">{lakh(c.value)}</b>
              {c.c.kyc !== 'Verified' && <Badge variant="warning">KYC</Badge>}
            </div>
          ))}
          {top.length > 5 && (
            <div className="type-caption mt-1.5 flex justify-between border-t border-dashed border-border pt-1.5 text-foreground-secondary">
              <span>{num(top.length - 5)} others</span>
              <span className="tabular-nums">{lakh(top.slice(5).reduce((a, c) => a + c.value, 0))}</span>
            </div>
          )}
          {top.length === 0 && <p className="type-caption text-foreground-secondary">No orders in this scope.</p>}
          <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full">
            {top.slice(0, 3).map((c, i) => (
              <i key={c.id} className={cn('block bg-chart-teal', i === 1 && 'opacity-70', i === 2 && 'opacity-45')} style={{ width: `${k.value ? (c.value / k.value) * 100 : 0}%` }} />
            ))}
            <i className="block flex-1 bg-background-sunken" />
          </div>
        </Panel>

        <Panel className="col-span-7" title="What's blocking KYC" subtitle={`${num(k.kyc)} pending · the BA completes these on the next visit · click a reason`}>
          {kycReasons.length ? (
            <HBars
              wideLabel
              rows={kycReasons.map(([reason, n]) => ({ label: reason, n, value: pctOf(n, k.kyc), barClass: 'bg-warning' }))}
              onRow={(reason) => list(`KYC pending · ${reason}`, (c) => c.c.kyc === 'Pending' && c.c.kycNote === reason, (c) => `onboarded ${dmy(c.c.onboarded)}`)}
            />
          ) : <p className="type-caption text-foreground-secondary">No KYC pending in this scope.</p>}
        </Panel>

        <Handoff
          className="col-span-12"
          go={go}
          report="buyer-customer-db"
          title="Need the full customer list?"
          body="Customer Database runs with these filters: owner, mobile, geo, beat, BA, mapped and discoverable distributors, KYC and status for every outlet, downloaded as Excel."
          cta="Run Customer Database report"
        />
      </div>
    </div>
  );
}
