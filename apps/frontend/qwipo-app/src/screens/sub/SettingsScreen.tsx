import { useState } from 'react';
import { ChevronRight, Moon } from 'lucide-react';
import { useTheme } from '@mockups/ui';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';
import ConfirmDialog from '../../components/ConfirmDialog';

const PREFS = [
  { key: 'orderUpdates', label: 'Order updates', detail: 'Dispatch, delivery, delays' },
  { key: 'promotions', label: 'Promotions & offers', detail: 'Distributor and brand offers' },
  { key: 'stockAlerts', label: 'Stock alerts', detail: 'When favourite SKUs are restocked' },
  { key: 'priceDrops', label: 'Price drops', detail: 'Alerts when prices fall on saved items' },
  { key: 'creditReminders', label: 'Credit reminders', detail: 'Due date and limit alerts' },
  { key: 'weeklyDigest', label: 'Weekly digest', detail: 'Summary of your savings and orders' },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-switch-background'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function SettingsScreen({ onBack, onOpenLanguage }: any) {
  const { isDark, setTheme } = useTheme();
  const [themeConfirm, setThemeConfirm] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ orderUpdates: true, promotions: true, stockAlerts: true, priceDrops: false, creditReminders: true, weeklyDigest: false });

  return (
    <div className="relative flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Settings" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1"><span className="block text-sm font-medium">Dark mode</span><span className="block text-xs text-muted-foreground">Switch the whole app theme</span></span>
            <Toggle on={isDark} onClick={() => setThemeConfirm(true)} />
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notification preferences</div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {PREFS.map((p, i) => (
              <div key={p.key} className={`flex items-center gap-3 p-3.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                <span className="flex-1"><span className="block text-sm font-medium">{p.label}</span><span className="block text-xs text-muted-foreground">{p.detail}</span></span>
                <Toggle on={prefs[p.key]} onClick={() => setPrefs((s) => ({ ...s, [p.key]: !s[p.key] }))} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">General</div>
          <button onClick={onOpenLanguage} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm">
            <span className="flex-1 text-sm font-medium">Language</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </section>
      </div>

      {themeConfirm && (
        <ConfirmDialog
          title={isDark ? 'Switch to light mode?' : 'Switch to dark mode?'}
          body="The whole app will change theme. You can switch back any time."
          confirmLabel="Apply"
          cancelLabel="Cancel"
          onClose={() => setThemeConfirm(false)}
          onConfirm={() => { setTheme(isDark ? 'light' : 'dark'); setThemeConfirm(false); }}
        />
      )}
    </div>
  );
}
