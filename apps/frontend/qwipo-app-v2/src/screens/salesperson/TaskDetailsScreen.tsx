import { useState } from 'react';
import { ChevronLeft, Phone, MapPin, CheckCircle2, LogIn, LogOut, MessageSquarePlus, Plus } from 'lucide-react';
import { SegmentedControl, EmptyState, Button, Sheet } from '@mockups/ui';
import { OrdersPanel, RecoPanel } from './customerPanels';
import type { Order } from '../../data/orders';
import {
  TASKS,
  INTERACTIONS,
  TASK_STATUS_LABEL,
  type Task,
  type TaskStatus,
  type Interaction,
} from '../../data/salesperson';

/* Salesperson · Task Details — one shop, four tabs. Info drives the visit
   lifecycle (check-in → interaction → check-out). Orders / Recommendation are
   read-only context; Interaction lists past visits + opens the create form. */

type Tab = 'info' | 'orders' | 'reco' | 'interaction';

export function TaskDetailsScreen({
  taskId,
  onBack,
  onCreateInteraction,
  onOpenOrder,
}: {
  taskId: string;
  onBack: () => void;
  onCreateInteraction: (taskId: string) => void;
  onOpenOrder: (order: Order) => void;
}) {
  const task = TASKS.find((t) => t.id === taskId) ?? TASKS[0];
  const [tab, setTab] = useState<Tab>('info');
  const [status, setStatus] = useState<TaskStatus>(task.status);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">
          Stop {task.stop} · {task.customer.businessName}
        </h1>
      </header>

      <div className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'info', label: 'Info' },
            { value: 'orders', label: 'Orders' },
            { value: 'reco', label: 'Reco' },
            { value: 'interaction', label: 'Visits' },
          ]}
        />
      </div>

      {tab === 'info' && <InfoTab task={task} status={status} setStatus={setStatus} onCreateInteraction={() => onCreateInteraction(task.id)} />}
      {tab === 'orders' && (
        <OrdersPanel customerId={task.customer.id} businessName={task.customer.businessName} onOpenOrder={onOpenOrder} />
      )}
      {tab === 'reco' && <RecoPanel customerId={task.customer.id} />}
      {tab === 'interaction' && <InteractionTab customerId={task.customer.id} onCreate={() => onCreateInteraction(task.id)} />}
    </div>
  );
}

function InfoTab({
  task,
  status,
  setStatus,
  onCreateInteraction,
}: {
  task: Task;
  status: TaskStatus;
  setStatus: (s: TaskStatus) => void;
  onCreateInteraction: () => void;
}) {
  const c = task.customer;
  return (
    <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="text-sm font-semibold text-foreground">{c.businessName}</div>
        <div className="mt-0.5 text-xs text-foreground-secondary">{c.ownerName}</div>
        <div className="mt-2 flex items-start gap-2 text-xs text-foreground-secondary">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {c.address}
        </div>
        <div className="mt-3 flex gap-2">
          <a href={`tel:${c.mobile}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]">
            <Phone size={14} /> {c.mobile}
          </a>
          <a href={`https://maps.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]">
            <MapPin size={14} /> Navigate
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-md bg-primary-soft p-2.5 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {TASK_STATUS_LABEL[status]}
        </div>

        <div className="mt-3">
          {status === 'none' ? (
            <Button fullWidth onClick={() => setStatus('checked_in')}>
              <LogIn size={16} /> Check-in
            </Button>
          ) : status === 'checked_in' ? (
            <Button fullWidth onClick={onCreateInteraction}>
              <MessageSquarePlus size={16} /> Add interaction
            </Button>
          ) : status === 'interaction_added' ? (
            <Button fullWidth onClick={() => setStatus('checked_out')}>
              <LogOut size={16} /> Check-out
            </Button>
          ) : (
            <Button fullWidth variant="secondary" disabled>
              Visit complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InteractionTab({ customerId, onCreate }: { customerId: string; onCreate: () => void }) {
  const [detail, setDetail] = useState<Interaction | null>(null);
  const list = INTERACTIONS[customerId] ?? [];
  return (
    <>
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {list.length === 0 ? (
          <div className="grid flex-1 place-items-center py-10">
            <EmptyState icon={<MessageSquarePlus className="h-7 w-7 text-foreground-secondary" />} title="No Interactions Found" />
          </div>
        ) : (
          list.map((i) => (
            <button
              key={i.id}
              onClick={() => setDetail(i)}
              className="w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{i.category}</span>
                <span className="shrink-0 text-xs text-foreground-secondary">{i.date}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-foreground-secondary">{i.comments}</div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-border bg-card p-3">
        <Button fullWidth onClick={onCreate}>
          <Plus size={16} /> Create interaction
        </Button>
      </div>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title="Interaction details" subtitle={detail?.date}>
        {detail && (
          <div className="space-y-3">
            <Field label="Category" value={detail.category} />
            <Field label="Comments" value={detail.comments} />
          </div>
        )}
      </Sheet>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-foreground-secondary">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
