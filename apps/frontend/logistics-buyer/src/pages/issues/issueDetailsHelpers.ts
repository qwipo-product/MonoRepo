// Pure logic of IssueDetailsComponent (chunk-JM2OTSZ2) — spec 06 §2.4, §5.4, §5.5, §5.7.
import { IssueStatusLabels } from '../../types/enums';
import type { IssueAction, IssueActor, IssueDetails, IssueImage, IssueResolution } from '../../api/services/issues.service';

/** Status order used by the next-action engine = key order of issueStatusLabels (ESCALATED is not in it). */
export const STATUS_ORDER = Object.keys(IssueStatusLabels);

const pad = (n: number) => String(n).padStart(2, '0');
const toDate = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/** HH:mm (local) or "". */
export function formatTime(v: any): string {
  const d = toDate(v);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
}
/** dd-mm-yyyy (local) or "". */
export function dateOnly(v: any): string {
  const d = toDate(v);
  return d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '';
}
/** dd-mm-yyyy HH:mm:ss (local) or "N/A" (formatDateTime). */
export function formatDateTime(v: any): string {
  if (v === null || v === undefined || v === 'null' || v === 'undefined' || v === '') return 'N/A';
  const d = toDate(v);
  return d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : 'N/A';
}
/** Details-style timeAgo: just now / Nm ago / Nh ago / Nd ago / Nw ago; empty → "". */
export function timeAgo(v: any): string {
  const d = toDate(v);
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/** Header / sidebar status text: OPEN/PROCESSING/RESOLVED/CLOSED labelled, anything else the raw code. */
export function headerStatusText(status: string | undefined): string | undefined {
  switch (status) {
    case 'OPEN': return 'Open';
    case 'PROCESSING': return 'Processing';
    case 'RESOLVED': return 'Resolved';
    case 'CLOSED': return 'Closed';
    default: return status;
  }
}

export const statusChipLabel = (code: string | undefined) => (code ? IssueStatusLabels[code] || code : code);

const tsOf = (v: any) => {
  const d = toDate(v);
  return d ? d.getTime() : 0;
};

/** The action with the greatest createdAt (missing dates sort as 0). */
export function getLatestAction(actions: IssueAction[] | undefined): IssueAction | undefined {
  if (!actions || !actions.length) return undefined;
  return actions.reduce((best, a) => (tsOf(a.createdAt) > tsOf(best.createdAt) ? a : best), actions[0]);
}

/** Walking actions newest first, the consecutive RESOLUTION_PROPOSED run at the top. */
export function getConsecutiveProposals(actionsNewestFirst: IssueAction[] | undefined): IssueAction[] {
  const out: IssueAction[] = [];
  for (const a of actionsNewestFirst || []) {
    if (a.descriptorCode !== 'RESOLUTION_PROPOSED') break;
    out.push(a);
  }
  return out;
}

// ---------------------------------------------------------------- actors

export function getActorTypeByName(issue: IssueDetails, name: string | undefined): string | undefined {
  const actors: IssueActor[] = issue?.issueactors || [];
  return actors.find((a) => a.personName === name || a.orgName === name)?.actorType;
}
export function roleLabel(actorType: string | undefined): string {
  switch (actorType) {
    case 'CONSUMER': return 'Consumer';
    case 'INTERFACING_NP': return 'Interfacing NP';
    case 'COUNTERPARTY_NP': return 'Counterparty NP';
    default: return actorType || 'N/A';
  }
}
export function roleClass(actorType: string | undefined): string {
  switch (actorType) {
    case 'CONSUMER': return 'consumer';
    case 'INTERFACING_NP': return 'buyer-app';
    case 'COUNTERPARTY_NP': return 'seller-app';
    default: return 'unknown';
  }
}

// ---------------------------------------------------------------- attachments (§5.7)

export function getImageUrl(img: IssueImage | string | null | undefined): string {
  if (typeof img === 'string') return img;
  return img?.url || img?.src || img?.href || '';
}
export function isPdf(url: string): boolean {
  return (url || '').toLowerCase().includes('.pdf');
}
/** Quirk: every URL that contains neither ".pdf" nor "pdf" counts as an image. */
export function isImage(url: string): boolean {
  const u = (url || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].some((ext) => u.includes(ext))) return true;
  if (['image', 'img', 'photo', 'picture'].some((w) => u.includes(w))) return true;
  return !u.includes('.pdf') && !u.includes('pdf');
}
export function attachmentTitle(url: string, n: number): string {
  if (isImage(url)) return `Attachment ${n}`;
  if (isPdf(url)) return `Document ${n}`;
  return `File ${n}`;
}
/** Every action's `{url}` attachments (plain strings excluded), newest action first. */
export function getAllAttachments(actionsNewestFirst: IssueAction[] | undefined): IssueImage[] {
  const out: IssueImage[] = [];
  [...(actionsNewestFirst || [])]
    .sort((a, b) => tsOf(b.createdAt) - tsOf(a.createdAt))
    .forEach((a) => (a.descriptorImages || []).forEach((img) => {
      if (img && typeof img === 'object' && img.url) out.push(img);
    }));
  return out;
}

// ---------------------------------------------------------------- next-action engine (§5.5)

export function getAllowedNextCodes(issue: IssueDetails, direction: string | undefined, code: string | undefined): string[] {
  const dir = (direction || '').toUpperCase();
  if (dir === 'OUT') {
    switch (code) {
      case 'INFO_REQUESTED': return ['INFO_PROVIDED'];
      case 'RESOLUTION_PROPOSED': return ['RESOLUTION_ACCEPTED', 'RESOLUTION_REJECTED'];
      case 'RESOLUTION_REJECTED': return ['ESCALATE'];
      case 'RESOLVED': return ['CLOSED'];
      default: return [];
    }
  }
  switch (code) {
    case 'PROCESSING': {
      const actions = issue?.issueactions || [];
      const idx = actions.findIndex((a) => a.descriptorCode === 'PROCESSING'); // newest PROCESSING (newest-first list)
      const older = idx >= 0 ? actions[idx + 1] : undefined;
      return older?.descriptorCode === 'INFO_PROVIDED' ? ['RESOLUTION_PROPOSED'] : ['INFO_REQUESTED'];
    }
    case 'INFO_PROVIDED': return ['RESOLUTION_PROPOSED'];
    case 'RESOLUTION_ACCEPTED': return ['RESOLVED'];
    default: return [];
  }
}

export function mapCodeToActionLabel(code: string, direction: string | undefined): string {
  const dir = (direction || '').toUpperCase();
  switch (code) {
    case 'INFO_REQUESTED': return 'Request Info';
    case 'INFO_PROVIDED': return dir === 'OUT' ? 'Provide Info' : 'Info Provided';
    case 'RESOLUTION_PROPOSED': return 'Propose Resolution';
    case 'RESOLUTION_ACCEPTED': return 'Accept';
    case 'RESOLUTION_REJECTED': return 'Reject';
    case 'RESOLVED': return 'Resolve';
    case 'CLOSED': return 'Close';
    case 'ESCALATE': return 'Escalate';
    case 'CASCADED': return 'Cascaded';
    default: return IssueStatusLabels[code] || code;
  }
}

/** Sort allowed codes by status order; first with an order index greater than the current code's, else the first. */
export function computeNextActionCode(allowed: string[], currentCode: string | undefined): string | undefined {
  if (!allowed.length) return undefined;
  const order = (c: string | undefined) => (c ? STATUS_ORDER.indexOf(c) : -1);
  const sorted = [...allowed].sort((a, b) => order(a) - order(b));
  const cur = order(currentCode);
  return sorted.find((c) => order(c) > cur) || sorted[0];
}

// ---------------------------------------------------------------- resolutions (§5.6.4)

/** PARENT row whose id = action.refId → option row with the same updatedAt (descriptorCode !== PARENT). */
export function getResolutionFromAction(issue: IssueDetails, action: IssueAction | undefined): IssueResolution | undefined {
  if (!action?.refId) return undefined;
  const resolutions: IssueResolution[] = issue?.resolutions || [];
  const parent = resolutions.find((r) => r.resolutionId === action.refId && r.descriptorCode === 'PARENT');
  if (!parent) return undefined;
  return resolutions.find((r) => r.updatedAt === parent.updatedAt && r.descriptorCode !== 'PARENT');
}
