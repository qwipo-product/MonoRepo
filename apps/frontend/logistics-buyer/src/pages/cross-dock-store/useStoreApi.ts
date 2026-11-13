import { useMemo } from 'react';
import { storeService } from '../../api/services/crossDock.service';
import { useAuth } from '../../hooks/useAuth';
import { profileOf } from '../../profiles';

/** The cross-dock API bound to the signed-in user's store (CDS-KPHB for the demo user). */
export function useStoreApi() {
  const { user } = useAuth();
  const code = profileOf(user).cdsCode ?? 'CDS-KPHB';
  return useMemo(() => storeService(code), [code]);
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local YYYY-MM-DD for an ISO timestamp. */
export const localDay = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
