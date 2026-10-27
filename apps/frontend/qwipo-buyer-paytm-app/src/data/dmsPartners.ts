// Gated catalogues that sell only to customers registered in a company's DMS
// (Distributor Management System). A shop registers with the company directly
// and the catalogue stays locked until the company approves. Separate from
// DISTRIBUTORS in home.ts: those are open sellers.
//
// Companies register a shop in one of two ways:
//
// - `dmsIntegrated` (TCPL) — the company's DMS is wired into Qwipo. It links
//   its own existing customers, so the only shop that reaches its registration
//   screen is a new one: the form shows the Qwipo KYC and asks for consent.
// - `linksExisting` (HUL) — the company takes existing customers only (HUL P2P,
//   stories 21543–21546 and 21741). Tapping it opens the Register with HUL
//   pop-up: the shop picks Customer ID or Mobile number, and Continue sends that
//   to the company to find the shop in its own records. Phase 1 sends the
//   mobile number registered on Qwipo; typing another number comes later.
//   The company answers found (registered) or not found (rejected, shown as
//   Failed, with Retry — story 21545).

// none → pending (request sent) → review (verifying) → registered
// or rejected (re-apply allowed; Retry for a `linksExisting` company).
export type DmsStatus = 'none' | 'pending' | 'review' | 'registered' | 'rejected';

/** A company with a gated catalogue, registered with directly. */
export interface DmsCompany {
  id: string;
  company: string;
  /** Short name used in sentences ("Register with HUL"). */
  shortName?: string;
  emoji: string;
  /** Placeholder for the Customer ID field — a company's own ID format. */
  idHint?: string;
  /** The company's DMS is wired into Qwipo: it links its own customers and
   *  takes their documents directly, so registration asks for neither. */
  dmsIntegrated?: boolean;
  /** The company registers its existing customers only, found by their
   *  customer ID or the mobile number it has for the shop. */
  linksExisting?: boolean;
  /** Demo only: the customer IDs a `linksExisting` company finds in its own
   *  records. Any other ID comes back rejected. */
  knownCustomerIds?: string[];
}

/* TCPL and HUL — one of each way of registering. The other four — PepsiCo,
   Marico, Colgate, ITC — demonstrated the pending / review / registered /
   rejected cards earlier; they are in git if wanted back. */
export const DMS_COMPANIES: DmsCompany[] = [
  {
    id: 'tcpl',
    company: 'Tata Consumer Products (TCPL)',
    shortName: 'TCPL',
    emoji: '🫖',
    dmsIntegrated: true,
  },
  {
    id: 'hul',
    company: 'Hindustan Unilever (HUL)',
    shortName: 'HUL',
    emoji: '🧴',
    idHint: 'e.g. HUL12345',
    linksExisting: true,
    knownCustomerIds: ['HUL12345'],
  },
];

export const dmsCompanyById = (id: string) => DMS_COMPANIES.find((c) => c.id === id);

export const dmsShortName = (c: DmsCompany) => c.shortName ?? c.company;

/* The shop's mobile number on Qwipo — the same one Account · Business Details
   and the registration form show. Phase 1 of the HUL pop-up sends this one. */
export const REGISTERED_MOBILE = '9876543210';

/** "9876543210" → "+91 98765 43210". */
export const formatMobile = (m: string) => `+91 ${m.slice(0, 5)} ${m.slice(5)}`;

/** What a shop sent to a `linksExisting` company to be found in its records. */
export interface DmsLinkRequest {
  by: 'customerId' | 'mobile';
  /** The customer ID typed, or the 10-digit mobile number sent. */
  value: string;
}

/** The request in a sentence: "customer ID HUL12345" / "mobile number +91 …". */
export const describeLink = (r: DmsLinkRequest) =>
  r.by === 'customerId' ? `customer ID ${r.value}` : `mobile number ${formatMobile(r.value)}`;

/* The company's simulated reply to a link request. It finds the shop by the
   mobile number on Qwipo or by a known customer ID, and rejects any other ID —
   so a mistyped ID walks into Failed and Retry. Nothing is sent anywhere. */
export const replyTo = (c: DmsCompany, r: DmsLinkRequest): DmsStatus =>
  r.by === 'mobile' ||
  (c.knownCustomerIds ?? []).some((id) => id.toLowerCase() === r.value.toLowerCase())
    ? 'registered'
    : 'rejected';

/** How long the simulated reply takes once the shop is back on Register to Order. */
export const DMS_REPLY_MS = 3000;

/** The review gallery's failed request: a customer ID one digit short. */
export const DEMO_FAILED_LINK: DmsLinkRequest = { by: 'customerId', value: 'HUL1234' };
