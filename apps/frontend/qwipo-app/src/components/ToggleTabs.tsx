/* Segmented control — pill track with an elevated active segment (white card,
   soft shadow, primary label). Enterprise-clean, DS §4 pill style. */
export default function ToggleTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="mx-4 flex gap-1 rounded-xl bg-muted p-1">
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm transition-all ${
              on
                ? 'bg-card font-semibold text-primary shadow-sm'
                : 'font-medium text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
