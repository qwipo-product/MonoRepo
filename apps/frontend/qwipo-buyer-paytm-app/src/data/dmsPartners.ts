// Gated catalogues that sell only to customers registered in a company's DMS
// (Distributor Management System). A shop registers with the company directly
// — already a customer (link the customer ID) or new (share KYC) — and the
// catalogue stays locked until the company approves. Separate from
// DISTRIBUTORS in home.ts: those are open sellers.
//
// A company whose DMS is wired into Qwipo (`dmsIntegrated`) works differently
// in two ways. It links its own existing customers, so their catalogue is
// simply open when they arrive and the only shop that ever reaches its
// registration screen is a new one — there is no customer ID to ask for. And
// it reads the shop's documents from Qwipo itself, so the form has no list of
// attachments to show.
//
// A company that `collectsDetails` (HUL) needs more than Qwipo's KYC holds: an
// email, WhatsApp OTP consent, two shop photos and one business document. Its
// form shows the KYC pre-filled and collects the rest beneath it.

// none → pending (request sent) → review (verifying) → registered
// or rejected (re-apply allowed).
export type DmsStatus = 'none' | 'pending' | 'review' | 'registered' | 'rejected';

/** A company with a gated catalogue, registered with directly. */
export interface DmsCompany {
  id: string;
  company: string;
  /** Short name used in sentences ("Already a customer of TCPL?"). */
  shortName?: string;
  emoji: string;
  brands: string[];
  products: number;
  /** Placeholder format shown in the customer-ID field. Not needed by a
   *  company that links its own customers — it never asks for one. */
  idHint?: string;
  /** The company's DMS is wired into Qwipo: it links its own customers and
   *  takes their documents directly, so registration asks for neither. */
  dmsIntegrated?: boolean;
  /** The company needs details Qwipo's KYC doesn't hold, so its registration
   *  form collects them (email, WhatsApp OTP, shop photos, a document). */
  collectsDetails?: boolean;
  rejectedReason?: string;
}

/* TCPL and HUL — one of each registration form: TCPL's is the Qwipo KYC alone,
   HUL's collects its own details too. The other four — PepsiCo, Marico,
   Colgate, ITC — were here to demonstrate the customer-ID path and the
   pending / review / registered / rejected cards; they are in git if wanted
   back. */
export const DMS_COMPANIES: DmsCompany[] = [
  {
    id: 'tcpl',
    company: 'Tata Consumer Products (TCPL)',
    shortName: 'TCPL',
    emoji: '🫖',
    brands: ['Tata Tea', 'Tata Salt', 'Tata Sampann', 'Tetley', 'Himalayan'],
    products: 126,
    dmsIntegrated: true,
  },
  {
    id: 'hul',
    company: 'Hindustan Unilever (HUL)',
    shortName: 'HUL',
    emoji: '🧴',
    brands: ['Surf Excel', 'Dove', 'Lifebuoy', 'Brooke Bond', 'Horlicks'],
    products: 240,
    collectsDetails: true,
  },
];

export const dmsCompanyById = (id: string) => DMS_COMPANIES.find((c) => c.id === id);

/** What a `collectsDetails` company's form collects on top of the KYC. */
export interface CollectedDetails {
  email: string;
  whatsappOtp: '' | 'yes' | 'no';
  boardPhoto: boolean;
  insidePhoto: boolean;
  docType: string;
  docId: string;
  docFile: '' | 'photo' | 'pdf';
}

export const NO_DETAILS: CollectedDetails = {
  email: '',
  whatsappOtp: '',
  boardPhoto: false,
  insidePhoto: false,
  docType: '',
  docId: '',
  docFile: '',
};

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** The fields of the seven still missing, in form order — Request
 *  Registration waits for none. `id` is the field's element id on the form, so
 *  the footer can scroll to it. */
export function detailsMissing(d: CollectedDetails): { id: string; label: string }[] {
  return [
    { id: 'dms-email', label: d.email.trim() ? 'a valid Email ID' : 'Email ID', ok: emailOk(d.email) },
    { id: 'dms-whatsapp', label: 'WhatsApp OTP', ok: d.whatsappOtp !== '' },
    { id: 'dms-board', label: 'Board photo', ok: d.boardPhoto },
    { id: 'dms-inside', label: 'Inside photo', ok: d.insidePhoto },
    { id: 'dms-doc-type', label: 'Document Type', ok: d.docType !== '' },
    { id: 'dms-doc-id', label: 'Document ID', ok: d.docId.trim() !== '' },
    { id: 'dms-doc-file', label: 'Document Image', ok: d.docFile !== '' },
  ]
    .filter((f) => !f.ok)
    .map(({ id, label }) => ({ id, label }));
}
