// Port of the original AuthService + AuthStore + permission model (docs/specs/00-shell-auth-shared.md §5, §20).
import { getConfig } from '../config';
import { http, setRefreshHandler, setTokenProvider } from '../http';
import type { ProfileKey } from '../../profiles';

export type RawPermission =
  | string
  | { pageId: string; canCreate?: boolean; canView?: boolean; canEdit?: boolean; canDelete?: boolean; canImport?: boolean; canExport?: boolean };

export interface PermissionDetail {
  pageId: string;
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: '';
  permissions: RawPermission[];
  /** Demo profile (src/profiles.ts). Missing on sessions saved before profiles existed → Logistics Tech. */
  profile?: ProfileKey;
  businessName?: string;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export';

/** Backend page ids → app page ids (anything else passes through, e.g. buyer_issues). */
export const PAGE_ID_MAP: Record<string, string> = {
  buyer_dashboard: 'dashboard',
  buyer_orders: 'orders',
  buyer_trips: 'trips',
  buyer_delivery_routes: 'delivery-routes',
  buyer_settings: 'settings',
  buyer_profile: 'users',
  buyer_payments: 'payments',
  buyer_reports: 'reports',
  buyer_notifications: 'notifications',
};
export const mapPageId = (id: string) => PAGE_ID_MAP[id] ?? id;

const K = { user: 'currentUser', token: 'token', refresh: 'refreshToken', perms: 'permissionDetails', customerOrderData: 'customerOrderData' };

type Listener = () => void;

class AuthService {
  private user: StoredUser | null = null;
  private token: string | null = null;
  private refresh: string | null = null;
  private permissionDetails: PermissionDetail[] = [];
  private pages: string[] | null = null;
  private refreshPromise: Promise<string> | null = null;
  private listeners = new Set<Listener>();
  /** Set by the app so non-React code (logout) can navigate. */
  navigate: (path: string) => void = (path) => {
    if (window.location.pathname.startsWith('/builds/')) window.location.hash = path;
    else window.location.assign(path);
  };

  constructor() {
    this.loadUserFromStorage();
    setTokenProvider(() => this.token);
    setRefreshHandler(() => this.refreshToken());
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  loadUserFromStorage() {
    const u = localStorage.getItem(K.user);
    const t = localStorage.getItem(K.token);
    if (u && t) {
      this.user = JSON.parse(u);
      this.token = t;
      const r = localStorage.getItem(K.refresh);
      if (r) this.refresh = r;
      const p = localStorage.getItem(K.perms);
      if (p) this.permissionDetails = JSON.parse(p);
      this.setPermission();
    }
  }

  isAuthenticated(): boolean {
    if ((!this.user || !this.token) && localStorage.getItem(K.user) && localStorage.getItem(K.token)) this.loadUserFromStorage();
    return !!this.user && !!this.token;
  }

  getCurrentUser() {
    return this.user;
  }
  getToken() {
    return this.token;
  }

  handleAuthResponse(res: { user: StoredUser; token: string; refreshToken: string; permissions: RawPermission[] }) {
    localStorage.setItem(K.user, JSON.stringify(res.user));
    localStorage.setItem(K.token, res.token);
    localStorage.setItem(K.refresh, res.refreshToken);
    const normalised: PermissionDetail[] = (res.permissions || []).map((p) => {
      if (typeof p === 'string') {
        return { pageId: mapPageId(p), canView: true, canCreate: false, canEdit: false, canDelete: false, canImport: false, canExport: false };
      }
      return {
        pageId: mapPageId(p.pageId),
        canCreate: !!p.canCreate,
        canView: !!p.canView,
        canEdit: !!p.canEdit,
        canDelete: !!p.canDelete,
        canImport: !!p.canImport,
        canExport: !!p.canExport,
      };
    });
    localStorage.setItem(K.perms, JSON.stringify(normalised));
    this.user = res.user;
    this.token = res.token;
    this.refresh = res.refreshToken;
    this.permissionDetails = normalised;
    this.setPermission();
    this.emit();
  }

  private setPermission() {
    this.pages = this.permissionDetails.filter((p) => p.canView).map((p) => p.pageId);
  }

  hasPagePermission(pageId: string): boolean {
    return this.pages?.includes(pageId) ?? false;
  }

  hasPermission(pageId: string, action: PermissionAction): boolean {
    const item = this.permissionDetails.find((p) => p.pageId === pageId);
    if (!item) return false;
    const key = ('can' + action.charAt(0).toUpperCase() + action.slice(1)) as keyof PermissionDetail;
    return !!item[key];
  }

  /** Immediate, no API call, no confirmation. Does not clear saved filters or route-plan keys (faithful). */
  logout() {
    [K.user, K.token, K.refresh, K.perms].forEach((k) => localStorage.removeItem(k));
    this.user = null;
    this.token = null;
    this.refresh = null;
    this.pages = null;
    this.emit();
    this.navigate('/auth/login');
  }

  async sendOtp(phoneNumber: string, isRegistration: boolean) {
    const res = await http.post<any>(`${getConfig().authUrl}/otp/send`, { phoneNumber, isRegistration }, { skipAuth: true });
    if (res.success && res.data?.success) return res;
    throw new Error(res.data?.message || 'OTP send failed');
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const res = await http.post<any>(`${getConfig().authUrl}/otp/verify`, { phoneNumber, otp }, { skipAuth: true });
    if (res.success && res.data?.success && res.data?.verified) {
      const u = res.data.user;
      this.handleAuthResponse({
        user: { id: u.id, name: u.name, email: u.email, mobile: u.mobileNumber, role: '', permissions: u.permissions, profile: u.profile, businessName: u.businessName },
        token: u.auth.token,
        refreshToken: u.auth.refreshToken,
        permissions: u.permissions,
      });
      return res;
    }
    throw new Error(res.data?.message || 'OTP verification failed');
  }

  /** POST {authUrl}/users/refresh_token. Concurrent callers share one in-flight refresh. */
  refreshToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        if (!this.refresh) {
          this.logout();
          throw new Error('No refresh token available');
        }
        const res = await http.post<any>(`${getConfig().authUrl}/users/refresh_token`, { refreshToken: this.refresh }, { noRetry: true });
        if (res.success) {
          localStorage.setItem(K.token, res.data.token);
          localStorage.setItem(K.refresh, res.data.refreshToken);
          this.token = res.data.token;
          this.refresh = res.data.refreshToken;
          return res.data.token as string;
        }
        this.logout();
        throw new Error('Token refresh failed');
      } catch (e) {
        if (this.token) this.logout();
        throw e;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  setCustomerOrderData(x: unknown) {
    localStorage.setItem(K.customerOrderData, JSON.stringify(x));
  }
  getCustomerOrderData<T = any>(): T | null {
    const v = localStorage.getItem(K.customerOrderData);
    return v ? JSON.parse(v) : null;
  }
  clearCustomerOrderData() {
    localStorage.removeItem(K.customerOrderData);
  }
}

export const authService = new AuthService();

/** Memory-only store for the mobile number between Login and OTP (lost on reload, like the original). */
export const authStore = {
  mobileNumber: '',
  setMobileNumber(m: string) {
    this.mobileNumber = m;
  },
  getMobileNumber() {
    return this.mobileNumber;
  },
  formatMobileNumber(m: string) {
    return m ? `+91 ${m}` : '';
  },
};
