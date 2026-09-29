import { useId } from 'react';
import type { ComponentType } from 'react';

import { RadioGroup, RadioGroupItem, cn } from '@mockups/web-ui';

export interface RadioCardOption {
  id: string;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

interface RadioCardGroupProps {
  title: string;
  subtitle?: string;
  required?: boolean;
  options: RadioCardOption[];
  value?: string;
  onChange: (id: string) => void;
  error?: string;
  columns?: 1 | 2 | 3 | 4;
  /** Keeps `title` as the accessible group label without rendering it visibly — for callers
   * that already show an equivalent heading elsewhere (e.g. a Card header just above). */
  hideLabel?: boolean;
}

const columnClasses: Record<NonNullable<RadioCardGroupProps['columns']>, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function RadioCardGroup({
  title,
  subtitle,
  required = false,
  options,
  value,
  onChange,
  error,
  columns = 2,
  hideLabel = false,
}: RadioCardGroupProps) {
  const groupId = useId();

  return (
    <div>
      {!hideLabel && (
        <div className="flex items-baseline justify-between">
          <label className="block text-sm font-medium text-gray-900">{title}</label>
          {required && <span className="text-xs font-medium text-gray-500">Required</span>}
        </div>
      )}
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}

      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-label={title}
        className={cn(hideLabel ? 'grid gap-2' : 'mt-2 grid gap-2', columnClasses[columns])}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.id}`;
          const isSelected = option.id === value;
          return (
            <label
              key={option.id}
              htmlFor={optionId}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <RadioGroupItem value={option.id} id={optionId} className="mt-0.5" />
              <span className="min-w-0">
                {option.icon && (
                  <option.icon className={cn('mb-1.5 block h-4 w-4', isSelected ? 'text-blue-600' : 'text-gray-500')} aria-hidden />
                )}
                <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                {option.description && <span className="mt-0.5 block text-xs leading-5 text-gray-500">{option.description}</span>}
              </span>
            </label>
          );
        })}
      </RadioGroup>

      {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
