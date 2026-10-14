// Distributors — admin-only. Leaderboard of all 18, size & momentum scatter,
// cancellation health, overdue load, beats, scheme placeholder. Same grammar
// as the frozen Overview: no page navigation, everything drills via drawers.
import { useState } from 'react';
import { Badge } from '@mockups/ui';
import { HBars } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Handoff } from '../components/Handoff';
import { Panel, KpiCard } from '../components/dashboard';
import { RecordsDrawer } from '../components/RecordsDrawer';
import { DistributorDrawer } from '../components/DistributorDrawer';
import { LeaderboardDrawer } from '../components/LeaderboardDrawer';
import { distributorRows, topBeats, type DistributorRow } from '../data/distributors';
import { drillDistributors } from '../data/sales';
import { toneBg } from '../components/chartClasses';
import type { Stage } from '../data/orderRows';
import type { Page } from '../nav';

const NETWORK_CANCEL = 24.9;
type Drill = { title: string; total: string; statuses?: Stage[]; distributors?: string[]; sort?: boolean };


export default function Distributors({ go }: { go: (p: Page) => void }) {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [detail, setDetail] = useState<DistributorRow | null>(null);
  const [board, setBoard] = useState(false);

  const openOrders = (d: DistributorRow) =>
    setDrill({ title: `Orders · ${d.name}`, total: `${d.orders} orders · ₹${d.value}L`, distributors: [d.name] });


  return (
    <div className="flex flex-col gap-5">
      <ScopeBar />
      {drill && <RecordsDrawer {...drill} sortByValue={drill.sort} onClose={() => setDrill(null)} go={go} />}
      {detail && !drill && (
        <DistributorDrawer d={detail} onClose={() => setDetail(null)} go={go}
          onOrders={() => { openOrders(detail); setDetail(null); }} />
      )}
      {board && !detail && !drill && (
        <LeaderboardDrawer onClose={() => setBoard(false)} go={go}
          onPick={(d) => { setBoard(false); setDetail(d); }} />
      )}

      <section>
        <div className="grid grid-cols-5 gap-3">
          <KpiCard label="Distributors" value="18" change="→" trend="flat" note="6 cities" />
          <KpiCard label="Network value" value="₹38.6L" change="↑ 11.2%" trend="up" note="₹34.7L" />
          <KpiCard label="Avg delivery rate" value="61.5%" change="↑ 1.8 pts" trend="up" note="target 70%" target="warning" />
          <KpiCard label="Avg cancellation" value="24.9%" change="↑ 4.1 pts" trend="up" inverse note="of orders" />
          <KpiCard label="Over 30% cancellation" value="2" change="↑ 1" trend="up" inverse note="Vijaya · Lakshmi" target="error"
            onOpen={() => setDrill({ title: 'Cancelled · Vijaya & Lakshmi', total: '89 orders · ₹3.3L', statuses: ['cancelled'], distributors: ['Vijaya Distributors', 'Lakshmi Agencies'] })} />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-5"
          title="Leaderboard"
          subtitle="18 distributors · ₹38.6L"
          onOpen={() => setBoard(true)}
        >
          {[...distributorRows].sort((a, b) => b.value - a.value).slice(0, 3).map((d, i) => (
            <div
              key={d.name}
              className="-mx-1.5 flex cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); setDetail(d); }}
            >
              <i className="type-caption w-3.5 shrink-0 not-italic text-foreground-tertiary">{i + 1}</i>
              <span className="min-w-0 flex-1">
                <span className="type-body block truncate">{d.name}</span>
                <span className="type-caption block text-foreground-tertiary">{d.city} · delivery {d.delivery}%</span>
              </span>
              <b className="type-price-sm">₹{d.value}L</b>
              <Badge variant={d.change < 0 ? 'danger' : 'success'}>{d.change < 0 ? '↓' : '↑'} {Math.abs(d.change)}%</Badge>
            </div>
          ))}
          <div className="type-caption mt-1.5 flex justify-between border-t border-dashed border-border pt-1.5 text-foreground-secondary">
            <span>15 others</span>
            <span className="tabular-nums">₹20.7L</span>
          </div>
          <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full">
            <i className="block bg-chart-blue" style={{ width: '20.5%' }} />
            <i className="block bg-chart-blue opacity-70" style={{ width: '14.5%' }} />
            <i className="block bg-chart-blue opacity-45" style={{ width: '11.4%' }} />
            <i className="block flex-1 bg-background-sunken" />
          </div>
        </Panel>

        <Panel className="col-span-7" title="Size against momentum" subtitle="Value × growth · dot size = orders · click a dot to drill in">
          <MomentumScatter onPick={(name) => setDetail(distributorRows.find((d) => d.name === name)!)} />
        </Panel>

        <Panel className="col-span-5" title="Cancellation health" subtitle={`Network ${NETWORK_CANCEL}% · worst first`}>
          <HBars
            rows={[...distributorRows].sort((a, b) => b.cancel - a.cancel).slice(0, 6).map((d) => ({
              label: `${d.name} · ${d.city}`, n: d.cancel, value: `${d.cancel}%`,
              barClass: d.cancel > 30 ? 'bg-error' : d.cancel > NETWORK_CANCEL ? 'bg-warning' : 'bg-border-strong',
            }))}
            wideLabel
            onRow={(label) => {
              const d = distributorRows.find((x) => label.startsWith(x.name))!;
              setDrill({ title: `Cancelled · ${d.name}`, total: `${Math.round((d.orders * d.cancel) / 100)} orders`, statuses: ['cancelled'], distributors: [d.name] });
            }}
          />
          <p className="type-caption mt-3 text-foreground-secondary">Stock-outs drive both distributors above 30%.</p>
        </Panel>

        <Panel className="col-span-5" title="Overdue load" subtitle="91 open past 4 days · by distributor">
          <HBars
            rows={drillDistributors.map((r) => ({ label: r.label, n: r.n, value: r.value, barClass: toneBg[r.tone] }))}
            wideLabel
            onRow={(label) => {
              const name = label.split(' · ')[0];
              if (name.includes('others')) return;
              setDrill({ title: `Overdue · ${name}`, total: `${drillDistributors.find((x) => x.label === label)!.n} orders`, statuses: ['created', 'accepted'], distributors: [name] });
            }}
          />
        </Panel>

        <Panel className="col-span-7" title="Top sales beats" subtitle="From order lines · Sales Beat Name">
          <HBars rows={topBeats.map((r) => ({ label: r.label, n: r.n, value: r.value, barClass: toneBg[r.tone] }))} wideLabel />
        </Panel>

        <Panel
          className="col-span-5"
          title="Discount & scheme impact"
          right={<Badge variant="warning" className="normal-case tracking-normal">needs scheme feed</Badge>}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="type-caption text-foreground-secondary">Avg line discount</div>
              <div className="type-h1 tabular-nums">4.2%</div>
              <div className="type-caption text-foreground-secondary">of MRP · from order lines</div>
            </div>
            <div>
              <div className="type-caption text-foreground-secondary">Scheme-tagged value</div>
              <div className="type-h1 tabular-nums text-foreground-tertiary">—</div>
              <div className="type-caption text-warning-foreground">Applied Scheme Name feed pending</div>
            </div>
          </div>
        </Panel>

        <Handoff
          className="col-span-7"
          go={go}
          report="distributor-performance"
          title="Need distributor-level records?"
          body="Runs the Distributor Performance report with this scope · lands in Run history."
          cta="Run Distributor Performance"
        />
      </div>
    </div>
  );
}

/** Value × growth scatter; horizontal zero-growth line, dot size by orders. */
function MomentumScatter({ onPick }: { onPick: (name: string) => void }) {
  const [hover, setHover] = useState<DistributorRow | null>(null);
  const x = (v: number) => 60 + (v / 8.5) * 900;
  const y = (c: number) => 160 - c * 5; // -12%..+24% → 220..40
  return (
    <div className="relative">
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-md"
          style={{ left: `${Math.min(Math.max((x(hover.value) / 1000) * 100, 15), 85)}%`, top: `${(y(hover.change) / 280) * 100 - 4}%` }}
        >
          <div className="type-label whitespace-nowrap">{hover.name}</div>
          <div className="type-caption whitespace-nowrap text-foreground-secondary">₹{hover.value}L · {hover.orders} orders · {hover.change < 0 ? '↓' : '↑'} {Math.abs(hover.change)}% vs Jul</div>
        </div>
      )}
      <svg viewBox="0 0 1000 280" className="block w-full" role="img" aria-label="Distributor value against growth">
        <line x1={60} y1={y(0)} x2={980} y2={y(0)} className="stroke-border-strong" strokeDasharray="5 4" />
        <text x={978} y={y(0) - 6} textAnchor="end" className="fill-foreground-secondary text-[10px]">no growth</text>
        {[2, 4, 6, 8].map((v) => (
          <text key={v} x={x(v)} y={272} textAnchor="middle" className="fill-foreground-secondary text-[10px]">₹{v}L</text>
        ))}
        {distributorRows.map((d) => (
          <g key={d.name} className="cursor-pointer" onClick={() => onPick(d.name)} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
            <circle cx={x(d.value)} cy={y(d.change)} r={4 + Math.sqrt(d.orders) * 0.9} className={d.change < 0 ? 'fill-error' : 'fill-success'} opacity={0.8} />
            {d.value > 2.5 && (
              <text x={x(d.value)} y={y(d.change) - (6 + Math.sqrt(d.orders))} textAnchor="middle" className="fill-foreground text-[10px] font-medium">{d.name.split(' ')[0] === 'Sri' ? d.name.split(' ')[1] : d.name.split(' ')[0]}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
