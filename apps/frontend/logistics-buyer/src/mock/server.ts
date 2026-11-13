// Tiny in-browser router that stands in for the real backend services.
// Feature modules register handlers with `route(method, service, pattern, handler)`; see src/mock/routes/*.
import { HttpError } from '../api/httpError';
import { getControls, shouldFail } from './controls';

export interface MockRequest {
  method: string;
  service: string; // e.g. "logistics-buyer-svc", "logistics-auth-svc", "files", "ws"
  path: string; // path after /api/v1 (or /api), e.g. "/orders/search"
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
  responseType?: 'json' | 'blob';
}

/** Throw from a handler to produce an HTTP error with the backend's error body shape. */
export class MockError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body ?? { success: false, message, error: { message } };
  }
}

/** Return from a handler to send a raw (non-enveloped) body, e.g. a Blob or a custom envelope. */
export class RawResponse {
  constructor(public body: any) {}
}

type Handler = (req: MockRequest) => any | Promise<any>;
interface Route { method: string; service: string; regex: RegExp; keys: string[]; handler: Handler; pattern: string }
const routes: Route[] = [];

function compile(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const src = pattern
    .replace(/\/$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === '*' ? '.*' : '\\' + m))
    .replace(/\\?:([a-zA-Z_]+)/g, (_m, k) => {
      keys.push(k);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${src}/?$`), keys };
}

export function route(method: string, service: string, pattern: string, handler: Handler) {
  const { regex, keys } = compile(pattern);
  routes.push({ method: method.toUpperCase(), service, regex, keys, handler, pattern });
}

/** Paths that never require a token (auth + public lookups). The CDS API (/cds/*) checks its own CDS session. */
const PUBLIC = [/^\/cds\//, /^\/auth\//, /^\/otp\//, /^\/buyer\/verify\//, /^\/buyer$/, /^\/users\/refresh_token/];

let tokenValidator: (token: string) => boolean = () => true;
/** Core routes register this so expired/revoked access tokens get a 401 (exercises the refresh flow). */
export function setTokenValidator(fn: (token: string) => boolean) {
  tokenValidator = fn;
}

function parse(url: string) {
  // mock://<service>/api/v1/<path>?query
  const m = url.match(/^mock:\/\/([^/]+)(\/api(?:\/v\d+)?)?(\/[^?]*)?(?:\?(.*))?$/);
  if (!m) throw new HttpError(0, { message: `Unknown URL ${url}` }, `Unknown URL ${url}`);
  const query: Record<string, string> = {};
  (m[4] || '').split('&').filter(Boolean).forEach((kv) => {
    const [k, v = ''] = kv.split('=');
    query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
  });
  return { service: m[1], path: m[3] || '/', query };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function handleMockRequest(method: string, url: string, body: unknown, headers: Record<string, string>, responseType?: 'json' | 'blob') {
  const { service, path, query } = parse(url);
  const controls = getControls();
  await sleep(controls.latencyMs * (0.6 + Math.random() * 0.8));

  if (shouldFail(path)) {
    const message = controls.failMessage || 'Internal server error';
    throw new HttpError(controls.failStatus, { success: false, message, error: { message } }, message);
  }

  const isPublic = PUBLIC.some((r) => r.test(path));
  if (!isPublic && service !== 'files') {
    const token = (headers.Authorization || '').replace(/^Bearer /, '');
    if (!token || !tokenValidator(token)) {
      throw new HttpError(401, { success: false, message: 'Unauthorized', error: { message: 'Unauthorized' } }, 'Unauthorized');
    }
  }

  const r = routes.find((x) => x.method === method && x.service === service && x.regex.test(path));
  if (!r) {
    const message = `No mock route for ${method} ${service}${path}`;
    console.error(message);
    throw new HttpError(404, { success: false, message, error: { message } }, message);
  }
  const match = path.match(r.regex)!;
  const params: Record<string, string> = {};
  r.keys.forEach((k, i) => (params[k] = decodeURIComponent(match[i + 1])));
  const reqBody = body instanceof FormData ? formDataToObject(body) : body instanceof Blob || body === undefined || body === null ? body : JSON.parse(JSON.stringify(body));
  const req: MockRequest = { method, service, path, params, query, body: reqBody, headers, responseType };

  try {
    const result = await r.handler(req);
    if (result instanceof RawResponse) return result.body;
    if (result instanceof Blob) return result;
    return { success: true, data: result };
  } catch (e) {
    if (e instanceof MockError) throw new HttpError(e.status, e.body, e.message);
    console.error('Mock handler crashed', e);
    throw new HttpError(500, { success: false, message: 'Internal server error', error: { message: 'Internal server error' } }, 'Internal server error');
  }
}

function formDataToObject(fd: FormData): Record<string, any> {
  const o: Record<string, any> = {};
  fd.forEach((v, k) => {
    const val = v instanceof File ? { name: v.name, size: v.size, type: v.type, file: v } : v;
    if (k in o) o[k] = ([] as any[]).concat(o[k], val);
    else o[k] = val;
  });
  return o;
}

/** Debug helper: list registered routes (shown in the mock panel). */
export function listRoutes() {
  return routes.map((r) => `${r.method} ${r.service}${r.pattern}`);
}
