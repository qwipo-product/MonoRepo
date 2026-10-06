// Ops (Logistics) · Orders — order tracking, delivery ageing and fulfilment.
// Aggregates only, like the reference: order rows live in the Distributor
// Report (Reports → Ops). Static figures; drill grammar comes in the UX round.
import { Fragment, useState } from 'react';
import { cn } from '@mockups/ui';
import { Columns } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Chip } from '../components/Chip';
import { Panel, KpiCard } from '../components/dashboard';
import { ageBg } from '../components/chartClasses';
import {
  network, opsDistributors, agingBuckets, agingBucketLabels, agingRows, dailyVolume, volumeMeasures, taxonomies, type VolumeMeasure,
} from '../data/logistics';

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

const fmtFor = (measure: VolumeMeasure) => (v: number) =>
  measure === 'amountL' ? `₹${v.toFixed(1)}L`
  : measure === 'weightKg' ? `${Math.round(v).toLocaleString('en-IN')} kg`
  : Math.round(v).toLocaleString('en-IN');

// One colour per measure, spelled out in full for the Tailwind scanner.
const MEASURE_BG: Record<VolumeMeasure, string> = {
  orders: 'bg-chart-blue', amountL: 'bg-success', weightKg: 'bg-chart-violet', buyers: 'bg-warning',
};

export default function OpsOrders() {
  // Multi-select: each picked measure gets its own aligned bar row.
  const [picked, setPicked] = useState<VolumeMeasure[]>(['orders']);
  const toggleMeasure = (k: VolumeMeasure) =>
    setPicked((s) => s.includes(k) ? (s.length > 1 ? s.filter((x) => x !== k) : s) : [...s, k]);
  const bucketTotals = agingBuckets.map((_, i) => sum(agingRows.map((r) => r.d[i])));
  const pending = sum(bucketTotals);

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />

      <section>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Total orders" value={network.totalOrders.toLocaleString('en-IN')} change="→" trend="flat" note="All orders this period" />
          <KpiCard label="Delivered orders" value={network.fulfilled.toLocaleString('en-IN')} change="92.3%" trend="up" note="of all orders" />
          <KpiCard label="Pending orders" value={network.pending.toLocaleString('en-IN')} change="→" trend="flat" inverse note="Awaiting dispatch" />
          <KpiCard label="Dispatch value" value={`₹${network.dispatchL}L`} change="→" trend="flat" note={`returns −₹${network.returnL}L · net ₹${network.netSalesL}L`} />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-5" title="Delivery ageing" subtitle={`${pending} in-progress orders · D0 same day → D4+ overdue`}>
          <Columns
            items={agingBucketLabels.map((b, i) => ({ label: b, n: bucketTotals[i], bg: ageBg[i] }))}
          />
          <p className="type-caption mt-3 text-foreground-secondary">
            The Delivery Aging export sheet buckets as {taxonomies.exportAgingBuckets.join(' / ')}.
          </p>
        </Panel>

        <Panel className="col-span-7" title="Distributor ageing distribution" subtitle="D0 → D4+ ageing mix per distributor · overdue share">
          <div className="type-caption grid grid-cols-[1fr_repeat(5,44px)_52px_120px] items-center gap-1.5">
            <div />
            {agingBuckets.map((b) => <div key={b} className="type-micro text-center text-foreground-secondary">{b}</div>)}
            <div className="type-micro text-right text-foreground-secondary">Total</div>
            <div className="type-micro text-right text-foreground-secondary">Overdue (D3+)</div>
            {agingRows.map((r) => {
              const d = opsDistributors.find((x) => x.code === r.code)!;
              const total = sum(r.d);
              const overdue = r.d[3] + r.d[4];
              return (
                <Fragment key={r.code}>
                  <span className="truncate py-1">{d.name}<span className="ml-1.5 text-foreground-tertiary">{d.city}</span></span>
                  {r.d.map((n, i) => <span key={i} className="text-center tabular-nums">{n}</span>)}
                  <span className="text-right font-medium tabular-nums">{total}</span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="flex h-[7px] w-16 overflow-hidden rounded-full bg-background-sunken">
                      {r.d.map((n, i) => (
                        <i key={i} className={cn('block', ageBg[i])} style={{ width: `${(n / total) * 100}%` }} />
                      ))}
                    </span>
                    <span className={cn('w-10 text-right tabular-nums', overdue / total > 0.08 ? 'text-error-foreground' : 'text-foreground-secondary')}>
                      {((overdue / total) * 100).toFixed(1)}%
                    </span>
                  </span>
                </Fragment>
              );
            })}
            <span className="py-1 text-foreground-secondary">Total</span>
            {bucketTotals.map((n, i) => <span key={i} className="text-center font-medium tabular-nums">{n}</span>)}
            <span className="text-right font-medium tabular-nums">{pending}</span>
            <span />
          </div>
        </Panel>

        <Panel
          className="col-span-12"
          title="Order volume trend"
          subtitle="Daily volume · May 2026 · pick one or more measures"
          right={
            <span className="flex flex-wrap gap-1.5">
              {volumeMeasures.map((m) => (
                <Chip
                  key={m.key} value={m.label} active={picked.includes(m.key)} noCaret
                  onClick={() => toggleMeasure(m.key)}
                  onRemove={picked.includes(m.key) && picked.length > 1 ? () => toggleMeasure(m.key) : undefined}
                />
              ))}
            </span>
          }
        >
          <div className="flex flex-col gap-4">
            {volumeMeasures.filter((m) => picked.includes(m.key)).map((m) => {
              const series = dailyVolume.map((d) => d[m.key]);
              const fmt = fmtFor(m.key);
              const max = Math.max(...series);
              const min = Math.min(...series);
              const total = m.key === 'amountL' ? network.netSalesL : sum(series);
              return (
                <div key={m.key}>
                  <div className="type-caption mb-1.5 flex flex-wrap items-center gap-x-4 text-foreground-secondary">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <i className={cn('h-2.5 w-2.5 rounded-sm', MEASURE_BG[m.key])} />
                      {m.label}
                    </span>
                    <span>Total <b className="tabular-nums text-foreground">{fmt(total)}</b></span>
                    <span>Peak <b className="tabular-nums text-foreground">{fmt(max)}</b> · {series.indexOf(max) + 1} May</span>
                    <span>Low <b className="tabular-nums text-foreground">{fmt(min)}</b> · {series.indexOf(min) + 1} May</span>
                  </div>
                  <div className={cn('flex items-end gap-[3px]', picked.length > 1 ? 'h-16' : 'h-28')}>
                    {series.map((v, i) => (
                      <div key={i} className="group flex h-full flex-1 items-end" title={`${i + 1} May · ${fmt(v)}`}>
                        <i className={cn('block w-full rounded-t-sm opacity-85 group-hover:opacity-100', MEASURE_BG[m.key])} style={{ height: `${(v / max) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="type-caption mt-1.5 flex justify-between text-foreground-secondary">
            <span>1 May</span><span>8 May</span><span>15 May</span><span>22 May</span><span>30 May</span>
          </div>
          <div className="type-caption mt-2.5 flex gap-5 border-t border-border-subtle pt-2 text-foreground-secondary">
            <span>Unique buyers <b className="tabular-nums text-foreground">{network.uniqueCustomers.toLocaleString('en-IN')}</b></span>
            <span>Volumetric weight <b className="tabular-nums text-foreground">{network.volumetricWeightKg.toLocaleString('en-IN')} kg</b></span>
            <span>Statuses tracked: {taxonomies.trendStatuses.join(' · ')}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
