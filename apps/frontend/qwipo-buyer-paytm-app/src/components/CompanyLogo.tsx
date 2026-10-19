import { cn } from '@mockups/ui';
import type { Company } from '../data/beatSchedule';
import { Wordmark } from './Wordmark';

/* A company's mark on a plate. Uses the real logo where the app has one (on
   white — logos are drawn for white in both themes); otherwise a wordmark
   tile that fits the box — a placeholder until the real logos arrive. */

export function CompanyLogo({ company, size = 'md', className }: { company: Company; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-md border border-border',
        company.logo ? 'bg-white' : 'bg-card',
        size === 'sm' ? 'h-8 w-8' : 'h-full w-full',
        className
      )}
    >
      {company.logo ? (
        // The PNGs carry their own whitespace, so no inset — and a touch of scale.
        <img src={encodeURI(company.logo)} alt={company.name} className="h-full w-full scale-110 object-contain" />
      ) : (
        <Wordmark text={company.mark} className={size === 'sm' ? 'p-0.5' : 'p-1'} />
      )}
    </span>
  );
}
