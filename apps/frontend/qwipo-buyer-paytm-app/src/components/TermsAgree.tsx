import { Check } from 'lucide-react';
import { cn } from '@mockups/ui';

/* "I have read & agree to the Terms" — the tick a screen needs before its
   committing action unlocks.

   Set at the size the sign-in screen uses for the same sentence (12px): it is
   a condition of carrying on, not something to read at body size, and keeping
   it small leaves the button under it the loudest thing in the bar. Shared so
   the KYC steps and Manual Review can't drift apart. */
export function TermsAgree({
  agreed,
  onChange,
  className,
}: {
  agreed: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!agreed)}
      aria-pressed={agreed}
      /* The whole row toggles it, and the row is padded so the box has a
         comfortable target around it — a 16px box is hard to hit accurately
         with a thumb, however big the row behind it is. */
      className={cn('flex items-start gap-2.5 py-1 text-left', className)}
    >
      <span
        className={cn(
          'mt-px grid h-5 w-5 flex-shrink-0 place-items-center rounded border',
          agreed ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong'
        )}
      >
        {agreed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="text-xs leading-relaxed text-foreground-secondary">
        I have read &amp; agree to the{' '}
        <a className="font-medium text-primary underline underline-offset-2">Terms of Use</a> and{' '}
        <a className="font-medium text-primary underline underline-offset-2">Privacy Policy</a>
      </span>
    </button>
  );
}
