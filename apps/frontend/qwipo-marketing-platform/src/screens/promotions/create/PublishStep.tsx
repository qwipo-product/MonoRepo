import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCircle2, Smartphone } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Switch } from '@mockups/web-ui';

import { deriveStatus, usePromotionStore } from '../../../store/usePromotionStore';
import { brands, categories, companies } from '../../../lib/mock-data';
import { describeGeo, formatDate, formatDateRange, promotionWizardSteps, statusLabels, statusStyles, surfaceLabels } from '../../../lib/promotion-copy';
import { PhoneSimulator } from '../../../components/wizard/phone-simulator';
import { WizardFooter } from '../../../components/wizard/wizard-footer';
import { WizardShell } from '../../../components/wizard/wizard-shell';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function PublishStep() {
  const navigate = useNavigate();
  const draft = usePromotionStore((state) => state.draft);
  const editingId = usePromotionStore((state) => state.editingId);
  const updateDraft = usePromotionStore((state) => state.updateDraft);
  const prevStep = usePromotionStore((state) => state.prevStep);
  const saveDraftRecord = usePromotionStore((state) => state.saveDraftRecord);
  const publishPromotion = usePromotionStore((state) => state.publishPromotion);

  const [attemptedCreate, setAttemptedCreate] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  const companyNames = useMemo(
    () => draft.product.company_ids.map((id) => companies.find((company) => company.id === id)?.name).filter(Boolean),
    [draft.product.company_ids],
  );
  const categoryNames = useMemo(
    () => draft.product.category_ids.map((id) => categories.find((category) => category.id === id)?.name).filter(Boolean),
    [draft.product.category_ids],
  );
  const brandNames = useMemo(
    () => draft.product.brand_ids.map((id) => brands.find((brand) => brand.id === id)?.name).filter(Boolean),
    [draft.product.brand_ids],
  );
  const skuCount = draft.product.sku_ids.length;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const previewStatus = useMemo(() => deriveStatus(draft.start_date, draft.end_date, today), [draft.start_date, draft.end_date, today]);

  const isMissingRequired = !draft.campaign_title.trim() || !draft.start_date || !draft.end_date || !draft.surface;

  const handleBack = () => {
    prevStep();
    navigate('/promotions/create/surface');
  };

  const handleSaveDraft = () => {
    saveDraftRecord();
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2500);
  };

  const handleCreate = () => {
    setAttemptedCreate(true);
    if (isMissingRequired) return;
    publishPromotion();
    navigate('/promotions');
  };

  return (
    <WizardShell
      title="Create promotion"
      steps={promotionWizardSteps}
      currentStep={4}
      footer={
        <WizardFooter
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          onContinue={handleCreate}
          continueLabel={editingId ? 'Save changes' : 'Create promotion'}
          savedRecently={savedRecently}
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                <SummaryRow label="Campaign title" value={draft.campaign_title || '—'} />
                <SummaryRow label="Display name" value={draft.display_name || '—'} />
                <SummaryRow label="Timeline" value={formatDateRange(draft.start_date, draft.end_date)} />
                <SummaryRow label="Geo scope" value={describeGeo(draft.geo)} />
                <SummaryRow label="Companies" value={companyNames.length > 0 ? companyNames.join(', ') : 'All'} />
                <SummaryRow label="Categories" value={categoryNames.length > 0 ? categoryNames.join(', ') : 'All'} />
                <SummaryRow label="Brands" value={brandNames.length > 0 ? brandNames.join(', ') : 'All'} />
                <SummaryRow label="SKUs" value={skuCount > 0 ? `${skuCount} selected` : 'All'} />
                <SummaryRow label="Promotion surface" value={draft.surface ? surfaceLabels[draft.surface] : '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4 text-gray-500" aria-hidden="true" />
                Push notification
              </CardTitle>
              <Switch
                checked={draft.push_notification_enabled}
                onCheckedChange={(checked) => updateDraft({ push_notification_enabled: checked })}
                aria-label="Push notification"
              />
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-gray-500">
                {draft.push_notification_enabled
                  ? `Scheduled to push on ${formatDate(draft.start_date)}, targeting ${describeGeo(draft.geo)}.`
                  : 'Off — no push notification will be sent when this campaign goes live.'}
              </p>
            </CardContent>
          </Card>

          {attemptedCreate && isMissingRequired && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Campaign title, timeline, and promotion surface are required before this promotion can be created — go back and complete them.
            </p>
          )}
        </div>

        <div className="lg:w-[340px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="size-4 text-gray-500" aria-hidden="true" />
                Final preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhoneSimulator surface={draft.surface} imageUrl={draft.asset.data_url} />
              {draft.start_date && (
                <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium text-gray-500">
                  <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Will be created as
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusStyles[previewStatus]}`}>
                    {statusLabels[previewStatus]}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WizardShell>
  );
}
