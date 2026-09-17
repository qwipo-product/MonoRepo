// Reports — ONE table: report name · last run · last status · last file ·
// Run · History. Run opens a right drawer with that report's filters;
// History opens a right drawer with its run dates, statuses and files.
// The Order Register also has a live paginated view (#reports/register).
import { useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Download, History, Play, Search, X } from 'lucide-react';
import { Badge, Button, Card, Input, cn, type BadgeProps } from '@mockups/ui';
import { ScopeBar } from '../components/ScopeBar';
import { reportDefs, runs, addRun, lastRunOf, schedules, setSchedule, scheduleLabel, type ReportDef, type Run } from '../data/reports';
import { pageRows, stageLabel, type Stage, type OrderRow } from '../data/orderRows';
import type { Page } from '../nav';

const statusBadge: Record<Run['status'], NonNullable<BadgeProps['variant']>> = {
  Ready: 'success', Running: 'info', Failed: 'danger',
};

export default function Reports({ go, register }: { go: (p: Page | string) => void; register?: boolean }) {
  const [running, setRunning] = useState<ReportDef | null>(null);
  const [history, setHistory] = useState<ReportDef | null>(null);
  const [scheduling, setScheduling] = useState<ReportDef | null>(null);
  const [, bump] = useState(0); // re-render after addRun
  if (register) return <Register go={go} />;

  return (
    <div className="flex flex-col gap-5">
      <ScopeBar line="Every report is generated within your scope and the selected period · Super Admin" />
      {running && (
        <RunDrawer
          def={running}
          onClose={() => setRunning(null)}
          onDone={() => bump((n) => n + 1)}
          onHistory={() => { setHistory(running); setRunning(null); }}
        />
      )}
      {history && !running && <HistoryDrawer def={history} onClose={() => setHistory(null)} />}
      {scheduling && !running && !history && (
        <ScheduleDrawer def={scheduling} onClose={() => setScheduling(null)} onSaved={() => bump((n) => n + 1)} />
      )}

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
            {reportDefs.map((def) => {
              const last = lastRunOf(def.key);
              return (
                <tr key={def.key} className="border-t border-border-subtle">
                  <td className="py-2.5 pl-5 pr-3">
                    <span className="type-label">{def.name}</span>
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
    </div>
  );
}

/* -------------------------------- Run drawer -------------------------------- */

function RunDrawer({ def, onClose, onDone, onHistory }: {
  def: ReportDef; onClose: () => void; onDone: () => void; onHistory: () => void;
}) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const generate = () => { addRun(def.key); setDone(true); onDone(); };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[420px] flex-col border-l border-border bg-card shadow-xl"
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="type-micro mb-1.5 text-foreground-tertiary">Scope</div>
          <p className="type-caption text-foreground-secondary">Full network · 1 – 22 Aug 2026 · follows your filters and role — no wider.</p>

          {def.filters.map((f) => (
            <div key={f.label} className="mt-4">
              <div className="type-micro mb-1.5 text-foreground-tertiary">{f.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {f.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setPicked({ ...picked, [f.label]: o })}
                    className={cn(
                      'type-caption rounded-full px-3 py-1',
                      (picked[f.label] ?? 'All') === o ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'bg-background-sunken text-foreground-secondary hover:bg-muted',
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {def.flags && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {def.flags.map((f) => <Badge key={f.label} variant={f.variant} className="normal-case tracking-normal">{f.label}</Badge>)}
            </div>
          )}

          {done && (
            <div className="mt-5 rounded-lg border border-success-border bg-success-subtle px-3.5 py-2.5">
              <span className="type-label text-success-foreground">Report generated</span>
              <span className="type-caption block text-success-foreground">The file is in this report's History, ready any time.</span>
            </div>
          )}
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
              <div className="flex items-center justify-between gap-3">
                <span className="type-label tabular-nums">{r.when}</span>
                <Badge variant={statusBadge[r.status]}>{r.status}</Badge>
              </div>
              <div className="type-caption text-foreground-secondary">{r.scope}</div>
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
  const chip = (active: boolean) => cn(
    'type-caption rounded-full px-3 py-1',
    active ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'bg-background-sunken text-foreground-secondary hover:bg-muted',
  );

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[400px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`Schedule ${def.name}`}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Schedule · {def.name}</span>
            <span className="type-caption block text-foreground-secondary">
              {current ? `Currently ${scheduleLabel(current)}` : 'Not scheduled — the file is generated and mailed automatically'}
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="type-micro mb-1.5 text-foreground-tertiary">Frequency</div>
          <div className="flex flex-wrap gap-1.5">
            {(['Off', 'Daily', 'Weekly', 'Monthly'] as const).map((o) => (
              <button key={o} type="button" onClick={() => setFreq(o)} className={chip(freq === o)}>{o}</button>
            ))}
          </div>

          {freq === 'Weekly' && (
            <>
              <div className="type-micro mb-1.5 mt-4 text-foreground-tertiary">Day of week</div>
              <div className="flex flex-wrap gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <button key={d} type="button" onClick={() => setWeekday(d)} className={chip(weekday === d)}>{d}</button>
                ))}
              </div>
            </>
          )}

          {freq === 'Monthly' && (
            <>
              <div className="type-micro mb-1.5 mt-4 text-foreground-tertiary">Day of month</div>
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
              {monthday > 28 && <p className="type-caption mt-1.5 text-foreground-secondary">In shorter months it runs on the last day.</p>}
            </>
          )}

          {freq !== 'Off' && (
            <>
              <div className="type-micro mb-1.5 mt-4 text-foreground-tertiary">Time</div>
              <div className="flex flex-wrap gap-1.5">
                {['06:15', '09:00', '13:00', '18:00'].map((o) => (
                  <button key={o} type="button" onClick={() => setTime(o)} className={chip(time === o)}>{o}</button>
                ))}
              </div>

              <div className="type-micro mb-1.5 mt-4 text-foreground-tertiary">Recipients</div>
              <p className="type-caption text-foreground-secondary">Your email, plus anyone in your team list. Each recipient gets the report in their own scope.</p>
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
          <Button size="sm" onClick={() => { addRun('order-register'); setExported(true); }}>Export XLSX</Button>
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
