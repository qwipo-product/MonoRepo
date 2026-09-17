// Dashed hand-off card: the one route from an analytics page to a report.
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@mockups/ui';
import type { Page } from '../nav';

export function Handoff({
  title, body, cta, className, go,
}: {
  title: string; body: string; cta: string; className?: string; go: (p: Page) => void;
}) {
  return (
    <Card className={cn('flex flex-col justify-center border-dashed', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="type-label">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button size="sm" onClick={() => go('reports')}>{cta}</Button>
      </CardContent>
    </Card>
  );
}
