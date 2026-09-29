import { Checkbox, cn } from '@mockups/web-ui';

export interface CheckboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface CheckboxListProps {
  options: CheckboxOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** Widest column count. Use 3 for short, label-only options in dense forms. */
  columns?: 2 | 3;
}

export function CheckboxList({ options, selectedIds, onChange, disabled = false, columns = 2 }: CheckboxListProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((selectedId) => selectedId !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3', disabled && 'opacity-60')}>
      {options.map((option) => {
        const isChecked = selectedIds.includes(option.id);
        return (
          <label
            key={option.id}
            aria-disabled={disabled}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors',
              disabled ? 'cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer hover:border-gray-300',
              isChecked && !disabled && 'border-blue-600 bg-blue-50',
              !isChecked && !disabled && 'border-gray-200 bg-white',
            )}
          >
            <Checkbox checked={isChecked} disabled={disabled} onCheckedChange={() => toggle(option.id)} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block font-medium text-gray-900">{option.label}</span>
              {option.sublabel && <span className="block text-xs text-gray-500">{option.sublabel}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
