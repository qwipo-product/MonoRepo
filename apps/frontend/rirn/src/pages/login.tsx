import { Building2, Network } from 'lucide-react';
import { Button, Card, CardContent } from '@mockups/web-ui';
import { login, type CompanyUser } from '../lib/company-session';

/**
 * Company sign-in.
 *
 * Picking a company rather than typing credentials, because the persona is
 * what matters in a demo: "your DMS" means something different for ITC than
 * for Britannia, and the whole verification story hangs on whose DMS is being
 * asked.
 */
const COMPANIES: CompanyUser[] = [
  {
    id: 'itc-1',
    name: 'Ramesh Iyer',
    company: 'ITC Limited',
    companyCode: 'COMP-ITC',
    initials: 'RI',
  },
  {
    id: 'hul-1',
    name: 'Priya Nair',
    company: 'Hindustan Unilever',
    companyCode: 'COMP-HUL',
    initials: 'PN',
  },
  {
    id: 'brt-1',
    name: 'Sanjay Rao',
    company: 'Britannia Industries',
    companyCode: 'COMP-BRT',
    initials: 'SR',
  },
];

export function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Network className="h-6 w-6 text-white" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Retailer Identity Network
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Find verified retailers and link them to your own customer records.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Sign in as a company
            </p>
            {COMPANIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => login(c)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                  {c.initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{c.company}</span>
                  <span className="block text-xs text-gray-500">
                    {c.name} · {c.companyCode}
                  </span>
                </span>
                <Building2 className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Every company sees the same verified retailer base. What differs is which
          retailers you&apos;ve mapped to your own DMS.
        </p>
      </div>
    </div>
  );
}

export function LoginFallbackButton() {
  return (
    <Button onClick={() => login(COMPANIES[0]!)} variant="outline">
      Sign in
    </Button>
  );
}
