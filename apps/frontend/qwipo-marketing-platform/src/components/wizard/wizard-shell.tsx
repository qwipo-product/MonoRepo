import type { ReactNode } from 'react';

import { cn } from '@mockups/web-ui';

import { WizardStepper } from './wizard-stepper';

interface WizardShellProps {
  /** Flow-level heading, e.g. "Create promotion". The per-step name comes from the stepper. */
  title: string;
  steps: string[];
  /** 1-indexed current step. */
  currentStep: number;
  /** Sticky action bar — normally a <WizardFooter /> or a Back/Continue pair. */
  footer: ReactNode;
  children: ReactNode;
  /** Max content width. Defaults to the 5xl used by the promotion wizard. */
  maxWidthClassName?: string;
}

/**
 * Fixed-frame wizard layout shared by the promotion wizard and the notification
 * composer: the title + stepper pin to the top, the action bar pins to the
 * bottom, and only the form content between them scrolls.
 */
export function WizardShell({ title, steps, currentStep, footer, children, maxWidthClassName = 'max-w-5xl' }: WizardShellProps) {
  return (
    <section className="flex h-full flex-col bg-gray-50">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className={cn('mx-auto space-y-3', maxWidthClassName)}>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <WizardStepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className={cn('mx-auto flex flex-col gap-4', maxWidthClassName)}>{children}</div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3">
        <div className={cn('mx-auto', maxWidthClassName)}>{footer}</div>
      </div>
    </section>
  );
}
