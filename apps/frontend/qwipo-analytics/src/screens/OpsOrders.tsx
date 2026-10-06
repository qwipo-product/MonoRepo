// Ops (Logistics) · Orders — order tracking, delivery ageing and fulfilment.
// Aggregates only, like the reference: order rows live in the Distributor
// Report (Reports → Ops). Static figures; drill grammar comes in the UX round.
import { Fragment } from 'react';
import { cn } from '@mockups/ui';
import { Columns } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { TrendChart } from '../components/TrendChart';
import { Panel, KpiCard } from '../components/dashboard';
import { ageBg } from '../components/chartClasses';
import {
  network, opsDistributors, agingBuckets, agingBucketLabels, agingRows, dailyVolume, volumeMeasures, taxonomies, type VolumeMeasure,
} from '../data/logistics';

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

// Axis top rounded up to a clean half-step (413 → 450, 7.95 → 8, 2,855 → 3,000).
const niceCeil = (v: number) => {
  const p10 = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (p10 / 2)) * (p10 / 2);
};
const fmtFor = (measure: VolumeMeasure) => (v: number) =>
  measure === 'amountL' ? `₹${v.toFixed(1)}L`
  : measure === 'weightKg' ? `${Math.round(v).toLocaleString('en-IN')} kg`
  : Math.round(v).toLocaleString('en-IN');

export default function OpsOrders() {
  const bucketTotals = agingBuckets.map((_, i) => sum(agingRows.map((r) => r.d[i])));
  const pending = sum(bucketTotals);

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />

      <section>
        <div className="grid grid-cols-5 gap-3">
          <KpiCard label="Total orders" value={network.totalOrders.toLocaleString('en-IN')} change="→" trend="flat" note="All orders this period" />
          <KpiCard label="Delivered orders" value={network.fulfilled.toLocaleString('en-IN')} change="92.3%" trend="up" note="of all orders" />
          <KpiCard label="Orders in progress" value={network.pending.toLocaleString('en-IN')} change="→" trend="flat" inverse note="Awaiting dispatch" />
          <KpiCard label="Dispatch value" value={`₹${network.dispatchL}L`} change="→" trend="flat" note={`returns −₹${network.returnL}L`} />
          <KpiCard label="Net sales value" value={`₹${network.netSalesL}L`} change="→" trend="flat" note="dispatch − returns" />
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

        <Panel className="col-span-12" title="Order volume trend" subtitle="Daily volume · May 2026 · all four measures">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {volumeMeasures.map((m) => {
              const series = dailyVolume.map((d) => d[m.key]);
              const fmt = fmtFor(m.key);
              const niceMax = niceCeil(Math.max(...series));
              const total = m.key === 'amountL' ? network.netSalesL : sum(series);
              return (
                <div key={m.key}>
                  <div className="type-caption mb-1 flex justify-between text-foreground-secondary">
                    <b className="text-foreground">{m.label}</b>
                    <span>Total <b className="tabular-nums text-foreground">{fmt(total)}</b></span>
                  </div>
                  <TrendChart
                    compact
                    current={series}
                    yMax={niceMax}
                    grid={[{ v: niceMax / 2, label: fmt(niceMax / 2) }, { v: niceMax, label: fmt(niceMax) }]}
                    fmt={fmt}
                    seriesLabel={m.label}
                    tooltipTitle={(i) => `${i + 1} May 2026`}
                    xTicks={[0, 14, 29]}
                    xLabel={(i) => `${i + 1} May`}
                    extremaMode="minmax"
                  />
                </div>
              );
            })}
          </div>
          <div className="type-caption mt-3 flex gap-5 text-foreground-secondary">
            <span>Unique buyers <b className="tabular-nums text-foreground">{network.uniqueCustomers.toLocaleString('en-IN')}</b></span>
            <span>Volumetric weight <b className="tabular-nums text-foreground">{network.volumetricWeightKg.toLocaleString('en-IN')} kg</b></span>
            <span>Statuses tracked: {taxonomies.trendStatuses.join(' · ')}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
