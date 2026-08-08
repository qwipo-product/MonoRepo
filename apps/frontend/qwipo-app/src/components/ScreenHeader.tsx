import type { ReactNode } from 'react';
import BackButton from './BackButton';

/* Pushed-screen top bar: grey-square back + title + optional right action.
   Sits inside a screen's elevated header cluster (see the browse screens). */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-3 px-3">
      {onBack && <BackButton onClick={onBack} />}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
