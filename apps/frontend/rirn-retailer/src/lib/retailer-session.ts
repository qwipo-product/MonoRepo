/**
 * The signed-in retailer, and the IDs they've claimed at each company.
 *
 * Note what is NOT here: there's no quota, no unlock allowance, no metering of
 * any kind. On the company console every one of those exists because a company
 * browsing the retailer base is drawing down Qwipo's asset. Here the retailer
 * is declaring their own IDs about their own shop — there is nothing to
 * harvest, so there is nothing to ration.
 *
 * The risk on this side is the opposite one, and it lives in `./dms.ts`:
 * proving that the person typing `RET-1234` is actually the shop that ID
 * belongs to.
 */

import { useSyncExternalStore } from 'react';

export interface RetailerIdentity {
  nrid: string;
  businessName: string;
  ownerName: string;
  gstin: string;
  locality: string;
  city: string;
  mobile: string;
  verification: 'business' | 'multi';
}

/** A claimed company ID, and how far along it is. */
export type ConnectionStatus = 'verified' | 'pending';

export interface Connection {
  companyId: string;
  retailerId: string;
  status: ConnectionStatus;
  /** How it was proved — shown on the card so the retailer knows what happened. */
  proof: 'gstin' | 'approval';
}

interface State {
  retailer: RetailerIdentity | null;
  connections: Map<string, Connection>;
}

const state: State = { retailer: null, connections: new Map() };

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let snapshot = compute();

function compute() {
  return {
    retailer: state.retailer,
    connections: [...state.connections.values()],
    connectedCount: state.connections.size,
  };
}

function emit() {
  snapshot = compute();
  listeners.forEach((l) => l());
}

export function useRetailerSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => snapshot,
  );
}

export const connectionFor = (companyId: string) => state.connections.get(companyId);

/** Reverse index, so a claim can't reuse an ID already claimed elsewhere. */
export function claimedIds(): Map<string, string> {
  const out = new Map<string, string>();
  state.connections.forEach((c) => out.set(c.retailerId, c.companyId));
  return out;
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

/**
 * The demo retailer. In the real product this comes from the buyer app's
 * session — the WebView is opened already signed in.
 */
export const DEMO_RETAILER: RetailerIdentity = {
  nrid: 'NRID-10001',
  businessName: 'Sri Balaji Kirana Stores',
  ownerName: 'M. Ramesh',
  gstin: '36AABS1042Q1ZK',
  locality: 'Kondapur',
  city: 'Hyderabad',
  mobile: '9876543210',
  verification: 'multi',
};

export function login(retailer: RetailerIdentity) {
  state.retailer = retailer;
  // Two companies are already connected, so the "already given" card state is
  // visible the moment the retailer lands rather than needing a setup step.
  state.connections = new Map([
    ['itc', { companyId: 'itc', retailerId: 'RET-1234', status: 'verified', proof: 'gstin' }],
    ['britannia', { companyId: 'britannia', retailerId: 'RET-8877', status: 'pending', proof: 'approval' }],
  ]);
  emit();
}

export function logout() {
  state.retailer = null;
  state.connections.clear();
  emit();
}

export function saveConnection(c: Connection) {
  state.connections.set(c.companyId, c);
  emit();
}
