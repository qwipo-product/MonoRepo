import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

import { Button } from '@mockups/web-ui';

interface WizardFooterProps {
  onBack: () => void;
  onSaveDraft: () => void;
  onContinue: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  savedRecently?: boolean;
}

export function WizardFooter({
  onBack,
  onSaveDraft,
  onContinue,
  continueLabel = 'Continue',
  backLabel = 'Back',
  continueDisabled = false,
  savedRecently = false,
}: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Button>

      <div className="flex items-center gap-3">
        {savedRecently && (
          <span className="hidden text-xs font-medium text-gray-500 sm:inline" role="status">
            Draft saved
          </span>
        )}
        <Button type="button" variant="outline" onClick={onSaveDraft}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save draft
        </Button>
        <Button type="button" onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
