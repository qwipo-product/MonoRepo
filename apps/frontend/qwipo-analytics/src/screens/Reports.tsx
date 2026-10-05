// Reports — ONE table: report name · last run · last status · last file ·
// Run · History. Run opens a right drawer with that report's filters;
// History opens a right drawer with its run dates, statuses and files.
// The Order Register also has a live paginated view (#reports/register).
import { useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Download, History, Play, Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge, Button, Card, Input, SegmentedControl, cn, type BadgeProps } from '@mockups/ui';
import { ScopeBar } from '../components/ScopeBar';
import { reportDefs, runs, addRun, lastRunOf, schedules, setSchedule, scheduleLabel, type ReportDef, type Run } from '../data/reports';
import { pageRows, stageLabel, type Stage, type OrderRow } from '../data/orderRows';
import { DateField } from '../components/DateField';
import { Section, Option, MultiSection } from '../components/filterControls';
import { companyOptions, citiesFor, distributorOptions, stateOptions, totals, scopeChips, type Filters } from '../components/filters';
import { buyerDistributors } from '../data/buyer';
import { Chip } from '../components/Chip';
import { useScope } from '../scope';
import { reportSections, type Page, type ReportDomain } from '../nav';
import BuyerAppAnalytics from './BuyerAppAnalytics';

const statusBadge: Record<Run['status'], NonNullable<BadgeProps['variant']>> = {
  Ready: 'success', Running: 'info', Failed: 'danger',
};

export default function Reports({ go, drill }: { go: (p: Page | string) => void; drill?: string }) {
  // #reports/run:<report-key>:<Status> — a drill-down hand-off: open the Run
  // drawer for that report with the status the user was looking at applied.
  const runMatch = drill?.startsWith('run:') ? drill.slice(4).split(':') : null;
  const [running, setRunning] = useState<ReportDef | null>(
    runMatch ? reportDefs.find((d) => d.key === runMatch[0]) ?? null : null,
  );
  const [history, setHistory] = useState<ReportDef | null>(null);
  const [scheduling, setScheduling] = useState<ReportDef | null>(null);
  const [, bump] = useState(0); // re-render after addRun
  if (drill === 'register') return <Register go={go} />;
  // Section: #reports/<seller|ops|buyer>; a run: hand-off lands in its report's section.
  const section: ReportDomain = runMatch
    ? reportDefs.find((d) => d.key === runMatch[0])?.domain ?? 'seller'
    : drill?.startsWith('analytics') ? 'buyer'
    : reportSections.find((s) => s.key === drill)?.key ?? 'seller';
  const inAnalytics = !!drill?.startsWith('analytics');
  const meta = reportSections.find((s) => s.key === section)!;
  const defs = reportDefs.filter((d) => d.domain === section);
  const closeRun = () => { setRunning(null); if (runMatch) go(`reports/${section}`); };

  return (
    <div className="flex flex-col gap-5">
      {running && (
        <RunDrawer
          def={running}
          initialPicked={runMatch?.[1] && runMatch[1] !== 'All' ? { Status: decodeURIComponent(runMatch[1]) } : undefined}
          onClose={closeRun}
          onDone={() => bump((n) => n + 1)}
          onHistory={() => { setHistory(running); closeRun(); }}
        />
      )}
      {history && !running && <HistoryDrawer def={history} onClose={() => setHistory(null)} />}
      {scheduling && !running && !history && (
        <ScheduleDrawer def={scheduling} onClose={() => setScheduling(null)} onSaved={() => bump((n) => n + 1)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          className="w-auto"
          options={reportSections.map((s) => ({
            value: s.key,
            label: <span className="whitespace-nowrap">{s.label} <span className="ml-1 text-foreground-tertiary tabular-nums">{reportDefs.filter((d) => d.domain === s.key).length}</span></span>,
          }))}
          value={section}
          onChange={(v) => go(`reports/${v}`)}
        />
        <span className="type-caption text-foreground-secondary">Source: {meta.source}</span>
      </div>


      {inAnalytics ? <BuyerAppAnalytics go={go} drill={drill} /> : (
      <Card className="flex flex-col">
        <table className="w-full border-collapse">
          <thead>
            <tr className="type-micro text-left text-foreground-tertiary">
              <th className="w-[26%] py-2.5 pl-5 pr-3 font-semibold">Report</th>
              <th className="w-[18%] py-2.5 pr-3 font-semibold">Last run</th>
              <th className="w-[10%] py-2.5 pr-3 font-semibold">File</th>
              <th className="w-[14%] py-2.5 pr-3 font-semibold">Schedule</th>
              <th className="py-2.5 pr-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="type-caption">
            {defs.map((def) => {
              const last = lastRunOf(def.key);
              return (
                <tr key={def.key} className="border-t border-border-subtle">
                  <td className="py-2.5 pl-5 pr-3">
                    <span className="type-label">{def.name}</span>
                    <span className="type-caption block max-w-[360px] text-foreground-tertiary">{def.desc}</span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3">
                    {last ? (
                      <span className="flex items-center gap-2 tabular-nums text-foreground-secondary">
                        {last.when} <Badge variant={statusBadge[last.status]}>{last.status}</Badge>
                      </span>
                    ) : (
                      <span className="text-foreground-tertiary">Never run</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {last?.file ? (
                      <button type="button" title={last.file} aria-label={`Download ${last.file}`} className="grid h-8 w-8 place-items-center rounded-md text-link hover:bg-muted">
                        <Download size={15} />
                      </button>
                    ) : (
                      <span className="text-foreground-tertiary">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3">
                    {schedules[def.key]
                      ? <span className="tabular-nums text-foreground-secondary">{scheduleLabel(schedules[def.key])}</span>
                      : <span className="text-foreground-tertiary">—</span>}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-5 text-right">
                    {def.page && (
                      <Button variant="ghost" size="sm" className="mr-1.5 text-link" onClick={() => go(def.page!)}>Open live</Button>
                    )}
                    <Button size="sm" onClick={() => setRunning(def)}><Play size={13} /> Run</Button>
                    <Button variant="secondary" size="sm" className="ml-1.5" onClick={() => setHistory(def)}><History size={13} /> History</Button>
                    <Button variant="secondary" size="sm" className="ml-1.5" onClick={() => setScheduling(def)}><CalendarClock size={13} /> Schedule</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      )}
    </div>
  );
}

/* -------------------------------- Run drawer -------------------------------- */

function RunDrawer({ def, initialPicked, onClose, onDone, onHistory }: {
  def: ReportDef; initialPicked?: Record<string, string>; onClose: () => void; onDone: () => void; onHistory: () => void;
}) {
  // Opens pre-filled with the dashboard's applied scope — the report runs on
  // exactly what the user was looking at, then they adjust if needed.
  const { f } = useScope();
  const [preset, setPreset] = useState<string>(f.preset);
  const [from, setFrom] = useState<Date | undefined>(f.from ? new Date(f.from) : undefined);
  const [to, setTo] = useState<Date | undefined>(f.to ? new Date(f.to) : undefined);
  const [calOpen, setCalOpen] = useState<'from' | 'to' | null>(null);
  const [companies, setCompanies] = useState<string[]>(f.companies);
  const [states, setStates] = useState<string[]>(f.states);
  const [cities, setCities] = useState<string[]>(f.cities);
  const [dists, setDists] = useState<string[]>(f.distributors);
  const [picked, setPicked] = useState<Record<string, string>>(initialPicked ?? {});
  // Buyer reports list the buyer app's distributors, narrowed by State / City.
  const geoCities = cities.length ? cities : citiesFor(states);
  const distOptions = def.domain === 'buyer'
    ? buyerDistributors.filter((d) => geoCities.includes(d.city)).map((d) => d.name)
    : distributorOptions;
  const [done, setDone] = useState(false);
  const generate = () => {
    const extras = Object.entries(picked).filter(([, v]) => v !== 'All').map(([label, value]) => ({ label, value }));
    addRun(def.key, [
      ...scopeChips({
        states, companies, cities, distributors: dists,
        preset: preset as Filters['preset'], from: from?.toISOString(), to: to?.toISOString(),
      }),
      ...extras,
    ]);
    setDone(true);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[360px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`Run ${def.name}`}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Run · {def.name}</span>
            <span className="type-caption block text-foreground-secondary">XLSX · sheets: {def.sheets.join(' · ')}</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {def.scope.includes('date') && (
            <Section label="Date range">
              {['Month to date', 'Last month', 'Last 7 days', 'Last 30 days', 'Custom'].map((r) => (
                <Option
                  key={r}
                  selected={preset === r}
                  onClick={() => {
                    setPreset(r);
                    if (r === 'Custom') { if (!from) { setFrom(new Date(2026, 7, 1)); setTo(new Date(2026, 7, 22)); } setCalOpen('from'); }
                    else setCalOpen(null);
                  }}
                >
                  {r === 'Month to date' ? '1 – 22 Aug 2026 · month to date' : r === 'Last month' ? '1 – 31 Jul 2026 · last month' : r === 'Custom' ? 'Custom…' : r}
                </Option>
              ))}
              {preset === 'Custom' && (
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <DateField
                    label="From" date={from}
                    open={calOpen === 'from'} onOpen={() => setCalOpen('from')} onClose={() => setCalOpen(null)}
                    rangeStart={from} rangeEnd={to}
                    onPick={(d) => { setFrom(d); if (to && d > to) setTo(d); setCalOpen('to'); }}
                  />
                  <DateField
                    label="To" date={to}
                    open={calOpen === 'to'} onOpen={() => setCalOpen('to')} onClose={() => setCalOpen(null)}
                    rangeStart={from} rangeEnd={to}
                    onPick={(d) => { if (from && d < from) { setTo(from); setFrom(d); } else setTo(d); setCalOpen(null); }}
                  />
                </div>
              )}
            </Section>
          )}

          {def.scope.includes('company') && (
            <MultiSection
              label="Company" unit="companies" total={totals.companies} searchable
              hint="Counts stay whole-order; ₹ becomes the selected companies' lines only"
              options={companyOptions} selected={companies} onChange={setCompanies}
            />
          )}
          {def.scope.includes('city') && (
            <MultiSection
              label="State" unit="states" total={totals.states}
              hint="More states appear as they onboard · cities narrow to the selected states"
              options={stateOptions} selected={states} onChange={(v) => { setStates(v); setCities([]); setDists([]); }}
            />
          )}
          {def.scope.includes('city') && (
            <MultiSection
              label="City" unit="cities" total={citiesFor(states).length}
              hint="From outlet GPS · 64 unresolved outlets excluded · changing city resets Distributor"
              options={citiesFor(states)} selected={cities} onChange={(v) => { setCities(v); setDists([]); }}
            />
          )}
          {def.scope.includes('distributor') && (
            <MultiSection
              label="Distributor" unit="distributors" total={distOptions.length > 6 && def.domain !== 'buyer' ? totals.distributors : distOptions.length} searchable
              hint="Narrowed by the selected cities"
              options={distOptions} selected={dists} onChange={setDists}
            />
          )}

          {def.filters.map((f) => (
            <Section key={f.label} label={f.label}>
              {f.options.map((o) => (
                <Option key={o} selected={(picked[f.label] ?? 'All') === o} onClick={() => setPicked({ ...picked, [f.label]: o })}>{o}</Option>
              ))}
            </Section>
          ))}

          <div className="px-5 py-4">
            {def.flags && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {def.flags.map((f) => <Badge key={f.label} variant={f.variant} className="normal-case tracking-normal">{f.label}</Badge>)}
              </div>
            )}
            <p className="type-caption text-foreground-tertiary">Whatever you pick, the report never widens past your role's scope.</p>
            {done && (
              <div className="mt-3 rounded-lg border border-success-border bg-success-subtle px-3.5 py-2.5">
                <span className="type-label text-success-foreground">Report generated</span>
                <span className="type-caption block text-success-foreground">The file is in this report's History, ready any time.</span>
              </div>
            )}
          </div>
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          {done ? (
            <Button fullWidth size="sm" onClick={onHistory}>View history</Button>
          ) : (
            <Button fullWidth size="sm" onClick={generate}><Play size={13} /> Run report</Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </footer>
      </aside>
    </div>
  );
}

/* ------------------------------ History drawer ------------------------------ */

function HistoryDrawer({ def, onClose }: { def: ReportDef; onClose: () => void }) {
  const mine = runs.filter((r) => r.reportKey === def.key);
  const [showFilters, setShowFilters] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[440px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`${def.name} history`}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">History · {def.name}</span>
            <span className="type-caption block text-foreground-secondary">{mine.length} run{mine.length === 1 ? '' : 's'} · newest first</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {mine.map((r) => (
            <div key={r.id} className="border-b border-border-subtle py-3">
              <div className="flex items-center gap-2">
                <span className="type-label flex-1 tabular-nums">{r.when}</span>
                <button
                  type="button"
                  title="Filters this run was generated with"
                  aria-label="Show this run's filters"
                  onClick={() => setShowFilters(showFilters === r.id ? null : r.id)}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-md',
                    showFilters === r.id ? 'bg-primary-soft text-primary-soft-foreground' : 'text-foreground-secondary hover:bg-muted',
                  )}
                >
                  <SlidersHorizontal size={14} />
                </button>
                <Badge variant={statusBadge[r.status]}>{r.status}</Badge>
              </div>
              {showFilters === r.id && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.filters.map((c) => <Chip key={`${c.label}-${c.value}`} label={c.label} value={c.value} />)}
                </div>
              )}
              {r.file ? (
                <button type="button" className="type-caption mt-1 flex items-center gap-1.5 font-medium text-link hover:underline" title={r.file}>
                  <Download size={13} /> {r.file}
                </button>
              ) : (
                <span className="type-caption mt-1 block text-error-foreground">Run failed — no file produced</span>
              )}
            </div>
          ))}
          {mine.length === 0 && (
            <div className="py-10 text-center text-foreground-secondary">
              No runs yet — run the report and it will appear here, ready to re-download any time.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------ Schedule drawer ------------------------------ */

function ScheduleDrawer({ def, onClose, onSaved }: { def: ReportDef; onClose: () => void; onSaved: () => void }) {
  const current = schedules[def.key];
  const [freq, setFreq] = useState<'Off' | 'Daily' | 'Weekly' | 'Monthly'>(current?.freq ?? 'Off');
  const [weekday, setWeekday] = useState<string>(current?.freq === 'Weekly' ? (current.day as string) : 'Mon');
  const [monthday, setMonthday] = useState<number>(current?.freq === 'Monthly' ? (current.day as number) : 1);
  const [time, setTime] = useState(current?.time ?? '06:15');

  const save = () => {
    setSchedule(def.key, freq === 'Off' ? undefined : {
      freq, time, day: freq === 'Weekly' ? weekday : freq === 'Monthly' ? monthday : undefined,
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[360px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`Schedule ${def.name}`}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Schedule · {def.name}</span>
            <span className="type-caption block text-foreground-secondary">Generated and mailed automatically</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* The saved schedule, unmissable. */}
          <div className={cn('mx-5 mt-4 rounded-lg border px-3.5 py-2.5', current ? 'border-info-border bg-info-subtle' : 'border-border bg-background-sunken')}>
            {current ? (
              <>
                <span className="type-label text-info-foreground">Scheduled · {scheduleLabel(current)}</span>
                <span className="type-caption block text-info-foreground">Next: {current.freq === 'Daily' ? 'tomorrow' : current.freq === 'Weekly' ? `next ${current.day}` : 'next month'} at {current.time} IST</span>
              </>
            ) : (
              <span className="type-caption text-foreground-secondary">Not scheduled yet — set it up below.</span>
            )}
          </div>

          <Section label="Frequency">
            {(['Off', 'Daily', 'Weekly', 'Monthly'] as const).map((o) => (
              <Option key={o} selected={freq === o} onClick={() => setFreq(o)}>{o}</Option>
            ))}
          </Section>

          {freq === 'Weekly' && (
            <Section label="Day of week">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <Option key={d} selected={weekday === d} onClick={() => setWeekday(d)}>{d === 'Mon' ? 'Monday' : d === 'Tue' ? 'Tuesday' : d === 'Wed' ? 'Wednesday' : d === 'Thu' ? 'Thursday' : d === 'Fri' ? 'Friday' : d === 'Sat' ? 'Saturday' : 'Sunday'}</Option>
              ))}
            </Section>
          )}

          {freq === 'Monthly' && (
            <Section label="Day of month" hint={monthday > 28 ? 'In shorter months it runs on the last day' : undefined}>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMonthday(d)}
                    className={cn(
                      'type-caption h-8 rounded-md tabular-nums',
                      monthday === d ? 'bg-primary font-medium text-primary-foreground' : 'bg-background-sunken text-foreground-secondary hover:bg-muted',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {freq !== 'Off' && (
            <>
              <Section label="Time" hint="24-hour · IST">
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 w-36 tabular-nums" />
              </Section>
              <Section label="Recipients">
                <p className="type-caption text-foreground-secondary">Your email, plus anyone in your team list. Each recipient gets the report in their own scope.</p>
              </Section>
            </>
          )}
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button fullWidth size="sm" onClick={save}>{freq === 'Off' && current ? 'Turn off schedule' : 'Save schedule'}</Button>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </footer>
      </aside>
    </div>
  );
}

/* ------------------------------ live register ------------------------------ */

const stageBadgeMap: Record<Stage, NonNullable<BadgeProps['variant']>> = {
  created: 'info', accepted: 'info', packed: 'info', shipped: 'info',
  delivered: 'success', cancelled: 'danger', returned: 'warning',
};
const PER_PAGE = 25;
const TOTAL = 1142;

function Register({ go }: { go: (p: Page | string) => void }) {
  const { f } = useScope();
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [exported, setExported] = useState(false);
  const totalPages = Math.ceil(TOTAL / PER_PAGE);
  let rows: OrderRow[] = pageRows(page % 5);
  if (q) rows = rows.filter((r) => `${r.id} ${r.outlet} ${r.distributor}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <div className="type-caption flex items-center gap-1.5 text-foreground-secondary">
        Reports › <b className="text-foreground">Order Register</b>
        <Button variant="ghost" size="sm" className="ml-2 text-link" onClick={() => go('reports')}>← Back to Reports</Button>
      </div>
      <ScopeBar line="Live register · pages straight from the warehouse · the XLSX export carries all 32 columns" />
      <Card className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-3">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, outlet or distributor" className="h-9 pl-8" />
          </div>
          <span className="type-caption text-foreground-secondary">Preview shows 6 of 32 columns</span>
          <Button size="sm" onClick={() => { addRun('order-register', scopeChips(f)); setExported(true); }}>Export XLSX</Button>
        </div>
        {exported && (
          <div className="type-caption border-b border-border-subtle bg-success-subtle px-5 py-2 text-success-foreground">
            Export generated — it's in the Order Register's History on the Reports page.
          </div>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr className="type-micro text-left text-foreground-tertiary">
              <th className="py-2.5 pl-5 pr-3 font-semibold">Date</th>
              <th className="py-2.5 pr-3 font-semibold">Order</th>
              <th className="py-2.5 pr-3 font-semibold">Outlet</th>
              <th className="py-2.5 pr-3 font-semibold">Distributor</th>
              <th className="py-2.5 pr-3 font-semibold">Status</th>
              <th className="py-2.5 pr-5 text-right font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="type-caption">
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border-subtle">
                <td className="whitespace-nowrap py-2 pl-5 pr-3 text-foreground-secondary">{r.date}</td>
                <td className="py-2 pr-3 font-medium tabular-nums">{r.id.replace('QW-ONDC-', '')}</td>
                <td className="max-w-[200px] truncate py-2 pr-3">{r.outlet}</td>
                <td className="py-2 pr-3">{r.distributor}</td>
                <td className="py-2 pr-3"><Badge variant={stageBadgeMap[r.status]}>{stageLabel[r.status]}</Badge></td>
                <td className="py-2 pr-5 text-right tabular-nums">₹{r.value.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-foreground-secondary">No orders match</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3">
          <span className="type-caption text-foreground-secondary">Page {page + 1} of {totalPages} · {TOTAL.toLocaleString('en-IN')} orders</span>
          <span className="flex gap-1.5">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight size={14} />
            </Button>
          </span>
        </div>
      </Card>
    </div>
  );
}
