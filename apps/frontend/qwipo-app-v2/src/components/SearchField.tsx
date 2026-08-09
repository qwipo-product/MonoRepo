import { Search, X } from 'lucide-react';
import { cn } from '@mockups/ui';

/* SearchField — the one search input row (icon · field · clear). One source of
   truth so Global Search, Distributors, and any future filter row stay
   identical. Editable field → white (bg-card) per the DS input contract. */
export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring',
        className
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-primary" />
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-secondary"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-foreground-secondary active:scale-[0.98]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
