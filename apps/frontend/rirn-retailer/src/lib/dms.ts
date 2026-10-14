/**
 * Checking a retailer-supplied ID against a company's DMS.
 *
 * THIS IS NOT THE SAME CHECK THE COMPANY CONSOLE MAKES, and the difference
 * matters.
 *
 * When ITC types `RET-1234`, the network confirms the ID exists in ITC's own
 * DMS — ITC is asserting something about its own records, so existence is
 * enough.
 *
 * When a *retailer* types `RET-1234`, existence proves nothing. The ID is
 * real; the question is whether it belongs to the shop doing the typing. Left
 * unchecked, a retailer could guess IDs and attach themselves to a
 * neighbour's relationship — which corrupts the graph rather than merely
 * leaking from it.
 *
 * So this check looks for OWNERSHIP, in two tiers:
 *
 *   1. GSTIN match — the DMS record's GSTIN equals the retailer's verified
 *      GSTIN. Silent, instant, no human involved. Works whenever the
 *      company's customer data is clean.
 *   2. Company approval — everything else. The claim is recorded as pending
 *      and a human at the company confirms it. PRD §7.2 already lists company
 *      approval as a valid verification path.
 *
 * We never auto-bind on the ID alone.
 *
 * Outcomes are deterministic so a demo can be rehearsed:
 *
 *   even serial      GSTIN on file matches  → verified immediately
 *   odd serial       GSTIN missing/differs  → pending company approval
 *   ends in 0        held by another shop   → rejected
 *   9000 and above   not in the DMS at all  → rejected
 */

export type ClaimOutcome = 'verified' | 'pending' | 'already_claimed' | 'not_found' | 'bad_format';

export interface ClaimResult {
  outcome: ClaimOutcome;
  message: string;
}

const ID_SHAPE = /^RET-\d{4}$/;

export interface ClaimInput {
  retailerId: string;
  companyName: string;
  /** IDs already claimed in this session, so the same ID can't be reused. */
  claimed: Map<string, string>;
}

export function submitClaim({
  retailerId,
  companyName,
  claimed,
}: ClaimInput): Promise<ClaimResult> {
  const id = retailerId.trim().toUpperCase();

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!ID_SHAPE.test(id)) {
        resolve({
          outcome: 'bad_format',
          message: 'Customer IDs look like RET-1234. Check the number on your invoice.',
        });
        return;
      }

      if (claimed.has(id)) {
        resolve({
          outcome: 'already_claimed',
          message: 'You have already used this ID for another company.',
        });
        return;
      }

      const serial = Number(id.slice(4));

      if (serial >= 9000) {
        resolve({
          outcome: 'not_found',
          message: `${companyName} has no customer with this ID. Check your invoice or ask your distributor.`,
        });
        return;
      }

      if (serial % 10 === 0) {
        resolve({
          outcome: 'already_claimed',
          message: 'This ID belongs to another shop. If you think that is wrong, raise a dispute.',
        });
        return;
      }

      if (serial % 2 === 0) {
        resolve({
          outcome: 'verified',
          message: `Matched on your GSTIN. You're connected to ${companyName}.`,
        });
        return;
      }

      resolve({
        outcome: 'pending',
        message: `Sent to ${companyName} to confirm. Usually takes a working day.`,
      });
    }, 1100);
  });
}
