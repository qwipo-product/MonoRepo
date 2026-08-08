import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';
import { products } from '@mockups/mock-data';

/* Placeholder Home — full browse screen lands in Phase 2. For now it hosts the
   KYC-pending banner so the onboarding → KYC → success flow stays reachable. */
export default function Home({
  kycPending,
  onCompleteKyc,
}: {
  kycPending?: boolean;
  onCompleteKyc?: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Home</h1>

      {kycPending && (
        <Card className="border-amber-300">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium">Complete your KYC</p>
              <p className="text-xs text-muted-foreground">Required before placing orders.</p>
            </div>
            <Button size="sm" onClick={onCompleteKyc}>
              Complete
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Shared screen — renders in both the Buyer and Paytm shells. Toggle above.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Design system wired</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{products.length} products available from @mockups/mock-data.</p>
          <Button>Primary action</Button>
        </CardContent>
      </Card>
    </div>
  );
}
