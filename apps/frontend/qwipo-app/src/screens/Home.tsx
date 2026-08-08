import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';
import { products } from '@mockups/mock-data';

export default function Home() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Home</h1>
      <p className="text-sm text-muted-foreground">
        Shared screen — renders in both the Buyer and Paytm shells. Toggle above.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Mock data is ready</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{products.length} products available from @mockups/mock-data.</p>
          <Button onClick={() => alert('Wire me up')}>Do the thing</Button>
        </CardContent>
      </Card>
    </div>
  );
}
