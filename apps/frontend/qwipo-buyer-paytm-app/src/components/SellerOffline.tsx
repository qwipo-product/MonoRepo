import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Badge, Toast, cn } from '@mockups/ui';
import { isSellerOffline, offlineMessage } from '../data/sellerStatus';

/* Seller-offline plumbing for every screen:

     useSellerOffline() → { isOffline(name), notify(name) }
     <OfflineBadge />   → the red "Currently Offline" pill

   notify() shows one message inside the phone frame: "<seller> is currently
   offline and not accepting orders." — what a tap on anything belonging to
   an offline seller does instead of opening it. */

type Ctx = { isOffline: (name?: string | null) => boolean; notify: (name: string) => void };

const SellerOfflineContext = createContext<Ctx>({ isOffline: isSellerOffline, notify: () => {} });

export function SellerOfflineProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const notify = useCallback((name: string) => setMsg(offlineMessage(name)), []);
  const close = useCallback(() => setMsg(null), []);
  return (
    <SellerOfflineContext.Provider value={{ isOffline: isSellerOffline, notify }}>
      {children}
      <Toast open={!!msg} variant="error" message={msg ?? ''} onClose={close} />
    </SellerOfflineContext.Provider>
  );
}

export const useSellerOffline = () => useContext(SellerOfflineContext);

export function OfflineBadge({ className }: { className?: string }) {
  return (
    <Badge variant="destructive" className={cn('shrink-0', className)}>
      Currently Offline
    </Badge>
  );
}
