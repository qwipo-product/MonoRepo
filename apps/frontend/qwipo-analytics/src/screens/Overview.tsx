import { Badge, Card, CardContent, CardHeader, CardTitle, CardDescription, cn } from '@mockups/ui';
import { ScopeBar } from '../components/ScopeBar';
import { TrendChart } from '../components/TrendChart';
import { Panel, Question, KpiCard, RankedRow, Columns } from '../components/dashboard';
import { statusColor, ageColor } from '../components/colors';
import {
  kpis, dailyValue, dailyPrev, dailyDelivered, attention, statuses, ageing, funnel, newOutletsByWeek,
  dimensions, movers, typeHue,
} from '../data/overview';
import type { Page } from '../nav';

const sevText = { error: 'text-error', warning: 'text-warning', info: 'text-info' } as const;

export default function Overview({ go }: { go: (p: Page) => void }) {
  const total = statuses.reduce((s, x) => s + x.orders, 0);
  const open = statuses.filter((s) => ['created', 'accepted', 'packed', 'shipped'].includes(s.key)).reduce((s, x) => s + x.orders, 0);
  const delivered = statuses.find((s) => s.key === 'delivered')!.orders;
  const cancelled = statuses.find((s) => s.key === 'cancelled')!.orders;
  const closed = delivered + cancelled;
  const bucketTotals = ageing.buckets.map((_, i) => ageing.rows.reduce((s, r) => s + r.counts[i], 0));
  const cellMax = 60;

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar
        chips={[
          { label: 'Company', value: 'All companies (5)' },
          { label: 'City', value: 'All cities (6)' },
          { label: 'Distributor', value: 'All distributors (18)' },
          { label: 'Date range', value: '1 – 22 Aug 2026 · month to date' },
        ]}
        line="Compared with the same days of the previous month, 1 – 22 Jul 2026 · Full network · Super Admin"
      />

      <section>
        <Question>Are we growing?</Question>
        <div className="grid grid-cols-5 gap-3">
          {kpis.map((k) => <KpiCard key={k.label} {...k} onOpen={() => go('sales')} />)}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-8" question="What changed?" title="Order value per day" subtitle="Current vs same days last month · delivered value shaded" onOpen={() => go('sales')}>
          <TrendChart current={dailyValue} previous={dailyPrev} delivered={dailyDelivered} />
          <div className="mt-2 flex gap-4 text-xs text-foreground-secondary">
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-primary" />Order value · ₹38.6L</span>
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-success" />Delivered value · ₹15.0L</span>
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-border-strong" />1 – 22 Jul · ₹34.7L</span>
          </div>
        </Panel>

        <Card className="col-span-4">
          <CardHeader className="pb-3">
            <Question>What needs me today?</Question>
            <CardTitle className="text-sm">Attention</CardTitle>
            <CardDescription>Rule-based · ordered by value at risk</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {attention.map((a) => (
              <button key={a.title} type="button" onClick={() => go(a.goto as Page)} className="grid grid-cols-[44px_1fr] gap-2.5 rounded-lg border border-border p-2.5 text-left hover:border-primary/40">
                <span className={cn('text-right text-xl font-semibold tabular-nums leading-tight', sevText[a.severity])}>{a.count}</span>
                <span>
                  <b className="block text-[13px] font-semibold leading-snug">{a.title}</b>
                  <span className="block text-xs text-foreground-secondary">{a.detail}</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-link">{a.owner} →</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Panel className="col-span-5" question="Are we fulfilling?" title="Order outcomes" subtitle={`${total.toLocaleString('en-IN')} orders · open ${open} · closed ${closed}`} onOpen={() => go('sales')}>
          <Columns items={[
            { label: 'Open', n: open, color: '#93c5fd' },
            { label: 'Delivered', n: delivered, color: statusColor.delivered },
            { label: 'Cancelled', n: cancelled, color: statusColor.cancelled },
            { label: 'Returned', n: 12, color: statusColor.returned },
          ]} />
          <div className="mt-5 flex gap-5">
            <div><div className="text-xs text-foreground-secondary">Delivery rate</div><div className="text-xl font-semibold tabular-nums">{((delivered / closed) * 100).toFixed(1)}%</div><div className="text-xs text-foreground-secondary"><span className="text-error-foreground">target 70%</span> · {delivered} ÷ {closed} closed</div></div>
            <div><div className="text-xs text-foreground-secondary">Cancellation rate</div><div className="text-xl font-semibold tabular-nums">{((cancelled / total) * 100).toFixed(1)}%</div><div className="text-xs text-foreground-secondary"><span className="text-error-foreground">↑ 4.1 pts</span> · {cancelled} of {total.toLocaleString('en-IN')}</div></div>
          </div>
        </Panel>

        <Panel className="col-span-7" question="What is stuck?" title="Open orders by age" subtitle={`${open} open · days since order date`} onOpen={() => go('sales')}>
          <Columns items={ageing.buckets.map((b, i) => ({ label: i === 0 ? 'D0 today' : i === 4 ? 'D4+ overdue' : b, n: bucketTotals[i], color: ageColor[i] }))} />
          <div className="mt-4 grid grid-cols-[80px_repeat(5,1fr)_48px] gap-1 text-[11.5px]">
            <div />
            {ageing.buckets.map((b) => <div key={b} className="text-center text-[10.5px] font-semibold text-foreground-secondary">{b}</div>)}
            <div />
            {ageing.rows.map((r) => (
              <>
                <div key={r.stage} className="whitespace-nowrap">{r.stage}</div>
                {r.counts.map((n, i) => {
                  const red = i === 4; const a = 0.08 + 0.85 * Math.min(n / cellMax, 1);
                  return (
                    <div key={i} className="grid h-7 place-items-center rounded font-medium tabular-nums"
                      style={{ background: red ? `rgba(220,38,38,${0.15 + 0.8 * n / cellMax})` : `rgba(37,99,235,${a})`, color: (red ? n > 25 : a > 0.55) ? '#fff' : 'var(--foreground)' }}>
                      {n}
                    </div>
                  );
                })}
                <div key={`${r.stage}t`} className="text-right tabular-nums text-foreground-secondary">{r.counts.reduce((s, x) => s + x, 0)}</div>
              </>
            ))}
            <div className="text-foreground-secondary">Total</div>
            {bucketTotals.map((t, i) => <div key={i} className="text-center tabular-nums text-foreground-secondary">{t}</div>)}
            <div className="text-right tabular-nums text-foreground-secondary">{open}</div>
          </div>
          <p className="mt-2.5 text-xs text-foreground-secondary">{ageing.rows[3].counts[4]} of {bucketTotals[4]} overdue orders are already <b className="text-foreground">Shipped</b>: the delay is last-mile, not acceptance.</p>
        </Panel>

        <Panel className="col-span-12" question="Are we widening the base?" title="Outlet funnel" subtitle={`${funnel[0].n} outlets onboarded in period`} onOpen={() => go('customers')}>
          <div className="grid grid-cols-[5fr_3fr_4fr] items-start gap-7">
            <div className="flex flex-col gap-1">
              {funnel.map((f, i) => {
                const w = f.n / funnel[0].n; const nxt = i < funnel.length - 1 ? funnel[i + 1].n / funnel[0].n : w * 0.7;
                return (
                  <div key={f.label} className="grid grid-cols-[90px_minmax(160px,1fr)_100px] items-center gap-2 text-[12.5px]">
                    <span className="text-right">{f.label}</span>
                    <div className="flex justify-center">
                      <div className={cn('grid h-[34px] place-items-center text-[13px] font-semibold text-white', i === funnel.length - 1 ? 'bg-success' : 'bg-primary')}
                        style={{ width: `${w * 100}%`, clipPath: `polygon(0 0,100% 0,${100 - ((w - nxt) / 2 / w) * 100}% 100%,${((w - nxt) / 2 / w) * 100}% 100%)` }}>
                        {f.n}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-foreground-secondary">{i === 0 ? '—' : <><b className="text-foreground">{Math.round((f.n / funnel[i - 1].n) * 100)}%</b> of prev</>}</span>
                  </div>
                );
              })}
              <p className="mt-1.5 text-xs text-foreground-secondary">Qualified = ≥2 orders, each &gt; ₹300</p>
            </div>
            <div>
              <p className="text-xs text-foreground-secondary"><b className="text-foreground">New outlets per week</b> · first-ever order · 62 total</p>
              <Columns items={newOutletsByWeek.map((w) => ({ ...w, color: '#4f46e5' }))} height={90} />
            </div>
            <div className="grid grid-cols-[10px_1fr] gap-2.5 rounded-lg border border-border p-3">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-error" />
              <div>
                <b className="text-[13px] font-semibold">93 outlets onboarded but silent</b>
                <p className="text-xs text-foreground-secondary">Median 11 days since onboarding · 61 in beats with no visit logged</p>
                <span className="mt-1 block text-[11px] font-medium text-link">Sales →</span>
              </div>
            </div>
          </div>
        </Panel>

        <Card className="col-span-12">
          <CardHeader className="pb-3">
            <Question>Who drives, who drags?</Question>
            <CardTitle className="text-sm">Contribution</CardTitle>
            <CardDescription>Top entries in each dimension · scoped value · change vs 1 – 22 Jul</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="mb-2 text-xs font-medium text-foreground-secondary">Biggest movers · the largest ₹ change in each dimension</div>
              <div className="grid grid-cols-2 gap-x-10">
                {(['up', 'down'] as const).map((dir) => (
                  <div key={dir}>
                    <h4 className={cn('mb-2 border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-wider', dir === 'up' ? 'text-success-foreground' : 'text-error-foreground')}>
                      {dir === 'up' ? 'Driving · +₹7.3L together' : 'Dragging · −₹2.1L together'}
                    </h4>
                    {movers[dir].map((m) => (
                      <div key={m.name} className="grid grid-cols-[78px_1fr_1fr_70px] items-center gap-2.5 border-b border-border-subtle py-1.5 text-[12.5px]">
                        <Badge className="justify-center normal-case tracking-normal" style={{ background: typeHue[m.type], color: '#fff' }}>{m.type}</Badge>
                        <span>{m.name}<span className="block text-[11.5px] text-foreground-secondary">{m.sub}</span></span>
                        <div className="h-2 overflow-hidden rounded bg-background-sunken"><div className={cn('h-full rounded', dir === 'up' ? 'bg-success' : 'bg-error')} style={{ width: `${(Math.abs(m.change) / 21) * 100}%` }} /></div>
                        <span className={cn('text-right font-semibold tabular-nums', dir === 'up' ? 'text-success-foreground' : 'text-error-foreground')}>
                          {dir === 'up' ? '↑' : '↓'} {Math.abs(m.change)}%<span className="block text-[11.5px] font-normal text-foreground-secondary">{m.delta}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {[['Who sells', ['distributors', 'cities'], 'distributors'], ['What sells', ['companies', 'categories'], 'brands'], ['', ['brands', 'skus'], 'brands']].map(([head, keys, target]) => (
              <div key={(keys as string[]).join()}>
                {head && <button type="button" onClick={() => go(target as Page)} className="mb-2 text-xs font-medium text-foreground-secondary hover:text-link">{head as string}</button>}
                <div className="grid grid-cols-2 gap-x-9 gap-y-5">
                  {(keys as string[]).map((k) => {
                    const d = dimensions.find((x) => x.key === k)!;
                    const max = Math.max(...d.rows.filter((r) => !r.other).map((r) => r.value));
                    let rank = 0;
                    return (
                      <div key={k}>
                        <h4 className="mb-2.5 flex items-center gap-2 border-b-2 pb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: d.hue }}>
                          <i className="h-2 w-2 rounded-sm" style={{ background: d.hue }} />{d.label}
                          <span className="ml-auto font-medium normal-case tracking-normal text-foreground-secondary">{d.total}</span>
                        </h4>
                        <div className="flex flex-col gap-2">
                          {d.rows.map((r) => <RankedRow key={r.name} rank={r.other ? undefined : ++rank} name={r.name} value={`₹${r.value}L`} max={max} change={r.change} hue={d.hue} other={r.other} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-foreground-secondary">Company and brand values are line-item scoped: ₹36.2L mapped + ₹2.4L unmapped = ₹38.6L. Full rankings → Distributors and Brands pages, SKU Performance report.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
