import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

export type AuthUser = {
  name: string;
  email: string;
  /** Second line under the name in the profile menu. */
  subtitle: string;
  avatarInitials: string;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

const STORAGE_KEY = 'qwipo.marketing.auth';

/* Tiny external store over localStorage so React reads the session via
 * useSyncExternalStore. The parsed snapshot is cached per raw string so
 * getSnapshot stays stable. */
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;
let cachePrimed = false;

function getSnapshot(): AuthUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!cachePrimed || raw !== cachedRaw) {
    cachedRaw = raw;
    cachePrimed = true;
    if (raw) {
      try {
        cachedUser = JSON.parse(raw) as AuthUser;
      } catch {
        cachedUser = null;
      }
    } else {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

const AuthContext = createContext<AuthState | null>(null);

function deriveUser(email: string): AuthUser {
  const localPart = email.split('@')[0] ?? 'user';
  const name = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    name: name || 'Admin User',
    email,
    subtitle: 'Marketing Admin',
    avatarInitials: initials || 'QA',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const login = useCallback((email: string, password: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false as const, error: 'Enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false as const, error: 'Password must be at least 6 characters.' };
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deriveUser(trimmed)));
    emit();
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    emit();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading: false, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
