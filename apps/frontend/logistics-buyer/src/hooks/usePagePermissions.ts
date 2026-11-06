// React port of BasePageComponent (spec 00 §14.1): permission flags + current user for a backend page id.
import { useMemo } from 'react';
import { authService, mapPageId } from '../api/services/auth.service';
import { useAuth } from './useAuth';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function usePagePermissions(rawPageId: string) {
  const { user } = useAuth();
  return useMemo(() => {
    const pageId = mapPageId(rawPageId);
    const can = (a: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import') => (rawPageId ? authService.hasPermission(pageId, a) : false);
    return {
      pageId,
      hasView: can('view'),
      hasCreate: can('create'),
      hasEdit: can('edit'),
      hasDelete: can('delete'),
      hasExport: can('export'),
      hasImport: can('import'),
      /** The auth user's id IS the buyerId used in every buyer-service call. */
      buyerId: user?.id ?? '',
      userId: user?.id ?? '',
      name: user?.name ?? '',
      buyerInfo: user,
    };
  }, [rawPageId, user]);
}
