// Ops (Logistics) · Orders — order tracking, delivery ageing and fulfilment.
// Aggregates only, like the reference: order rows live in the Distributor
// Report (Reports → Ops). Static figures; drill grammar comes in the UX round.
import { Fragment, useState } from 'react';
import { SegmentedControl, cn } from '@mockups/ui';
import { Columns } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Panel, KpiCard } from '../components/dashboard';
import { ageBg } from '../components/chartClasses';
import {
  network, opsDistributors, agingBuckets, agingRows, dailyVolume, volumeMeasures, type VolumeMeasure,
} from '../data/logistics';

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

export default function OpsOrders() {
  const [measure, setMeasure] = useState<VolumeMeasure>('orders');
  const bucketTotals = agingBuckets.map((_, i) => sum(agingRows.map((r) => r.d[i])));
  const pending = sum(bucketTotals);
  const maxDay = Math.max(...dailyVolume.map((d) => d[measure]));
  const fmt = (v: number) => measure === 'amountL' ? `₹${v}L` : v.toLocaleString('en-IN');

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
            items={agingBuckets.map((b, i) => ({ label: i === 0 ? 'D0 same day' : i === 4 ? 'D4+ overdue' : b, n: bucketTotals[i], bg: ageBg[i] }))}
          />
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
          subtitle="Daily volume · May 2026"
          right={
            <SegmentedControl
              className="w-auto"
              options={volumeMeasures.map((m) => ({ value: m.key, label: m.label }))}
              value={measure}
              onChange={(v) => setMeasure(v as VolumeMeasure)}
            />
          }
        >
          <div className="flex h-[130px] items-end gap-1">
            {dailyVolume.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day} May · ${fmt(d[measure])}`}>
                <i className="block w-full rounded-t-sm bg-chart-blue group-hover:bg-chart-indigo" style={{ height: `${(d[measure] / maxDay) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="type-caption mt-1.5 flex justify-between text-foreground-secondary">
            <span>1 May</span><span>15 May</span><span>30 May</span>
          </div>
          <div className="type-caption mt-2.5 flex gap-5 text-foreground-secondary">
            <span>Total <b className="tabular-nums text-foreground">{fmt(measure === 'amountL' ? network.netSalesL : sum(dailyVolume.map((d) => d[measure])))}</b></span>
            <span>Unique buyers <b className="tabular-nums text-foreground">{network.uniqueCustomers.toLocaleString('en-IN')}</b></span>
            <span>Volumetric weight <b className="tabular-nums text-foreground">{network.volumetricWeightKg.toLocaleString('en-IN')} kg</b></span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
