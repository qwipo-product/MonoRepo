// Ops (Logistics) · Trips — trips, fleet utilization, distributor trip
// efficiency, driver performance and the vehicle master. Clicking a
// distributor row narrows the driver table; full records are in the
// Distributor Report (Reports → Ops).
import { useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from '@mockups/ui';
import { Columns, Stat } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Panel, KpiCard } from '../components/dashboard';
import { network, opsDistributors, drivers, vehicles, runtimeByCity, tripsDaily, fleet } from '../data/logistics';

const pct = (n: number, of: number) => +((n / of) * 100).toFixed(1);

export default function OpsTrips() {
  const [picked, setPicked] = useState<string | null>(null);
  const shownDrivers = picked ? drivers.filter((d) => d.distributor === picked) : drivers;
  const successRate = pct(fleet.attempts - fleet.returnTrips, fleet.attempts);
  const utils = [
    { label: 'Vehicle utilization', n: network.vehicleUtil, formula: 'Vehicles used ÷ vehicles available' },
    { label: 'Weight utilization', n: network.weightUtil, formula: 'Load weight carried ÷ vehicle weight capacity' },
    { label: 'Time utilization', n: network.timeUtil, formula: 'Active run hours ÷ available hours (e.g. 6/8 = 74%)' },
    { label: 'Delivery point utilization', n: network.dpUtil, formula: 'Stops served ÷ vehicle stop capacity' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />

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
          <div className="flex flex-col gap-3">
            {utils.map((u) => (
              <div key={u.label} className="type-caption grid grid-cols-[180px_1fr_40px] items-center gap-x-2.5">
                <span>{u.label}<span className="block text-foreground-tertiary">{u.formula}</span></span>
                <div className="h-2.5 overflow-hidden rounded-sm bg-background-sunken">
                  <div className={cn('h-full rounded-sm', u.n >= 85 ? 'bg-success' : u.n >= 75 ? 'bg-chart-blue' : 'bg-warning')} style={{ width: `${u.n}%` }} />
                </div>
                <span className="text-right font-medium tabular-nums">{u.n}%</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-6">
            <Stat label="Vehicles in use" value={network.vehiclesInUse} note="avg · daily peak" />
            <Stat label="Planned vs live km" value={`${(network.liveKm / 1000).toFixed(1)}k`} note={`${network.plannedKm.toLocaleString('en-IN')} planned · ${network.liveKm.toLocaleString('en-IN')} driven`} />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Trips per day" subtitle="Daily trip volume for the selected period">
          <Columns items={tripsDaily.map((t) => ({ label: String(t.day), n: t.trips, bg: 'bg-chart-cyan' }))} height={110} />
          <div className="mt-4 flex gap-6">
            <Stat label="Total trips" value={String(fleet.trips)} note="this period" />
            <Stat label="Avg / day" value={(fleet.trips / tripsDaily.length).toFixed(1)} note={`${tripsDaily.length} working days`} />
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

        <Panel className="col-span-12" title="Distributor performance" subtitle="Trip efficiency & fleet use by distributor · select a distributor for driver-level detail">
          <table className="w-full border-collapse">
            <thead>
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="py-2 pr-3 font-semibold">Distributor</th>
                <th className="py-2 pr-3 font-semibold">City</th>
                <th className="py-2 pr-3 text-right font-semibold">Orders</th>
                <th className="py-2 pr-3 text-right font-semibold">Fulfilled</th>
                <th className="py-2 pr-3 text-right font-semibold">Returns</th>
                <th className="py-2 pr-3 text-right font-semibold">Invoice</th>
                <th className="py-2 pr-3 text-right font-semibold">Vehicles</th>
                <th className="py-2 pr-3 text-right font-semibold">Veh · Wt · Time · DP util</th>
                <th className="py-2 pr-3 text-right font-semibold">Fill rate</th>
                <th className="py-2 text-right font-semibold">Trip efficiency</th>
              </tr>
            </thead>
            <tbody className="type-caption">
              {opsDistributors.map((d) => (
                <tr
                  key={d.code}
                  className={cn('cursor-pointer border-t border-border-subtle hover:bg-muted', picked === d.code && 'bg-primary-soft')}
                  onClick={() => setPicked(picked === d.code ? null : d.code)}
                >
                  <td className="py-1.5 pr-3 font-medium">{d.name}<span className="ml-1.5 font-normal text-foreground-tertiary">{d.code}</span></td>
                  <td className="py-1.5 pr-3">{d.city}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.orders}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.fulfilled}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.returned}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">₹{d.invoiceL}L</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.vehicles}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.vehicleUtil} · {d.weightUtil} · {d.timeUtil} · {d.dpUtil}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.fillRate}%</td>
                  <td className="py-1.5 text-right tabular-nums">{d.tripEfficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          className="col-span-12"
          title="Driver performance analytics"
          subtitle="Overview of trips, distance covered, and delivery success metrics"
          right={picked ? (
            <Badge variant="info" className="cursor-pointer normal-case tracking-normal" onClick={() => setPicked(null)}>
              {opsDistributors.find((d) => d.code === picked)?.name} · clear ✕
            </Badge>
          ) : undefined}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="py-2 pr-3 font-semibold">Driver</th>
                <th className="py-2 pr-3 font-semibold">Vehicle</th>
                <th className="py-2 pr-3 font-semibold">Distributor</th>
                <th className="py-2 pr-3 text-right font-semibold">Trips</th>
                <th className="py-2 pr-3 text-right font-semibold">Distance (km)</th>
                <th className="py-2 pr-3 text-right font-semibold">Attempts</th>
                <th className="py-2 pr-3 text-right font-semibold">Returns</th>
                <th className="py-2 pr-3 text-right font-semibold">Return %</th>
                <th className="py-2 pr-3 text-right font-semibold">Success rate</th>
                <th className="py-2 pr-3 text-right font-semibold">Runtime</th>
                <th className="py-2 pr-3 text-right font-semibold">Net sale</th>
                <th className="py-2 text-right font-semibold">Contribution</th>
              </tr>
            </thead>
            <tbody className="type-caption">
              {shownDrivers.map((d) => (
                <tr key={d.name} className="border-t border-border-subtle">
                  <td className="py-1.5 pr-3 font-medium">{d.name}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{(d.vehicles ?? [d.vehicle]).join(', ')}</td>
                  <td className="py-1.5 pr-3">{opsDistributors.find((x) => x.code === d.distributor)?.name} · {d.city}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.trips}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.distanceKm}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.attempts}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.returns}</td>
                  <td className={cn('py-1.5 pr-3 text-right tabular-nums', d.returnPct > 10 && 'text-error-foreground')}>{d.returnPct}%</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.successRate}%</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.runtime}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{d.netSale}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.contribution}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
