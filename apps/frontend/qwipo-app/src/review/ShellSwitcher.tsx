/* Review-only control: toggle which shell wraps the shared screens.
   Not shipped in either production surface. */
export type Shell = 'buyer' | 'paytm';

export default function ShellSwitcher({
  value,
  onChange,
}: {
  value: Shell;
  onChange: (s: Shell) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-muted p-1 text-sm">
      {(['buyer', 'paytm'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-full capitalize transition-colors ${
            value === s ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
          }`}
        >
          {s === 'buyer' ? 'Buyer App' : 'Paytm mini'}
        </button>
      ))}
    </div>
  );
}
