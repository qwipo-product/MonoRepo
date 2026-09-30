import { cn } from '@mockups/ui';

/* Which persona is using the app: a regular Customer, or a Salesperson (who
   gets the beat-day features layered on top — task icon on Home, a Salesperson
   section in My Account, and the Salesperson screens in the sidebar).
   Review-only, mirrors the ShellSwitcher styling. */
export type Role = 'customer' | 'salesperson';

export function RoleSwitcher({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex w-full rounded-full bg-muted p-1 text-sm">
      {(['customer', 'salesperson'] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-full px-2 py-1.5 capitalize transition-colors',
            value === r ? 'bg-card font-medium text-foreground shadow-sm' : 'text-foreground-secondary'
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
