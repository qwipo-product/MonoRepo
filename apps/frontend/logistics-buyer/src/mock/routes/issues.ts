// Issues (ONDC IGM) mock endpoints — spec 06 §3, §8, §9.
//   POST /issues/get_by_filters        list (snake_case nested arrays) + stats + pagination
//   GET  /issues/get_by_id/:id         details (camelCase, `logisticOrderId` spelling)
//   POST /issues/update                append our action, move status / latest action (lifecycle §8)
//   POST /issues                       create from the Create New Issue dialog
//   POST /fulfillment/req_for_issue_status   "Issue Status" button (pulls the counterparty's next reply)
// The counterparty NP's replies are simulated: after each of our actions a scripted reply is queued
// (db.ext.issuePendingReplies) and applied a few seconds later — lazily, on the next issues request,
// or immediately when "Issue Status" is requested for that issue.
import { route, MockError, RawResponse } from '../server';
import { db, persist, uuid, nowIso } from '../db';
import { createRng } from '../seed';
import {
  seed as seedIssues,
  addProposal, agentForProvider, CLOSURE_TAGS, evidenceImage, GRIEVANCE_OFFICER, latestProposalChild, makeIssueCode, shortId, statusForAction,
  type IssueActionRec, type IssueActorRec, type IssuePendingReply, type IssueRec,
} from '../extensions/issues';

const BUYER = 'logistics-buyer-svc';

// ---------------------------------------------------------------- store helpers

function store(): IssueRec[] {
  const d = db();
  if (!Array.isArray(d.ext.issues)) {
    // A DB persisted before this extension existed: backfill the synthetic issues once (same RNG seed as buildSeed).
    seedIssues(d, createRng('./extensions/issues.ts'.length * 7919));
    persist();
  }
  return d.ext.issues;
}
function pendingStore(): IssuePendingReply[] {
  const d = db();
  if (!Array.isArray(d.ext.issuePendingReplies)) d.ext.issuePendingReplies = [];
  return d.ext.issuePendingReplies;
}
const findById = (id: any) => store().find((i) => String(i.id) === String(id));

const tsOf = (iso?: string | null) => (iso ? new Date(iso).getTime() || 0 : 0);
const latestAction = (i: IssueRec): IssueActionRec | undefined =>
  i.actions.reduce<IssueActionRec | undefined>((best, a) => (!best || tsOf(a.createdAt) >= tsOf(best.createdAt) ? a : best), undefined);

function ourActor(i: IssueRec): IssueActorRec {
  let a = i.actors.find((x) => x.actorType === 'INTERFACING_NP');
  if (!a) {
    const d = db();
    a = { actorId: shortId('actor'), actorType: 'INTERFACING_NP', personName: d.buyer.name, orgName: d.buyer.businessName, createdAt: nowIso() };
    i.actors.push(a);
  }
  return a;
}
function counterpartyActor(i: IssueRec): IssueActorRec {
  let a = i.actors.find((x) => x.actorType === 'COUNTERPARTY_NP' && x.personName !== GRIEVANCE_OFFICER);
  if (!a) {
    const d = db();
    const provider = d.providers.find((p) => p.id === i.providerId);
    a = { actorId: shortId('actor'), actorType: 'COUNTERPARTY_NP', personName: agentForProvider(d, i.providerId), orgName: provider?.name || i.providerName || 'Logistics Provider', createdAt: nowIso() };
    i.actors.push(a);
  }
  return a;
}

// ---------------------------------------------------------------- response mappers

/** List row: top-level camelCase, nested arrays snake_case (spec 06 §3.1 / §9.1). */
function toListRow(i: IssueRec) {
  return {
    id: i.id,
    issueId: i.issueId,
    status: i.status,
    level: i.level,
    descriptorShortDesc: i.descriptorShortDesc,
    descriptorLongDesc: i.descriptorLongDesc,
    category: i.category,
    subcategory: i.subcategory,
    descriptorCode: i.descriptorCode,
    buyerOrderId: i.orderId,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    contextDomain: i.contextDomain,
    transactionId: i.transactionId,
    logisticsOrderId: i.logisticOrderId,
    providerId: i.providerId,
    providerName: i.providerName,
    buyerId: i.buyerId,
    direction: i.direction,
    buyerName: i.buyerName,
    issuerefs: i.refs.map((r) => ({ ref_type: r.refType, ref_id: r.refId, created_at: r.createdAt })),
    issueresolutions: i.resolutions.map((r) => ({
      resolution_id: r.resolutionId, descriptor_code: r.descriptorCode, descriptor_short_desc: r.descriptorShortDesc,
      refund_amount: r.refundAmount, status: r.status, created_at: r.createdAt, updated_at: r.updatedAt,
    })),
    issueactors: i.actors.map((a) => ({ actor_id: a.actorId, actor_type: a.actorType, person_name: a.personName, org_name: a.orgName, created_at: a.createdAt })),
    issueactions: i.actions.map((a) => ({
      id: a.id, descriptor_code: a.descriptorCode, descriptor_name: a.descriptorName, descriptor_short_desc: a.descriptorShortDesc,
      ref_id: a.refId, ref_type: a.refType, created_at: a.createdAt,
    })),
  };
}

/** Details: camelCase (spec 06 §9.2). */
function toDetails(i: IssueRec) {
  const c = JSON.parse(JSON.stringify(i)) as IssueRec;
  return {
    id: c.id,
    issueId: c.issueId,
    issueTitle: c.issueTitle,
    issueDescription: c.issueDescription,
    category: c.category,
    subcategory: c.subcategory,
    descriptorCode: c.descriptorCode,
    direction: c.direction,
    status: c.status,
    level: c.level,
    logisticOrderId: c.logisticOrderId,
    transactionId: c.transactionId,
    providerId: c.providerId,
    providerName: c.providerName,
    orderId: c.orderId,
    buyerId: c.buyerId,
    contextDomain: c.contextDomain,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    fulfillmentId: c.fulfillmentId,
    fulfillmentLocation: c.fulfillmentLocation,
    refs: c.refs,
    actors: c.actors,
    actions: c.actions,
    resolutions: c.resolutions,
  };
}

// ---------------------------------------------------------------- simulated counterparty replies

const REPLY_DELAY_MS: Record<string, number> = {
  processing: 5000, info_request: 15000, propose: 6000, resolve: 6000, gro_processing: 8000, provide_info: 6000, accept: 6000, close: 8000,
};
/** Latest action code each reply kind expects; stale replies are dropped. */
const REPLY_AFTER: Record<string, string> = {
  processing: 'OPEN', info_request: 'PROCESSING', propose: 'INFO_PROVIDED', resolve: 'RESOLUTION_ACCEPTED',
  gro_processing: 'ESCALATE', provide_info: 'INFO_REQUESTED', accept: 'RESOLUTION_PROPOSED', close: 'RESOLVED',
};

function schedule(issue: IssueRec, kind: string, baseMs = Date.now()) {
  pendingStore().push({ issueDbId: issue.id, dueAt: baseMs + (REPLY_DELAY_MS[kind] ?? 6000), kind });
}

/** Queue the counterparty's natural next move after one of OUR actions. */
function scheduleAfterOurAction(issue: IssueRec, code: string) {
  const out = String(issue.direction || '').toUpperCase() === 'OUT';
  if (out) {
    if (code === 'INFO_PROVIDED') schedule(issue, 'propose');
    else if (code === 'RESOLUTION_ACCEPTED') schedule(issue, 'resolve');
    else if (code === 'ESCALATE') schedule(issue, 'gro_processing');
  } else {
    if (code === 'INFO_REQUESTED') schedule(issue, 'provide_info');
    else if (code === 'RESOLUTION_PROPOSED') schedule(issue, 'accept');
    else if (code === 'RESOLVED') schedule(issue, 'close');
  }
}

function proposalFor(issue: IssueRec): { code: string; amount: string | null } {
  if (issue.category === 'ITEM') return { code: 'REPLACEMENT', amount: null };
  if (issue.category === 'FULFILLMENT' || issue.category === 'PAYMENT') {
    const trip = db().trips.find((t) => t.logisticsOrderId === issue.logisticOrderId);
    const price = Number(trip?.deliveryPrice) || 1000;
    return { code: 'REFUND', amount: String(Math.round(price * 0.25)) };
  }
  return { code: 'RECONCILED', amount: null };
}

function applyReply(issue: IssueRec, kind: string, atMs: number) {
  const last = latestAction(issue);
  if (!last || last.descriptorCode !== REPLY_AFTER[kind]) return; // stale
  if (issue.status === 'CLOSED') return;
  const at = new Date(Math.max(atMs, tsOf(last.createdAt) + 1000)).toISOString();
  const cp = counterpartyActor(issue);
  const act: IssueActionRec = {
    id: shortId('ac'), descriptorCode: '', descriptorName: cp.personName, descriptorShortDesc: '', descriptorLongDesc: '', descriptorImages: [],
    createdAt: at, updatedAt: at, refId: null, refType: null, action: shortId('act'), actorId: cp.actorId,
  };
  switch (kind) {
    case 'processing':
      Object.assign(act, { descriptorCode: 'PROCESSING', descriptorShortDesc: 'We are looking into it', descriptorLongDesc: 'Our support team has picked up this issue.' });
      break;
    case 'info_request':
      Object.assign(act, { descriptorCode: 'INFO_REQUESTED', descriptorShortDesc: 'Please share photos of the consignment and the signed delivery challan' });
      break;
    case 'propose': {
      const p = proposalFor(issue);
      const msg = `We are proposing the ${p.code} as a resolution for this issue`;
      const { parentId } = addProposal(issue, p.code, p.amount, msg, at);
      Object.assign(act, { descriptorCode: 'RESOLUTION_PROPOSED', descriptorShortDesc: msg, refId: parentId, refType: 'RESOLUTIONS' });
      break;
    }
    case 'resolve': {
      const child = latestProposalChild(issue);
      Object.assign(act, { descriptorCode: 'RESOLVED', descriptorShortDesc: child ? `Resolution ${child.descriptorCode} has been executed` : 'Issue resolved' });
      break;
    }
    case 'gro_processing': {
      let gro = issue.actors.find((x) => x.personName === GRIEVANCE_OFFICER);
      if (!gro) {
        gro = { actorId: shortId('actor'), actorType: 'COUNTERPARTY_NP', personName: GRIEVANCE_OFFICER, orgName: cp.orgName, createdAt: at };
        issue.actors.push(gro);
      }
      Object.assign(act, {
        descriptorCode: 'PROCESSING', descriptorName: gro.personName, actorId: gro.actorId,
        descriptorShortDesc: 'Escalation received; the grievance officer is reviewing this issue',
      });
      break;
    }
    case 'provide_info': {
      const req = [...issue.actions].filter((a) => a.descriptorCode === 'INFO_REQUESTED').sort((a, b) => tsOf(b.createdAt) - tsOf(a.createdAt))[0];
      Object.assign(act, {
        descriptorCode: 'INFO_PROVIDED', descriptorShortDesc: 'Requested information attached',
        descriptorImages: [{ url: evidenceImage('Proof of delivery', 'e0f2fe/075985') }],
        name: req?.action ?? null, refId: req?.action ?? null,
      });
      break;
    }
    case 'accept': {
      const child = latestProposalChild(issue);
      if (child) child.status = 'ACCEPTED';
      Object.assign(act, {
        descriptorCode: 'RESOLUTION_ACCEPTED', descriptorShortDesc: `We are accepting the resolution: ${child?.descriptorCode ?? ''}`.trim(),
        refId: child?.resolutionId ?? null, refType: 'RESOLUTIONS',
      });
      break;
    }
    case 'close':
      Object.assign(act, { descriptorCode: 'CLOSED', descriptorShortDesc: 'Thank you, closing the issue', tags: CLOSURE_TAGS });
      break;
    default:
      return;
  }
  issue.actions.push(act);
  issue.status = statusForAction(act.descriptorCode);
  issue.updatedAt = at;
  // chained replies (newly created issue: OPEN → PROCESSING → INFO_REQUESTED)
  if (kind === 'processing') schedule(issue, 'info_request', atMs);
}

/** Applies every reply whose time has come; with `forceIssueId`, also pulls that issue's next pending reply. */
function applyDueReplies(forceIssueId?: string) {
  const list = pendingStore();
  if (!list.length) return;
  const now = Date.now();
  let changed = false;
  list.sort((a, b) => a.dueAt - b.dueAt);
  let i = 0;
  while (i < list.length) {
    const p = list[i];
    if (p.dueAt <= now) {
      list.splice(i, 1);
      const issue = findById(p.issueDbId);
      if (issue) applyReply(issue, p.kind, p.dueAt);
      changed = true;
      list.sort((a, b) => a.dueAt - b.dueAt);
      i = 0;
      continue;
    }
    i++;
  }
  if (forceIssueId) {
    const idx = list.findIndex((p) => p.issueDbId === forceIssueId);
    if (idx >= 0) {
      const [p] = list.splice(idx, 1);
      const issue = findById(p.issueDbId);
      if (issue) applyReply(issue, p.kind, now);
      changed = true;
    }
  }
  if (changed) persist();
}

// ---------------------------------------------------------------- routes

route('POST', BUYER, '/issues/get_by_filters', (req) => {
  applyDueReplies();
  const b = req.body || {};
  let rows = store().slice();
  // The UI always sends buyerId "" (spec 06 §1) — the real backend scopes by token; filter only when given.
  if (b.buyerId) rows = rows.filter((i) => i.buyerId === b.buyerId);

  // Stats are computed over the buyer's issues (not narrowed by status/level/search) so the cards stay meaningful.
  const stats = {
    totalIssues: rows.length,
    open: rows.filter((i) => i.status === 'OPEN').length,
    processing: rows.filter((i) => i.status === 'PROCESSING').length,
    resolved: rows.filter((i) => i.status === 'RESOLVED').length,
    closed: rows.filter((i) => i.status === 'CLOSED').length,
  };

  if (b.issueId) rows = rows.filter((i) => i.issueId === b.issueId || String(i.id) === String(b.issueId));
  if (b.logisticsOrderId) rows = rows.filter((i) => i.logisticOrderId === b.logisticsOrderId || i.orderId === b.logisticsOrderId);
  if (b.createdDate) {
    const day = String(b.createdDate).slice(0, 10);
    rows = rows.filter((i) => {
      const d = new Date(i.createdAt);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return ymd === day;
    });
  }
  if (b.status) rows = rows.filter((i) => i.status === b.status);
  if (b.level) rows = rows.filter((i) => i.level === b.level);
  const q = String(b.searchText || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((i) =>
      [i.issueId, i.descriptorShortDesc, i.descriptorLongDesc, i.category, i.subcategory, i.orderId, i.logisticOrderId, i.providerName, i.level, i.status,
        ...i.actors.map((a) => `${a.personName} ${a.orgName}`)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }
  rows.sort((a, c) => tsOf(c.createdAt) - tsOf(a.createdAt));

  const pageNumber = Math.max(1, Number(b.pageNumber) || 1);
  const pageSize = Math.max(1, Number(b.pageSize) || 10);
  const totalCount = rows.length;
  const slice = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  return {
    issues: slice.map(toListRow),
    pagination: { pageNumber, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    stats,
  };
});

route('GET', BUYER, '/issues/get_by_id/:id', (req) => {
  applyDueReplies();
  const issue = findById(req.params.id) || store().find((i) => i.issueId === req.params.id);
  if (!issue) throw new MockError(404, 'Issue not found');
  return toDetails(issue);
});

route('POST', BUYER, '/issues/update', (req) => {
  applyDueReplies();
  const b = req.body || {};
  if (!b.issueId) throw new MockError(400, 'issueId is required');
  const issue = findById(b.issueId);
  if (!issue) throw new MockError(404, 'Issue not found');
  const actions: any[] = Array.isArray(b.actions) ? b.actions : [];
  if (!actions.length) throw new MockError(400, 'At least one action is required');
  if (issue.status === 'CLOSED') return new RawResponse({ success: false, error: { message: 'Issue is already closed' } });

  const us = ourActor(issue);
  let lastCode = '';
  actions.forEach((a) => {
    const code = String(a?.code || '').toUpperCase();
    if (!code) throw new MockError(400, 'Action code is required');
    const last = latestAction(issue);
    const atMs = Math.max(Date.now(), tsOf(last?.createdAt) + 1);
    const at = new Date(atMs).toISOString();
    const act: IssueActionRec = {
      id: shortId('ac'),
      descriptorCode: code,
      descriptorName: us.personName,
      descriptorShortDesc: a.shortDesc ?? '',
      descriptorLongDesc: a.longDesc ?? '',
      descriptorImages: (Array.isArray(a.images) ? a.images : []).filter(Boolean).map((u: any) => (typeof u === 'string' ? { url: u } : u)),
      createdAt: at,
      updatedAt: at,
      refId: a.refId ?? null,
      refType: a.refType ?? null,
      action: shortId('act'),
      actorId: us.actorId,
      name: a.name ?? null,
      tags: a.tags,
    };
    if (code === 'RESOLUTION_PROPOSED') {
      const r = a.resolution || {};
      const amountEntry = (r.tags || []).flatMap((t: any) => t?.list || []).find((l: any) => l?.descriptor?.code === 'REFUND_AMOUNT');
      const { parentId } = addProposal(issue, String(r.code || 'NO_ACTION'), amountEntry?.value != null ? String(amountEntry.value) : null, r.shortDesc || a.shortDesc || '', at);
      act.refId = parentId;
      act.refType = 'RESOLUTIONS';
    }
    if (code === 'RESOLUTION_ACCEPTED' || code === 'RESOLUTION_REJECTED') {
      const child = a.refId ? issue.resolutions.find((r) => r.resolutionId === a.refId) : latestProposalChild(issue);
      if (child && child.descriptorCode !== 'PARENT') child.status = code === 'RESOLUTION_ACCEPTED' ? 'ACCEPTED' : 'REJECTED';
    }
    issue.actions.push(act);
    issue.status = statusForAction(code);
    issue.updatedAt = at;
    lastCode = code;
  });
  // the counterparty's pending replies are superseded by our new action
  db().ext.issuePendingReplies = pendingStore().filter((p) => p.issueDbId !== issue.id);
  scheduleAfterOurAction(issue, lastCode);
  persist();
  return { id: issue.id, issueId: issue.issueId, status: issue.status, updatedAt: issue.updatedAt };
});

route('POST', BUYER, '/issues', (req) => {
  applyDueReplies();
  const b = req.body || {};
  if (!b.category || !b.subcategory || !b.descriptorCode) throw new MockError(400, 'Issue category and subcategory are required');
  if (!b.descriptorLongDesc) throw new MockError(400, 'Detailed description is required');
  if (!b.logisticsOrderId && !b.orderId) throw new MockError(400, 'logisticsOrderId or orderId is required');
  const d = db();
  const ids = [b.logisticsOrderId, b.orderId].filter(Boolean).map(String);
  const trip = d.trips.find((t) => ids.includes(t.logisticsOrderId)) || d.trips.find((t) => ids.includes(t.orderId));
  if (!trip) throw new MockError(404, 'Logistics order not found');

  const duplicate = store().find((i) => i.logisticOrderId === trip.logisticsOrderId && i.descriptorCode === b.descriptorCode && i.status !== 'CLOSED');
  if (duplicate) {
    return new RawResponse({ success: false, error: { message: `An open issue (${duplicate.issueId}) already exists for this order with the same subcategory` } });
  }

  const at = nowIso();
  const providerId = b.providerId || trip.providerId;
  const provider = d.providers.find((p) => p.id === providerId);
  const stop = b.fulfillmentId ? trip.stops.find((s) => s.fulfillmentId === b.fulfillmentId) : undefined;
  const info = b.buyerInfo || {};
  const us: IssueActorRec = { actorId: shortId('actor'), actorType: 'INTERFACING_NP', personName: info.name || d.buyer.name, orgName: d.buyer.businessName, createdAt: at };
  const cp: IssueActorRec = { actorId: shortId('actor'), actorType: 'COUNTERPARTY_NP', personName: agentForProvider(d, providerId), orgName: provider?.name || trip.providerName, createdAt: at };
  const issue: IssueRec = {
    id: uuid(),
    issueId: makeIssueCode(at),
    issueTitle: b.descriptorShortDesc || b.subcategory,
    issueDescription: b.descriptorLongDesc,
    descriptorShortDesc: b.descriptorShortDesc || b.subcategory,
    descriptorLongDesc: b.descriptorLongDesc,
    category: b.category,
    subcategory: b.subcategory,
    descriptorCode: b.descriptorCode,
    direction: 'OUT',
    status: 'OPEN',
    level: 'ISSUE',
    logisticOrderId: trip.logisticsOrderId,
    orderId: trip.orderId,
    transactionId: b.transactionId || trip.transactionId,
    providerId,
    providerName: provider?.name || trip.providerName,
    buyerId: info.id || d.buyer.id,
    buyerName: d.buyer.businessName,
    contextDomain: 'ONDC:LOG10',
    fulfillmentId: b.fulfillmentId || null,
    fulfillmentLocation: stop ? { deliveryLocation: { address: { name: stop.address.name } } } : null,
    createdAt: at,
    updatedAt: at,
    refs: [
      { refType: 'ORDER', refId: trip.orderId, createdAt: at },
      ...(b.fulfillmentId ? [{ refType: 'FULFILLMENT' as const, refId: String(b.fulfillmentId), createdAt: at }] : []),
    ],
    actors: [us, cp],
    actions: [{
      id: shortId('ac'), descriptorCode: 'OPEN', descriptorName: us.personName, descriptorShortDesc: b.descriptorShortDesc || b.subcategory,
      descriptorLongDesc: b.descriptorLongDesc, descriptorImages: [], createdAt: at, updatedAt: at, refId: null, refType: null, action: shortId('act'), actorId: us.actorId,
    }],
    resolutions: [],
  };
  store().unshift(issue);
  schedule(issue, 'processing');
  persist();
  return { id: issue.id, issueId: issue.issueId, status: issue.status, createdAt: issue.createdAt };
});

route('POST', BUYER, '/fulfillment/req_for_issue_status', (req) => {
  const b = req.body || {};
  if (!b.issueId) throw new MockError(400, 'issueId is required');
  const issue = store().find((i) => i.issueId === b.issueId);
  if (!issue) throw new MockError(404, 'Issue not found');
  // The ONDC /issue_status round trip: the counterparty answers with its latest state (pull the next queued reply).
  applyDueReplies(issue.id);
  return { message: 'Issue status request sent', issueId: issue.issueId, status: issue.status };
});
