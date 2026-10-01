import { useState } from 'react';
import {
  GPS_FIX,
  ID_FIX_STEPS,
  ID_PHOTOS,
  LOCATION_FIX_STEPS,
  MAX_ATTEMPTS,
  PHOTO_FIX_STEPS,
  SHOP_PHOTOS,
  checkLocation,
  type AiResult,
  type Criterion,
  type CriterionResult,
  type IdScene,
  type IdType,
  type ShopScene,
} from './kycData';

/* The buyer's KYC. Each of the three mandatory fields is checked by AI the
   moment it's added — not at the end:

     empty → checking → accepted ✓
                      → rejected ✕ (attempt n of 5, with how-to-fix steps)
                      → review   (5th rejection: our team checks it by hand)

   Held in App so it survives leaving the form (e.g. for the Manual Review
   screen) and coming back. */

export type KycStatus = 'not-started' | 'active' | 'pending' | 'rejected';
export type FieldStatus = 'empty' | 'checking' | 'accepted' | 'rejected' | 'review';

export type KycLocation = { lat: string; lng: string; source: 'gps' | 'manual' };

export type Field = {
  status: FieldStatus;
  /** Failed AI checks on this field (0–3). */
  attempts: number;
  /** Latest AI answer. */
  result: (CriterionResult & { steps?: string[] }) | null;
};

export type KycState = {
  photo: ShopScene | null;
  location: KycLocation | null;
  idType: IdType | null;
  idScene: IdScene | null;
  fields: Record<Criterion, Field>;
  /** Shop photo sent on each attempt, oldest first — BMS shows the history. */
  photoHistory: ShopScene[];
  status: KycStatus;
  submittedAt: string | null;
};

const EMPTY: Field = { status: 'empty', attempts: 0, result: null };

const FRESH: KycState = {
  photo: null,
  location: null,
  idType: null,
  idScene: null,
  fields: { photo: EMPTY, location: EMPTY, ownerId: EMPTY },
  photoHistory: [],
  status: 'not-started',
  submittedAt: null,
};

const GPS: KycLocation = { ...GPS_FIX, source: 'gps' };

// Five rejected shop photos — what the review-gallery "Manual Review" jump replays.
const REVIEW_PHOTOS: ShopScene[] = ['board-hidden', 'blurry', 'dark', 'blocked', 'board-hidden'];

/** What AI says about each field. Also used by BMS. */
export function aiCheck(s: Pick<KycState, 'photo' | 'location' | 'idScene'>): AiResult {
  const p = s.photo ? SHOP_PHOTOS[s.photo] : null;
  const photo: CriterionResult = p
    ? { ok: p.ok, why: p.why, fix: p.fix, aiNote: p.aiNote }
    : { ok: false, why: 'Shop photo is missing.', fix: 'Please add a photo of your shop.', aiNote: 'No image' };
  const loc = checkLocation(s.location?.lat ?? '', s.location?.lng ?? '');
  const location: CriterionResult = loc.ok
    ? { ok: true, aiNote: s.location?.source === 'gps' ? 'Valid GPS location' : 'Valid location' }
    : { ok: false, why: loc.why, fix: loc.fix, aiNote: loc.kind === 'missing' ? 'Location missing' : 'Invalid Lat/Long format' };
  const idp = s.idScene ? ID_PHOTOS[s.idScene] : null;
  const ownerId: CriterionResult = idp
    ? { ok: idp.ok, why: idp.why, fix: idp.fix, aiNote: idp.ok ? 'Validated' : idp.aiNote }
    : { ok: false, why: 'Owner ID is missing.', fix: 'Please add your ID.', aiNote: 'No ID' };
  return { photo, location, ownerId };
}

function stepsFor(c: Criterion, s: Pick<KycState, 'photo' | 'location' | 'idScene'>): string[] | undefined {
  if (c === 'photo') return s.photo ? PHOTO_FIX_STEPS[s.photo] : undefined;
  if (c === 'ownerId') return s.idScene ? ID_FIX_STEPS[s.idScene] : undefined;
  const k = checkLocation(s.location?.lat ?? '', s.location?.lng ?? '').kind;
  return k ? LOCATION_FIX_STEPS[k] : undefined;
}

function stamp(n: number) {
  // Fixed demo clock so screenshots are stable.
  return `30 Sep 2026, 11:${String(30 + n * 6).padStart(2, '0')} AM`;
}

/** Run the AI on one field of a state, returning the updated state. */
function judge(k: KycState, c: Criterion): KycState {
  const r = aiCheck(k)[c];
  const prev = k.fields[c];
  const attempts = r.ok ? prev.attempts : prev.attempts + 1;
  const status: FieldStatus = r.ok ? 'accepted' : attempts >= MAX_ATTEMPTS ? 'review' : 'rejected';
  return {
    ...k,
    fields: { ...k.fields, [c]: { status, attempts, result: { ...r, steps: stepsFor(c, k) } } },
    photoHistory: c === 'photo' && k.photo ? [...k.photoHistory, k.photo] : k.photoHistory,
    submittedAt: stamp(k.photoHistory.length),
  };
}

export function useKycFlow() {
  const [kyc, setKyc] = useState<KycState>(FRESH);

  const setField = (c: Criterion, f: Partial<Field>) =>
    setKyc((k) => ({ ...k, fields: { ...k.fields, [c]: { ...k.fields[c], ...f } } }));

  const done = (c: Criterion) => ['accepted', 'review'].includes(kyc.fields[c].status);

  return {
    kyc,
    /** All three mandatory fields are accepted or with our team. */
    ready: done('photo') && done('location') && done('ownerId'),
    anyInReview: (['photo', 'location', 'ownerId'] as Criterion[]).some((c) => kyc.fields[c].status === 'review'),

    /** Add a photo / location / ID — starts the AI check. */
    addPhoto: (photo: ShopScene) => setKyc((k) => ({ ...k, photo, fields: { ...k.fields, photo: { ...k.fields.photo, status: 'checking' } } })),
    addLocation: (location: KycLocation) =>
      setKyc((k) => ({ ...k, location, fields: { ...k.fields, location: { ...k.fields.location, status: 'checking' } } })),
    addOwnerId: (idType: IdType, idScene: IdScene) =>
      setKyc((k) => ({ ...k, idType, idScene, fields: { ...k.fields, ownerId: { ...k.fields.ownerId, status: 'checking' } } })),

    /** AI answer for a field that's checking. Returns the new field status. */
    resolve: (c: Criterion): FieldStatus => {
      const next = judge(kyc, c);
      setKyc(next);
      return next.fields[c].status;
    },

    /** Delete what was added (attempts are kept — deleting isn't a free retry). */
    clear: (c: Criterion) =>
      setKyc((k) => ({
        ...k,
        ...(c === 'photo' ? { photo: null } : c === 'location' ? { location: null } : { idType: null, idScene: null }),
        fields: { ...k.fields, [c]: { ...k.fields[c], status: 'empty', result: null } },
      })),
    setField,
    setStatus: (status: KycStatus) => setKyc((k) => ({ ...k, status })),
    reset: () => setKyc(FRESH),

    /** Register: Active if AI accepted all three, otherwise Pending (manual review). */
    submit: (): 'active' | 'pending' => {
      const allOk = (['photo', 'location', 'ownerId'] as Criterion[]).every((c) => kyc.fields[c].status === 'accepted');
      setKyc((k) => ({ ...k, status: allOk ? 'active' : 'pending' }));
      return allOk ? 'active' : 'pending';
    },

    /** Review-gallery jumps: put the flow in the state that screen shows. */
    seed: (id: string) => {
      const base = (photos: ShopScene[], extra: Partial<KycState> = {}): KycState => {
        let k: KycState = { ...FRESH };
        for (const p of photos) k = judge({ ...k, photo: p }, 'photo');
        return { ...k, ...extra };
      };
      const withRest = (k: KycState) =>
        judge(judge({ ...k, location: GPS, idType: 'aadhaar', idScene: 'clear' }, 'location'), 'ownerId');
      switch (id) {
        case 'kyc-complete':
        case 'kyc-docs':
          return setKyc(FRESH);
        case 'kyc-docs-rejected':
          return setKyc(base(['board-hidden']));
        case 'kyc-docs-attempt-2':
          return setKyc(base(['board-hidden', 'blurry']));
        case 'kyc-docs-done':
          return setKyc(withRest(base(['good'])));
        case 'kyc-success':
          return setKyc({ ...withRest(base(['good'])), status: 'active' });
        case 'kyc-manual-review':
          return setKyc(withRest(base(REVIEW_PHOTOS)));
        case 'kyc-pending':
        case 'bms:kyc-review':
          return setKyc((k) =>
            k.fields.photo.status === 'review' ? { ...k, status: 'pending' } : { ...withRest(base(REVIEW_PHOTOS)), status: 'pending' }
          );
        default:
          return undefined;
      }
    },
  };
}

export type KycFlow = ReturnType<typeof useKycFlow>;
