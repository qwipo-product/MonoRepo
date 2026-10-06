// Ops (Logistics) · Summary — data-point parity with the reference build's
// Summary page, including the richer network panels its deployed UI hides.
// Static figures; drill grammar comes in the UX round.
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';
import { Columns, HBars, StackBar, Stat } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Panel, KpiCard } from '../components/dashboard';
import { network, companyOps, yearTiles, onboardedCompanies, categoryMix, weeklyTrend, opsDistributors } from '../data/logistics';

const pct = (n: number, of: number) => +((n / of) * 100).toFixed(1);

export default function OpsSummary() {
  const deliveryRate = pct(network.fulfilled, network.totalOrders);
  const statusParts = [
    { key: 'Delivered', n: network.fulfilled, bg: 'bg-success' },
    { key: 'In planning', n: network.pending, bg: 'bg-chart-blue' },
    { key: 'Returned', n: network.returned, bg: 'bg-warning' },
    { key: 'Cancelled', n: network.cancelled, bg: 'bg-error' },
  ];
  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />

      <section>
        <div className="grid grid-cols-4 gap-3">
          {yearTiles.map((t) => (
            <KpiCard key={t.label} label={t.label} value={t.value} change={t.change} trend={t.change === '→' ? 'flat' : 'up'} note={t.note} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12" title="Customer companies" subtitle="Onboarded client companies and operational distribution metrics">
          <div className="grid grid-cols-2 gap-4">
            {onboardedCompanies.map((c) => (
              <Card key={c.name} className="p-3.5">
                <div className="mb-3 flex items-center gap-2.5 border-b border-border pb-3">
                  <span className="type-caption grid h-9 w-9 place-items-center rounded-lg bg-chart-indigo font-semibold text-primary-foreground">{c.logo}</span>
                  <span>
                    <b className="type-label block">{c.name}</b>
                    <span className="type-caption block text-foreground-secondary">Onboarded {c.onboarded}</span>
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(c.metrics).map(([label, value]) => (
                    <div key={label}>
                      <div className="type-micro text-foreground-secondary">{label}</div>
                      <div className="type-label mt-0.5 tabular-nums">{value}</div>
                      <div className="type-caption text-foreground-tertiary">This year</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <section className="col-span-12">
          <p className="type-caption mb-2 text-foreground-secondary">Network performance · May 2026 · all companies</p>
          <div className="grid grid-cols-5 gap-3">
            <KpiCard label="Total orders" value={network.totalOrders.toLocaleString('en-IN')} change="→" trend="flat" note="This period" />
            <KpiCard label="Delivered" value={network.fulfilled.toLocaleString('en-IN')} change={`${deliveryRate}%`} trend="up" note="delivery rate" />
            <KpiCard label="Invoice value" value={`₹${network.invoiceL}L`} change="→" trend="flat" note={`dispatch ₹${network.dispatchL}L`} />
            <KpiCard label="Return rate" value={`${network.returnRate}%`} change="→" trend="flat" inverse note={`${network.returned} returned`} />
            <KpiCard label="Unique customers" value={network.uniqueCustomers.toLocaleString('en-IN')} change="→" trend="flat" note="served this period" />
          </div>
        </section>

        <Panel className="col-span-7" title="Weekly performance trend" subtitle="Invoice value (₹L) & order volume · Apr – May 2026">
          <Columns items={weeklyTrend.map((w) => ({ label: w.week, n: w.orders, bg: 'bg-chart-blue' }))} />
          <div className="type-caption mt-2 flex gap-2.5 text-foreground-secondary">
            <span className="shrink-0">Invoice ₹L</span>
            {weeklyTrend.map((w) => (
              <span key={w.week} className="flex-1 text-center tabular-nums">{w.invoiceL}</span>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-5" title="Order status distribution" subtitle="Delivered · In planning · Returned · Cancelled">
          <StackBar parts={statusParts.map((s) => ({ ...s, pct: pct(s.n, network.totalOrders), label: s.key }))} />
          <div className="type-caption mt-2.5 flex flex-col gap-1 text-foreground-secondary">
            {statusParts.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <i className={`h-2.5 w-2.5 rounded-sm ${s.bg}`} />
                {s.key} · <b className="tabular-nums text-foreground">{s.n.toLocaleString('en-IN')}</b> · {pct(s.n, network.totalOrders)}%
              </span>
            ))}
            <span className="text-foreground-tertiary">Partial return exists in the status taxonomy; the reference carries no separate count for it.</span>
          </div>
        </Panel>

        <Panel className="col-span-5" title="Returns breakdown" subtitle="Returned: cancelled vs delivery retry">
          <HBars
            rows={[
              { label: 'Returned · cancelled', n: network.returnedCancelled, value: pct(network.returnedCancelled, network.returned) + '%', barClass: 'bg-error' },
              { label: 'Returned · delivery retry', n: network.returnedDeliveryRetry, value: pct(network.returnedDeliveryRetry, network.returned) + '%', barClass: 'bg-warning' },
            ]}
            wideLabel
          />
          <div className="mt-4 flex gap-5">
            <Stat label="Total returns" value={network.returned.toLocaleString('en-IN')} note={`${network.returnRate}% of orders · ₹${network.returnL}L value`} />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Category contribution" subtitle={`Revenue share across the network · ₹${network.invoiceL}L`}>
          <HBars
            rows={categoryMix.All.map((c, i) => ({
              label: c.name, n: c.revenueL, value: `${c.share}%`,
              barClass: ['bg-chart-blue', 'bg-chart-cyan', 'bg-chart-indigo', 'bg-chart-violet', 'bg-chart-teal'][i],
            }))}
            wideLabel
          />
          <p className="type-caption mt-3 text-foreground-secondary">Per-company category splits (ITC, HUL, Nestlé, Britannia, Dabur) are in the data behind the Company filter.</p>
        </Panel>

        <Card className="col-span-12">
          <CardHeader className="pb-3">
            <CardTitle className="type-label">Company operations</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr className="type-micro text-left text-foreground-tertiary">
                  <th className="py-2 pr-3 font-semibold">Company</th>
                  <th className="py-2 pr-3 text-right font-semibold">Orders</th>
                  <th className="py-2 pr-3 text-right font-semibold">Fulfilled</th>
                  <th className="py-2 pr-3 text-right font-semibold">Pending</th>
                  <th className="py-2 pr-3 text-right font-semibold">Returned</th>
                  <th className="py-2 pr-3 text-right font-semibold">Cancelled</th>
                  <th className="py-2 pr-3 text-right font-semibold">Invoice</th>
                  <th className="py-2 pr-3 text-right font-semibold">Return %</th>
                  <th className="py-2 pr-3 text-right font-semibold">Vehicles</th>
                  <th className="py-2 pr-3 text-right font-semibold">Veh · Wt · Time · DP util</th>
                  <th className="py-2 text-right font-semibold">Avg run time</th>
                </tr>
              </thead>
              <tbody className="type-caption">
                {companyOps.map((c) => (
                  <tr key={c.name} className="border-t border-border-subtle">
                    <td className="py-2 pr-3 font-medium">{c.name}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.orders.toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.fulfilled.toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.pending}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.returned}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.cancelled}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">₹{c.invoiceL}L</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.returnRate}%</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.vehiclesInUse}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.vehicleUtil} · {c.weightUtil} · {c.timeUtil} · {c.dpUtil}</td>
                    <td className="py-2 text-right tabular-nums">{c.avgRunTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Panel className="col-span-12" title="Distributor performance comparison" subtitle="Delivery rate, returns, invoice value · 13 distributors with metrics">
          <div className="grid grid-cols-2 gap-x-10">
            {[0, 1].map((half) => (
              <div key={half}>
                {[...opsDistributors].sort((a, b) => b.invoiceL - a.invoiceL)
                  .slice(half * 7, half * 7 + 7)
                  .map((d, i) => (
                    <div key={d.code} className="type-caption grid grid-cols-[18px_1fr_auto_auto_auto] items-center gap-2.5 border-b border-border-subtle py-1.5">
                      <i className="not-italic text-foreground-tertiary">{half * 7 + i + 1}</i>
                      <span className="truncate">{d.name}<span className="block text-foreground-tertiary">{d.city} · {d.state}</span></span>
                      <Badge variant={pct(d.fulfilled, d.orders) >= 93 ? 'success' : 'neutral'}>{pct(d.fulfilled, d.orders)}%</Badge>
                      <span className="tabular-nums text-foreground-secondary">{d.returned} ret</span>
                      <b className="type-price-sm w-14 text-right">₹{d.invoiceL}L</b>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
