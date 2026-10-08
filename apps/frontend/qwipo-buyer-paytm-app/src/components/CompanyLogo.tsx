import { cn } from '@mockups/ui';
import { COMPANIES, type Company } from '../data/beatSchedule';

/* A company's mark on a white plate. Uses the real logo where the app has one;
   otherwise a wordmark tile — a placeholder until the real logos arrive. */

// Placeholder wordmarks get a token colour each, so the row isn't a wall of one colour.
const INK = [
  'text-error',
  'text-success-foreground',
  'text-info-foreground',
  'text-primary',
  'text-warning-foreground',
  'text-accent-foreground',
];

export function CompanyLogo({ company, size = 'md', className }: { company: Company; size?: 'sm' | 'md'; className?: string }) {
  const ink = INK[COMPANIES.findIndex((c) => c.id === company.id) % INK.length];
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-card',
        size === 'sm' ? (company.logo ? 'h-8 w-8 p-0.5' : 'h-8 min-w-8 px-1.5') : 'h-full w-full p-2',
        className
      )}
    >
      {company.logo ? (
        <img src={company.logo} alt={company.name} className="max-h-full max-w-full object-contain" />
      ) : (
        <span
          aria-label={company.name}
          className={cn(
            'text-center font-extrabold leading-none tracking-tight',
            size === 'sm' ? 'text-2xs' : 'text-base',
            ink
          )}
        >
          {company.mark}
        </span>
      )}
    </span>
  );
}
