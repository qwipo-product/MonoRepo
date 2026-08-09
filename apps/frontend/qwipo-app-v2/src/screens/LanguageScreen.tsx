import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@mockups/ui';

/* Account · Language — choose the app language (radio select). */

const LANGUAGES = [
  { code: 'en', native: 'English', name: 'English' },
  { code: 'hi', native: 'हिन्दी', name: 'Hindi' },
  { code: 'te', native: 'తెలుగు', name: 'Telugu' },
  { code: 'ta', native: 'தமிழ்', name: 'Tamil' },
];

export function LanguageScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState('en');

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Language</h1>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle p-4">
        <h2 className="text-sm font-semibold text-foreground">Choose your language</h2>
        <p className="mt-0.5 text-xs text-foreground-secondary">
          The app will switch to your selected language immediately.
        </p>

        <div
          role="radiogroup"
          aria-label="Language"
          className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          {LANGUAGES.map((l) => {
            const active = l.code === selected;
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(l.code)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:scale-[0.99]"
              >
                <span className="min-w-0 flex-1">
                  <span lang={l.code} className="block text-sm font-medium text-foreground">
                    {l.native}
                  </span>
                  <span className="block text-xs text-foreground-secondary">{l.name}</span>
                </span>
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                    active ? 'border-primary' : 'border-foreground-tertiary'
                  )}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
