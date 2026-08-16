import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@mockups/web-ui';

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rirn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Delete this screen and build the real thing. The desktop kit is already wired up.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold">The web kit is ready</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Tables, dialogs, sheets, comboboxes, charts and AppShell all come from
            @mockups/web-ui. Browse them in storybook-web.
          </p>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success">Verified</StatusBadge>
            <StatusBadge tone="warning">Pending</StatusBadge>
            <StatusBadge tone="danger">Rejected</StatusBadge>
          </div>
          <Button onClick={() => alert('Wire me up')}>Do the thing</Button>
        </CardContent>
      </Card>
    </div>
  );
}
