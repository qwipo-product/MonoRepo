/**
 * Stand-in for a company's DMS.
 *
 * In production the network never trusts a retailer ID a company types in —
 * it round-trips to that company's DMS and only commits the mapping if the
 * DMS confirms it. This module fakes that round trip, including the failure
 * branches, because the failure branches are where the product decisions are.
 *
 * Outcomes are deterministic so a demo can be rehearsed:
 *
 *   RET-1000 … RET-8999   exists in the DMS  → confirmed
 *   RET-9000 and above    not in the DMS     → `not_found`
 *   an ID already mapped  bound elsewhere    → `already_bound`
 *   wrong shape           fails validation   → `bad_format`
 *
 * The GSTIN-mismatch branch is modelled too: a handful of DMS records carry a
 * GSTIN that disagrees with the network's, which is the genuinely awkward case
 * — the ID is real, the retailer is real, and they still shouldn't be linked
 * without a human looking.
 */

export type DmsOutcome = 'confirmed' | 'not_found' | 'already_bound' | 'bad_format' | 'gstin_mismatch';

export interface DmsResult {
  outcome: DmsOutcome;
  /** Shown to the user. Written as the DMS would phrase it, not as a stack trace. */
  message: string;
  /** For `already_bound` — which network identity currently holds this ID. */
  boundTo?: string;
  /** For `gstin_mismatch` — what the company's own DMS has on file. */
  dmsGstin?: string;
}

const ID_SHAPE = /^RET-\d{4}$/;

/** DMS records whose GSTIN disagrees with the network's. Rare, on purpose. */
const GSTIN_MISMATCH_IDS = new Set(['RET-4242', 'RET-5150']);

export interface VerifyInput {
  retailerId: string;
  /** NRID the company is trying to attach the ID to. */
  nrid: string;
  /** IDs this company has already committed, so we can catch re-use. */
  alreadyMapped: Map<string, string>;
}

/**
 * Round-trip to the DMS. Async with a real delay — the waiting state is part
 * of the design, not an accident, and reviewers should feel it.
 */
export function verifyWithDms({
  retailerId,
  nrid,
  alreadyMapped,
}: VerifyInput): Promise<DmsResult> {
  const id = retailerId.trim().toUpperCase();

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!ID_SHAPE.test(id)) {
        resolve({
          outcome: 'bad_format',
          message: 'Retailer IDs look like RET-1234. Check the ID in your DMS and try again.',
        });
        return;
      }

      const boundTo = alreadyMapped.get(id);
      if (boundTo && boundTo !== nrid) {
        resolve({
          outcome: 'already_bound',
          message: 'This DMS ID is already mapped to a different retailer on the network.',
          boundTo,
        });
        return;
      }

      const serial = Number(id.slice(4));
      if (serial >= 9000) {
        resolve({
          outcome: 'not_found',
          message: 'No customer with this ID exists in your DMS.',
        });
        return;
      }

      if (GSTIN_MISMATCH_IDS.has(id)) {
        resolve({
          outcome: 'gstin_mismatch',
          message:
            'This ID exists in your DMS, but its GSTIN does not match the one the network has verified.',
          dmsGstin: '36AABX9931Q1ZP',
        });
        return;
      }

      resolve({
        outcome: 'confirmed',
        message: 'Verified against your DMS. The mapping is committed.',
      });
    }, 1100);
  });
}
