import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from '@mockups/web-ui';

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  helperText?: string;
  options: SelectFieldOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

// Radix Select reserves the empty string internally to mean "no value" and throws if a
// SelectItem is given value="" — this codebase uses "" as a legitimate placeholder/unset
// option, so it's swapped for an internal sentinel at this boundary and translated back on change.
const EMPTY_VALUE_SENTINEL = '__unset__';

export function SelectField({ label, helperText, options, value, onChange, disabled = false, error }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <Select
        value={value === '' ? EMPTY_VALUE_SENTINEL : value}
        onValueChange={(next) => onChange(next === EMPTY_VALUE_SENTINEL ? '' : next)}
        disabled={disabled}
      >
        <SelectTrigger className={cn('w-full', error && 'border-destructive')} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value === '' ? EMPTY_VALUE_SENTINEL : option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        helperText && <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
