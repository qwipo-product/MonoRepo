// In-memory database for the mock backend, persisted to localStorage so created/edited records survive reloads.
// Use `db()` to read/write collections and call `persist()` after mutations. `resetDb()` reseeds synthetic data.
import { buildSeed, type MockDatabase } from './seed';

const KEY = 'lbnp_mock_db_v1';
let state: MockDatabase | null = null;
let timer: number | undefined;

export function db(): MockDatabase {
  if (!state) {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? (JSON.parse(raw) as MockDatabase) : buildSeed();
    } catch {
      state = buildSeed();
    }
    if (!state.__version || state.__version !== buildSeed.VERSION) state = buildSeed();
    persist();
  }
  return state;
}

/** Saves soon (batched). A save still pending when the page closes or reloads is written before it goes. */
export function persist() {
  window.clearTimeout(timer);
  pending = true;
  timer = window.setTimeout(persistNow, 50);
}

/** Saves now — use before a reload (for example a demo reset). */
export function persistNow() {
  window.clearTimeout(timer);
  pending = false;
  if (!state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Mock DB could not be persisted (storage full?)', e);
  }
}

let pending = false;
if (typeof window !== 'undefined') {
  const flush = () => { if (pending) persistNow(); };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  // Another tab saved (for example a demo reset): drop this tab's copy so the next read loads the saved data and
  // this tab can never write its older copy back over it.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    window.clearTimeout(timer);
    pending = false;
    state = null;
  });
}

export function resetDb() {
  state = buildSeed();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

let seq = Date.now() % 100000;
export function uuid(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function nextSeq(): number {
  return ++seq;
}
export const nowIso = () => new Date().toISOString();

/** Standard page slice helper (1-based page numbers, like the real API). */
export function paginate<T>(items: T[], pageNumber = 1, pageSize = 10) {
  const p = Math.max(1, Number(pageNumber) || 1);
  const s = Math.max(1, Number(pageSize) || 10);
  return { rows: items.slice((p - 1) * s, p * s), totalCount: items.length, pageNumber: p, pageSize: s, totalPages: Math.max(1, Math.ceil(items.length / s)) };
}
