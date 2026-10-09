import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '@mockups/ui';

/* AuthShell — the shared frame for Login and OTP Verification.

   Both screens must line up pixel for pixel: same logo position, same heading,
   subheading, field row and primary button. They drifted when each owned its
   own markup (the Back button pushed OTP's logo down 23px, the sheets had
   different padding, and a two-line subtitle moved the field 22px). One shell
   means they can't drift again.

   Keep subtitles to a single line — a wrapping subtitle is the one thing that
   still shifts everything below it on that screen only. */
export function AuthShell({
  onBack,
  title,
  subtitle,
  footer,
  children,
}: {
  /** Renders a Back control. Positioned absolutely so it never moves the logo. */
  onBack?: () => void;
  title: ReactNode;
  subtitle: ReactNode;
  /** Extra line pinned to the bottom of the sheet (Login's terms copy). */
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* top half — brand, centred identically whether or not Back is shown */}
      <div className="relative flex flex-1 items-center justify-center">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <AuthBrand />
      </div>

      {/* bottom half — elevated sheet */}
      <div className="flex flex-1 flex-col rounded-t-2xl border-t border-border bg-background p-6 pb-8 shadow-bar-top">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-foreground-secondary">{subtitle}</p>
        {children}
        {footer && <div className="mt-auto pt-5">{footer}</div>}
      </div>
    </div>
  );
}

/** Qwipo brand lockup (real SVG assets) — swaps to the white mark in dark mode. */
export function AuthBrand() {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={isDark ? './brand/qwipo-primary-white.svg' : './brand/qwipo-primary.svg'}
        alt="Qwipo"
        className="h-[130px] w-auto"
      />
      <img src="./brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="h-9 w-auto" />
    </div>
  );
}

/** Label (+ required asterisk) over a control — DS form-field rhythm. */
export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
    </div>
  );
}

/* Shared control chrome — editable fields are WHITE (bg-card); 44px touch target. */
export const controlClass =
  'flex h-11 w-full items-center rounded-md border border-border bg-card px-3 text-sm text-foreground';
