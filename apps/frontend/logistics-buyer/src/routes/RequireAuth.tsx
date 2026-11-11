import { Navigate, Outlet, useLocation } from 'react-router';
import { authService } from '../api/services/auth.service';
import { useAuth } from '../hooks/useAuth';

/**
 * Port of AuthGuard (spec 00 §4.2). Not logged in → /auth/login?returnUrl=…; missing `canView` on
 * `requiredPage` → /orders. (Original bug: without "orders" view this loops forever; the replica renders
 * a blank page instead of looping.)
 */
export default function RequireAuth({ requiredPage }: { requiredPage?: string }) {
  useAuth();
  const location = useLocation();
  if (!authService.isAuthenticated()) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }
  if (requiredPage && !authService.hasPagePermission(requiredPage)) {
    if (location.pathname === '/orders') return null;
    return <Navigate to="/orders" replace />;
  }
  return <Outlet />;
}
