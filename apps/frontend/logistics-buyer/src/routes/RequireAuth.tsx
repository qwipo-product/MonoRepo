import { Navigate, Outlet, useLocation } from 'react-router';
import { authService } from '../api/services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { homeFor, profileOf, type ProfileKey } from '../profiles';

/**
 * Port of AuthGuard (spec 00 §4.2). Not logged in → /auth/login?returnUrl=…; missing `canView` on
 * `requiredPage` → the user's home (/orders for Logistics Tech). (Original bug: without "orders" view this loops
 * forever; the replica renders a blank page instead of looping.)
 */
export default function RequireAuth({ requiredPage }: { requiredPage?: string }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!authService.isAuthenticated()) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }
  if (requiredPage && !authService.hasPagePermission(requiredPage)) {
    const home = homeFor(user);
    if (location.pathname === home) return null;
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}

/** Keeps each demo user inside their own pages: anyone else is sent to their own home. */
export function RequireProfile({ profile }: { profile: ProfileKey }) {
  const { user } = useAuth();
  if (profileOf(user).key !== profile) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

/** `/` → the signed-in user's home. Signed out it goes to /orders, which sends you to Login as before. */
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={authService.isAuthenticated() ? homeFor(user) : '/orders'} replace />;
}
