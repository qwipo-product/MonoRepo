import type { LucideIcon } from 'lucide-react';

/* Full-page empty state — icon + title + subtitle (DS §5 empty-state pattern). */
export default function EmptyState({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}
