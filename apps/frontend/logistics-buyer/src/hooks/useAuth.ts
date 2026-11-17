import { useSyncExternalStore } from 'react';
import { authService } from '../api/services/auth.service';

/** Re-renders when the auth state changes (login, logout, token refresh). */
export function useAuth() {
  const user = useSyncExternalStore((cb) => authService.subscribe(cb), () => authService.getCurrentUser());
  return { user, isAuthenticated: authService.isAuthenticated() };
}
