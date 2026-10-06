// Ops (Logistics) · Summary — dashboards, not reports: KPI cards first, then
// comparisons as charts. The full company/distributor field sets live in the
// data file and export via the Company and Distributor Reports (Reports → Ops).
import { Card } from '@mockups/ui';
import { Columns, HBars, Stat } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Handoff } from '../components/Handoff';
import { Panel, KpiCard } from '../components/dashboard';
import { network, companyOps, yearTiles, onboardedCompanies, categoryMix, weeklyTrend, taxonomies, registry } from '../data/logistics';
import type { Page } from '../nav';

const pct = (n: number, of: number) => +((n / of) * 100).toFixed(1);

export default function OpsSummary({ go }: { go: (p: Page | string) => void }) {
  const deliveryRate = pct(network.fulfilled, network.totalOrders);
  const statusRows = [
    { label: 'Delivered', n: network.fulfilled, barClass: 'bg-success' },
    { label: 'In planning', n: network.pending, barClass: 'bg-chart-blue' },
    { label: 'Returned', n: network.returned, barClass: 'bg-warning' },
    { label: 'Cancelled', n: network.cancelled, barClass: 'bg-error' },
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

        <Panel className="col-span-5" title="Order status distribution" subtitle={`${network.totalOrders.toLocaleString('en-IN')} orders this period`}>
          <HBars
            rows={statusRows.map((s) => ({ ...s, value: `${pct(s.n, network.totalOrders)}%` }))}
          />
          <p className="type-caption mt-3 text-foreground-tertiary">Partial return exists in the taxonomy; no separate count yet.</p>
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
          <p className="type-caption mt-3 text-foreground-secondary">
            Return remarks in the export: {taxonomies.returnRemarks.map((r) => `“${r}”`).join(' · ')}
          </p>
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

        <Panel className="col-span-7" title="Companies compared" subtitle="Net sales this period · return rate alongside">
          <HBars
            rows={companyOps.map((c) => ({
              label: c.name, n: c.netSalesL, value: `${c.returnRate}% ret`,
              barClass: c.returnRate > 6 ? 'bg-warning' : 'bg-chart-indigo',
            }))}
          />
          <p className="type-caption mt-3 text-foreground-secondary">
            {registry.length} registered distributors across {new Set(registry.map((r) => r[2])).size} states · 13 carry metrics this period · per-distributor detail on Trips
          </p>
        </Panel>

        <Handoff
          className="col-span-5"
          go={go}
          report="ops-company-report"
          title="Need the full company & distributor tables?"
          body="Every field — dispatch, returns split, customers, fleet, km — exports via the Company Report; per-distributor sheets via the Distributor Report."
          cta="Run Company Report"
        />
      </div>
    </div>
  );
}
