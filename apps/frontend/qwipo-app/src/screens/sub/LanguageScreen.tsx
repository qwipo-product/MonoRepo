import { useState } from 'react';
import { Check } from 'lucide-react';
import { useI18n, LANGUAGES, type LangCode } from '@mockups/i18n';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function LanguageScreen({ onBack }: any) {
  const { lang, setLang, t } = useI18n();
  const [pending, setPending] = useState<LangCode | null>(null);
  const [toast, setToast] = useState('');
  const pendingLang = pending && LANGUAGES.find((l) => l.code === pending);

  return (
    <div className="relative flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title={t('account.language')} onBack={onBack} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold">{t('lang.choose_language')}</div>
          <div className="text-xs text-muted-foreground">{t('lang.choose_language_sub')}</div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {LANGUAGES.map((l, i) => {
            const on = lang === l.code;
            return (
              <button key={l.code} onClick={() => !on && setPending(l.code)} aria-pressed={on} className={`flex w-full items-center justify-between px-4 py-3.5 text-left ${i > 0 ? 'border-t border-border' : ''}`}>
                <span><span className="block text-sm font-medium">{l.nativeName}</span><span className="block text-xs text-muted-foreground">{l.name}</span></span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${on ? 'border-primary' : 'border-muted-foreground'}`}>{on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pending && pendingLang && (
        <ConfirmDialog
          title={`Switch to ${pendingLang.nativeName}?`}
          body={`The whole app will switch to ${pendingLang.name}. You can change it back from here any time.`}
          confirmLabel="Apply"
          cancelLabel="Cancel"
          onClose={() => setPending(null)}
          onConfirm={() => { setLang(pending); setToast(t('lang.applied')); setPending(null); setTimeout(() => setToast(''), 1600); }}
        />
      )}
      {toast && (
        <div className="absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg" role="status">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}
    </div>
  );
}
