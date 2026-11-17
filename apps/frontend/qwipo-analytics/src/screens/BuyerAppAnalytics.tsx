// Buyer app analytics — its own sidebar group and page. PostHog-style product
// boards for the buyer app: Overview, ten app-screen boards, Funnels and
// Session recordings, all behind one shared filter bar.
// Hash: #buyer-analytics[/<board>[:<arg>]] — board is overview | funnels |
// recordings | a screen id (home, cart, …); arg is a funnel id or a recordings page.
import { useState, type ReactNode } from 'react';
import { ArrowRight, ChevronRight, Download, MapPin, PlayCircle, Share2, Target, Video } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, cn } from '@mockups/ui';
import { FilterSelect, useFlash } from '../components/buyerKit';
import { LineChart, Sparkline } from '../buyerapp/charts';
import { SERIES } from '../buyerapp/seriesColors';
import { OVERVIEW, explainEvent, explainFunnelRow, explainFunnelTile, explainKpi, explainSignal, explainStep, RECORDINGS_INFO } from '../buyerapp/explain';
import { BOARDS, type BoardSpec } from '../buyerapp/boards';
import { FUNNELS } from '../buyerapp/funnels';
import { RECORDINGS, RECORDING_PAGES, SIGNALS, SIGNAL_COUNTS, SIGNAL_INFO, type Signal } from '../buyerapp/recordings';
import { ALL_CITIES, dates, entry, event, funnel, int, kpi, pct, series, trendLabels } from '../buyerapp/engine';
import { useBoard, useFilters } from '../buyerapp/filters';
import { ChangePill, EntryLine, EventTable, FilterBar, FunnelTable, KpiStrip, Movers, Section, Tip } from '../buyerapp/ui';

const boardId = (b: BoardSpec) => b.path.slice(1);
const TH = 'type-micro py-2.5 font-semibold text-foreground-tertiary';

/* ── page frame ─────────────────────────────────────────────────────── */

function Frame({
  title, question, rail, flash, children,
}: { title: string; question: string; rail?: ReactNode; flash: (m: string) => void; children: ReactNode }) {
  const { filters, set } = useFilters();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="type-h2">{title}</h2>
          <p className="type-caption text-foreground-secondary">{question}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tip side="bottom" align="end" title="Sample data" note="Made-up numbers for this mockup. In the real product these come from PostHog and refresh every hour.">
            <span className="type-caption hidden cursor-default items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-foreground-secondary lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Sample data · updated 22 Aug, 9:00 AM
            </span>
          </Tip>
          <Button variant="secondary" size="sm" onClick={() => flash('Link copied')}><Share2 size={14} /> Share</Button>
          <Button variant="secondary" size="sm" onClick={() => flash('Exported as CSV')}><Download size={14} /> Export</Button>
        </div>
      </div>
      <Card className="px-4 py-3"><FilterBar /></Card>
      {filters.cities.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MapPin />}
            title="No location selected"
            description="Pick at least one state or city to see the numbers."
            action={<Button onClick={() => set({ cities: ALL_CITIES })}>Select all locations</Button>}
          />
        </Card>
      ) : rail ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-5">{children}</div>
          <aside className="flex flex-col gap-4">{rail}</aside>
        </div>
      ) : (
        <div className="flex flex-col gap-5">{children}</div>
      )}
    </div>
  );
}

/* ── boards ─────────────────────────────────────────────────────────── */

function Board({ spec, go, flash }: { spec: BoardSpec; go: (p: string) => void; flash: (m: string) => void }) {
  const { m } = useBoard();
  const sections = spec.sections.map((s) => ({ ...s, values: s.rows.map((r) => ({ ...event(m, r), ...explainEvent(spec, s.title, r) })) }));
  const tracked = sections.reduce((a, s) => a + s.values.length, 0);

  const rail = (
    <>
      <Movers rows={sections.flatMap((s) => s.values)} />
      {spec.recordings && (
        <Card className="flex flex-col gap-2 px-5 py-4">
          <div className="type-h3 flex items-center gap-2"><PlayCircle size={16} className="text-primary" /> Session recordings</div>
          <p className="type-caption text-foreground-secondary">See rage clicks, dead clicks and drop-offs on the {spec.recordings} page.</p>
          <button
            type="button"
            onClick={() => go(`buyer-analytics/recordings:${encodeURIComponent(spec.recordings!)}`)}
            className="type-caption flex items-center gap-1 font-medium text-link hover:underline"
          >
            Watch recordings <ArrowRight size={13} />
          </button>
        </Card>
      )}
      <p className="type-caption px-1 text-foreground-secondary">{tracked} actions tracked on this board.</p>
    </>
  );

  return (
    <Frame title={spec.title} question={spec.question} rail={rail} flash={flash}>
      <EntryLine place={spec.entry.place} {...entry(m, spec.entry)} />
      <KpiStrip kpis={spec.kpis.map((k) => ({ ...kpi(m, k), ...explainKpi(spec, k) }))} prev={m.R.prev} />
      {spec.funnel && (
        <Section title={spec.funnel.title} sub="Buyers at each step and where they drop off">
          <FunnelTable steps={funnel(m, spec.funnel.steps)} explain={(s, i) => explainStep(spec.funnel!.title, s, i)} />
        </Section>
      )}
      {sections.map((s) => (
        <Section key={s.title} title={s.title} sub={s.sub}><EventTable rows={s.values} /></Section>
      ))}
    </Frame>
  );
}

/* ── overview ───────────────────────────────────────────────────────── */

function Overview({ go, flash }: { go: (p: string) => void; flash: (m: string) => void }) {
  const { m } = useBoard();
  const R = m.R;
  const withInfo = <T extends { label: string }>(v: T) => ({ ...v, ...OVERVIEW[v.label] });

  const north = { ...kpi(m, { label: 'Weekly ordering buyers', kind: 'users', base: 6318, good: 'up', hint: 'Shops with at least one order' }), ...OVERVIEW['Weekly ordering buyers'] };
  const kpis = [
    withInfo(kpi(m, { label: 'Active buyers', kind: 'users', base: 18420, good: 'up', hint: 'Opened the app' })),
    withInfo(kpi(m, { label: 'Orders', kind: 'count', base: 9742, good: 'up', hint: 'Successful orders' })),
    withInfo(kpi(m, { label: 'Sales (GMV)', kind: 'inr', base: 9742 * 4989, good: 'up', hint: 'Value of orders' })),
    withInfo(kpi(m, { label: 'Buyer conversion', kind: 'pct', base: 34.3, good: 'up', hint: 'Opened app → ordered' })),
  ];

  const dd = dates(R.n, R.step);
  const orders = series(9742 * m.k * m.q * (m.daily ? 1 / 7 : 1), 2.4 + m.jit, 0.07, 0.1, dd, 0.55);

  const funnels = FUNNELS.map((f) => {
    const steps = funnel(m, f.steps);
    return { id: f.id, title: f.title, steps, start: steps[0], end: steps[steps.length - 1], worst: steps.find((s) => s.worst) };
  });
  const everything = BOARDS.flatMap((b) => b.sections.flatMap((s) => s.rows.map((r) => ({ ...event(m, r), ...explainEvent(b, s.title, r) }))));

  const rail = (
    <>
      <Movers rows={everything} title="What changed across the app" />
      <Card className="flex flex-col py-2">
        <div className="type-h3 px-5 pb-1 pt-2">Boards</div>
        {BOARDS.map((b) => (
          <button
            key={b.path}
            type="button"
            onClick={() => go(`buyer-analytics/${boardId(b)}`)}
            className="type-caption flex items-center justify-between gap-2 px-5 py-1.5 text-left hover:bg-muted"
          >
            <Tip side="left" title={b.title} note={`${b.question} ${b.sections.reduce((a, s) => a + s.rows.length, 0)} actions tracked.`}>
              <span className="truncate">{b.title}</span>
            </Tip>
            <ChevronRight size={14} className="shrink-0 text-foreground-tertiary" />
          </button>
        ))}
      </Card>
    </>
  );

  return (
    <Frame title="Overview" question="How buyers sign up, find products, order and come back." rail={rail} flash={flash}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="flex flex-col gap-3 bg-gradient-to-br from-primary-soft via-card to-card px-6 py-5">
          <div className="flex items-center justify-between">
            <Tip
              side="bottom"
              align="start"
              title="North star metric"
              note="The one number the whole team works to grow."
              what={north.what}
              why={north.why}
              check={north.check}
            >
              <Badge variant="info" className="cursor-help gap-1"><Target size={12} /> North star</Badge>
            </Tip>
            <Tip side="left" rows={[['Before', north.before], ['Now', north.value]]} note={`${north.change.good ? 'Better' : 'Worse'} than the ${R.prev}.`}>
              <ChangePill c={north.change} />
            </Tip>
          </div>
          <div>
            <div className="type-label text-foreground-secondary">{north.label}</div>
            <div className="text-5xl font-semibold tabular-nums tracking-tight">{north.value}</div>
            <div className="type-caption text-foreground-secondary">{north.hint} · vs {R.prev}</div>
          </div>
          <div className="mt-auto">
            <Sparkline points={north.points} good={north.change.good} width={320} height={56} labels={trendLabels(m)} fmt={north.fmt} />
          </div>
        </Card>
        <Section info={OVERVIEW.ordersChart} title={`Orders per ${m.daily ? 'day' : 'week'}`} sub={`${R.n} ${m.daily ? 'days' : 'weeks'} · hover for exact numbers`}>
          <div className="px-4 py-4">
            <LineChart dates={dd} height={170} fmt={(v) => int(v)} series={[{ name: 'Orders', color: SERIES.primary, values: orders }]} />
          </div>
        </Section>
      </div>

      <KpiStrip kpis={kpis} prev={R.prev} />

      <Section
        title="Key funnels"
        sub="Start to finish, for each journey"
        action={
          <button type="button" onClick={() => go('buyer-analytics/funnels')} className="type-caption flex items-center gap-1 font-medium text-link hover:underline">
            All funnels <ChevronRight size={14} />
          </button>
        }
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className={cn(TH, 'pl-5')}>Funnel</th>
              <th className={cn(TH, 'text-right')}>Started</th>
              <th className={cn(TH, 'text-right')}>Finished</th>
              <th className={cn(TH, 'w-56 pl-6')}>Conversion</th>
              <th className={cn(TH, 'pr-5')}>Biggest drop-off</th>
            </tr>
          </thead>
          <tbody className="type-caption">
            {funnels.map((f) => (
              <tr key={f.id} className="border-t border-border-subtle">
                <td className="py-2.5 pl-5 font-medium">
                  <Tip side="right" title={`${f.title} funnel`} note="Click for step-by-step detail." {...explainFunnelRow(f.title, f.steps.map((s) => s.label))}>
                    <button type="button" onClick={() => go(`buyer-analytics/funnels:${f.id}`)} className="hover:text-primary hover:underline">{f.title}</button>
                  </Tip>
                </td>
                <td className="py-2.5 text-right tabular-nums">{int(f.start.users)}</td>
                <td className="py-2.5 text-right tabular-nums">{int(f.end.users)}</td>
                <td className="py-2.5 pl-6">
                  <Tip block side="top" note={`${int(f.end.users)} of ${int(f.start.users)} buyers who started finished (“${f.end.label}”).`}>
                    <span className="flex cursor-default items-center gap-2">
                      <span className="h-1.5 flex-1 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${f.end.ofStart}%` }} /></span>
                      <span className="w-12 text-right font-medium tabular-nums">{pct(f.end.ofStart)}</span>
                    </span>
                  </Tip>
                </td>
                <td className="py-2.5 pr-5 text-foreground-secondary">
                  {f.worst && (
                    <Tip
                      side="left"
                      rows={[
                        ['Buyers lost', int(f.steps[f.steps.indexOf(f.worst) - 1].users - f.worst.users)],
                        ['Typical time to this step', f.worst.time],
                      ]}
                      note="The step where this funnel loses the most buyers."
                    >
                      <span className="cursor-default"><span className="font-medium text-error">−{pct(f.worst.drop)}</span> before {f.worst.label}</span>
                    </Tip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </Frame>
  );
}

/* ── funnels ────────────────────────────────────────────────────────── */

function Funnels({ initial, flash }: { initial?: string; flash: (m: string) => void }) {
  const { m } = useBoard();
  const [id, setId] = useState(FUNNELS.some((f) => f.id === initial) ? initial! : FUNNELS[0].id);
  const spec = FUNNELS.find((x) => x.id === id) ?? FUNNELS[0];
  const steps = funnel(m, spec.steps);
  const first = steps[0];
  const last = steps[steps.length - 1];
  const worst = steps.find((s) => s.worst);

  const tiles = [
    { label: 'Started', value: int(first.users), hint: first.label, note: `Unique buyers at the first step, “${first.label}”.` },
    { label: 'Finished', value: int(last.users), hint: last.label, note: `Unique buyers who reached the last step, “${last.label}”.` },
    { label: 'Conversion', value: pct(last.ofStart), hint: 'Start to finish', note: `${int(last.users)} of ${int(first.users)} buyers made it all the way.` },
    {
      label: 'Biggest drop-off',
      value: worst ? '−' + pct(worst.drop) : '—',
      hint: worst ? `Before “${worst.label}”` : '',
      note: worst ? 'The step that loses the most buyers. Fixing it lifts the whole funnel.' : '',
    },
  ];

  return (
    <Frame title="Funnels" question="How many buyers get through each key journey, and where do they stop?" flash={flash}>
      <div className="flex flex-wrap gap-2">
        {FUNNELS.map((x) => (
          <Tip key={x.id} side="bottom" title={`${x.title} funnel`} note={x.steps.map((s) => s.label).join(' → ')}>
            <Chip selected={x.id === id} onClick={() => setId(x.id)}>{x.title}</Chip>
          </Tip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((k) => (
          <Tip key={k.label} block side="bottom" align="start" title={k.label} note={k.note} {...explainFunnelTile(k.label)}>
            <Card className="flex cursor-default flex-col gap-1 px-5 py-4">
              <div className="type-caption text-foreground-secondary">{k.label}</div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
              <div className="type-caption truncate text-foreground-secondary">{k.hint}</div>
            </Card>
          </Tip>
        ))}
      </div>

      <Section title={`${spec.title} funnel`} sub={spec.steps.map((s) => s.label).join(' → ')}>
        <FunnelTable steps={steps} explain={(s, i) => explainStep(spec.title, s, i)} />
      </Section>

      <Section title="Most common paths" sub="The routes buyers take most often through this funnel">
        <ul>
          {spec.paths.map((p) => (
            <li key={p.path} className="type-caption flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-3 first:border-t-0 hover:bg-muted">
              <Tip
                side="top"
                align="start"
                rows={[['Share of buyers', `${p.share}%`], ['About', `${int((first.users * p.share) / 100)} buyers`]]}
                note="Each arrow is a screen the buyer moved to next."
              >
                <span className="cursor-default">{p.path}</span>
              </Tip>
              <span className="font-medium tabular-nums">{p.share}% of buyers</span>
            </li>
          ))}
        </ul>
      </Section>
    </Frame>
  );
}

/* ── session recordings ─────────────────────────────────────────────── */

function Recordings({ initialPage, flash }: { initialPage?: string; flash: (m: string) => void }) {
  const { f, m } = useBoard();
  const [page, setPage] = useState<string>(initialPage && (RECORDING_PAGES as readonly string[]).includes(initialPage) ? initialPage : 'All');
  const [signal, setSignal] = useState<string>('All');

  const pages = page === 'All' ? [...RECORDING_PAGES] : [page];
  const counts = SIGNALS.map((s) => ({
    signal: s,
    count: (pages.reduce((a, p) => a + (SIGNAL_COUNTS[p]?.[s] ?? 0), 0) * m.k * m.R.e) / m.q,
  }));
  const rows = RECORDINGS.filter(
    (r) => f.cities.includes(r.city) && (page === 'All' || r.page === page) && (signal === 'All' || r.signals.includes(signal as Signal)),
  );

  return (
    <Frame title="Session recordings" question="Watch where buyers get stuck, confused or give up." flash={flash}>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Page" value={page} options={[...RECORDING_PAGES]} onChange={setPage} />
        <FilterSelect label="Problem" value={signal} options={[...SIGNALS]} onChange={setSignal} />
      </div>

      <Section info={RECORDINGS_INFO.problems} title="Problems seen" sub={page === 'All' ? 'Recordings across all pages' : `Recordings on the ${page} page`}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className={cn(TH, 'pl-5')}>Problem</th>
              <th className={cn(TH, 'pr-5 text-right')}>Recordings</th>
            </tr>
          </thead>
          <tbody className="type-caption">
            {counts.map((c) => (
              <tr
                key={c.signal}
                onClick={() => setSignal(c.signal)}
                className={cn('cursor-pointer border-t border-border-subtle hover:bg-muted', signal === c.signal && 'bg-primary-soft')}
              >
                <td className="py-2.5 pl-5">
                  <Tip side="top" align="start" title={c.signal} note={SIGNAL_INFO[c.signal]} {...explainSignal(c.signal)}>
                    <span>{c.signal}</span>
                  </Tip>
                </td>
                <td className="py-2.5 pr-5 text-right font-medium tabular-nums">{c.count ? int(c.count) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section info={RECORDINGS_INFO.list} title="Recordings to watch" sub="Click a problem above to see only those recordings">
        {rows.length === 0 ? (
          <EmptyState icon={<Video />} title="No recordings match" description="Try another page, problem or location." />
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={cn(TH, 'pl-5')}>Buyer</th>
                <th className={TH}>City</th>
                <th className={TH}>Page</th>
                <th className={TH}>What happened</th>
                <th className={TH}>Length</th>
                <th className={TH}>When</th>
                <th className={cn(TH, 'pr-5')} />
              </tr>
            </thead>
            <tbody className="type-caption">
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border-subtle align-top">
                  <td className="py-2.5 pl-5 font-medium">
                    <Tip
                      side="right"
                      title={`Buyer ${r.buyer}`}
                      rows={[['City', r.city], ['Page', r.page], ['Recorded', r.when], ['Length', r.duration]]}
                      note="Support can look this buyer up by ID to call them."
                    >
                      <span className="cursor-default">{r.buyer}</span>
                    </Tip>
                  </td>
                  <td className="py-2.5">{r.city}</td>
                  <td className="py-2.5">{r.page}</td>
                  <td className="py-2.5 pr-3">
                    <div>{r.note}</div>
                    <div className="flex flex-wrap gap-x-1.5 text-foreground-secondary">
                      {r.signals.map((s, i) => (
                        <Tip key={s} side="bottom" align="start" title={s} note={SIGNAL_INFO[s]} {...explainSignal(s)}>
                          <span className="cursor-help underline decoration-dotted underline-offset-2">{s}{i < r.signals.length - 1 ? ' ·' : ''}</span>
                        </Tip>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 tabular-nums">{r.duration}</td>
                  <td className="whitespace-nowrap py-2.5 text-foreground-secondary">{r.when}</td>
                  <td className="py-2.5 pr-5 text-right">
                    <Tip side="left" {...RECORDINGS_INFO.watch}><Button variant="secondary" size="sm" onClick={() => flash('Recordings open in PostHog. It is not connected in this mockup.')}>
                      <PlayCircle size={14} /> Watch
                    </Button></Tip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </Frame>
  );
}

/* ── board router: the sidebar group picks the board ────────────────── */

export default function BuyerAppAnalytics({ go, drill }: { go: (p: string) => void; drill?: string }) {
  const [toast, flash] = useFlash();
  // drill: <board>[:<arg>]
  const [board = 'overview', arg] = (drill || 'overview').split(':');
  const spec = BOARDS.find((b) => boardId(b) === board);

  return (
    <>
      {spec ? (
        <Board key={board} spec={spec} go={go} flash={flash} />
      ) : board === 'funnels' ? (
        <Funnels key={arg ?? ''} initial={arg} flash={flash} />
      ) : board === 'recordings' ? (
        <Recordings key={arg ?? ''} initialPage={arg && decodeURIComponent(arg)} flash={flash} />
      ) : (
        <Overview go={go} flash={flash} />
      )}
      {toast}
    </>
  );
}
