// Customers & Onboarding — admin-only. The funnel promoted from the Overview,
// onboarding cohorts, frequency bands, gone-quiet and silent analysis. Same
// grammar: no navigation, drawers only.
import { useState } from 'react';
import { cn } from '@mockups/ui';
import { Columns, HBars } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Panel, KpiCard } from '../components/dashboard';
import { EntityDrawer, type EntityQuickFilter } from '../components/EntityDrawer';
import { funnelOutlets, quietOutlets, type EntityRow } from '../data/entityRows';
import { quietByCity, quietAges, frequencyBands, cohorts } from '../data/customers';
import { funnel } from '../data/overview';
import { toneBg } from '../components/chartClasses';
import type { Page } from '../nav';

const funnelQuick: EntityQuickFilter[] = [
  { label: 'All onboarded', count: 210 },
  { label: 'Ordered', tag: 'ordered', count: 117 },
  { label: 'Repeat ≥2', tag: 'repeat', count: 64 },
  { label: 'Qualified', tag: 'qualified', count: 48 },
  { label: 'Silent', tag: 'silent', count: 93 },
];

export default function Customers({ go }: { go: (p: Page) => void }) {
  const [entity, setEntity] = useState<{ title: string; total: string; rows: EntityRow[]; quickFilters?: EntityQuickFilter[]; initialQf?: number } | null>(null);
  const openFunnel = (initialQf: number, title = 'Outlets onboarded this period') =>
    setEntity({ title, total: '210 outlets · 1 – 22 Aug', rows: funnelOutlets, quickFilters: funnelQuick, initialQf });

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar line="Compared with the same days of the previous month, 1 – 22 Jul 2026 · Full network · Super Admin" />
      {entity && <EntityDrawer {...entity} onClose={() => setEntity(null)} go={go} />}

      <section>
        <div className="grid grid-cols-5 gap-3">
          <KpiCard label="Active outlets" value="480" change="↑ 5.8%" trend="up" note="454"
            onOpen={() => setEntity({ title: 'Outlet register', total: '480 outlets', rows: [...funnelOutlets, ...quietOutlets] })} />
          <KpiCard label="Onboarded this period" value="210" change="↑ 12%" trend="up" note="187" onOpen={() => openFunnel(0)} />
          <KpiCard label="Onboarded → ordered" value="56%" change="↑ 3 pts" trend="up" note="117 of 210" onOpen={() => openFunnel(1)} />
          <KpiCard label="Qualified" value="48" change="↑ 9" trend="up" note="≥2 orders, each > ₹300" onOpen={() => openFunnel(3)} />
          <KpiCard label="Gone quiet" value="148" change="↑ 22" trend="up" inverse note="₹6.2L monthly value" target="error"
            onOpen={() => setEntity({ title: 'High-value outlets gone quiet', total: '148 outlets · ₹6.2L monthly value', rows: quietOutlets })} />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-7" title="Onboarding funnel" subtitle="Qualified = ≥2 orders, each > ₹300" onOpen={() => openFunnel(0)}>
          <div className="flex flex-col gap-1.5 py-2">
            {funnel.map((f, i) => {
              const w = f.n / funnel[0].n; const nxt = i < funnel.length - 1 ? funnel[i + 1].n / funnel[0].n : w * 0.7;
              const inset = ((w - nxt) / 2 / w) * 100;
              return (
                <div
                  key={f.label}
                  className="type-caption grid cursor-pointer grid-cols-[110px_minmax(200px,1fr)_110px] items-center gap-3 rounded-md hover:bg-muted"
                  onClick={(e) => { e.stopPropagation(); openFunnel(i, `Outlets · ${f.label}`); }}
                >
                  <span className="text-right text-foreground">{f.label}</span>
                  <div className="flex justify-center">
                    <div
                      className={cn('type-price-sm grid h-10 place-items-center text-primary-foreground', i === funnel.length - 1 ? 'bg-success' : 'bg-primary')}
                      style={{ width: `${w * 100}%`, clipPath: `polygon(0 0,100% 0,${100 - inset}% 100%,${inset}% 100%)` }}
                    >
                      {f.n}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-foreground-secondary">{i === 0 ? '—' : <><b className="text-foreground">{Math.round((f.n / funnel[i - 1].n) * 100)}%</b> of prev</>}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="col-span-5" title="Weekly cohorts" subtitle="Onboarded · how many ordered">
          <Columns
            height={110}
            items={cohorts.map((c) => ({ label: `${c.label} Aug`, n: c.n, bg: 'bg-chart-indigo' }))}
            onBar={(l) => {
              const wi = cohorts.findIndex((c) => `${c.label} Aug` === l);
              setEntity({ title: `Onboarded ${cohorts[wi].label} Aug`, total: `${cohorts[wi].n} outlets`, rows: funnelOutlets.filter((r) => r.tags?.includes(`w${wi + 1}`)) });
            }}
          />
          <div className="type-caption mt-3 flex flex-col gap-1 text-foreground-secondary">
            {cohorts.map((c) => (
              <div key={c.label} className="flex justify-between">
                <span>{c.label} Aug</span>
                <span><b className="text-foreground tabular-nums">{Math.round((c.ordered / c.n) * 100)}%</b> ordered · {c.ordered} of {c.n}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-4" title="Order frequency" subtitle="480 active outlets">
          <Columns
            height={110}
            items={frequencyBands.map((b) => ({ label: b.label, n: b.n, bg: 'bg-chart-teal' }))}
            onBar={(l) => setEntity({
              title: `Outlets · ${l}`,
              total: `${frequencyBands.find((b) => b.label === l)!.n} outlets`,
              rows: l === '4+ orders' ? funnelOutlets.filter((r) => r.tags?.includes('qualified')) : funnelOutlets.filter((r) => r.tags?.includes('ordered')),
            })}
          />
        </Panel>

        <Panel className="col-span-4" title="Gone quiet · by city" subtitle="148 outlets · no order 14+ days">
          <HBars
            rows={quietByCity.map((r) => ({ label: r.label, n: r.n, value: r.value, barClass: toneBg[r.tone] }))}
            onRow={(label) => setEntity({ title: `Gone quiet · ${label}`, total: `${quietByCity.find((x) => x.label === label)!.n} outlets`, rows: quietOutlets.filter((r) => r.sub.startsWith(label)) })}
          />
        </Panel>

        <Panel className="col-span-4" title="How long quiet" subtitle="Longest quiet = highest risk">
          <Columns
            height={110}
            items={quietAges.map((b, i) => ({ label: b.label, n: b.n, bg: ['bg-warning', 'bg-error', 'bg-error'][i] }))}
            onBar={() => setEntity({ title: 'High-value outlets gone quiet', total: '148 outlets · ₹6.2L monthly value', rows: quietOutlets })}
          />
        </Panel>

        <div className="col-span-12 flex flex-col justify-center rounded-xl border border-dashed border-border bg-card p-5">
          <b className="type-label">Need the outlet records?</b>
          <p className="type-caption mt-0.5 text-foreground-secondary">Runs the Customer Master report with this scope · Platform Admin only · lands in Run history.</p>
          <div className="mt-3">
            <button type="button" onClick={() => go('reports')} className="type-caption rounded-md bg-primary px-3.5 py-2 font-medium text-primary-foreground hover:bg-primary-hover">
              Run Customer Master
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
