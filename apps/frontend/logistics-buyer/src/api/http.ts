// HttpClient replacement. Every request goes to the in-browser mock server (src/mock), which mimics the
// real backend's routes, response envelopes ({ success, data, message }) and error bodies.
import { handleMockRequest } from '../mock';

import { HttpError } from './httpError';
export { HttpError };

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  /** Skip attaching the bearer token (mirrors the original's SKIP_AUTH HttpContextToken). */
  skipAuth?: boolean;
  responseType?: 'json' | 'blob';
  /** Internal: do not run the 401 → refresh → retry flow (used by the refresh call itself). */
  noRetry?: boolean;
}

type Listener = (err: HttpError, url: string) => void;
const errorListeners = new Set<Listener>();
/** Lets the auth layer react to 401s (auto-logout), like the original interceptor. */
export function onHttpError(fn: Listener) {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

let tokenProvider: () => string | null = () => null;
export function setTokenProvider(fn: () => string | null) {
  tokenProvider = fn;
}

let refreshHandler: (() => Promise<string>) | null = null;
/** Registered by the auth layer: refreshes the access token on a 401 (interceptor behaviour, spec 00 §6). */
export function setRefreshHandler(fn: () => Promise<string>) {
  refreshHandler = fn;
}

function buildUrl(url: string, params?: RequestOptions['params']): string {
  if (!params) return url;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  if (!qs) return url;
  return url + (url.includes('?') ? '&' : '?') + qs;
}

async function request<T>(method: string, url: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const fullUrl = buildUrl(url, opts.params);
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (!opts.skipAuth) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
    else console.warn('No auth token available for request:', fullUrl);
  }
  try {
    return (await handleMockRequest(method, fullUrl, body, headers, opts.responseType)) as T;
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(0, { message: String(e) }, String(e));
    if (err.status === 401 && !opts.skipAuth && !opts.noRetry && refreshHandler) {
      // First 401 triggers a token refresh; concurrent 401s share it. Then the original request is retried once.
      let newToken: string;
      try {
        newToken = await refreshHandler();
        console.log('Token refreshed successfully');
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        throw new HttpError(401, 'Session expired. Please log in again.', 'Unauthorized');
      }
      return (await handleMockRequest(method, fullUrl, body, { ...headers, Authorization: `Bearer ${newToken}` }, opts.responseType)) as T;
    }
    if (!opts.skipAuth) console.error(`HTTP Error: ${err.status}`, err.message);
    errorListeners.forEach((l) => l(err, fullUrl));
    throw err;
  }
}

export const http = {
  get: <T = any>(url: string, opts?: RequestOptions) => request<T>('GET', url, undefined, opts),
  post: <T = any>(url: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', url, body, opts),
  put: <T = any>(url: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', url, body, opts),
  patch: <T = any>(url: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', url, body, opts),
  delete: <T = any>(url: string, opts?: RequestOptions & { body?: unknown }) => request<T>('DELETE', url, opts?.body, opts),
};

/** Triggers a browser download for a Blob (used by every "Download …" action). */
export function saveBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}
