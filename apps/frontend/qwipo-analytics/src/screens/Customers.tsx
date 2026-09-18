// Customers & Onboarding — admin-only. The funnel promoted from the Overview,
// onboarding cohorts, frequency bands, gone-quiet and silent analysis. Same
// grammar: no navigation, drawers only.
import { useState } from 'react';
import { Columns, HBars } from '@mockups/components';
import { ScopeBar } from '../components/ScopeBar';
import { Funnel } from '../components/Funnel';
import { Handoff } from '../components/Handoff';
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
  const [entity, setEntity] = useState<{ title: string; total: string; rows: EntityRow[]; quickFilters?: EntityQuickFilter[]; initialQf?: number; report?: string } | null>(null);
  const openFunnel = (initialQf: number, title = 'Outlets onboarded this period') =>
    setEntity({ title, total: '210 outlets · 1 – 22 Aug', rows: funnelOutlets, quickFilters: funnelQuick, initialQf, report: 'onboarding-funnel' });

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar line="Compared with the same days of the previous month, 1 – 22 Jul 2026 · Full network · Super Admin" />
      {entity && <EntityDrawer {...entity} onClose={() => setEntity(null)} go={go} />}

      <section>
        <div className="grid grid-cols-5 gap-3">
          <KpiCard label="Active outlets" value="480" change="↑ 5.8%" trend="up" note="454"
            onOpen={() => setEntity({ title: 'Outlet register', total: '480 outlets', rows: [...funnelOutlets, ...quietOutlets], report: 'customer-master' })} />
          <KpiCard label="Onboarded this period" value="210" change="↑ 12%" trend="up" note="187" onOpen={() => openFunnel(0)} />
          <KpiCard label="Onboarded → ordered" value="56%" change="↑ 3 pts" trend="up" note="117 of 210" onOpen={() => openFunnel(1)} />
          <KpiCard label="Qualified" value="48" change="↑ 9" trend="up" note="≥2 orders, each > ₹300" onOpen={() => openFunnel(3)} />
          <KpiCard label="Gone quiet" value="148" change="↑ 22" trend="up" inverse note="₹6.2L monthly value" target="error"
            onOpen={() => setEntity({ title: 'High-value outlets gone quiet', total: '148 outlets · ₹6.2L monthly value', rows: quietOutlets, report: 'customer-master' })} />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-7" title="Onboarding funnel" subtitle="Qualified = ≥2 orders, each > ₹300" onOpen={() => openFunnel(0)}>
          <Funnel stages={funnel} onStage={(i, label) => openFunnel(i, `Outlets · ${label}`)} />
        </Panel>

        <Panel className="col-span-5" title="Weekly cohorts" subtitle="Onboarded · how many ordered">
          <Columns
            height={110}
            items={cohorts.map((c) => ({ label: `${c.label} Aug`, n: c.n, bg: 'bg-chart-indigo' }))}
            onBar={(l) => {
              const wi = cohorts.findIndex((c) => `${c.label} Aug` === l);
              setEntity({ title: `Onboarded ${cohorts[wi].label} Aug`, total: `${cohorts[wi].n} outlets`, rows: funnelOutlets.filter((r) => r.tags?.includes(`w${wi + 1}`)), report: 'onboarding-funnel' });
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
              report: 'onboarding-funnel',
            })}
          />
        </Panel>

        <Panel className="col-span-4" title="Gone quiet · by city" subtitle="148 outlets · no order 14+ days">
          <HBars
            rows={quietByCity.map((r) => ({ label: r.label, n: r.n, value: r.value, barClass: toneBg[r.tone] }))}
            onRow={(label) => setEntity({ title: `Gone quiet · ${label}`, total: `${quietByCity.find((x) => x.label === label)!.n} outlets`, rows: quietOutlets.filter((r) => r.sub.startsWith(label)), report: 'customer-master' })}
          />
        </Panel>

        <Panel className="col-span-4" title="How long quiet" subtitle="Longest quiet = highest risk">
          <Columns
            height={110}
            items={quietAges.map((b, i) => ({ label: b.label, n: b.n, bg: ['bg-warning', 'bg-error', 'bg-error'][i] }))}
            onBar={() => setEntity({ title: 'High-value outlets gone quiet', total: '148 outlets · ₹6.2L monthly value', rows: quietOutlets, report: 'customer-master' })}
          />
        </Panel>

        <Handoff
          className="col-span-12"
          go={go}
          report="customer-master"
          title="Need the outlet records?"
          body="Runs the Customer Master report with this scope · Platform Admin only · lands in Run history."
          cta="Run Customer Master"
        />
      </div>
    </div>
  );
}
