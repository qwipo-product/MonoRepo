import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, ImageIcon, Smartphone } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@mockups/web-ui';

import { usePromotionStore } from '../../../store/usePromotionStore';
import { promotionWizardSteps, surfaceDimensions, surfaceOptions } from '../../../lib/promotion-copy';
import type { PromotionSurface } from '../../../types/campaign';
import { RadioCardGroup } from '../../../components/wizard/radio-card-group';
import { ImageDropzone } from '../../../components/wizard/image-dropzone';
import { PhoneSimulator } from '../../../components/wizard/phone-simulator';
import { WizardFooter } from '../../../components/wizard/wizard-footer';
import { WizardShell } from '../../../components/wizard/wizard-shell';

// DEMO ONLY — on-spec sample creatives served from /public/samples, one per surface.
// Remove alongside the download link below once real assets are in play.
const sampleAssets: Record<PromotionSurface, string> = {
  full_screen: '/samples/sample-full-screen-1080x1920.png',
  home_carousel: '/samples/sample-home-carousel-1080x450.png',
  product_list: '/samples/sample-product-list-1080x1080.png',
};

export default function SurfaceStep() {
  const navigate = useNavigate();
  const draft = usePromotionStore((state) => state.draft);
  const updateDraft = usePromotionStore((state) => state.updateDraft);
  const updateAsset = usePromotionStore((state) => state.updateAsset);
  const prevStep = usePromotionStore((state) => state.prevStep);
  const nextStep = usePromotionStore((state) => state.nextStep);
  const saveDraftRecord = usePromotionStore((state) => state.saveDraftRecord);

  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  const surface = draft.surface;
  const dimensions = surface ? surfaceDimensions[surface] : undefined;
  const isAssetValid = Boolean(surface && draft.asset.width === dimensions?.width && draft.asset.height === dimensions?.height);

  const surfaceError = attemptedContinue && !surface ? 'Select a promotion surface to continue.' : undefined;
  const assetError = attemptedContinue && surface && !isAssetValid ? 'Upload a banner that matches the required dimensions.' : undefined;

  const handleBack = () => {
    prevStep();
    navigate('/promotions/create/details');
  };

  const handleSaveDraft = () => {
    saveDraftRecord();
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2500);
  };

  const handleContinue = () => {
    setAttemptedContinue(true);
    if (!surface || !isAssetValid) return;
    nextStep();
    navigate('/promotions/create/publish');
  };

  return (
    <WizardShell
      title="Create promotion"
      steps={promotionWizardSteps}
      currentStep={3}
      footer={<WizardFooter onBack={handleBack} onSaveDraft={handleSaveDraft} onContinue={handleContinue} savedRecently={savedRecently} />}
    >
      <Card>
        <CardHeader>
          <CardTitle>Promotion surface</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioCardGroup
            title="Surface"
            subtitle="Select where this promotion should render in the Qwipo Buyer App."
            required
            options={surfaceOptions}
            value={surface}
            onChange={(value) => updateDraft({ surface: value as PromotionSurface })}
            error={surfaceError}
            columns={3}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-4 text-gray-500" aria-hidden="true" />
              Banner creative
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              {surface
                ? `Required for ${surfaceOptions.find((option) => option.id === surface)?.label}: ${dimensions?.width} × ${dimensions?.height}px.`
                : 'Select a promotion surface first to see its required dimensions.'}
            </p>
            {surface && dimensions ? (
              <ImageDropzone requiredWidth={dimensions.width} requiredHeight={dimensions.height} asset={draft.asset} onChange={updateAsset} />
            ) : (
              <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                Choose a promotion surface above to unlock the upload dropzone.
              </p>
            )}
            {assetError && <p className="text-xs font-medium text-destructive">{assetError}</p>}

            {/* DEMO ONLY — on-spec sample creatives for testing the upload flow. */}
            {surface && sampleAssets[surface] && (
              <a
                href={sampleAssets[surface]}
                download
                className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download a sample {dimensions?.width} × {dimensions?.height} banner
              </a>
            )}
          </CardContent>
        </Card>

        <div className="lg:w-[340px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="size-4 text-gray-500" aria-hidden="true" />
                Live preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhoneSimulator surface={surface} imageUrl={draft.asset.data_url} />
            </CardContent>
          </Card>
        </div>
      </div>
    </WizardShell>
  );
}
