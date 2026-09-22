import { Gauge } from 'lucide-react';
import { Progress, Tooltip, TooltipContent, TooltipTrigger } from '@mockups/web-ui';
import { UNLOCKS_EARNED_PER_MAPPING, useCompanySession } from '../lib/company-session';

/**
 * The allowance, always visible in the top bar.
 *
 * It's here rather than buried in a settings page because it's meant to be
 * felt: a company that browses without contributing should watch this drain.
 * That pressure is the anti-harvesting control, so hiding it would defeat it.
 */
export function QuotaMeter() {
  const { remaining, allowance, unlocksSpent, unlocksEarned } = useCompanySession();
  const pct = allowance === 0 ? 0 : (remaining / allowance) * 100;
  const low = remaining <= 3;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden w-48 cursor-default md:block">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Gauge className="h-3.5 w-3.5" />
              Unlocks left
            </span>
            <span className={low ? 'font-semibold text-red-600' : 'font-medium text-gray-900'}>
              {remaining} / {allowance}
            </span>
          </div>
          <Progress value={pct} className="mt-1.5 h-1.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        <p className="text-xs">
          {unlocksSpent} used today. Mapping a retailer earns {UNLOCKS_EARNED_PER_MAPPING} more —
          you&apos;ve earned {unlocksEarned} so far.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
