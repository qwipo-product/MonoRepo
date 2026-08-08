import { useState } from 'react';
import BuyerShell from './shells/BuyerShell';
import PaytmShell from './shells/PaytmShell';
import ShellSwitcher, { type Shell } from './review/ShellSwitcher';
import Home from './screens/Home';

/* One codebase, two chrome wrappers. Shared screens live in ./screens;
   surface-specific ones in ./screens-buyer-only and ./screens-paytm-only.
   Default shell follows ?shell=paytm; the switcher flips it live for review. */
export default function App() {
  const initial: Shell =
    new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer';
  const [shell, setShell] = useState<Shell>(initial);
  const Shell = shell === 'paytm' ? PaytmShell : BuyerShell;

  return (
    <div className="min-h-dvh bg-shell grid place-items-center gap-4 p-4">
      <ShellSwitcher value={shell} onChange={setShell} />
      <Shell>
        <Home />
      </Shell>
    </div>
  );
}
