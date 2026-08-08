import type { Ref } from 'react';
import { Search, X } from 'lucide-react';

/* Search input row, DS tokens. Optional clear button + ref for autofocus. */
export default function SearchField({
  value,
  onChange,
  placeholder,
  inputRef,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputRef?: Ref<HTMLInputElement>;
  onClear?: () => void;
}) {
  return (
    <div className="mx-4 mb-2 flex h-11 items-center gap-2 rounded-lg border border-border bg-input-background px-3">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {value && onClear && (
        <button onClick={onClear} aria-label="Clear">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
