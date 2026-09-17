// Sales deep page, plus the drilled state reached from the Overview attention
// item "91 open orders past 4 days". A drill is a filter, not a page: the same
// screen with drill chips in the scope bar and panels reshaped to the subset.
// Records never appear here — the last card hands the filters to a report.
import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SegmentedControl, cn } from '@mockups/ui';
import { ScopeBar } from '../components/ScopeBar';
import { TrendChart } from '../components/TrendChart';
import { Columns, Stat, StackBar, HBars } from '@mockups/components';
import { Panel, KpiCard } from '../components/dashboard';
import { stageBg, toneBg, openBg } from '../components/chartClasses';
import { dailyValue, dailyPrev, dailyDelivered, statuses } from '../data/overview';
import {
  salesKpis, monthly, cities, networkCancelRate, cancelReasons,
  drillKpis, drillStages, drillDistributors, overdueDaily, overduePrev, type BarRow,
} from '../data/sales';

const toHBars = (rows: BarRow[]) => rows.map((r) => ({ label: r.label, n: r.n, value: r.value, barClass: toneBg[r.tone] }));
import { RecordsDrawer } from '../components/RecordsDrawer';
import { useScope } from '../scope';
import type { Stage } from '../data/orderRows';
import type { Page } from '../nav';

/** Drill-through per KPI. null = no record list yet (outlet-grain KPIs). */
type Drill = { title: string; total: string; statuses?: Stage[]; sort?: boolean };
const salesDrills: (Drill | null)[] = [
  { title: 'Orders', total: '1,142 orders · ₹38.6L' },
  { title: 'Order value', total: '1,142 orders · ₹38.6L', sort: true },
  { title: 'Avg order value', total: '1,142 orders · ₹3,380 avg', sort: true },
  { title: 'Delivered orders', total: '454 orders · ₹15.0L', statuses: ['delivered'] },
  { title: 'Cancelled orders', total: '284 orders · ₹10.5L', statuses: ['cancelled'] },
  null, // Repeat-order rate — outlet records come with the Customers page
];

export default function Sales({ go, drilled }: { go: (p: Page) => void; drilled?: boolean }) {
  return drilled ? <DrilledSales go={go} /> : <FullSales go={go} />;
}

/* ---------------------------------- full page ---------------------------------- */

function FullSales({ go }: { go: (p: Page) => void }) {
  const [metric, setMetric] = useState('value');
  const [grain, setGrain] = useState('daily');
  const [drill, setDrill] = useState<Drill | null>(null);
  const totalOrders = statuses.reduce((s, x) => s + x.orders, 0);
  const totalValue = statuses.reduce((s, x) => s + x.value, 0);
  const { f, setF } = useScope();
  const stageDrill = (key: string) => {
    const s = statuses.find((x) => x.key === key)!;
    setDrill({ title: `${s.label} orders`, total: `${s.orders} orders · ₹${s.value.toFixed(1)}L`, statuses: [key as Stage] });
  };
  return (
    <div className="flex flex-col gap-5">
      <ScopeBar line="Compared with the same days of the previous month, 1 – 22 Jul 2026 · Full network · Super Admin" />
      {drill && <RecordsDrawer {...drill} sortByValue={drill.sort} onClose={() => setDrill(null)} go={go} />}

      <div className="flex gap-1.5">
        {['Summary', 'Trend', 'Status', 'Geography', 'Cancellations'].map((a, i) => (
          <span key={a} className={cn('type-caption rounded-full px-3 py-1', i === 0 ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'text-foreground-secondary')}>
            {a}
          </span>
        ))}
      </div>

      <section>
        <div className="grid grid-cols-6 gap-3">
          {salesKpis.map((k, i) => (
            <KpiCard key={k.label} {...k} onOpen={salesDrills[i] ? () => setDrill(salesDrills[i]) : undefined} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12" title="Orders and value over time" subtitle="Delivered value shaded" onOpen={() => go('reports')}
          right={
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <SegmentedControl className="w-auto" value={metric} onChange={setMetric} options={[
                { value: 'value', label: 'Value' }, { value: 'orders', label: 'Orders' }, { value: 'vs', label: 'Orders vs delivered' },
              ]} />
              <SegmentedControl className="w-auto" value={grain} onChange={setGrain} options={[
                { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' },
              ]} />
            </div>
          }>
          <TrendChart current={dailyValue} previous={dailyPrev} delivered={dailyDelivered} />
          <Legend items={[
            { bg: 'bg-primary', label: 'Order value · ₹38.6L' },
            { bg: 'bg-success', label: 'Delivered value · ₹15.0L' },
            { bg: 'bg-border-strong', label: '1 – 22 Jul · ₹34.7L' },
          ]} />
        </Panel>

        <Panel className="col-span-12" title="Month-wise sales" subtitle="Delivered value inside each bar">
          <MonthBars />
          <Legend items={[
            { bg: openBg, label: 'Order value' },
            { bg: 'bg-success', label: 'Delivered value' },
            { bg: '', label: '* Aug = 22 days' },
          ]} />
        </Panel>

        <Panel className="col-span-5" title="Orders and value by status" subtitle={`${totalOrders.toLocaleString('en-IN')} orders · ₹${totalValue.toFixed(1)}L`}>
          <div className="type-caption mb-1.5 text-foreground-secondary"><b className="text-foreground">Orders</b> · share of {totalOrders.toLocaleString('en-IN')}</div>
          <StackBar onPart={stageDrill} parts={statuses.map((s) => ({ key: s.key, pct: (s.orders / totalOrders) * 100, label: String(s.orders), bg: stageBg[s.key] }))} />
          <div className="type-caption mb-1.5 mt-4 text-foreground-secondary"><b className="text-foreground">Value</b> · share of ₹{totalValue.toFixed(1)}L</div>
          <StackBar onPart={stageDrill} parts={statuses.map((s) => ({ key: s.key, pct: (s.value / totalValue) * 100, label: `₹${s.value.toFixed(1)}L`, bg: stageBg[s.key] }))} />
          <Legend items={statuses.map((s) => ({ bg: stageBg[s.key], label: s.label }))} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Delivery rate" value="61.5%" note={<><span className="font-medium text-error-foreground">target 70%</span> · 454 ÷ 738 closed</>} />
            <Stat label="Cancellation rate" value="24.9%" note={<><span className="font-medium text-error-foreground">↑ 4.1 pts</span> · of 1,142</>} />
            <Stat label="Return rate" value="2.6%" note="12 ÷ 466 delivered" />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Cities: size against cancellation" subtitle="Telangana · 6 cities">
          {/* Clicking a city applies it to the app-wide scope — a drill IS a filter. */}
          <CityScatter onCity={(name) => setF({ ...f, cities: [name], distributors: [] })} />
        </Panel>

        <Panel className="col-span-5" title="Cancellation reasons" subtitle="284 orders · ₹10.5L" onOpen={() => go('reports')}>
          <HBars
            rows={toHBars(cancelReasons)}
            onRow={(label) => {
              const r = cancelReasons.find((x) => x.label === label)!;
              setDrill({ title: `Cancelled · ${label}`, total: `${r.n} orders · ${r.value}`, statuses: ['cancelled'] });
            }}
          />
        </Panel>

        <Handoff
          className="col-span-7"
          go={go}
          title="Need the orders themselves?"
          body="Runs the Order Register report with this scope · lands in Run history."
          cta="Run Order Register with this scope"
        />
      </div>
    </div>
  );
}

/* --------------------------------- drilled state --------------------------------- */

function DrilledSales({ go }: { go: (p: Page) => void }) {
  const [drill, setDrill] = useState<Drill | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <div className="type-caption flex items-center gap-1.5 text-foreground-secondary">
        Overview › Attention › <b className="text-foreground">Open orders past 4 days</b>
        <Button variant="ghost" size="sm" className="ml-2 text-link" onClick={() => go('overview')}>← Back to Overview</Button>
      </div>
      {drill && <RecordsDrawer {...drill} onClose={() => setDrill(null)} go={go} />}

      <ScopeBar
        chips={[
          { label: 'Drill · Status', value: 'Open', drill: true },
          { label: 'Drill · Age', value: 'D4+ overdue', drill: true },
        ]}
        line={<>Drilled from Overview · same scope and period · <b className="text-foreground">91 orders</b> match · the two drill chips can be removed one at a time</>}
        action="Clear drill"
        onAction={() => go('sales')}
      />

      <section>
        <div className="grid grid-cols-6 gap-3">
          {drillKpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-5" title="The 91 by stage">
          <Columns
            height={150}
            items={drillStages.map((s) => ({ label: s.label, n: s.n, bg: s.key === 'shipped' ? 'bg-error' : stageBg[s.key] }))}
            onBar={(l) => {
              const s = drillStages.find((x) => x.label === l)!;
              setDrill({ title: `The 91 · ${s.label}`, total: `${s.n} orders`, statuses: [s.key as Stage] });
            }}
          />
          <p className="type-caption mt-3 text-foreground-secondary"><b className="text-foreground">60 are already Shipped.</b></p>
        </Panel>

        <Panel className="col-span-7" title="The 91 by distributor" onOpen={() => go('distributors')}>
          <HBars rows={toHBars(drillDistributors)} wideLabel />
          <p className="type-caption mt-3 text-foreground-secondary"><b className="text-foreground">58 of 91 sit with two Hyderabad distributors.</b></p>
        </Panel>

        <Panel className="col-span-12" title="Overdue count by day">
          <OverdueChart />
          <Legend items={[
            { bg: 'bg-error', label: 'Overdue open orders · today 91' },
            { bg: 'bg-border-strong', label: '1 – 22 Jul · ended at 77' },
          ]} />
        </Panel>

        <Handoff
          className="col-span-12"
          go={go}
          title="Need the 91 orders themselves?"
          body="Runs Open Order Ageing with these drill filters · lands in Run history."
          cta="Run Open Order Ageing with this drill"
        />
      </div>
    </div>
  );
}

/* ---------------------------------- pieces ---------------------------------- */

function Legend({ items }: { items: { bg: string; label: React.ReactNode }[] }) {
  return (
    <div className="type-caption mt-3 flex flex-wrap gap-x-4 gap-y-1 text-foreground-secondary">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.bg && <i className={cn('h-2.5 w-2.5 rounded-sm', it.bg)} />}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Month columns with the delivered slice inside each bar. */
function MonthBars() {
  const max = Math.max(...monthly.map((m) => m.value));
  return (
    <div className="flex items-end justify-around gap-6 px-4" style={{ height: 210 }}>
      {monthly.map((m) => (
        <div key={m.label} className="flex h-full w-full max-w-[110px] flex-col items-center justify-end gap-1">
          <b className="type-price-sm">₹{m.value}L</b>
          <div className="relative w-full" style={{ height: `${(m.value / max) * 82}%` }}>
            <div className={cn('absolute inset-0 rounded-t-sm', openBg)} />
            <div className="absolute inset-x-0 bottom-0 grid place-items-center bg-success" style={{ height: `${(m.delivered / m.value) * 100}%` }}>
              <span className="type-caption font-medium text-primary-foreground">₹{m.delivered}L</span>
            </div>
          </div>
          <small className="type-caption text-foreground-secondary">{m.label}</small>
        </div>
      ))}
    </div>
  );
}

/** Cities scatter: order value × cancellation rate, dot size by orders, network line. */
function CityScatter({ onCity }: { onCity?: (name: string) => void }) {
  const x = (v: number) => 70 + v * 49;
  const y = (rate: number) => 270 - (rate - 20) * 16.8;
  const netY = y(networkCancelRate);
  const dotFill = (c: number) =>
    c <= networkCancelRate ? 'fill-success' : c <= networkCancelRate + 1.5 ? 'fill-warning' : 'fill-error';
  return (
    <svg viewBox="0 0 1000 360" className="block w-full" role="img" aria-label="Cities: order value on x, cancellation rate on y, dot size by orders, network rate line at 24.9%.">
      <rect x={70} y={30} width={880} height={netY - 30} className="fill-error-subtle" />
      <rect x={70} y={netY} width={880} height={300 - netY} className="fill-success-subtle" />
      <line x1={70} y1={netY} x2={950} y2={netY} className="stroke-foreground" strokeDasharray="5 4" />
      <text x={950} y={netY - 6} textAnchor="end" className="fill-foreground-secondary text-[10px]">network {networkCancelRate}%</text>
      <text x={78} y={46} className="fill-error-foreground text-[10px] font-semibold">Cancels above network</text>
      <text x={78} y={292} className="fill-success-foreground text-[10px] font-semibold">Cleaner than network</text>
      {cities.map((c) => (
        <g key={c.name} className={cn(onCity && 'cursor-pointer')} onClick={onCity && (() => onCity(c.name))}>
          <circle cx={x(c.value)} cy={y(c.cancel)} r={c.r} className={dotFill(c.cancel)} opacity={0.85} />
          <text
            x={x(c.value) + (c.labelLeft ? -(c.r + 5) : c.r + 5)}
            y={y(c.cancel) + 4}
            textAnchor={c.labelLeft ? 'end' : 'start'}
            className="fill-foreground text-[10px] font-medium"
          >
            {c.name} <tspan className="fill-foreground-secondary font-normal">₹{c.value}L · {c.cancel}% · {c.change}</tspan>
          </text>
        </g>
      ))}
      {[4, 8, 12, 16].map((v) => (
        <text key={v} x={x(v)} y={318} textAnchor="middle" className="fill-foreground-secondary text-[10px]">₹{v}L</text>
      ))}
      {[20, 25, 30].map((r) => (
        <text key={r} x={62} y={y(r) + 4} textAnchor="end" className="fill-foreground-secondary text-[10px]">{r}%</text>
      ))}
      <text x={510} y={340} textAnchor="middle" className="fill-foreground-secondary text-[10px]">
        Order value · dot size = orders · label shows change vs 1 – 22 Jul
      </text>
    </svg>
  );
}

/** Overdue open orders per day: 53 → 91 over August, previous month dashed. */
function OverdueChart() {
  const x = (i: number) => 50 + (i * 920) / (overdueDaily.length - 1);
  const y = (n: number) => 170 - (n - 30) * 2;
  const line = (vals: number[]) => vals.map((n, i) => `${x(i).toFixed(1)},${y(n)}`).join(' ');
  const last = overdueDaily.length - 1;
  return (
    <svg viewBox="0 0 1000 200" className="block w-full" role="img" aria-label="Overdue open orders per day, rising from 53 to 91 over August; previous month dashed.">
      {[60, 90].map((v) => (
        <g key={v}>
          <line x1={50} y1={y(v)} x2={970} y2={y(v)} className="stroke-border" />
          <text x={18} y={y(v) + 4} className="fill-foreground-secondary text-[10px]">{v}</text>
        </g>
      ))}
      <line x1={50} y1={170} x2={970} y2={170} className="stroke-border" />
      <polyline points={line(overduePrev)} className="fill-none stroke-border-strong" strokeWidth={1.6} strokeDasharray="4 3" />
      <polyline points={line(overdueDaily)} className="fill-none stroke-error" strokeWidth={2.2} />
      <circle cx={x(0)} cy={y(overdueDaily[0])} r={3} className="fill-error" />
      <text x={x(0) + 6} y={y(overdueDaily[0]) + 16} className="fill-foreground-secondary text-[10px]">{overdueDaily[0]}</text>
      <circle cx={x(last)} cy={y(overdueDaily[last])} r={3.5} className="fill-error" />
      <text x={x(last) - 12} y={y(overdueDaily[last]) - 8} textAnchor="end" className="fill-foreground text-[10px] font-medium">{overdueDaily[last]}</text>
      {[0, 10, 21].map((i) => (
        <text key={i} x={x(i)} y={188} textAnchor={i === 0 ? 'start' : i === 21 ? 'end' : 'middle'} className="fill-foreground-secondary text-[10px]">
          {i + 1} Aug
        </text>
      ))}
    </svg>
  );
}

/** Dashed hand-off card: the only route from analytics to order-level records. */
function Handoff({ title, body, cta, className, go }: { title: string; body: string; cta: string; className?: string; go: (p: Page) => void }) {
  return (
    <Card className={cn('flex flex-col justify-center border-dashed', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="type-label">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button size="sm" onClick={() => go('reports')}>{cta}</Button>
        <Button size="sm" variant="secondary" onClick={() => go('reports')}>Open Reports</Button>
      </CardContent>
    </Card>
  );
}
