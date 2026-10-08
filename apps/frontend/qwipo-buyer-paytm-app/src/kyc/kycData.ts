/* KYC — the three things that make a buyer's KYC Active, the sample photos the
   demo lets you "take", and the plain-language reasons AI gives back.

   Every message here is written for a Kirana shop owner: short, no technical
   words (no "validation", "coordinates", "threshold"). Copy lives in one place
   so the buyer app and the BMS review screen say the same thing. */

export type ShopScene =
  | 'good'
  | 'blurry'
  | 'dark'
  | 'board-closeup'
  | 'blocked'
  | 'unrelated'
  | 'person'
  | 'board-hidden'
  | 'too-far';

/** Which part of a good photo a guide tile points at. */
export type SceneHighlight = 'none' | 'board' | 'entrance' | 'light' | 'whole';

export type ShopPhoto = {
  id: ShopScene;
  /** Short label on the example tile. */
  label: string;
  ok: boolean;
  /** Caption under the example ("Shop and name board are clearly visible."). */
  caption: string;
  /** Why AI said no — shown to the buyer, word for word. */
  why?: string;
  /** What the buyer should do next. */
  fix?: string;
  /** Short reason for the BMS table. */
  aiNote: string;
};

export const SHOP_PHOTOS: Record<ShopScene, ShopPhoto> = {
  good: {
    id: 'good',
    label: 'Clear shop front',
    ok: true,
    caption: 'Shop and name board are clearly visible.',
    aiNote: 'Shop front and name board visible',
  },
  blurry: {
    id: 'blurry',
    label: 'Blurry photo',
    ok: false,
    caption: 'Image is too blurry.',
    why: 'Your photo is blurry. We cannot see the shop clearly.',
    fix: 'Hold your phone steady and take the photo again.',
    aiNote: 'Image is blurry',
  },
  dark: {
    id: 'dark',
    label: 'Very dark photo',
    ok: false,
    caption: 'Image is too dark.',
    why: 'Your photo is too dark. We cannot see the shop.',
    fix: 'Take the photo in daylight, or switch on the shop lights.',
    aiNote: 'Image too dark',
  },
  'board-closeup': {
    id: 'board-closeup',
    label: 'Only name board',
    ok: false,
    caption: 'Only the name board is visible.',
    why: 'Only the name board is in the photo. We cannot see your shop.',
    fix: 'Step back and take a photo of the full shop front with the name board.',
    aiNote: 'Close-up of name board only',
  },
  blocked: {
    id: 'blocked',
    label: 'Shop covered',
    ok: false,
    caption: 'Shop is not clearly visible.',
    why: 'Vehicles or items are covering your shop.',
    fix: 'Take the photo when the front of the shop is clear.',
    aiNote: 'Shop blocked by vehicles',
  },
  unrelated: {
    id: 'unrelated',
    label: 'Not a shop',
    ok: false,
    caption: 'This is not a shop photo.',
    why: 'This photo does not show a shop.',
    fix: 'Please take a photo of your own shop from the front.',
    aiNote: 'Unrelated location — no shop found',
  },
  person: {
    id: 'person',
    label: 'Photo of a person',
    ok: false,
    caption: 'Photo shows a person, not the shop.',
    why: 'This photo shows a person, not your shop.',
    fix: 'Please take a photo of the shop front. People are not needed in the photo.',
    aiNote: 'Person in frame instead of shop',
  },
  'board-hidden': {
    id: 'board-hidden',
    label: 'Name board not visible',
    ok: false,
    caption: 'Name board is not visible.',
    why: 'Your shop name board is not clearly visible.',
    fix: 'Please take a new photo from the front of the shop and make sure the name board is clearly visible.',
    aiNote: 'Name board not visible',
  },
  'too-far': {
    id: 'too-far',
    label: 'Too far away',
    ok: false,
    caption: 'Shop is too far to see.',
    why: 'Your shop is too far away in the photo.',
    fix: 'Walk closer so your shop fills most of the photo.',
    aiNote: 'Shop too far — not identifiable',
  },
};

/** Guide: "✓ Accepted vs ✕ Not Accepted", one row per rule. */
export const PHOTO_COMPARE: { good: { label: string; highlight: SceneHighlight }; bad: ShopScene }[] = [
  { good: { label: 'Clear shop front', highlight: 'whole' }, bad: 'blurry' },
  { good: { label: 'Name board visible', highlight: 'board' }, bad: 'board-hidden' },
  { good: { label: 'Good lighting', highlight: 'light' }, bad: 'dark' },
  { good: { label: 'Shop clearly visible', highlight: 'entrance' }, bad: 'blocked' },
];

/** Guide: the rest of the photos we can't accept. */
export const PHOTO_MORE_BAD: ShopScene[] = ['board-closeup', 'too-far', 'person', 'unrelated'];

/** The checklist for a good photo, in the buyer's words. */
export const PHOTO_TIPS = [
  'Full shop front in the photo',
  'Name board clearly visible',
  'Shop entrance visible',
  'Take it in daylight',
  'Hold the phone steady',
  'Stand across the road, not too far',
  'No vehicles or items blocking the shop',
];

/** What the demo "gallery" offers when uploading — good first. */
export const UPLOAD_CHOICES: ShopScene[] = ['good', 'board-hidden', 'blurry', 'dark', 'blocked', 'person'];

/* ---- Owner ID ---------------------------------------------------------- */

export type IdType = 'aadhaar' | 'pan' | 'voter' | 'dl' | 'shopReg' | 'udyam' | 'fssai' | 'invoice';

/** How the document looks — picks the illustration. */
export type IdKind = 'card' | 'certificate' | 'invoice';

export const ID_TYPES: { id: IdType; label: string; hint: string; group: 'owner' | 'shop'; kind: IdKind }[] = [
  { id: 'aadhaar', label: 'Aadhaar Card', hint: 'Front side', group: 'owner', kind: 'card' },
  { id: 'pan', label: 'PAN Card', hint: 'Front side', group: 'owner', kind: 'card' },
  { id: 'voter', label: 'Voter ID', hint: 'Front side', group: 'owner', kind: 'card' },
  { id: 'dl', label: 'Driving Licence', hint: 'Front side', group: 'owner', kind: 'card' },
  { id: 'shopReg', label: 'Shop Registration Certificate', hint: 'Full page', group: 'shop', kind: 'certificate' },
  { id: 'udyam', label: 'Udyam License', hint: 'Full page', group: 'shop', kind: 'certificate' },
  { id: 'fssai', label: 'FSSAI License', hint: 'Full page', group: 'shop', kind: 'certificate' },
  { id: 'invoice', label: 'Latest Invoice', hint: 'Shop name must be visible', group: 'shop', kind: 'invoice' },
];

export const idKindOf = (t: IdType | null | undefined): IdKind =>
  ID_TYPES.find((x) => x.id === t)?.kind ?? 'card';

export type IdScene = 'clear' | 'blurry' | 'cut';
export const ID_PHOTOS: Record<IdScene, { label: string; ok: boolean; why?: string; fix?: string; aiNote: string }> = {
  clear: { label: 'Clear ID photo', ok: true, aiNote: 'Name and photo readable' },
  blurry: {
    label: 'Blurry ID photo',
    ok: false,
    why: 'Your photo is blurry. We cannot read the name.',
    fix: 'Keep the document on a flat table and take the photo again.',
    aiNote: 'ID text not readable',
  },
  cut: {
    label: 'ID cut off',
    ok: false,
    why: 'Part of your document is cut off in the photo.',
    fix: 'Make sure all four corners of the document are in the photo.',
    aiNote: 'ID corners cut off',
  },
};

/* ---- Shop location ------------------------------------------------------ */

/** Where "Current Location" lands — the demo shop in Hyderabad. */
export const GPS_FIX = { lat: '17.3850', lng: '78.4867' };
export const SHOP_ADDRESS = 'Shop 12, Main Road, Ameerpet, Hyderabad 500016';

// One flat shape rather than a union: `strict` is off in this app, so
// TypeScript can't narrow on `ok`.
export type LocationCheck = { ok: boolean; kind?: 'missing' | 'format'; why?: string; fix?: string };

const NUM = /^-?\d{1,3}\.\d{3,}$/;

/** Plain-language check on a latitude / longitude pair. */
export function checkLocation(lat: string, lng: string): LocationCheck {
  const a = lat.trim();
  const b = lng.trim();
  if (!a && !b)
    return {
      ok: false,
      kind: 'missing',
      why: 'Your shop location is missing.',
      fix: 'Please allow location access or add your shop location.',
    };
  if (!a || !b)
    return {
      ok: false,
      kind: 'missing',
      why: !a ? 'Latitude is missing.' : 'Longitude is missing.',
      fix: 'Tap “Current Location” while standing in your shop.',
    };
  const la = Number(a);
  const lo = Number(b);
  if (!NUM.test(a) || !NUM.test(b) || Math.abs(la) > 90 || Math.abs(lo) > 180)
    return {
      ok: false,
      kind: 'format',
      why: 'Your shop location could not be verified.',
      fix: 'Latitude and Longitude must be in a valid number format, like 17.3850.',
    };
  return { ok: true };
}

/* ---- AI check ----------------------------------------------------------- */

export const MAX_ATTEMPTS = 5;

/* The four things AI checks, now spread across the three KYC steps:
   `ownerId` is the customer's photo ID in step 1, `location` is the business
   location in step 2, and the two shop photos are step 3. `photo` is the shot
   from outside — the name board — and `photoInside` is the one from within. */
export type Criterion = 'photo' | 'photoInside' | 'location' | 'ownerId';

export type CriterionResult = { ok: boolean; why?: string; fix?: string; aiNote: string };
export type AiResult = Record<Criterion, CriterionResult>;

export const CRITERIA: { id: Criterion; title: string; lines: [string, string] }[] = [
  { id: 'photo', title: 'Shop Photo — Outside', lines: ['Upload clear shop photo', 'Name board should be visible'] },
  { id: 'photoInside', title: 'Shop Photo — Inside', lines: ['Upload a photo from inside', 'Shelves should be visible'] },
  { id: 'location', title: 'Business Location', lines: ['Add your business location', 'Location should match your shop'] },
  { id: 'ownerId', title: 'Customer Photo ID', lines: ['Upload your photo ID', 'Name should be clear'] },
];

/* ---- BMS ---------------------------------------------------------------- */

export type BmsCase = {
  id: string;
  name: string;
  phone: string;
  business: string;
  businessType: string;
  address: string;
  customerId: string;
  photos: ShopScene[]; // one per attempt, oldest first
  lat: string;
  lng: string;
  idType: IdType;
  idScene: IdScene;
  submittedAt: string;
};

/** Other buyers already waiting in KYC Review (the first row is the live demo buyer). */
export const BMS_QUEUE: BmsCase[] = [
  {
    id: 'kr-2',
    name: 'Lakshmi Devi',
    phone: '9848022338',
    business: 'Lakshmi General Store',
    businessType: 'Kirana Store',
    address: 'Plot 4, Dilsukhnagar, Hyderabad 500060',
    customerId: 'QW-B-20418',
    photos: ['blocked', 'blocked', 'too-far', 'blocked', 'too-far'],
    lat: '17.3688',
    lng: '78.5247',
    idType: 'voter',
    idScene: 'clear',
    submittedAt: '30 Sep 2026, 10:05 AM',
  },
  {
    id: 'kr-3',
    name: 'Mohammed Irfan',
    phone: '9701234567',
    business: 'Irfan Provision Stores',
    businessType: 'Kirana Store',
    address: '2-3-45, Tolichowki, Hyderabad 500008',
    customerId: 'QW-B-20397',
    photos: ['dark', 'good', 'good', 'good', 'good'],
    lat: '17.3950',
    lng: '78.4150',
    idType: 'aadhaar',
    idScene: 'blurry',
    submittedAt: '29 Sep 2026, 06:48 PM',
  },
];

/* ---- Internal AI testing (pre go-live) ---------------------------------- */

export type TestCase = {
  name: string;
  scene: ShopScene | null;
  image: 'Good' | 'Poor' | 'Invalid';
  location: 'Valid' | 'Invalid' | 'Missing';
  ownerId: 'Valid';
  expected: 'Approve' | 'Reject';
  ai: 'Approve' | 'Reject';
};

export const AI_TEST_CASES: TestCase[] = [
  { name: 'Clear shop image', scene: 'good', image: 'Good', location: 'Valid', ownerId: 'Valid', expected: 'Approve', ai: 'Approve' },
  { name: 'Blurry image', scene: 'blurry', image: 'Poor', location: 'Valid', ownerId: 'Valid', expected: 'Reject', ai: 'Reject' },
  { name: 'Name board not visible', scene: 'board-hidden', image: 'Poor', location: 'Valid', ownerId: 'Valid', expected: 'Reject', ai: 'Reject' },
  { name: 'Wrong image', scene: 'unrelated', image: 'Invalid', location: 'Valid', ownerId: 'Valid', expected: 'Reject', ai: 'Reject' },
  { name: 'Invalid location', scene: 'good', image: 'Good', location: 'Invalid', ownerId: 'Valid', expected: 'Reject', ai: 'Reject' },
  { name: 'Missing location', scene: 'good', image: 'Good', location: 'Missing', ownerId: 'Valid', expected: 'Reject', ai: 'Reject' },
  { name: 'All valid', scene: 'good', image: 'Good', location: 'Valid', ownerId: 'Valid', expected: 'Approve', ai: 'Approve' },
];

/* ---- How to fix it ------------------------------------------------------ */

/** Numbered steps shown under a rejection — short, one action each. */
export const PHOTO_FIX_STEPS: Partial<Record<ShopScene, string[]>> = {
  'board-hidden': ['Stand in front of your shop', 'Keep the full name board in the photo', 'Nothing should cover the board'],
  blurry: ['Hold the phone steady with both hands', 'Tap the screen to focus, then click', 'Take the photo in daylight'],
  dark: ['Take the photo during the day', 'Or switch on the shop lights', 'Do not take it at night'],
  blocked: ['Wait until vehicles move away', 'Remove items kept in front of the shop', 'Take the photo again'],
  person: ['Take a photo of the shop, not a person', 'Nobody should stand in front', 'Show the name board'],
  unrelated: ['Take the photo at your own shop', 'Show the shop front and the name board'],
  'board-closeup': ['Step back a few steps', 'Show the full shop front', 'Keep the name board in the photo'],
  'too-far': ['Walk closer to your shop', 'Shop should fill most of the photo', 'Name board should be readable'],
};

export const ID_FIX_STEPS: Partial<Record<IdScene, string[]>> = {
  blurry: ['Keep the document on a flat table', 'Hold the phone steady', 'Make sure the name can be read'],
  cut: ['Keep the full document inside the photo', 'All 4 corners should be visible', 'Do not cover it with your fingers'],
};

export const LOCATION_FIX_STEPS: Record<'missing' | 'format', string[]> = {
  missing: ['Stand inside your shop', 'Tap “Current Location”', 'If your phone asks, tap “Allow”'],
  format: ['Tap “Current Location” inside your shop', 'Or type numbers only, like 17.3850', 'Do not type letters or spaces'],
};

/* Demo stand-in for the camera: Camera gives a clear photo, Gallery gives a
   problem photo — a different problem on each attempt — so both AI answers
   can be shown without any demo controls on the phone. */
export const GALLERY_BAD_PHOTOS: ShopScene[] = ['board-hidden', 'blurry', 'dark', 'blocked', 'person'];
export const GALLERY_BAD_IDS: IdScene[] = ['blurry', 'cut', 'blurry', 'cut', 'blurry'];
