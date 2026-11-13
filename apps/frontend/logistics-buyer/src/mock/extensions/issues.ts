// Issues (ONDC IGM) seed extension — spec 06 §8/§9.
// Seeds issues tied to real seeded trips (ref ORDER = trip.orderId, logisticOrderId = trip.logisticsOrderId,
// FULFILLMENT = a delivery stop of that trip) and providers, covering every latest-action state so each
// next-action button (Provide Info, Accept/Reject, Escalate, Close, Request Info, Propose Resolution, Resolve)
// and every display edge case in spec 06 §11 can be reached.
// Stored under db.ext.issues (camelCase "details" shape; the list route maps it to snake_case).
// NOTE: no import of ../db here (seed.ts → extensions → db would be circular); routes import the helpers below.
import type { MockDatabase, Rng } from '../seed';
import type { DbTrip } from '../types';
import { IssueCategories } from '../../types/enums';

// ---------------------------------------------------------------- record types (shared with routes/issues.ts)

export interface IssueImageRec { url: string }
export interface IssueActionRec {
  id: string;
  descriptorCode: string;
  descriptorName: string;
  descriptorShortDesc: string;
  descriptorLongDesc: string;
  /** `{url}` objects; a few seeded rows use plain strings on purpose (spec 06 §5.4.4 quirk). */
  descriptorImages: (IssueImageRec | string)[];
  createdAt: string;
  updatedAt: string;
  refId: string | null;
  refType: string | null;
  /** Identifier string, copied into INFO_PROVIDED's name/refId by the UI. */
  action: string;
  actorId: string | null;
  name?: string | null;
  tags?: any[];
}
export interface IssueActorRec { actorId: string; actorType: 'CONSUMER' | 'INTERFACING_NP' | 'COUNTERPARTY_NP'; personName: string; orgName: string; createdAt: string }
export interface IssueRefRec { refType: 'ORDER' | 'FULFILLMENT'; refId: string; createdAt: string }
export interface IssueResolutionRec {
  resolutionId: string;
  descriptorCode: string;
  descriptorShortDesc: string;
  descriptorLongDesc: string;
  refundAmount: string | null;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | null;
  tags: any[];
  createdAt: string;
  updatedAt: string;
}
export interface IssueRec {
  id: string;
  issueId: string;
  issueTitle: string;
  issueDescription: string;
  descriptorShortDesc: string;
  descriptorLongDesc: string;
  category: string;
  subcategory: string;
  descriptorCode: string;
  direction: string;
  status: string;
  level: string;
  /** Trip uuid (the real API spells it `logisticOrderId` on the details endpoint). */
  logisticOrderId: string;
  /** Trip number (Q-…). */
  orderId: string;
  transactionId: string;
  providerId: string;
  providerName: string | null;
  buyerId: string;
  buyerName: string;
  contextDomain: string;
  fulfillmentId: string | null;
  fulfillmentLocation: { deliveryLocation: { address: { name: string } } } | null;
  createdAt: string;
  updatedAt: string;
  refs: IssueRefRec[];
  actors: IssueActorRec[];
  actions: IssueActionRec[];
  resolutions: IssueResolutionRec[];
}

/** A scripted counterparty reply that the routes apply lazily once `dueAt` has passed. */
export interface IssuePendingReply { issueDbId: string; dueAt: number; kind: string }

// ---------------------------------------------------------------- shared helpers

export const ISSUE_AGENTS = ['Kiran Desai', 'Anita Rao', 'Farhan Sheikh', 'Divya Menon'];
export const GRIEVANCE_OFFICER = 'Lakshmi Narayan';

const pad = (n: number) => String(n).padStart(2, '0');
let idCounter = 0;
const rand = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

/** ONDC-style issue id, e.g. ISS-20261103-7F3K9Q. */
export function makeIssueCode(iso: string, suffix?: string): string {
  const d = new Date(iso);
  return `ISS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${suffix || rand(6)}`;
}
export const shortId = (prefix: string, rng?: Rng) => `${prefix}-${rng ? rng.uuid().slice(0, 8) : `${Date.now().toString(36)}${(++idCounter).toString(36)}${rand(3).toLowerCase()}`}`;

/** Overall issue.status implied by the latest action (only OPEN / PROCESSING / RESOLVED / CLOSED are filterable). */
export function statusForAction(code: string): string {
  if (code === 'OPEN') return 'OPEN';
  if (code === 'RESOLVED') return 'RESOLVED';
  if (code === 'CLOSED') return 'CLOSED';
  return 'PROCESSING';
}

export function agentForProvider(db: MockDatabase, providerId: string): string {
  const idx = db.providers.findIndex((p) => p.id === providerId);
  return ISSUE_AGENTS[(idx >= 0 ? idx : 0) % ISSUE_AGENTS.length];
}

/** Placeholder evidence images (real, loadable). */
export const evidenceImage = (text: string, colour = 'e2e8f0/1f2937') => `https://placehold.co/800x600/${colour}/png?text=${encodeURIComponent(text).replace(/%20/g, '+')}`;
/** Document URLs (served by the files service in production; dead links in the replica). */
export const evidenceDoc = (name: string) => `https://files.example.test/logistics_buyer_info_provided/${name}`;

export function resolutionTags(code: string, amount: string | null) {
  return [{ descriptor: { code: 'RESOLUTION_DETAILS' }, list: [{ descriptor: { code: 'ITEM' } }, ...(code === 'REFUND' && amount != null ? [{ descriptor: { code: 'REFUND_AMOUNT' }, value: amount }] : [])] }];
}
export const CLOSURE_TAGS = [{ descriptor: { code: 'CLOSURE_DETAILS' }, list: [{ descriptor: { code: 'RATING' }, value: 'THUMBS_UP' }] }];

/** Adds a RESOLUTION_PROPOSED pair (PARENT row + option row with the same updatedAt). Returns the parent id. */
export function addProposal(issue: IssueRec, code: string, amount: string | null, msg: string, at: string, rng?: Rng): { parentId: string; childId: string } {
  const parentId = shortId('res-p', rng);
  const childId = shortId('res-o', rng);
  issue.resolutions.push(
    { resolutionId: parentId, descriptorCode: 'PARENT', descriptorShortDesc: msg, descriptorLongDesc: '', refundAmount: null, status: null, tags: [], createdAt: at, updatedAt: at },
    { resolutionId: childId, descriptorCode: code, descriptorShortDesc: msg, descriptorLongDesc: msg, refundAmount: code === 'REFUND' ? amount : null, status: 'PROPOSED', tags: resolutionTags(code, amount), createdAt: at, updatedAt: at },
  );
  return { parentId, childId };
}

/** Child option row of the newest proposal (for accept/reject in scripted flows). */
export function latestProposalChild(issue: IssueRec): IssueResolutionRec | undefined {
  const proposals = issue.actions.filter((a) => a.descriptorCode === 'RESOLUTION_PROPOSED' && a.refId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const p of proposals) {
    const parent = issue.resolutions.find((r) => r.resolutionId === p.refId && r.descriptorCode === 'PARENT');
    const child = parent && issue.resolutions.find((r) => r.updatedAt === parent.updatedAt && r.descriptorCode !== 'PARENT');
    if (child) return child;
  }
  return undefined;
}

// ---------------------------------------------------------------- scenario script

type Who = 'us' | 'cp' | 'cpOrg' | 'consumer' | 'gro';
interface Step {
  code: string;
  who: Who;
  short: string;
  long?: string;
  /** Minutes after the previous step. */
  gap: number;
  images?: (IssueImageRec | string)[];
  propose?: { code: string; amount?: string };
  /** For RESOLUTION_ACCEPTED / REJECTED: target the newest proposal's option row. */
  answerProposal?: boolean;
  tags?: any[];
}
interface Scenario {
  direction: string;
  level: string;
  category: string;
  subcategory: string;
  long: string;
  /** Minutes ago of the LAST step. */
  lastAgoMin: number;
  /** Which trip pool to use. */
  tripKind: 'today' | 'past' | 'cancelled';
  withFulfillment: boolean;
  withOrderRef?: boolean;
  withConsumer?: boolean;
  missingProviderName?: boolean;
  statusOverride?: string;
  steps: Step[];
}

const proposeMsg = (code: string) => `We are proposing the ${code} as a resolution for this issue`;

const SCENARIOS: Scenario[] = [
  // 1 — OUT, latest OPEN (no button; "New")
  {
    direction: 'OUT', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Delay in delivery', tripKind: 'today', withFulfillment: true, lastAgoMin: 25,
    long: 'Shipment was promised by 11 AM; the vehicle has still not reached the outlet.',
    steps: [{ code: 'OPEN', who: 'us', short: 'Delay in delivery', long: 'Shipment was promised by 11 AM; the vehicle has still not reached the outlet.', gap: 0 }],
  },
  // 2 — OUT, latest PROCESSING (no button; 2 actions → "New")
  {
    direction: 'OUT', level: 'ISSUE', category: 'ITEM', subcategory: 'Missing items', tripKind: 'today', withFulfillment: true, lastAgoMin: 70,
    long: '2 cases of Sunvita Refined Sunflower Oil 1 Ltr missing from the delivered consignment.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Missing items', long: '2 cases of Sunvita Refined Sunflower Oil 1 Ltr missing from the delivered consignment.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', long: 'Our hub team is checking the loading records for this trip.', gap: 18 },
    ],
  },
  // 3 — OUT, latest INFO_REQUESTED → Provide Info (+ callout)
  {
    direction: 'OUT', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Packaging', tripKind: 'today', withFulfillment: true, lastAgoMin: 160,
    long: 'Three cartons of Crispo Cream Biscuits arrived crushed and torn at the outlet.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Packaging', long: 'Three cartons of Crispo Cream Biscuits arrived crushed and torn at the outlet.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 22 },
      { code: 'INFO_REQUESTED', who: 'cp', short: 'Please share photos of the damaged cartons and the signed delivery challan', gap: 41 },
    ],
  },
  // 4 — OUT, single RESOLUTION_PROPOSED (REFUND 500) → Accept / Reject on the card (spec 06 §9.2 example)
  {
    direction: 'OUT', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Delay in delivery', tripKind: 'past', withFulfillment: true, lastAgoMin: 300,
    long: 'Delivery late by 5 hours',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Delay in delivery', long: 'Promised 2 PM, not delivered by 7 PM', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 8 },
      { code: 'INFO_REQUESTED', who: 'cp', short: 'Please share a photo of the delivery slip', gap: 40 },
      { code: 'INFO_PROVIDED', who: 'us', short: 'Supporting documents added to the issue', gap: 75, images: [{ url: evidenceImage('Delivery slip', 'fef3c7/92400e') }, { url: evidenceDoc('invoice-4512.pdf') }] },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('REFUND'), gap: 145, propose: { code: 'REFUND', amount: '500' } },
    ],
  },
  // 5 — OUT, two consecutive proposals → "Latest Actions - Multiple Resolution Proposals"; status outside the 4 filterable ones (empty list pill)
  {
    direction: 'OUT', level: 'DISPUTE', category: 'ITEM', subcategory: 'Quantity issue', tripKind: 'past', withFulfillment: true, lastAgoMin: 420, statusOverride: 'RESOLUTION_PROPOSED',
    long: 'Invoice shows 40 units of Kisan Toor Dal 1 Kg, only 32 units were delivered.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Quantity issue', long: 'Invoice shows 40 units of Kisan Toor Dal 1 Kg, only 32 units were delivered.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'Verifying the dispatch count with the warehouse', gap: 30 },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('REPLACEMENT'), gap: 95, propose: { code: 'REPLACEMENT' } },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('REFUND'), gap: 4, propose: { code: 'REFUND', amount: '1250.5' } },
    ],
  },
  // 6 — OUT, latest RESOLUTION_REJECTED → Escalate
  {
    direction: 'OUT', level: 'ISSUE', category: 'ITEM', subcategory: 'Item mismatch', tripKind: 'past', withFulfillment: true, lastAgoMin: 60 * 26,
    long: 'Ordered Sagar Iodised Salt 1 Kg; received 500 G packs instead.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Item mismatch', long: 'Ordered Sagar Iodised Salt 1 Kg; received 500 G packs instead.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 35 },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('NO_ACTION'), gap: 180, propose: { code: 'NO_ACTION' } },
      { code: 'RESOLUTION_REJECTED', who: 'us', short: 'We are rejecting the resolution: NO_ACTION', gap: 50, answerProposal: true },
    ],
  },
  // 7 — OUT, latest RESOLVED → Close
  {
    direction: 'OUT', level: 'ISSUE', category: 'ORDER', subcategory: 'Invoice missing', tripKind: 'past', withFulfillment: true, lastAgoMin: 60 * 49,
    long: 'Tax invoice was not handed over with the consignment.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Invoice missing', long: 'Tax invoice was not handed over with the consignment.', gap: 0 },
      { code: 'PROCESSING', who: 'cpOrg', short: 'Ticket assigned to the billing desk', gap: 20 },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('RECONCILED'), gap: 120, propose: { code: 'RECONCILED' } },
      { code: 'RESOLUTION_ACCEPTED', who: 'us', short: 'We are accepting the resolution: RECONCILED', gap: 30, answerProposal: true },
      { code: 'RESOLVED', who: 'cp', short: 'Invoice copy shared over email; issue resolved', gap: 45 },
    ],
  },
  // 8 — OUT, CLOSED (full path; attachment quirks: string image, getpdf "FILE", broken image)
  {
    direction: 'OUT', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Incorrectly marked as delivered', tripKind: 'past', withFulfillment: true, lastAgoMin: 60 * 24 * 4,
    long: 'Stop was marked delivered at 10:42 but the outlet never received the goods.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Incorrectly marked as delivered', long: 'Stop was marked delivered at 10:42 but the outlet never received the goods.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 15 },
      { code: 'INFO_REQUESTED', who: 'cp', short: 'Please share the outlet photo and the GRN register page', gap: 60 },
      {
        code: 'INFO_PROVIDED', who: 'us', short: 'Supporting documents added to the issue', gap: 90,
        images: [
          evidenceImage('Outlet shutter photo', 'dbeafe/1e3a8a'),
          { url: evidenceImage('GRN register', 'dcfce7/166534') },
          { url: 'https://files.example.test/docs/getpdf?id=88213' },
          { url: evidenceDoc('outlet-photo-broken.jpg') },
        ],
      },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('REPLACEMENT'), gap: 200, propose: { code: 'REPLACEMENT' } },
      { code: 'RESOLUTION_ACCEPTED', who: 'us', short: 'We are accepting the resolution: REPLACEMENT', gap: 25, answerProposal: true },
      { code: 'RESOLVED', who: 'cp', short: 'Replacement consignment delivered', gap: 60 * 20 },
      { code: 'CLOSED', who: 'us', short: 'Received the replacement, closing', gap: 90, tags: CLOSURE_TAGS },
    ],
  },
  // 9 — OUT, GRIEVANCE, latest ESCALATE (no button)
  {
    direction: 'OUT', level: 'GRIEVANCE', category: 'AGENT', subcategory: 'Agent behavioral issue', tripKind: 'past', withFulfillment: true, lastAgoMin: 60 * 24 * 3,
    long: 'Delivery agent was rude to the store owner and refused to unload inside the shop.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Agent behavioral issue', long: 'Delivery agent was rude to the store owner and refused to unload inside the shop.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 40 },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('NOT_RECONCILED'), gap: 240, propose: { code: 'NOT_RECONCILED' } },
      { code: 'RESOLUTION_REJECTED', who: 'us', short: 'We are rejecting the resolution: NOT_RECONCILED', gap: 35, answerProposal: true },
      { code: 'ESCALATE', who: 'us', short: 'Escalating to the grievance officer', gap: 20 },
    ],
  },
  // 10 — OUT (lower-case "out"), latest RESOLUTION_PROPOSED → header "Accept" + "Reject" via the note prompt (spec 06 §11)
  {
    direction: 'out', level: 'ISSUE', category: 'ITEM', subcategory: 'Expired item', tripKind: 'past', withFulfillment: true, lastAgoMin: 600,
    long: 'Two packs of Kisan Moong Dal delivered past their best-before date.',
    steps: [
      { code: 'OPEN', who: 'us', short: 'Expired item', long: 'Two packs of Kisan Moong Dal delivered past their best-before date.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 25 },
      { code: 'RESOLUTION_PROPOSED', who: 'cp', short: proposeMsg('RETURN'), gap: 90, propose: { code: 'RETURN' } },
    ],
  },
  // 11 — OUT, latest INFO_PROVIDED (no button, waiting); CONSUMER actor raised it
  {
    direction: 'OUT', level: 'ISSUE', category: 'ORDER', subcategory: 'Quality issue', tripKind: 'past', withFulfillment: true, withConsumer: true, lastAgoMin: 60 * 30,
    long: 'Retailer reports the Annapoorna Sona Masoori rice bags were damp and lumpy.',
    steps: [
      { code: 'OPEN', who: 'consumer', short: 'Quality issue', long: 'Retailer reports the Annapoorna Sona Masoori rice bags were damp and lumpy.', gap: 0 },
      { code: 'PROCESSING', who: 'cp', short: 'We are looking into it', gap: 30 },
      { code: 'INFO_REQUESTED', who: 'cp', short: 'Please share photos of the affected bags with batch numbers', gap: 55 },
      { code: 'INFO_PROVIDED', who: 'us', short: 'Supporting documents added to the issue', gap: 80, images: [{ url: evidenceImage('Rice bag batch label', 'ede9fe/5b21b6') }] },
    ],
  },
  // 12 — IN, latest PROCESSING (no prior INFO_PROVIDED) → Request Info
  {
    direction: 'IN', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Unable to reach location', tripKind: 'today', withFulfillment: true, lastAgoMin: 120,
    long: 'Delivery agent could not locate the outlet; the shared pin drops 600 m away from the shop.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Unable to reach location', long: 'Delivery agent could not locate the outlet; the shared pin drops 600 m away from the shop.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'We are looking into it', gap: 12 },
    ],
  },
  // 13 — IN, latest PROCESSING with INFO_PROVIDED right before → Propose Resolution
  {
    direction: 'IN', level: 'ISSUE', category: 'PAYMENT', subcategory: 'Delay in payment', tripKind: 'past', withFulfillment: false, lastAgoMin: 360,
    long: 'Trip charges for this logistics order are pending for more than 7 days.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Delay in payment', long: 'Trip charges for this logistics order are pending for more than 7 days.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'Checking with the accounts team', gap: 35 },
      { code: 'INFO_REQUESTED', who: 'us', short: 'Please share the trip invoice number', gap: 20 },
      { code: 'INFO_PROVIDED', who: 'cp', short: 'Trip invoice attached', gap: 65, images: [{ url: evidenceDoc('trip-invoice-2219.pdf') }] },
      { code: 'PROCESSING', who: 'us', short: 'Verifying the shared documents', gap: 30 },
    ],
  },
  // 14 — IN, DISPUTE, latest INFO_PROVIDED → Propose Resolution
  {
    direction: 'IN', level: 'DISPUTE', category: 'PAYMENT', subcategory: 'Underpaid', tripKind: 'past', withFulfillment: false, lastAgoMin: 480,
    long: 'Amount settled for the trip is ₹350 lower than the quoted delivery price.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Underpaid', long: 'Amount settled for the trip is ₹350 lower than the quoted delivery price.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'We are looking into it', gap: 45 },
      { code: 'INFO_REQUESTED', who: 'us', short: 'Please share the quote reference and settlement statement', gap: 25 },
      { code: 'INFO_PROVIDED', who: 'cp', short: 'Settlement statement attached', gap: 70, images: [{ url: evidenceDoc('settlement-statement.pdf') }, { url: evidenceImage('Quote screenshot', 'e0f2fe/075985') }] },
    ],
  },
  // 15 — IN, latest RESOLUTION_ACCEPTED → Resolve; only a FULFILLMENT ref ("Order - N/A"); green pill with "Processing"
  {
    direction: 'IN', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Delay in pick up', tripKind: 'past', withFulfillment: true, withOrderRef: false, lastAgoMin: 60 * 22,
    long: 'Consignment was not ready at the warehouse for 90 minutes after the pickup slot started.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Delay in pick up', long: 'Consignment was not ready at the warehouse for 90 minutes after the pickup slot started.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'We are looking into it', gap: 20 },
      { code: 'INFO_REQUESTED', who: 'us', short: 'Please share the gate-in time of the vehicle', gap: 15 },
      { code: 'INFO_PROVIDED', who: 'cp', short: 'Gate-in log attached', gap: 40, images: [{ url: evidenceImage('Gate-in log', 'fee2e2/991b1b') }] },
      { code: 'RESOLUTION_PROPOSED', who: 'us', short: proposeMsg('REFUND'), gap: 60, propose: { code: 'REFUND', amount: '200' } },
      { code: 'RESOLUTION_ACCEPTED', who: 'cp', short: 'We are accepting the resolution: REFUND', gap: 50, answerProposal: true },
    ],
  },
  // 16 — IN, latest OPEN (no button); missing providerName; no fulfillment; counterparty action named by org
  {
    direction: 'IN', level: 'ISSUE', category: 'BUSINESS', subcategory: 'Order ID is either invalid or incorrect', tripKind: 'today', withFulfillment: false, missingProviderName: true, lastAgoMin: 40,
    long: 'The order id in the confirm call does not match our records.',
    steps: [{ code: 'OPEN', who: 'cpOrg', short: 'Order ID is either invalid or incorrect', long: 'The order id in the confirm call does not match our records.', gap: 0 }],
  },
  // 17 — IN, latest RESOLVED (no button; waiting for complainant to close)
  {
    direction: 'IN', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Wrong delivery address', tripKind: 'past', withFulfillment: true, lastAgoMin: 60 * 24 * 2 + 200,
    long: 'Delivery address on the order points to the old shop location.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Wrong delivery address', long: 'Delivery address on the order points to the old shop location.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'We are looking into it', gap: 30 },
      { code: 'INFO_REQUESTED', who: 'us', short: 'Please confirm the correct landmark', gap: 10 },
      { code: 'INFO_PROVIDED', who: 'cp', short: 'Landmark shared: opposite the bus depot', gap: 25 },
      { code: 'RESOLUTION_PROPOSED', who: 'us', short: proposeMsg('NOW_VISIBLE'), gap: 40, propose: { code: 'NOW_VISIBLE' } },
      { code: 'RESOLUTION_ACCEPTED', who: 'cp', short: 'We are accepting the resolution: NOW_VISIBLE', gap: 35, answerProposal: true },
      { code: 'RESOLVED', who: 'us', short: 'Customer address updated in the master', gap: 20 },
    ],
  },
  // 18 — IN, CLOSED (cancelled trip)
  {
    direction: 'IN', level: 'ISSUE', category: 'FULFILLMENT', subcategory: 'Not picked up', tripKind: 'cancelled', withFulfillment: false, lastAgoMin: 60 * 24 * 5,
    long: 'Vehicle reached the warehouse but the trip was cancelled before loading.',
    steps: [
      { code: 'OPEN', who: 'cp', short: 'Not picked up', long: 'Vehicle reached the warehouse but the trip was cancelled before loading.', gap: 0 },
      { code: 'PROCESSING', who: 'us', short: 'We are looking into it', gap: 25 },
      { code: 'INFO_REQUESTED', who: 'us', short: 'Please share the vehicle arrival photo', gap: 15 },
      { code: 'INFO_PROVIDED', who: 'cp', short: 'Arrival photo attached', gap: 30, images: [{ url: evidenceImage('Vehicle at gate', 'f1f5f9/1f2937') }] },
      { code: 'RESOLUTION_PROPOSED', who: 'us', short: proposeMsg('CANCEL'), gap: 50, propose: { code: 'CANCEL' } },
      { code: 'RESOLUTION_ACCEPTED', who: 'cp', short: 'We are accepting the resolution: CANCEL', gap: 30, answerProposal: true },
      { code: 'RESOLVED', who: 'us', short: 'Cancellation charges waived', gap: 25 },
      { code: 'CLOSED', who: 'cp', short: 'Closing the issue', gap: 60, tags: CLOSURE_TAGS },
    ],
  },
];

// ---------------------------------------------------------------- seed

export const seed = (db: MockDatabase, rng: Rng) => {
  const now = Date.now();
  const tripsToday = db.trips.filter((t) => t.status === 2);
  const tripsPast = db.trips.filter((t) => t.status === 3);
  const tripsCancelled = db.trips.filter((t) => t.status === 4);
  const pools: Record<Scenario['tripKind'], DbTrip[]> = {
    today: tripsToday.length ? tripsToday : db.trips,
    past: tripsPast.length ? tripsPast : db.trips,
    cancelled: tripsCancelled.length ? tripsCancelled : db.trips,
  };
  const used: Record<string, number> = { today: 0, past: 0, cancelled: 0 };
  const issues: IssueRec[] = [];

  SCENARIOS.forEach((sc, si) => {
    const pool = pools[sc.tripKind];
    if (!pool.length) return;
    const trip = pool[used[sc.tripKind]++ % pool.length];
    const provider = db.providers.find((p) => p.id === trip.providerId);
    const providerName = provider?.name || trip.providerName;
    const deliveryStops = trip.stops.filter((s) => s.deliveryType === 'Delivery');
    const stop = deliveryStops.length ? deliveryStops[si % deliveryStops.length] : undefined;
    const customer = stop?.customerId ? db.customers.find((c) => c.id === stop.customerId) : undefined;

    // timestamps: last step at now - lastAgoMin, earlier steps by their gaps
    const totalGap = sc.steps.reduce((s, st) => s + st.gap, 0);
    let t = now - (sc.lastAgoMin + totalGap) * 60000 + rng.int(0, 50) * 1000;
    const stepTimes = sc.steps.map((st) => {
      t += st.gap * 60000;
      return new Date(t).toISOString();
    });
    const createdAt = stepTimes[0];
    const updatedAt = stepTimes[stepTimes.length - 1];

    const us: IssueActorRec = { actorId: shortId('actor', rng), actorType: 'INTERFACING_NP', personName: db.buyer.name, orgName: db.buyer.businessName, createdAt };
    const firstCp = sc.steps.findIndex((s) => s.who === 'cp' || s.who === 'cpOrg');
    const cp: IssueActorRec = { actorId: shortId('actor', rng), actorType: 'COUNTERPARTY_NP', personName: agentForProvider(db, trip.providerId), orgName: providerName, createdAt: stepTimes[Math.max(0, firstCp)] };
    const consumer: IssueActorRec | null = sc.withConsumer && customer
      ? { actorId: shortId('actor', rng), actorType: 'CONSUMER', personName: customer.customer_name, orgName: customer.business_name, createdAt }
      : null;
    const actors = [us, cp, ...(consumer ? [consumer] : [])];

    const refs: IssueRefRec[] = [];
    if (sc.withOrderRef !== false) refs.push({ refType: 'ORDER', refId: trip.orderId, createdAt });
    if (sc.withFulfillment && stop) refs.push({ refType: 'FULFILLMENT', refId: stop.fulfillmentId, createdAt });

    const descriptorCode = IssueCategories.find((c) => c.category === sc.category && c.subcategory === sc.subcategory)?.enumCode || '';
    const issue: IssueRec = {
      id: rng.uuid(),
      issueId: makeIssueCode(createdAt, rng.letters(3) + rng.digits(1) + rng.letters(2)),
      issueTitle: sc.subcategory,
      issueDescription: sc.long,
      descriptorShortDesc: sc.subcategory,
      descriptorLongDesc: sc.long,
      category: sc.category,
      subcategory: sc.subcategory,
      descriptorCode,
      direction: sc.direction,
      status: '',
      level: sc.level,
      logisticOrderId: trip.logisticsOrderId,
      orderId: trip.orderId,
      transactionId: trip.transactionId,
      providerId: trip.providerId,
      providerName: sc.missingProviderName ? null : providerName,
      buyerId: db.buyer.id,
      buyerName: db.buyer.businessName,
      contextDomain: 'ONDC:LOG10',
      fulfillmentId: sc.withFulfillment && stop ? stop.fulfillmentId : null,
      fulfillmentLocation: sc.withFulfillment && stop ? { deliveryLocation: { address: { name: stop.address.name } } } : null,
      createdAt,
      updatedAt,
      refs,
      actors,
      actions: [],
      resolutions: [],
    };

    let lastInfoRequestAction: string | null = null;
    sc.steps.forEach((st, k) => {
      const at = stepTimes[k];
      const actor = st.who === 'us' ? us : st.who === 'consumer' && consumer ? consumer : cp;
      const descriptorName = st.who === 'cpOrg' ? cp.orgName : st.who === 'gro' ? GRIEVANCE_OFFICER : actor.personName;
      const act: IssueActionRec = {
        id: shortId('ac', rng),
        descriptorCode: st.code,
        descriptorName,
        descriptorShortDesc: st.short,
        descriptorLongDesc: st.long || '',
        descriptorImages: st.images || [],
        createdAt: at,
        updatedAt: at,
        refId: null,
        refType: null,
        action: shortId('act', rng),
        actorId: actor.actorId,
        tags: st.tags,
      };
      if (st.code === 'INFO_REQUESTED') lastInfoRequestAction = act.action;
      if (st.code === 'INFO_PROVIDED' && lastInfoRequestAction) {
        act.name = lastInfoRequestAction;
        act.refId = lastInfoRequestAction;
      }
      if (st.propose) {
        const { parentId } = addProposal(issue, st.propose.code, st.propose.amount ?? null, st.short, at, rng);
        act.refId = parentId;
        act.refType = 'RESOLUTIONS';
      }
      if (st.answerProposal) {
        const child = latestProposalChild(issue);
        if (child) {
          act.refId = child.resolutionId;
          act.refType = 'RESOLUTIONS';
          child.status = st.code === 'RESOLUTION_ACCEPTED' ? 'ACCEPTED' : 'REJECTED';
        }
      }
      issue.actions.push(act);
    });
    issue.status = sc.statusOverride || statusForAction(sc.steps[sc.steps.length - 1].code);
    issues.push(issue);
  });

  issues.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.ext.issues = issues;
  db.ext.issuePendingReplies = [] as IssuePendingReply[];
};
