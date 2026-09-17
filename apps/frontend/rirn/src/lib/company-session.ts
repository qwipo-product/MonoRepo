/**
 * The signed-in company's session: who they are, what they've mapped, and
 * how much browsing they have left.
 *
 * THE QUOTA IS THE PRODUCT, not a rate limit bolted on afterwards.
 *
 * The network's asset is the verified retailer base. A company that browses
 * it and maps nothing is extracting value and returning none, so unlocking a
 * retailer costs from a daily allowance and committing a mapping earns some
 * back. Browse-only runs dry; contribute and you can keep going. That is the
 * whole anti-harvesting design (PRD §15) expressed as an economy rather than
 * a wall.
 *
 * The two numbers below are the economics. They're the first thing to tune
 * after a demo.
 */

import { useSyncExternalStore } from 'react';

/** Unlocks granted at the start of each day. */
export const DAILY_UNLOCK_ALLOWANCE = 20;
/** Unlocks returned for each mapping the company's DMS confirms. */
export const UNLOCKS_EARNED_PER_MAPPING = 5;

export interface CompanyUser {
  id: string;
  name: string;
  company: string;
  companyCode: string;
  initials: string;
}

export interface Mapping {
  nrid: string;
  retailerId: string;
  mappedAt: string;
}

interface SessionState {
  user: CompanyUser | null;
  /** NRIDs this company has spent an unlock on. Unlocks are permanent. */
  unlocked: Set<string>;
  /** NRID → the company's own DMS retailer ID. */
  mappings: Map<string, string>;
  unlocksSpent: number;
  unlocksEarned: number;
}

const state: SessionState = {
  user: null,
  unlocked: new Set(),
  mappings: new Map(),
  unlocksSpent: 0,
  unlocksEarned: 0,
};

/* ------------------------------------------------------------------ *
 * Store plumbing
 * ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
// useSyncExternalStore compares snapshots by identity, so hand out a new
// object only when something actually changed.
let snapshot = computeSnapshot();

function emit() {
  snapshot = computeSnapshot();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function computeSnapshot() {
  const allowance = DAILY_UNLOCK_ALLOWANCE + state.unlocksEarned;
  return {
    user: state.user,
    unlockedCount: state.unlocked.size,
    mappedCount: state.mappings.size,
    unlocksSpent: state.unlocksSpent,
    unlocksEarned: state.unlocksEarned,
    allowance,
    remaining: Math.max(0, allowance - state.unlocksSpent),
  };
}

export type SessionSnapshot = ReturnType<typeof computeSnapshot>;

export function useCompanySession(): SessionSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}

/* ------------------------------------------------------------------ *
 * Reads — not hooks, so map markers and sorters can call them freely
 * ------------------------------------------------------------------ */

export const isUnlocked = (nrid: string) => state.unlocked.has(nrid);
export const mappingFor = (nrid: string) => state.mappings.get(nrid);
export const getUser = () => state.user;

/** NRID → retailerId, reversed to retailerId → NRID for the DMS re-use check. */
export function mappedIdsByRetailerId(): Map<string, string> {
  const out = new Map<string, string>();
  state.mappings.forEach((retailerId, nrid) => out.set(retailerId, nrid));
  return out;
}

export function allMappings(): Mapping[] {
  return [...state.mappings.entries()]
    .map(([nrid, retailerId]) => ({ nrid, retailerId, mappedAt: 'today' }))
    .reverse();
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export function login(user: CompanyUser) {
  state.user = user;
  emit();
}

export function logout() {
  state.user = null;
  state.unlocked.clear();
  state.mappings.clear();
  state.unlocksSpent = 0;
  state.unlocksEarned = 0;
  emit();
}

/**
 * Spend one unlock on a retailer. Returns false when the allowance is gone —
 * the caller shows the "map some retailers to keep going" prompt rather than
 * silently failing.
 */
export function spendUnlock(nrid: string): boolean {
  if (state.unlocked.has(nrid)) return true; // already paid for
  if (snapshot.remaining <= 0) return false;
  state.unlocked.add(nrid);
  state.unlocksSpent += 1;
  emit();
  return true;
}

/** Commit a DMS-confirmed mapping and hand back some allowance. */
export function commitMapping(nrid: string, retailerId: string) {
  const isNew = !state.mappings.has(nrid);
  state.mappings.set(nrid, retailerId.trim().toUpperCase());
  if (isNew) state.unlocksEarned += UNLOCKS_EARNED_PER_MAPPING;
  emit();
}
