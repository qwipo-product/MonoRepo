import { Fragment } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, CardDescription, cn } from '@mockups/ui';
import { ScopeBar } from '../components/ScopeBar';
import { TrendChart } from '../components/TrendChart';
import { RankedRow, Columns, Stat } from '@mockups/components';
import { Panel, Question, KpiCard } from '../components/dashboard';
import { dimBg, dimBorder, ageBg, severityText, openBg } from '../components/chartClasses';
import {
  kpis, dailyValue, dailyPrev, dailyDelivered, attention, statuses, ageing, funnel, newOutletsByWeek,
  dimensions, movers, dimensionLabel,
} from '../data/overview';
import type { Page } from '../nav';

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

export default function Overview({ go }: { go: (p: Page | string) => void }) {
  const total = sum(statuses.map((s) => s.orders));
  const open = sum(statuses.filter((s) => ['created', 'accepted', 'packed', 'shipped'].includes(s.key)).map((s) => s.orders));
  const delivered = statuses.find((s) => s.key === 'delivered')!.orders;
  const cancelled = statuses.find((s) => s.key === 'cancelled')!.orders;
  const returned = statuses.find((s) => s.key === 'returned')!.orders;
  const closed = delivered + cancelled;
  const bucketTotals = ageing.buckets.map((_, i) => sum(ageing.rows.map((r) => r.counts[i])));

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
          <div className="type-caption mt-2 flex gap-4 text-foreground-secondary">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-primary" />Order value · ₹38.6L</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />Delivered value · ₹15.0L</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-border-strong" />1 – 22 Jul · ₹34.7L</span>
          </div>
        </Panel>

        <Card className="col-span-4">
          <CardHeader className="pb-3">
            <Question>What needs me today?</Question>
            <CardTitle className="type-label">Attention</CardTitle>
            <CardDescription>Rule-based · ordered by value at risk</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {attention.map((a) => (
              <Card key={a.title} variant="interactive" onClick={() => go(a.drill ? `${a.goto}/${a.drill}` : a.goto)} className="grid grid-cols-[44px_1fr] gap-2.5 p-2.5">
                <span className={cn('type-h1 text-right tabular-nums', severityText[a.severity])}>{a.count}</span>
                <span>
                  <b className="type-label block leading-snug">{a.title}</b>
                  <span className="type-caption block text-foreground-secondary">{a.detail}</span>
                  <span className="type-caption mt-0.5 block font-medium text-link">{a.owner} →</span>
                </span>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Panel className="col-span-5" question="Are we fulfilling?" title="Order outcomes" subtitle={`${total.toLocaleString('en-IN')} orders · open ${open} · closed ${closed}`} onOpen={() => go('sales')}>
          <Columns items={[
            { label: 'Open', n: open, bg: openBg },
            { label: 'Delivered', n: delivered, bg: 'bg-success' },
            { label: 'Cancelled', n: cancelled, bg: 'bg-error' },
            { label: 'Returned', n: returned, bg: 'bg-warning' },
          ]} />
          <div className="mt-5 flex gap-5">
            <Stat label="Delivery rate" value={`${((delivered / closed) * 100).toFixed(1)}%`} note={<><span className="text-error-foreground">target 70%</span> · {delivered} ÷ {closed} closed</>} />
            <Stat label="Cancellation rate" value={`${((cancelled / total) * 100).toFixed(1)}%`} note={<><span className="text-error-foreground">↑ 4.1 pts</span> · {cancelled} of {total.toLocaleString('en-IN')}</>} />
          </div>
        </Panel>

        <Panel className="col-span-7" question="What is stuck?" title="Open orders by age" subtitle={`${open} open · days since order date`} onOpen={() => go('sales')}>
          <Columns items={ageing.buckets.map((b, i) => ({ label: i === 0 ? 'D0 today' : i === 4 ? 'D4+ overdue' : b, n: bucketTotals[i], bg: ageBg[i] }))} />
          <div className="type-caption mt-4 grid grid-cols-[80px_repeat(5,1fr)_48px] gap-1">
            <div />
            {ageing.buckets.map((b) => <div key={b} className="type-micro text-center text-foreground-secondary">{b}</div>)}
            <div />
            {ageing.rows.map((r) => (
              <Fragment key={r.stage}>
                <div className="whitespace-nowrap">{r.stage}</div>
                {r.counts.map((n, i) => (
                  <div key={i} className="relative grid h-7 place-items-center rounded-sm font-medium tabular-nums">
                    <i className={cn('absolute inset-0 rounded-sm', i === 4 ? 'bg-error' : 'bg-primary')} style={{ opacity: 0.12 + 0.88 * Math.min(n / 60, 1) }} />
                    <span className={cn('relative', n >= 30 ? 'text-primary-foreground' : 'text-foreground')}>{n}</span>
                  </div>
                ))}
                <div className="text-right tabular-nums text-foreground-secondary">{sum(r.counts)}</div>
              </Fragment>
            ))}
            <div className="text-foreground-secondary">Total</div>
            {bucketTotals.map((t, i) => <div key={i} className="text-center tabular-nums text-foreground-secondary">{t}</div>)}
            <div className="text-right tabular-nums text-foreground-secondary">{open}</div>
          </div>
          <p className="type-caption mt-2.5 text-foreground-secondary">{ageing.rows[3].counts[4]} of {bucketTotals[4]} overdue orders are already <b className="text-foreground">Shipped</b>: the delay is last-mile, not acceptance.</p>
        </Panel>

        <Panel className="col-span-12" question="Are we widening the base?" title="Outlet funnel" subtitle={`${funnel[0].n} outlets onboarded in period`} onOpen={() => go('customers')}>
          <div className="grid grid-cols-[5fr_3fr_4fr] items-start gap-7">
            <div className="flex flex-col gap-1">
              {funnel.map((f, i) => {
                const w = f.n / funnel[0].n; const nxt = i < funnel.length - 1 ? funnel[i + 1].n / funnel[0].n : w * 0.7;
                const inset = ((w - nxt) / 2 / w) * 100;
                return (
                  <div key={f.label} className="type-caption grid grid-cols-[90px_minmax(160px,1fr)_100px] items-center gap-2">
                    <span className="text-right text-foreground">{f.label}</span>
                    <div className="flex justify-center">
                      <div className={cn('type-price-sm grid h-[34px] place-items-center text-primary-foreground', i === funnel.length - 1 ? 'bg-success' : 'bg-primary')}
                        style={{ width: `${w * 100}%`, clipPath: `polygon(0 0,100% 0,${100 - inset}% 100%,${inset}% 100%)` }}>
                        {f.n}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-foreground-secondary">{i === 0 ? '—' : <><b className="text-foreground">{Math.round((f.n / funnel[i - 1].n) * 100)}%</b> of prev</>}</span>
                  </div>
                );
              })}
              <p className="type-caption mt-1.5 text-foreground-secondary">Qualified = ≥2 orders, each &gt; ₹300</p>
            </div>
            <div>
              <p className="type-caption text-foreground-secondary"><b className="text-foreground">New outlets per week</b> · first-ever order · 62 total</p>
              <Columns items={newOutletsByWeek.map((w) => ({ ...w, bg: dimBg.company }))} height={90} />
            </div>
            <Card variant="compact" className="grid grid-cols-[10px_1fr] gap-2.5 p-3">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-error" />
              <div>
                <b className="type-label">93 outlets onboarded but silent</b>
                <p className="type-caption text-foreground-secondary">Median 11 days since onboarding · 61 in beats with no visit logged</p>
                <span className="type-caption mt-1 block font-medium text-link">Sales →</span>
              </div>
            </Card>
          </div>
        </Panel>

        <Card className="col-span-12">
          <CardHeader className="pb-3">
            <Question>Who drives, who drags?</Question>
            <CardTitle className="type-label">Contribution</CardTitle>
            <CardDescription>Top entries in each dimension · scoped value · change vs 1 – 22 Jul</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="type-caption mb-2 font-medium text-foreground-secondary">Biggest movers · the largest ₹ change in each dimension</div>
              <div className="grid grid-cols-2 gap-x-10">
                {(['up', 'down'] as const).map((dir) => (
                  <div key={dir}>
                    <h4 className={cn('type-micro mb-2 border-b border-border pb-1.5', dir === 'up' ? 'text-success-foreground' : 'text-error-foreground')}>
                      {dir === 'up' ? 'Driving · +₹7.3L together' : 'Dragging · −₹2.1L together'}
                    </h4>
                    {movers[dir].map((m) => (
                      <div key={m.name} className="type-caption grid grid-cols-[78px_1fr_1fr_70px] items-center gap-2.5 border-b border-border-subtle py-1.5 text-foreground">
                        <Badge className={cn('justify-center normal-case tracking-normal text-primary-foreground', dimBg[m.type])}>{dimensionLabel[m.type]}</Badge>
                        <span>{m.name}<span className="block text-foreground-secondary">{m.sub}</span></span>
                        <div className="h-2 overflow-hidden rounded-sm bg-background-sunken"><div className={cn('h-full rounded-sm', dir === 'up' ? 'bg-success' : 'bg-error')} style={{ width: `${(Math.abs(m.change) / 21) * 100}%` }} /></div>
                        <span className={cn('text-right font-semibold tabular-nums', dir === 'up' ? 'text-success-foreground' : 'text-error-foreground')}>
                          {dir === 'up' ? '↑' : '↓'} {Math.abs(m.change)}%<span className="block font-normal text-foreground-secondary">{m.delta}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {([['Who sells', ['distributor', 'city'], 'distributors'], ['What sells', ['company', 'category'], 'brands'], ['', ['brand', 'sku'], 'brands']] as const).map(([head, keys, target]) => (
              <div key={keys.join()}>
                {head && <button type="button" onClick={() => go(target)} className="type-caption mb-2 font-medium text-foreground-secondary hover:text-link">{head}</button>}
                <div className="grid grid-cols-2 gap-x-9 gap-y-5">
                  {keys.map((k) => {
                    const d = dimensions.find((x) => x.key === k)!;
                    const max = Math.max(...d.rows.filter((r) => !r.other).map((r) => r.value));
                    let rank = 0;
                    return (
                      <div key={k}>
                        <h4 className={cn('type-micro mb-2.5 flex items-center gap-2 border-b-2 pb-1.5 text-foreground', dimBorder[d.key])}>
                          <i className={cn('h-2 w-2 rounded-sm', dimBg[d.key])} />{d.label}
                          <span className="ml-auto font-medium normal-case tracking-normal text-foreground-secondary">{d.total}</span>
                        </h4>
                        <div className="flex flex-col gap-2">
                          {d.rows.map((r) => <RankedRow key={r.name} rank={r.other ? undefined : ++rank} name={r.name} value={r.value} max={max} change={r.change} barClass={dimBg[d.key]} other={r.other} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="type-caption text-foreground-secondary">Company and brand values are line-item scoped: ₹36.2L mapped + ₹2.4L unmapped = ₹38.6L. Full rankings → Distributors and Brands pages, SKU Performance report.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
