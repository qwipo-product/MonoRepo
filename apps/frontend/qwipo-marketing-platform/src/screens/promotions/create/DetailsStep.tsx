import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarClock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mockups/web-ui';

import { deriveStatus, usePromotionStore } from '../../../store/usePromotionStore';
import { promotionWizardSteps, statusLabels, statusStyles } from '../../../lib/promotion-copy';
import { WizardFooter } from '../../../components/wizard/wizard-footer';
import { WizardShell } from '../../../components/wizard/wizard-shell';

export default function DetailsStep() {
  const navigate = useNavigate();
  const draft = usePromotionStore((state) => state.draft);
  const updateDraft = usePromotionStore((state) => state.updateDraft);
  const prevStep = usePromotionStore((state) => state.prevStep);
  const nextStep = usePromotionStore((state) => state.nextStep);
  const saveDraftRecord = usePromotionStore((state) => state.saveDraftRecord);

  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const computedStatus = useMemo(() => deriveStatus(draft.start_date, draft.end_date, today), [draft.start_date, draft.end_date, today]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!draft.campaign_title.trim()) e.campaign_title = 'Campaign title is required.';
    if (!draft.display_name.trim()) e.display_name = 'Display name is required.';
    if (!draft.start_date) e.start_date = 'Start date is required.';
    else if (draft.start_date < today) e.start_date = 'Start date cannot be in the past.';
    if (!draft.end_date) e.end_date = 'End date is required.';
    if (draft.start_date && draft.end_date && draft.end_date < draft.start_date) e.end_date = 'End date must be on or after the start date.';
    return e;
  }, [draft, today]);

  const shownError = (key: string) => (attemptedContinue ? errors[key] : undefined);

  const handleBack = () => {
    prevStep();
    navigate('/promotions/create');
  };

  const handleSaveDraft = () => {
    saveDraftRecord();
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2500);
  };

  const handleContinue = () => {
    setAttemptedContinue(true);
    if (Object.keys(errors).length > 0) return;
    nextStep();
    navigate('/promotions/create/surface');
  };

  return (
    <WizardShell
      title="Create promotion"
      steps={promotionWizardSteps}
      currentStep={2}
      footer={<WizardFooter onBack={handleBack} onSaveDraft={handleSaveDraft} onContinue={handleContinue} savedRecently={savedRecently} />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-gray-500" aria-hidden="true" />
            Campaign information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_title">Campaign title</Label>
            <Input
              id="campaign_title"
              type="text"
              value={draft.campaign_title}
              onChange={(event) => updateDraft({ campaign_title: event.target.value })}
              placeholder="e.g. Monsoon Staples Drive — internal"
              aria-invalid={Boolean(shownError('campaign_title'))}
            />
            <p className="text-xs text-gray-500">
              {shownError('campaign_title') ? (
                <span className="font-medium text-destructive">{shownError('campaign_title')}</span>
              ) : (
                'Internal reference name, only visible to your team.'
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              type="text"
              value={draft.display_name}
              onChange={(event) => updateDraft({ display_name: event.target.value })}
              placeholder="e.g. Monsoon atta mahotsav"
              aria-invalid={Boolean(shownError('display_name'))}
            />
            <p className="text-xs text-gray-500">
              {shownError('display_name') ? (
                <span className="font-medium text-destructive">{shownError('display_name')}</span>
              ) : (
                'Customer-facing title shown on the Qwipo Buyer App.'
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                type="date"
                min={today}
                value={draft.start_date}
                onChange={(event) => updateDraft({ start_date: event.target.value })}
                aria-invalid={Boolean(shownError('start_date'))}
              />
              {shownError('start_date') && <p className="text-xs font-medium text-destructive">{shownError('start_date')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                type="date"
                min={draft.start_date || today}
                value={draft.end_date}
                onChange={(event) => updateDraft({ end_date: event.target.value })}
                aria-invalid={Boolean(shownError('end_date'))}
              />
              {shownError('end_date') && <p className="text-xs font-medium text-destructive">{shownError('end_date')}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-gray-900">Auto-calculated status</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">
            Based on the timeline above, this campaign will be marked{' '}
            <span className={`ml-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[computedStatus]}`}>
              {statusLabels[computedStatus]}
            </span>{' '}
            once created.
          </p>
        </div>
      </div>
    </WizardShell>
  );
}
