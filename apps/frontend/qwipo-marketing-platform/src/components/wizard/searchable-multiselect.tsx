import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { Command, CommandGroup, CommandInput, CommandItem, CommandList, Popover, PopoverContent, PopoverTrigger, cn } from '@mockups/web-ui';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableMultiSelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyMessage?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  /** Renders a pinned "select everything" row above the searchable list, handled separately from per-item toggling. */
  allOption?: { label: string };
  isAllSelected?: boolean;
  onToggleAll?: () => void;
  hideLabel?: boolean;
  hideChips?: boolean;
  pluralLabel?: string;
  showClearInTrigger?: boolean;
}

/** Chips shown inline before collapsing the rest into a "+N more" pill. */
const VISIBLE_CHIPS = 4;

/** Square checkbox marker for a dropdown row — a real <Checkbox> can't nest inside a CommandItem. */
function CheckMarker({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
        checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white',
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function SearchableMultiSelect({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  emptyMessage = 'No matches found.',
  helperText,
  error,
  disabled = false,
  allOption,
  isAllSelected = false,
  onToggleAll,
  hideLabel = false,
  hideChips = false,
  pluralLabel,
  showClearInTrigger = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(normalized) || option.sublabel?.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const selectedOptions = options.filter((option) => selectedIds.includes(option.id));
  const visibleChips = selectedOptions.slice(0, VISIBLE_CHIPS);
  const hiddenChipCount = selectedOptions.length - visibleChips.length;
  const hasChips = isAllSelected || selectedOptions.length > 0;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((selectedId) => selectedId !== id));
    else onChange([...selectedIds, id]);
  };

  const triggerText = isAllSelected
    ? (allOption?.label ?? 'All')
    : selectedOptions.length === 0
      ? (placeholder ?? `Select ${label.toLowerCase()}...`)
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : pluralLabel
          ? `${selectedOptions.length} ${pluralLabel} selected`
          : `${selectedOptions.length} selected`;
  const isPlaceholder = !isAllSelected && selectedOptions.length === 0;
  const canClearFromTrigger = showClearInTrigger && !disabled && (isAllSelected || selectedOptions.length > 0);

  const clearAll = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    if (isAllSelected) onToggleAll?.();
    else onChange([]);
  };

  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <div className="flex items-baseline justify-between gap-2">
          <label className="block text-sm font-medium text-gray-900">{label}</label>
          {!isAllSelected && selectedOptions.length > 1 && !disabled && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <div
            role="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={label}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpen((prev) => !prev);
              }
            }}
            className={cn(
              'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border bg-input-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              disabled && 'cursor-not-allowed opacity-60',
              error ? 'border-destructive ring-destructive/20' : 'border-gray-300 hover:border-gray-400',
            )}
          >
            <span className={cn('flex-1 truncate text-left', isPlaceholder ? 'text-muted-foreground' : 'font-medium text-gray-900')}>
              {triggerText}
            </span>
            {canClearFromTrigger && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label={`Clear ${label}`}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList className="max-h-64">
              {allOption && (
                <CommandGroup>
                  <CommandItem onSelect={() => onToggleAll?.()} className="gap-2 font-medium">
                    <CheckMarker checked={isAllSelected} />
                    {allOption.label}
                  </CommandItem>
                </CommandGroup>
              )}
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-muted-foreground">{emptyMessage}</p>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const isSelected = !isAllSelected && selectedIds.includes(option.id);
                    return (
                      <CommandItem key={option.id} onSelect={() => toggle(option.id)} className="gap-2">
                        <CheckMarker checked={isSelected} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{option.label}</span>
                          {option.sublabel && <span className="block truncate text-xs text-muted-foreground">{option.sublabel}</span>}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!hideChips && hasChips && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {isAllSelected && allOption ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pr-1 pl-2 text-xs font-medium text-blue-700">
              {allOption.label}
              <button
                type="button"
                onClick={onToggleAll}
                className="rounded-full p-0.5 transition-colors hover:bg-blue-100"
                aria-label={`Clear ${allOption.label}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ) : (
            <>
              {visibleChips.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex max-w-[14rem] items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pr-1 pl-2 text-xs font-medium text-blue-700"
                >
                  <span className="truncate">{option.label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(option.id)}
                    className="rounded-full p-0.5 transition-colors hover:bg-blue-100"
                    aria-label={`Remove ${option.label}`}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {hiddenChipCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  +{hiddenChipCount} more
                </button>
              )}
            </>
          )}
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        helperText && <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
