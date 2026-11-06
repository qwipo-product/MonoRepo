// Runtime switches for the mock backend, editable from the floating "Mock controls" panel.
// They let you exercise loading states and every error branch without a real server.

export type FailMode = 'none' | 'next' | 'all';

export interface MockControls {
  latencyMs: number;
  failMode: FailMode;
  failStatus: number;
  failMessage: string;
  /** Only fail requests whose path contains this text (empty = any request). */
  failPathContains: string;
  /** Fixed OTP accepted by the mock auth service. */
  otp: string;
}

const KEY = 'lbnp_mock_controls';
const DEFAULTS: MockControls = {
  latencyMs: 400,
  failMode: 'none',
  failStatus: 500,
  failMessage: 'Internal server error',
  failPathContains: '',
  otp: '123456',
};

let state: MockControls = load();
const listeners = new Set<(c: MockControls) => void>();

function load(): MockControls {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getControls(): MockControls {
  return state;
}

export function setControls(patch: Partial<MockControls>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* ignore */ }
  listeners.forEach((l) => l(state));
}

export function subscribeControls(fn: (c: MockControls) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Decides whether the current request should be failed artificially. Consumes a one-shot "next" failure. */
export function shouldFail(path: string): boolean {
  if (state.failMode === 'none') return false;
  if (state.failPathContains && !path.includes(state.failPathContains)) return false;
  if (state.failMode === 'next') setControls({ failMode: 'none' });
  return true;
}
