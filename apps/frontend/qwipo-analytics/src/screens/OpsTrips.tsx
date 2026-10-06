// Ops (Logistics) · Trips — trips, fleet utilization, distributor trip
// efficiency, driver performance and the vehicle master. Clicking a
// distributor row narrows the driver table; full records are in the
// Distributor Report (Reports → Ops).
import { useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from '@mockups/ui';
import { Columns, Stat } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Handoff } from '../components/Handoff';
import { EntityDrawer } from '../components/EntityDrawer';
import { OpsDistributorsDrawer } from '../components/OpsDistributorsDrawer';
import { Panel, KpiCard } from '../components/dashboard';
import { network, opsDistributors, drivers, vehicles, runtimeByCity, tripStatusCards, tripsByWeekday, tripsWeekly, fleet } from '../data/logistics';
import type { Page } from '../nav';

const pct = (n: number, of: number) => +((n / of) * 100).toFixed(1);

/** Arc gauge, the reference's utilization dial: a 270° arc with the % centred.
 *  `stroke` is a full token class so the Tailwind scanner sees it. */
function ArcGauge({ pct: value, stroke }: { pct: number; stroke: string }) {
  const r = 30, c = 2 * Math.PI * r, arc = 0.75 * c;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" role="img" aria-label={`${value}%`}>
      <g transform="rotate(135 40 40)">
        <circle cx={40} cy={40} r={r} className="fill-none stroke-background-sunken" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle cx={40} cy={40} r={r} className={cn('fill-none', stroke)} strokeWidth={7} strokeLinecap="round" strokeDasharray={`${(arc * value) / 100} ${c}`} />
      </g>
      <text x={40} y={45} textAnchor="middle" className="fill-foreground text-[15px] font-semibold tabular-nums">{value}%</text>
    </svg>
  );
}

const sumTrips = (list: { trips: number }[]) => list.reduce((s, d) => s + d.trips, 0);

export default function OpsTrips({ go }: { go: (p: Page | string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<'distributors' | 'drivers' | null>(null);
  const shownDrivers = picked ? drivers.filter((d) => d.distributor === picked) : drivers;
  const rankedDistributors = [...opsDistributors].sort((a, b) => b.tripEfficiency - a.tripEfficiency);
  const rankedDrivers = [...shownDrivers].sort((a, b) => b.trips - a.trips);
  const tail = rankedDistributors.slice(5);
  const tailAvgEff = (tail.reduce((s, d) => s + d.tripEfficiency, 0) / tail.length).toFixed(1);
  const distName = (code: string) => opsDistributors.find((x) => x.code === code)?.name ?? code;
  const successRate = pct(fleet.attempts - fleet.returnTrips, fleet.attempts);
  const utils = [
    { label: 'Vehicle utilization', n: network.vehicleUtil, formula: 'Vehicles used ÷ vehicles available', stroke: 'stroke-chart-blue' },
    { label: 'Weight utilization', n: network.weightUtil, formula: 'Load weight carried ÷ vehicle weight capacity', stroke: 'stroke-chart-violet' },
    { label: 'Time utilization', n: network.timeUtil, formula: 'Active run hours ÷ available hours (e.g. 6/8 = 74%)', stroke: 'stroke-chart-cyan' },
    { label: 'Delivery point utilization', n: network.dpUtil, formula: 'Stops served ÷ vehicle stop capacity', stroke: 'stroke-success' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />
      {drawer === 'distributors' && <OpsDistributorsDrawer onClose={() => setDrawer(null)} go={go} />}
      {drawer === 'drivers' && (
        <EntityDrawer
          title={picked ? `Drivers · ${distName(picked)}` : 'Driver performance'}
          total={`${rankedDrivers.length} drivers · ${sumTrips(rankedDrivers)} trips`}
          rows={rankedDrivers.map((d) => ({
            name: d.name,
            sub: `${distName(d.distributor)} · ${d.city} · ${(d.vehicles ?? [d.vehicle]).join(', ')}`,
            mid: `${d.attempts} attempts · ${d.returns} returns (${d.returnPct}%) · runtime ${d.runtime}`,
            right: `${d.trips} trips`,
            rightSub: `${d.successRate}% success · ${d.distanceKm} km · ${d.netSale}`,
            tone: d.returnPct > 10 ? ('warning' as const) : undefined,
          }))}
          report="ops-distributor-report"
          onClose={() => setDrawer(null)}
          go={go}
        />
      )}

      <section>
        <div className="grid grid-cols-4 gap-3">
          {tripStatusCards.map((s) => {
            const total = tripStatusCards.reduce((x, c) => x + c.value, 0);
            const share = Math.round((s.value / total) * 100);
            return (
              <Card key={s.label} className="p-3.5">
                <div className="type-caption flex items-center justify-between text-foreground-secondary">
                  {s.label}
                  <i className={cn('h-2.5 w-2.5 rounded-full', s.bg)} />
                </div>
                <div className="type-display my-0.5 tabular-nums tracking-tight">{s.value}</div>
                <div className="type-caption text-foreground-secondary">{share}% of {total} total</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-sunken">
                  <i className={cn('block h-full rounded-full', s.bg)} style={{ width: `${share}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-6 gap-3">
          <KpiCard label="Total fleet trips" value={fleet.trips.toLocaleString('en-IN')} change="→" trend="flat" note="This period" />
          <KpiCard label="Active distributors" value={String(opsDistributors.length)} change="→" trend="flat" note="in scope this period" />
          <KpiCard label="Avg run time" value={network.avgRunTime} change="→" trend="flat" note="per trip" />
          <KpiCard label="Delivery success rate" value={`${successRate}%`} change="→" trend="flat" note="% successful deliveries per trip" />
          <KpiCard label="Fleet efficiency" value={`${fleet.efficiency}%`} change="→" trend="flat" note="avg utilization across 4 metrics" />
          <KpiCard label="Return trips" value={String(fleet.returnTrips)} change="→" trend="flat" inverse note="total returned orders/trips" />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-5" title="Fleet utilization" subtitle="Vehicle · weight · time · delivery-point efficiency">
          <div className="grid grid-cols-4 gap-2">
            {utils.map((u) => (
              <div key={u.label} className="flex flex-col items-center text-center">
                <ArcGauge pct={u.n} stroke={u.stroke} />
                <span className="type-label mt-1">{u.label}</span>
                <span className="type-caption mt-0.5 text-foreground-tertiary">{u.formula}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-6">
            <Stat label="Vehicles in use" value={network.vehiclesInUse} note="avg · daily peak" />
            <Stat label="Planned vs live km" value={`${(network.liveKm / 1000).toFixed(1)}k`} note={`${network.plannedKm.toLocaleString('en-IN')} planned · ${network.liveKm.toLocaleString('en-IN')} driven`} />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Trips per day" subtitle="Weekday profile · avg vehicles in use beneath">
          <Columns items={tripsByWeekday.map((t) => ({ label: t.day, n: t.trips, bg: 'bg-chart-cyan' }))} height={110} />
          <div className="type-caption mt-2 flex gap-2.5 text-foreground-secondary">
            <span className="shrink-0">Vehicles</span>
            {tripsByWeekday.map((t) => (
              <span key={t.day} className="flex-1 text-center tabular-nums">{t.avgVehicles}</span>
            ))}
          </div>
          <div className="type-caption mt-3 border-t border-border-subtle pt-2 text-foreground-secondary">
            Weekly · {tripsWeekly.map((w) => `${w.week} ${w.trips}`).join(' · ')}
          </div>
          <div className="mt-4 flex gap-6">
            <Stat label="Total trips" value={String(fleet.trips)} note="this period" />
            <Stat label="Total distance" value={`${fleet.distanceKm.toLocaleString('en-IN')} km`} note={`${fleet.drivers} drivers`} />
          </div>
        </Panel>

        <Panel className="col-span-5" title="Run time by city" subtitle="Slabs: ≤ 2h · 2 – 4h · 4 – 6h · > 6h">
          <table className="w-full border-collapse">
            <thead>
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="py-2 pr-3 font-semibold">City</th>
                <th className="py-2 pr-3 font-semibold">Slab</th>
                <th className="py-2 pr-3 text-right font-semibold">Avg run time</th>
                <th className="py-2 text-right font-semibold">Trips</th>
              </tr>
            </thead>
            <tbody className="type-caption">
              {runtimeByCity.map((r) => (
                <tr key={r.city} className="border-t border-border-subtle">
                  <td className="py-1.5 pr-3">{r.city}</td>
                  <td className="py-1.5 pr-3"><Badge variant={r.slab === '> 6h' ? 'warning' : 'neutral'}>{r.slab}</Badge></td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{r.avg}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.trips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Card className="col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="type-label">Vehicle master</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr className="type-micro text-left text-foreground-tertiary">
                  <th className="py-2 pr-3 font-semibold">Vehicle</th>
                  <th className="py-2 pr-3 font-semibold">Registration</th>
                  <th className="py-2 pr-3 font-semibold">Ownership</th>
                  <th className="py-2 pr-3 text-right font-semibold">Volumetric capacity</th>
                  <th className="py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="type-caption">
                {vehicles.map((v) => (
                  <tr key={v.registration} className="border-t border-border-subtle">
                    <td className="py-2 pr-3">{v.name}</td>
                    <td className="py-2 pr-3 tabular-nums">{v.registration}</td>
                    <td className="py-2 pr-3">{v.ownership}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{v.volumetricCapacity.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right"><Badge variant="success">{v.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="type-caption mt-2.5 text-foreground-secondary">The full fleet exports as the Vehicle Raw sheet of the Distributor Report.</p>
          </CardContent>
        </Card>

        <Panel
          className="col-span-7"
          title="Distributor performance"
          subtitle="Trip efficiency · top 5 · click a row for its drivers, the card for the full list"
          onOpen={() => setDrawer('distributors')}
        >
          <div className="flex flex-col gap-2">
            {rankedDistributors.slice(0, 5).map((d) => (
              <div
                key={d.code}
                className={cn(
                  'type-caption grid cursor-pointer grid-cols-[210px_1fr_120px] items-center gap-2.5 rounded-md px-1 -mx-1 text-foreground hover:bg-muted',
                  picked === d.code && 'bg-primary-soft hover:bg-primary-soft',
                )}
                onClick={(e) => { e.stopPropagation(); setPicked(picked === d.code ? null : d.code); }}
              >
                <span className="truncate">{d.name}<span className="ml-1.5 text-foreground-tertiary">{d.city}</span></span>
                <div className="h-2.5 overflow-hidden rounded-sm bg-background-sunken">
                  <div className={cn('h-full rounded-sm', d.tripEfficiency >= 90 ? 'bg-success' : d.tripEfficiency >= 87 ? 'bg-chart-blue' : 'bg-warning')} style={{ width: `${d.tripEfficiency}%` }} />
                </div>
                <span className="text-right tabular-nums">
                  {d.tripEfficiency}% <small className="text-foreground-tertiary">₹{d.invoiceL}L · {d.returned} ret</small>
                </span>
              </div>
            ))}
          </div>
          <div className="type-caption mt-2 flex justify-between border-t border-dashed border-border pt-2 text-foreground-secondary">
            <span>{rankedDistributors.length - 5} others · avg {tailAvgEff}%</span>
            <span className="text-link">Full list</span>
          </div>
        </Panel>

        <Panel
          className="col-span-5"
          title="Driver performance"
          subtitle={picked ? 'Drivers of the selected distributor' : 'Trips per driver · top 5'}
          onOpen={() => setDrawer('drivers')}
          right={picked ? (
            <Badge variant="info" className="cursor-pointer normal-case tracking-normal" onClick={(e) => { e.stopPropagation(); setPicked(null); }}>
              {opsDistributors.find((d) => d.code === picked)?.name} ✕
            </Badge>
          ) : undefined}
        >
          <div className="flex flex-col gap-2">
            {rankedDrivers.slice(0, 5).map((d) => (
              <div key={d.name} className="type-caption grid grid-cols-[150px_1fr_108px] items-center gap-2.5 text-foreground">
                <span className="truncate">{d.name}<span className="block text-foreground-tertiary">{d.city} · {d.distanceKm} km</span></span>
                <div className="h-2.5 overflow-hidden rounded-sm bg-background-sunken">
                  <div className={cn('h-full rounded-sm', d.returnPct > 10 ? 'bg-warning' : 'bg-chart-cyan')} style={{ width: `${(d.trips / 25) * 100}%` }} />
                </div>
                <span className="text-right tabular-nums">
                  {d.trips} trips <small className={cn(d.returnPct > 10 ? 'text-warning-foreground' : 'text-foreground-tertiary')}>{d.successRate}%</small>
                </span>
              </div>
            ))}
          </div>
          {rankedDrivers.length > 5 && (
            <div className="type-caption mt-2 flex justify-between border-t border-dashed border-border pt-2 text-foreground-secondary">
              <span>{rankedDrivers.length - 5} others · {sumTrips(rankedDrivers.slice(5))} trips</span>
              <span className="text-link">Full list</span>
            </div>
          )}
          <p className="type-caption mt-3 text-foreground-secondary">Amber = return rate over 10%.</p>
        </Panel>

        <Handoff
          className="col-span-12"
          go={go}
          report="ops-distributor-report"
          title="Need the full distributor & driver tables?"
          body="Orders, returns, utilization quad, fill rate, runtimes, net sale and vehicles per driver — all export via the Distributor Report with this scope."
          cta="Run Distributor Report"
        />
      </div>
    </div>
  );
}
