import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';
import { products } from '@mockups/mock-data';

export default function Home() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Seller Mobile</h1>
      <p className="text-sm text-muted-foreground">
        Delete this screen and build the real thing. The shared kit is already wired up.
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
