import { useState, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Sheet, useTheme, cn } from '@mockups/ui';

/** Qwipo brand lockup (real SVG assets) — swaps to the white mark in dark mode. */
export function AuthBrand() {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={isDark ? '/brand/qwipo-primary-white.svg' : '/brand/qwipo-primary.svg'}
        alt="Qwipo"
        className="h-[130px] w-auto"
      />
      <img src="/brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="h-6" />
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

/** Business types — verbatim from the source picker. */
export const BUSINESS_TYPES = [
  'Kirana',
  'Restaurant',
  'Caterers',
  'Tiffin Centers',
  'PG/Hostel',
  'Wholesale',
  'Bakery',
  'Sweet House',
  'Medicals',
  'Supermarket',
];

/** Select-style control that opens a bottom Sheet of options (mirrors BusinessTypeSheet). */
export function SelectField({
  label,
  required,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} required={required}>
      <button type="button" onClick={() => setOpen(true)} className={cn(controlClass, 'justify-between')}>
        <span className={value ? 'text-foreground' : 'text-foreground-secondary'}>{value || placeholder}</span>
        <ChevronDown className="h-5 w-5 text-foreground-secondary" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="space-y-1">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-3 text-sm',
                o === value ? 'bg-muted font-medium text-primary' : 'text-foreground hover:bg-muted'
              )}
            >
              <span>{o}</span>
              {o === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </Sheet>
    </Field>
  );
}
