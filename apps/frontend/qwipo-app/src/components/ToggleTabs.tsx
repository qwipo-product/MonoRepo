/* Segmented control (2–4 mutually-exclusive options), DS pill style. */
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
    <div className="mx-4 flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            active === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
