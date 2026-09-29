import { Check } from 'lucide-react';

import { cn } from '@mockups/web-ui';

interface WizardStepperProps {
  /** Ordered step names, rendered under their number. */
  steps: string[];
  /** 1-indexed current step. */
  currentStep: number;
}

/**
 * Shared horizontal wizard stepper: a numbered marker per step with its name
 * directly underneath, joined by connector rules. Completed steps turn emerald
 * with a check, the current step is brand blue, upcoming steps stay outlined.
 * Used by both the promotion wizard and the notification composer so the two
 * flows read identically.
 */
export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <ol className="flex items-start" aria-label={`Step ${currentStep} of ${steps.length}`}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li key={label} className={cn('flex items-start', !isLast && 'flex-1')}>
            <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 sm:w-28">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isDone && 'bg-emerald-600 text-white',
                  isActive && 'bg-blue-600 text-white',
                  !isDone && !isActive && 'border border-gray-300 bg-white text-gray-400',
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden="true" /> : stepNumber}
              </span>
              <span
                className={cn(
                  'text-center text-[11px] leading-4 sm:text-xs',
                  isActive ? 'font-medium text-gray-900' : isDone ? 'text-gray-700' : 'text-gray-400',
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && <span aria-hidden="true" className={cn('mt-4 h-px flex-1', isDone ? 'bg-emerald-600' : 'bg-gray-200')} />}
          </li>
        );
      })}
    </ol>
  );
}
