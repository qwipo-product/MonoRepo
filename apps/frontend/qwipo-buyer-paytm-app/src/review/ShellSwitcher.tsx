import { cn } from '@mockups/ui';

/* Which mockup surface wraps the shared screens: the standalone Qwipo Buyer
   App, or the Paytm Mini App (WebView container). Review-only. */
export type Shell = 'buyer' | 'paytm';

export function ShellSwitcher({ value, onChange }: { value: Shell; onChange: (s: Shell) => void }) {
  return (
    <div className="flex w-full rounded-full bg-muted p-1 text-sm">
      {(['buyer', 'paytm'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-full px-2 py-1.5 transition-colors',
            value === s ? 'bg-card font-medium text-foreground shadow-sm' : 'text-foreground-secondary'
          )}
        >
          {s === 'buyer' ? 'Qwipo App' : 'Paytm App'}
        </button>
      ))}
    </div>
  );
}
