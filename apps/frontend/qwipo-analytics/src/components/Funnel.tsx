// Inverted funnel: stage rows with conversion vs the previous stage.
// Used by the Overview card and the Customers page.
import { cn } from '@mockups/ui';

export function Funnel({
  stages, onStage,
}: {
  stages: { label: string; n: number }[];
  onStage?: (i: number, label: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      {stages.map((f, i) => {
        const w = f.n / stages[0].n;
        const nxt = i < stages.length - 1 ? stages[i + 1].n / stages[0].n : w * 0.7;
        const inset = ((w - nxt) / 2 / w) * 100;
        return (
          <div
            key={f.label}
            className={cn(
              'type-caption grid grid-cols-[105px_minmax(160px,1fr)_105px] items-center gap-3',
              onStage && 'cursor-pointer rounded-md hover:bg-muted',
            )}
            onClick={onStage && ((e) => { e.stopPropagation(); onStage(i, f.label); })}
          >
            <span className="text-right text-foreground">{f.label}</span>
            <div className="flex justify-center">
              <div
                className={cn('type-price-sm grid h-9 place-items-center text-primary-foreground', i === stages.length - 1 ? 'bg-success' : 'bg-primary')}
                style={{ width: `${w * 100}%`, clipPath: `polygon(0 0,100% 0,${100 - inset}% 100%,${inset}% 100%)` }}
              >
                {f.n}
              </div>
            </div>
            <span className="whitespace-nowrap text-foreground-secondary">
              {i === 0 ? '—' : <><b className="text-foreground">{Math.round((f.n / stages[i - 1].n) * 100)}%</b> of prev</>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
