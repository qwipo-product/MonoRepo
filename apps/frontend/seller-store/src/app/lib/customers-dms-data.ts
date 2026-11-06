// =====================================================================
// New Onboarding — proposal store.
//
// A SECOND, self-contained customer model that sits alongside the live
// /customers module without touching it. The live module auto-registers
// a buyer on their first order. This one models the DMS reality:
//
//   A buyer who wants to order from a distributor must first exist in
//   that distributor's DMS software — and the DMS issues a DIFFERENT
//   customer ID per COMPANY. A distributor packing ITC, HUL, Colgate
//   and PepsiCo holds FOUR customer IDs for the same shop.
//
// So the customer is ONE entry here, and the company-specific IDs hang
// off it as links. Registration state is tracked PER LINK, because a
// shop can be live on ITC while still waiting on HUL.
//
// Wholesaler-mode companies are deliberately exempt: wholesale needs no
// DMS registration, so those links are born "registered" with no ID.
//
// Buyer-app contract mirrored here (5 statuses, 2 entry paths):
//   Path 1 — buyer already knows their DMS customer ID and links it →
//            straight to Registered, pipeline skipped.
//   Path 2 — buyer submits the KYC form → Pending approval →
//            Under review → Registered | Rejected → (re-apply) →
//            Pending approval.
//
// Routed at /new-onboarding. Nothing here is imported by the live
// Customers module.
// =====================================================================

import { isEmptyMode } from "./data-mode";
import {
  findBeatsForCustomer,
  getServiceabilityBeats,
  setServiceabilityBeats,
  type ServiceabilityBeat,
} from "./serviceability-data";

// ---------- Companies the seller packs ----------

/** How the seller operates for one company. Mirrors `OperationMode` in
 *  mock-store.ts — redeclared locally so this proposal store stays
 *  self-contained and can be deleted in one piece. */
export type DmsOperationMode = "distributor" | "wholesaler";

export interface DmsCompany {
  id: string;
  name: string;
  shortName: string;
  operationMode: DmsOperationMode;
  /** Placeholder shown in the Customer ID input + used by the CSV
   *  template so operators see the shape their DMS emits. */
  idFormatHint: string;
}

/**
 * The seller's linked companies. Four distributor mappings (each one
 * issues its own customer ID) and one wholesaler mapping (exempt from
 * registration entirely) — that mix is the whole point of the demo.
 */
export const DMS_COMPANIES: DmsCompany[] = [
  {
    id: "co-itc",
    name: "ITC Limited",
    shortName: "ITC",
    operationMode: "distributor",
    idFormatHint: "ITC-104582",
  },
  {
    id: "co-hul",
    name: "Hindustan Unilever Limited",
    shortName: "HUL",
    operationMode: "distributor",
    idFormatHint: "HUL-771903",
  },
  {
    id: "co-colgate",
    name: "Colgate-Palmolive India",
    shortName: "Colgate",
    operationMode: "distributor",
    idFormatHint: "CLG-102938",
  },
  {
    id: "co-pepsico",
    name: "PepsiCo India Holdings",
    shortName: "PepsiCo",
    operationMode: "distributor",
    idFormatHint: "PEP-582104",
  },
  {
    id: "co-marico",
    name: "Marico Limited",
    shortName: "Marico",
    operationMode: "wholesaler",
    idFormatHint: "—",
  },
];

export const DISTRIBUTOR_COMPANIES = DMS_COMPANIES.filter(
  (c) => c.operationMode === "distributor",
);

export const getDmsCompany = (id: string) =>
  DMS_COMPANIES.find((c) => c.id === id);

// ---------- Registration lifecycle ----------

/**
 * The five buyer-app statuses, carried verbatim so the seller screen
 * and the buyer screen never drift:
 *
 *  - "none"          Register — buyer has not started. Never shown on
 *                    the seller side (nothing has reached us yet); kept
 *                    so the type matches the buyer contract 1:1.
 *  - "pending"       Pending approval — request submitted, untouched.
 *  - "under-review"  Under review — a distributor user picked it up.
 *  - "registered"    Registered — approved with an ID, or ID linked.
 *  - "rejected"      Rejected — verification failed, reason attached.
 */
export type DmsRegStatus =
  | "none"
  | "pending"
  | "under-review"
  | "registered"
  | "rejected";

/** How a link reached "registered".
 *  - "buyer-linked"  Path 1 — the buyer typed an existing DMS ID. No
 *                    approval happened, so there is nothing to review.
 *  - "approved"      Path 2 — a distributor user approved the KYC
 *                    request and issued the ID from the review drawer.
 *  - "bulk-upload"   Path 2, at scale — the ID arrived in the filled
 *                    template rather than being typed one at a time.
 *  - "exempt"        Wholesaler mapping — no DMS registration needed.
 */
export type DmsLinkMethod =
  | "buyer-linked"
  | "approved"
  | "bulk-upload"
  | "exempt";

/** One (customer → company) registration. The DMS customer ID lives
 *  HERE, not on the customer, because it is company-specific. */
export interface DmsCompanyLink {
  companyId: string;
  companyName: string;
  operationMode: DmsOperationMode;
  status: DmsRegStatus;
  /** The company-specific ID issued by that company's DMS. Present
   *  only once status is "registered" (and never for wholesaler). */
  dmsCustomerId?: string;
  linkMethod?: DmsLinkMethod;
  requestedAt?: string;
  reviewStartedAt?: string;
  registeredAt?: string;
  rejectedAt?: string;
  /** Shown to the buyer verbatim on a rejection, e.g. "GSTIN could not
   *  be verified". */
  rejectionReason?: string;
  /** Buyer re-applied after a rejection — the row went back to
   *  "pending" and we keep the count so repeat offenders are visible. */
  reapplyCount?: number;
  /** Has the issued ID been pushed to the DMS connector yet? */
  syncState?: "synced" | "queued" | "failed";
  /** Per-company block. A shop can be blocked on ITC for unpaid dues
   *  and still trade on HUL. */
  blocked?: boolean;
}

/** KYC documents carried over from the buyer's Qwipo profile. The
 *  distributor reads them; they are never editable here. */
export interface DmsDocument {
  id: string;
  label: "Shop Image" | "Shop Owner Photo ID" | "GST Certificate";
  fileName: string;
  uploadedAt: string;
}

/**
 * A delivery address for a DMS customer. Mirrors `CustomerAddress` in
 * customers-demo-data.ts exactly — same shape, same rules — so the two
 * customer models share one mental model:
 *   • each address sits in its own location and maps into its OWN set
 *     of serviceability beats;
 *   • `serviceabilityOverrides` keys declare which companies deliver to
 *     THIS address, and the beat ids resolve live against the shared
 *     serviceability store (admin edits show up without a reload);
 *   • omit the map to fall back to the deterministic hash picker for
 *     every linked company.
 */
export interface DmsAddress {
  id: string;
  /** Short human label — "Main Store", "Godown", "Branch – KPHB". */
  label: string;
  fullAddress?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  /** The customer's default delivery address. Exactly one per customer. */
  isPrimary?: boolean;
  /** Per-company beat mapping for THIS address — companyId → beat ids. */
  serviceabilityOverrides?: Record<string, string[]>;
}

export interface DmsCustomer {
  id: string;
  /** Buyer-app request reference — the join key for the bulk template. */
  requestId: string;
  /** KYC fields, pre-filled from the Qwipo profile and editable by the
   *  buyer before submitting. */
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  shopAddress: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  /** Lat/long power the embedded map on the detail page. */
  latitude: number;
  longitude: number;
  /** Optional on the buyer form — a blank GSTIN is a legitimate
   *  submission, not an error. */
  gstNumber?: string;
  /** Optional, like GSTIN. When a GSTIN exists the PAN is its
   *  characters 3–12. */
  panNumber?: string;
  classType:"Kirana" | "Supermarket" | "General Store" | "Medical" | "HoReCa";
  documents: DmsDocument[];
  /** First time anything about this shop reached the seller. */
  submittedAt: string;
  companies: DmsCompanyLink[];
  /**
   * Delivery addresses. When present (length ≥ 1) the detail page
   * renders the address selector with per-address serviceability; when
   * omitted the top-level fields act as a single primary address —
   * identical to the live Customers module.
   */
  addresses?: DmsAddress[];
  /** Customer-level per-company beat override (primary address). */
  serviceabilityOverrides?: Record<string, string[]>;
  /** Customer-level block — overrides every link. */
  blocked?: boolean;
  blockedAt?: string;
  blockReason?: string;
  /** Free-text left by the reviewing user. */
  internalNote?: string;
}

// ---------- Derived state ----------

/**
 * Which of the three tabs a customer belongs to.
 *
 * BUSINESS RULE UP FOR REVIEW — a customer lives in exactly ONE tab, so
 * counts across the three tabs always add up to the total and nobody
 * gets actioned twice:
 *   1. Customer-level block wins → Blocked.
 *   2. Any link still awaiting us (pending / under-review / rejected)
 *      → New Registrations. Work-to-do beats work-done.
 *   3. Otherwise → Registered.
 *
 * A shop that is live on ITC but still pending on HUL therefore sits in
 * New Registrations, with its ITC chip already green in the row. The
 * alternative — listing it in both tabs — was rejected as double-
 * counting the queue.
 */
export type DmsTab = "new" | "registered" | "blocked";

const AWAITING: DmsRegStatus[] = ["pending", "under-review", "rejected"];

export function getCustomerTab(c: DmsCustomer): DmsTab {
  if (c.blocked) return "blocked";
  if (c.companies.some((l) => AWAITING.includes(l.status))) return "new";
  return "registered";
}

/** Links that still need a decision from the distributor. */
export const awaitingLinks = (c: DmsCustomer) =>
  c.companies.filter((l) => AWAITING.includes(l.status));

/** Distributor links that need an ID but don't have one yet. */
export const idPendingLinks = (c: DmsCustomer) =>
  c.companies.filter(
    (l) =>
      l.operationMode === "distributor" &&
      l.status !== "registered" &&
      l.status !== "none",
  );

export const registeredLinks = (c: DmsCustomer) =>
  c.companies.filter((l) => l.status === "registered");

/** "2 of 4 companies" — the headline number in the Companies column. */
export function registrationProgress(c: DmsCustomer) {
  const total = c.companies.length;
  const done = registeredLinks(c).length;
  return {
    done,
    total,
    label: `${done} of ${total} ${total === 1 ? "company" : "companies"}`,
  };
}

export const STATUS_LABELS: Record<DmsRegStatus, string> = {
  none: "Register",
  pending: "Pending approval",
  "under-review": "Under review",
  registered: "Registered",
  rejected: "Rejected",
};

/** Tailwind chip classes per status — kept in one place so the list,
 *  the drawer and the detail page can never disagree on colour. */
export const STATUS_STYLES: Record<DmsRegStatus, string> = {
  none: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "under-review": "bg-blue-50 text-blue-700 border-blue-200",
  registered: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

// ---------- Seed ----------

const doc = (
  id: string,
  label: DmsDocument["label"],
  fileName: string,
  uploadedAt: string,
): DmsDocument => ({ id, label, fileName, uploadedAt });

/** Standard three-document KYC bundle every buyer-app request carries. */
const kycBundle = (slug: string, at: string): DmsDocument[] => [
  doc(`${slug}-img`, "Shop Image", `${slug}-storefront.jpg`, at),
  doc(`${slug}-id`, "Shop Owner Photo ID", `${slug}-aadhaar.pdf`, at),
  doc(`${slug}-gst`, "GST Certificate", `${slug}-gst-cert.pdf`, at),
];

const link = (
  companyId: string,
  status: DmsRegStatus,
  extra: Partial<DmsCompanyLink> = {},
): DmsCompanyLink => {
  const co = getDmsCompany(companyId)!;
  return {
    companyId,
    companyName: co.name,
    operationMode: co.operationMode,
    status,
    ...extra,
  };
};

const SEED: DmsCustomer[] = [
  // ---- New registrations: fresh KYC requests, untouched ----
  {
    id: "dms-1",
    requestId: "REG-2026-0148",
    shopName: "Demo Outlet 01",
    ownerName: "Demo Owner 01",
    mobile: "6000970001",
    email: "outlet01@example.invalid",
    shopAddress: "Unit 1, Demo Market",
    area: "Rai Durg",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    latitude: 17.4851,
    longitude: 78.3951,
    gstNumber: "36DEMOP0001Z1Z5",
    panNumber: "DEMOP0001Z",
    classType: "General Store",
    documents: kycBundle("demo-01", "2026-08-28T09:12:00Z"),
    submittedAt: "2026-08-28T09:12:00Z",
    // Two delivery locations — the godown sits in a different beat, so
    // ITC serves it on different days and HUL/Colgate don't reach it
    // at all. Same multi-address model as the live Customers module.
    addresses: [
      {
        id: "dms-1-addr-1",
        label: "Main Store",
        fullAddress: "Unit 1-1, Demo Market",
        area: "Rai Durg",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
        latitude: 17.4851,
        longitude: 78.3951,
        isPrimary: true,
        serviceabilityOverrides: {
          "co-itc": ["beat-dms-itc-hitech"],
          "co-hul": ["beat-dms-hul-central"],
          "co-colgate": ["beat-dms-colgate-city"],
          "co-marico": ["beat-dms-marico-zone-a"],
        },
      },
      {
        id: "dms-1-addr-2",
        label: "Godown – Kukatpally",
        fullAddress: "Unit 1-2, Demo Market",
        area: "Kukatpally",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500072",
        latitude: 17.4852,
        longitude: 78.3952,
        serviceabilityOverrides: {
          "co-itc": ["beat-dms-itc-kukatpally"],
          "co-marico": ["beat-dms-marico-zone-a"],
        },
      },
    ],
    companies: [
      link("co-itc", "pending", { requestedAt: "2026-08-28T09:12:00Z" }),
      link("co-hul", "pending", { requestedAt: "2026-08-28T09:12:00Z" }),
      link("co-colgate", "pending", { requestedAt: "2026-08-28T09:14:00Z" }),
      link("co-marico", "registered", {
        linkMethod: "exempt",
        registeredAt: "2026-08-28T09:12:00Z",
      }),
    ],
  },
  {
    id: "dms-2",
    requestId: "REG-2026-0149",
    shopName: "Demo Outlet 02",
    ownerName: "Demo Owner 02",
    mobile: "6000970002",
    shopAddress: "Unit 2, Demo Market",
    area: "Kukatpally",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500072",
    latitude: 17.5052,
    longitude: 78.5052,
    panNumber: "DEMOP0002Z",
    classType: "Kirana",
    documents: [
      doc("balaji-img", "Shop Image", "balaji-storefront.jpg", "2026-08-28T11:40:00Z"),
      doc("balaji-id", "Shop Owner Photo ID", "balaji-voterid.pdf", "2026-08-28T11:40:00Z"),
    ],
    submittedAt: "2026-08-28T11:40:00Z",
    companies: [
      link("co-itc", "pending", { requestedAt: "2026-08-28T11:40:00Z" }),
      link("co-pepsico", "pending", { requestedAt: "2026-08-28T11:40:00Z" }),
    ],
  },
  {
    id: "dms-3",
    requestId: "REG-2026-0150",
    shopName: "Demo Outlet 03",
    ownerName: "Demo Owner 03",
    mobile: "6000970003",
    email: "outlet03@example.invalid",
    shopAddress: "Unit 3, Demo Market",
    area: "Miyapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500049",
    latitude: 17.4453,
    longitude: 78.4553,
    gstNumber: "36DEMOP0003Z1Z5",
    panNumber: "DEMOP0003Z",
    classType: "Supermarket",
    documents: kycBundle("demo-03", "2026-08-27T15:05:00Z"),
    submittedAt: "2026-08-27T15:05:00Z",
    companies: [
      link("co-itc", "pending", { requestedAt: "2026-08-27T15:05:00Z" }),
      link("co-hul", "pending", { requestedAt: "2026-08-27T15:05:00Z" }),
      link("co-colgate", "pending", { requestedAt: "2026-08-27T15:05:00Z" }),
      link("co-pepsico", "pending", { requestedAt: "2026-08-27T15:05:00Z" }),
    ],
  },
  {
    id: "dms-4",
    requestId: "REG-2026-0151",
    shopName: "Demo Outlet 04",
    ownerName: "Demo Owner 04",
    mobile: "6000970004",
    shopAddress: "Unit 4, Demo Market",
    area: "Gandhi Nagar",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    pincode: "520003",
    latitude: 17.4854,
    longitude: 78.3954,
    gstNumber: "36DEMOP0004Z1Z5",
    panNumber: "DEMOP0004Z",
    classType: "Kirana",
    documents: kycBundle("demo-04", "2026-08-26T10:22:00Z"),
    submittedAt: "2026-08-26T10:22:00Z",
    companies: [
      link("co-hul", "pending", { requestedAt: "2026-08-26T10:22:00Z" }),
      link("co-colgate", "pending", { requestedAt: "2026-08-26T10:22:00Z" }),
    ],
  },

  // ---- Under review: a distributor user has picked these up ----
  {
    id: "dms-5",
    requestId: "REG-2026-0142",
    shopName: "Demo Outlet 05",
    ownerName: "Demo Owner 05",
    mobile: "6000970005",
    email: "outlet05@example.invalid",
    shopAddress: "Unit 5, Demo Market",
    area: "SR Nagar",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500038",
    latitude: 17.5055,
    longitude: 78.5055,
    gstNumber: "36DEMOP0005Z1Z5",
    panNumber: "DEMOP0005Z",
    classType: "General Store",
    documents: kycBundle("demo-05", "2026-08-25T08:30:00Z"),
    submittedAt: "2026-08-25T08:30:00Z",
    internalNote: "GSTIN checked on the portal — active. Waiting on ITC ID from DMS.",
    companies: [
      link("co-itc", "under-review", {
        requestedAt: "2026-08-25T08:30:00Z",
        reviewStartedAt: "2026-08-29T10:15:00Z",
      }),
      link("co-hul", "registered", {
        dmsCustomerId: "HUL-771903",
        linkMethod: "approved",
        requestedAt: "2026-08-25T08:30:00Z",
        reviewStartedAt: "2026-08-29T10:15:00Z",
        registeredAt: "2026-08-29T10:20:00Z",
        syncState: "synced",
      }),
    ],
  },
  {
    id: "dms-6",
    requestId: "REG-2026-0144",
    shopName: "Demo Outlet 06",
    ownerName: "Demo Owner 06",
    mobile: "6000970006",
    shopAddress: "Unit 6, Demo Market",
    area: "Charminar",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500002",
    latitude: 17.4456,
    longitude: 78.4556,
    classType: "General Store",
    documents: [
      doc("bismillah-img", "Shop Image", "bismillah-storefront.jpg", "2026-08-24T17:45:00Z"),
      doc("bismillah-id", "Shop Owner Photo ID", "bismillah-aadhaar.pdf", "2026-08-24T17:45:00Z"),
    ],
    submittedAt: "2026-08-24T17:45:00Z",
    companies: [
      link("co-pepsico", "under-review", {
        requestedAt: "2026-08-24T17:45:00Z",
        reviewStartedAt: "2026-08-30T09:05:00Z",
      }),
    ],
  },

  // ---- Rejected: verification failed, buyer can re-apply ----
  {
    id: "dms-7",
    requestId: "REG-2026-0131",
    shopName: "Demo Outlet 07",
    ownerName: "Demo Owner 07",
    mobile: "6000970007",
    shopAddress: "Unit 7, Demo Market",
    area: "Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500034",
    latitude: 17.4857,
    longitude: 78.3957,
    gstNumber: "36DEMOP0007Z1Z5",
    panNumber: "DEMOP0007Z",
    classType: "Supermarket",
    documents: kycBundle("demo-07", "2026-08-20T12:10:00Z"),
    submittedAt: "2026-08-20T12:10:00Z",
    companies: [
      link("co-itc", "rejected", {
        requestedAt: "2026-08-20T12:10:00Z",
        rejectedAt: "2026-08-22T16:00:00Z",
        rejectionReason: "GSTIN could not be verified",
      }),
      link("co-hul", "rejected", {
        requestedAt: "2026-08-20T12:10:00Z",
        rejectedAt: "2026-08-22T16:00:00Z",
        rejectionReason: "GSTIN could not be verified",
      }),
    ],
  },
  {
    id: "dms-8",
    requestId: "REG-2026-0137",
    shopName: "Demo Outlet 08",
    ownerName: "Demo Owner 08",
    mobile: "6000970008",
    shopAddress: "Unit 8, Demo Market",
    area: "Arundelpet",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522002",
    latitude: 17.5058,
    longitude: 78.5058,
    gstNumber: "36DEMOP0008Z1Z5",
    panNumber: "DEMOP0008Z",
    classType: "Medical",
    documents: kycBundle("demo-08", "2026-08-23T09:00:00Z"),
    submittedAt: "2026-08-21T14:30:00Z",
    companies: [
      // Re-applied after a rejection — back in the queue as pending.
      link("co-colgate", "pending", {
        requestedAt: "2026-08-23T09:00:00Z",
        rejectedAt: "2026-08-22T11:00:00Z",
        rejectionReason: "Shop image did not show the shop name board",
        reapplyCount: 1,
      }),
    ],
  },

  // ---- Registered: live customers ----
  {
    id: "dms-9",
    requestId: "REG-2026-0102",
    shopName: "Demo Outlet 09",
    ownerName: "Demo Owner 09",
    mobile: "6000970009",
    email: "outlet09@example.invalid",
    shopAddress: "Unit 9, Demo Market",
    area: "Ameerpet",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500016",
    latitude: 17.4459,
    longitude: 78.4559,
    gstNumber: "36DEMOP0009Z1Z5",
    panNumber: "DEMOP0009Z",
    classType: "Supermarket",
    documents: kycBundle("demo-09", "2026-07-14T10:00:00Z"),
    submittedAt: "2026-07-14T10:00:00Z",
    // Three locations. The warehouse maps ITC into TWO beats (visited
    // Mon/Thu AND Tue/Fri), and Colgate doesn't reach the KPHB branch —
    // the coverage-gap cases the beats table needs to demonstrate.
    addresses: [
      {
        id: "dms-9-addr-1",
        label: "Main Store",
        fullAddress: "Unit 9-1, Demo Market",
        area: "Ameerpet",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500016",
        latitude: 17.4459,
        longitude: 78.4559,
        isPrimary: true,
        serviceabilityOverrides: {
          "co-itc": ["beat-dms-itc-ameerpet"],
          "co-hul": ["beat-dms-hul-west"],
          "co-colgate": ["beat-dms-colgate-city"],
          "co-pepsico": ["beat-dms-pepsico-metro"],
          "co-marico": ["beat-dms-marico-zone-a"],
        },
      },
      {
        id: "dms-9-addr-2",
        label: "Branch – KPHB",
        fullAddress: "Unit 9-2, Demo Market",
        area: "KPHB",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500072",
        latitude: 17.4460,
        longitude: 78.4560,
        serviceabilityOverrides: {
          "co-itc": ["beat-dms-itc-kukatpally"],
          "co-hul": ["beat-dms-hul-west"],
          "co-pepsico": ["beat-dms-pepsico-express"],
          "co-marico": ["beat-dms-marico-zone-a"],
        },
      },
      {
        id: "dms-9-addr-3",
        label: "Warehouse – Balanagar",
        fullAddress: "Unit 9-3, Demo Market",
        area: "Balanagar",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500037",
        latitude: 17.4461,
        longitude: 78.4561,
        serviceabilityOverrides: {
          "co-itc": ["beat-dms-itc-ameerpet", "beat-dms-itc-kukatpally"],
          "co-marico": ["beat-dms-marico-zone-a"],
        },
      },
    ],
    companies: [
      link("co-itc", "registered", {
        dmsCustomerId: "ITC-104582",
        linkMethod: "approved",
        requestedAt: "2026-07-14T10:00:00Z",
        reviewStartedAt: "2026-07-15T09:30:00Z",
        registeredAt: "2026-07-15T11:00:00Z",
        syncState: "synced",
      }),
      link("co-hul", "registered", {
        dmsCustomerId: "HUL-660214",
        linkMethod: "approved",
        requestedAt: "2026-07-14T10:00:00Z",
        reviewStartedAt: "2026-07-15T09:30:00Z",
        registeredAt: "2026-07-15T11:00:00Z",
        syncState: "synced",
      }),
      link("co-colgate", "registered", {
        dmsCustomerId: "CLG-102938",
        linkMethod: "bulk-upload",
        requestedAt: "2026-07-14T10:00:00Z",
        reviewStartedAt: "2026-07-17T16:00:00Z",
        registeredAt: "2026-07-18T09:30:00Z",
        syncState: "synced",
      }),
      link("co-pepsico", "registered", {
        dmsCustomerId: "PEP-582104",
        linkMethod: "bulk-upload",
        requestedAt: "2026-07-14T10:00:00Z",
        reviewStartedAt: "2026-07-17T16:00:00Z",
        registeredAt: "2026-07-18T09:30:00Z",
        syncState: "queued",
      }),
      link("co-marico", "registered", {
        linkMethod: "exempt",
        registeredAt: "2026-07-14T10:00:00Z",
      }),
    ],
  },
  {
    id: "dms-10",
    requestId: "REG-2026-0110",
    shopName: "Demo Outlet 10",
    ownerName: "Demo Owner 10",
    mobile: "6000970010",
    shopAddress: "Unit 10, Demo Market",
    area: "Kukatpally",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500085",
    latitude: 17.4860,
    longitude: 78.3960,
    gstNumber: "36DEMOP0010Z1Z5",
    panNumber: "DEMOP0010Z",
    classType: "General Store",
    documents: kycBundle("demo-10", "2026-07-22T13:15:00Z"),
    submittedAt: "2026-07-22T13:15:00Z",
    companies: [
      // Path 1 — the buyer already had the ID and linked it themselves.
      link("co-itc", "registered", {
        dmsCustomerId: "ITC-118840",
        linkMethod: "buyer-linked",
        registeredAt: "2026-07-22T13:20:00Z",
        syncState: "synced",
      }),
      link("co-marico", "registered", {
        linkMethod: "exempt",
        registeredAt: "2026-07-22T13:15:00Z",
      }),
    ],
  },
  {
    id: "dms-11",
    requestId: "REG-2026-0118",
    shopName: "Demo Outlet 11",
    ownerName: "Demo Owner 11",
    mobile: "6000970011",
    email: "outlet11@example.invalid",
    shopAddress: "Unit 11, Demo Market",
    area: "Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    latitude: 17.5061,
    longitude: 78.5061,
    gstNumber: "36DEMOP0011Z1Z5",
    panNumber: "DEMOP0011Z",
    classType: "HoReCa",
    documents: kycBundle("demo-11", "2026-08-01T08:45:00Z"),
    submittedAt: "2026-08-01T08:45:00Z",
    companies: [
      link("co-hul", "registered", {
        dmsCustomerId: "HUL-902317",
        linkMethod: "approved",
        requestedAt: "2026-08-01T08:45:00Z",
        reviewStartedAt: "2026-08-02T09:15:00Z",
        registeredAt: "2026-08-02T10:00:00Z",
        syncState: "synced",
      }),
      link("co-pepsico", "registered", {
        dmsCustomerId: "PEP-441029",
        linkMethod: "approved",
        requestedAt: "2026-08-01T08:45:00Z",
        reviewStartedAt: "2026-08-02T09:15:00Z",
        registeredAt: "2026-08-02T10:00:00Z",
        // Deliberate failure case — the ID exists on our side but the
        // DMS push errored, so the row needs a retry.
        syncState: "failed",
      }),
    ],
  },
  {
    id: "dms-12",
    requestId: "REG-2026-0125",
    shopName: "Demo Outlet 12",
    ownerName: "Demo Owner 12",
    mobile: "6000970012",
    shopAddress: "Unit 12, Demo Market",
    area: "Hanamkonda",
    city: "Warangal",
    state: "Telangana",
    pincode: "506001",
    latitude: 17.4462,
    longitude: 78.4562,
    panNumber: "DEMOP0012Z",
    classType: "Kirana",
    documents: [
      doc("ganesh-img", "Shop Image", "ganesh-storefront.jpg", "2026-08-05T16:20:00Z"),
      doc("ganesh-id", "Shop Owner Photo ID", "ganesh-aadhaar.pdf", "2026-08-05T16:20:00Z"),
    ],
    submittedAt: "2026-08-05T16:20:00Z",
    companies: [
      link("co-itc", "registered", {
        dmsCustomerId: "ITC-120944",
        linkMethod: "bulk-upload",
        requestedAt: "2026-08-05T16:20:00Z",
        reviewStartedAt: "2026-08-06T11:00:00Z",
        registeredAt: "2026-08-07T09:00:00Z",
        syncState: "synced",
      }),
      link("co-colgate", "registered", {
        dmsCustomerId: "CLG-118273",
        linkMethod: "bulk-upload",
        requestedAt: "2026-08-05T16:20:00Z",
        reviewStartedAt: "2026-08-06T11:00:00Z",
        registeredAt: "2026-08-07T09:00:00Z",
        syncState: "synced",
      }),
    ],
  },

  // ---- Blocked ----
  {
    id: "dms-13",
    requestId: "REG-2026-0096",
    shopName: "Demo Outlet 13",
    ownerName: "Demo Owner 13",
    mobile: "6000970013",
    shopAddress: "Unit 13, Demo Market",
    area: "Musheerabad",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500020",
    latitude: 17.4863,
    longitude: 78.3963,
    gstNumber: "36DEMOP0013Z1Z5",
    panNumber: "DEMOP0013Z",
    classType: "General Store",
    documents: kycBundle("demo-13", "2026-06-30T11:00:00Z"),
    submittedAt: "2026-06-30T11:00:00Z",
    blocked: true,
    blockedAt: "2026-08-12T15:30:00Z",
    blockReason: "Outstanding dues beyond 90 days across ITC and HUL",
    companies: [
      link("co-itc", "registered", {
        dmsCustomerId: "ITC-098221",
        linkMethod: "approved",
        requestedAt: "2026-06-30T11:00:00Z",
        reviewStartedAt: "2026-07-01T09:00:00Z",
        registeredAt: "2026-07-01T10:00:00Z",
        syncState: "synced",
        blocked: true,
      }),
      link("co-hul", "registered", {
        dmsCustomerId: "HUL-334455",
        linkMethod: "approved",
        requestedAt: "2026-06-30T11:00:00Z",
        reviewStartedAt: "2026-07-01T09:00:00Z",
        registeredAt: "2026-07-01T10:00:00Z",
        syncState: "synced",
        blocked: true,
      }),
    ],
  },
  {
    id: "dms-14",
    requestId: "REG-2026-0088",
    shopName: "Demo Outlet 14",
    ownerName: "Demo Owner 14",
    mobile: "6000970014",
    shopAddress: "Unit 14, Demo Market",
    area: "LB Nagar",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500074",
    latitude: 17.5064,
    longitude: 78.5064,
    classType: "Kirana",
    documents: kycBundle("demo-14", "2026-06-18T09:40:00Z"),
    submittedAt: "2026-06-18T09:40:00Z",
    blocked: true,
    blockedAt: "2026-07-28T12:00:00Z",
    blockReason: "Repeated order cancellations at delivery",
    companies: [
      link("co-pepsico", "registered", {
        dmsCustomerId: "PEP-220118",
        linkMethod: "buyer-linked",
        registeredAt: "2026-06-18T09:45:00Z",
        syncState: "synced",
        blocked: true,
      }),
    ],
  },
];

// ---------- Store (module state + pub/sub) ----------
//
// Same shape as the other mock stores in this app: module-level array,
// a subscriber set, and mutators that notify. No persistence — a reload
// resets the demo to seed, which is what reviewers want.

let customers: DmsCustomer[] = SEED.map((c) => ({
  ...c,
  companies: c.companies.map((l) => ({ ...l })),
}));

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export function subscribeToDmsCustomers(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const emptyCustomers: DmsCustomer[] = [];
export const getDmsCustomers = () => isEmptyMode() ? emptyCustomers : customers;

export const getDmsCustomer = (id: string) =>
  getDmsCustomers().find((c) => c.id === id);

/** Replace one customer in place and notify. */
function update(id: string, fn: (c: DmsCustomer) => DmsCustomer) {
  customers = customers.map((c) => (c.id === id ? fn(c) : c));
  notify();
}

const nowIso = () => new Date().toISOString();

/** Pick up a request — "distributor picked up the request and is
 *  verifying". Only moves rows that are actually pending. */
export function markUnderReview(customerId: string, companyIds?: string[]) {
  update(customerId, (c) => ({
    ...c,
    companies: c.companies.map((l) =>
      l.status === "pending" &&
      (!companyIds || companyIds.includes(l.companyId))
        ? { ...l, status: "under-review", reviewStartedAt: nowIso() }
        : l,
    ),
  }));
}

/** Issue a company-specific DMS customer ID and register the link. */
export function assignCustomerId(
  customerId: string,
  companyId: string,
  dmsCustomerId: string,
  method: DmsLinkMethod = "approved",
) {
  update(customerId, (c) => ({
    ...c,
    companies: c.companies.map((l) =>
      l.companyId === companyId
        ? {
            ...l,
            status: "registered",
            dmsCustomerId: dmsCustomerId.trim(),
            linkMethod: method,
            registeredAt: nowIso(),
            syncState: "queued",
            rejectionReason: undefined,
            rejectedAt: undefined,
          }
        : l,
    ),
  }));
}

/** Approve several links at once — used by the review drawer's
 *  "Approve & register" button, which submits every filled ID. */
export function approveWithIds(
  customerId: string,
  ids: Record<string, string>,
  method: DmsLinkMethod = "approved",
) {
  update(customerId, (c) => ({
    ...c,
    companies: c.companies.map((l) => {
      const id = ids[l.companyId]?.trim();
      if (!id) return l;
      return {
        ...l,
        status: "registered",
        dmsCustomerId: id,
        linkMethod: method,
        registeredAt: nowIso(),
        syncState: "queued",
        rejectionReason: undefined,
        rejectedAt: undefined,
      };
    }),
  }));
}

export function rejectRegistration(
  customerId: string,
  companyIds: string[],
  reason: string,
) {
  update(customerId, (c) => ({
    ...c,
    companies: c.companies.map((l) =>
      companyIds.includes(l.companyId)
        ? {
            ...l,
            status: "rejected",
            rejectedAt: nowIso(),
            rejectionReason: reason,
          }
        : l,
    ),
  }));
}

export function setBlocked(
  customerId: string,
  blocked: boolean,
  reason?: string,
) {
  update(customerId, (c) => ({
    ...c,
    blocked,
    blockedAt: blocked ? nowIso() : undefined,
    blockReason: blocked ? reason : undefined,
    companies: c.companies.map((l) => ({ ...l, blocked })),
  }));
}

export function setInternalNote(customerId: string, note: string) {
  update(customerId, (c) => ({ ...c, internalNote: note }));
}

/** Retry a failed DMS push. Demo-only: flips straight to synced. */
export function retrySync(customerId: string, companyId: string) {
  update(customerId, (c) => ({
    ...c,
    companies: c.companies.map((l) =>
      l.companyId === companyId ? { ...l, syncState: "synced" } : l,
    ),
  }));
}

// ---------- Serviceability (addresses × beats) ----------
//
// Same infrastructure as the live Customers module: beats live in the
// SHARED serviceability store (serviceability-data.ts) and every lookup
// resolves live via findBeatsForCustomer, so an admin editing a beat's
// delivery days updates this page without a reload.
//
// Register a small demo beat set for the DMS companies here through
// the store's public API, exactly the way the admin Serviceability tab
// would. Guarded by id so a hot-reload never duplicates them.

const DMS_DEMO_BEATS: ServiceabilityBeat[] = [
  {
    id: "beat-dms-itc-ameerpet",
    companyId: "co-itc",
    companyName: "ITC Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "ITC_Ameerpet_Central",
    deliveryDays: ["Monday", "Thursday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-itc-kukatpally",
    companyId: "co-itc",
    companyName: "ITC Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "ITC_Kukatpally_West",
    deliveryDays: ["Tuesday", "Friday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-itc-hitech",
    companyId: "co-itc",
    companyName: "ITC Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "ITC_Hitech_City",
    deliveryDays: ["Wednesday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-hul-central",
    companyId: "co-hul",
    companyName: "Hindustan Unilever Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "HUL_Central_HYD",
    deliveryDays: ["Tuesday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-hul-west",
    companyId: "co-hul",
    companyName: "Hindustan Unilever Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "HUL_West_HYD",
    deliveryDays: ["Monday", "Wednesday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-colgate-city",
    companyId: "co-colgate",
    companyName: "Colgate-Palmolive India",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "CLG_City_Weekly",
    deliveryDays: ["Saturday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-pepsico-metro",
    companyId: "co-pepsico",
    companyName: "PepsiCo India Holdings",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "PEP_Metro_Route",
    deliveryDays: ["Thursday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-pepsico-express",
    companyId: "co-pepsico",
    companyName: "PepsiCo India Holdings",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "PEP_Express_NDD",
    deliveryDays: ["Next Day"],
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "beat-dms-marico-zone-a",
    companyId: "co-marico",
    companyName: "Marico Limited",
    sellerId: "seller-1",
    sellerName: "ABC Distributors",
    beatName: "Marico_Wholesale_Zone_A",
    deliveryDays: ["Monday", "Friday"],
    createdAt: "2026-07-01T09:00:00Z",
  },
];

(function ensureDmsDemoBeats() {
  const existing = getServiceabilityBeats();
  const have = new Set(existing.map((b) => b.id));
  const missing = DMS_DEMO_BEATS.filter((b) => !have.has(b.id));
  if (missing.length > 0) {
    setServiceabilityBeats([...existing, ...missing]);
  }
})();

// ---------- Address helpers ----------
// Mirrors of getCustomerAddresses / getPrimaryAddress /
// getAddressServiceability in customers-demo-data.ts, retyped for
// DmsCustomer so the module stays self-contained.

/** Normalised address list — `addresses` when present, else a single
 *  primary synthesised from the legacy top-level fields. */
export const getDmsAddresses = (c: DmsCustomer): DmsAddress[] => {
  if (c.addresses && c.addresses.length > 0) return c.addresses;
  return [
    {
      id: `${c.id}-addr-1`,
      label: "Primary address",
      fullAddress: c.shopAddress,
      area: c.area,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      latitude: c.latitude,
      longitude: c.longitude,
      isPrimary: true,
      serviceabilityOverrides: c.serviceabilityOverrides,
    },
  ];
};

/** The customer's default address — flagged primary, else first. */
export const getDmsPrimaryAddress = (c: DmsCustomer): DmsAddress => {
  const list = getDmsAddresses(c);
  return list.find((a) => a.isPrimary) ?? list[0];
};

/** One company's resolved beats at a specific address. */
export interface DmsAddressCompanyServiceability extends DmsCompanyLink {
  beats: ServiceabilityBeat[];
}

/**
 * Resolve company × beat × delivery-days for ONE address. Identical
 * rules to the live module:
 *   • explicit overrides → the KEYS decide which linked companies are
 *     served here (a company absent from the map has no beat covering
 *     this spot);
 *   • no overrides → every linked company resolves via the location
 *     hash picker against the shared beat store.
 * Companies with no covering beat come back in `unserved` so the page
 * can flag the coverage gap.
 */
export const getDmsAddressServiceability = (
  c: DmsCustomer,
  address: DmsAddress,
): { served: DmsAddressCompanyServiceability[]; unserved: DmsCompanyLink[] } => {
  const served: DmsAddressCompanyServiceability[] = [];
  const unserved: DmsCompanyLink[] = [];
  const overrides = address.serviceabilityOverrides;
  for (const link of c.companies) {
    if (overrides != null && !(link.companyId in overrides)) {
      unserved.push(link);
      continue;
    }
    const beats = findBeatsForCustomer(
      {
        customerId: c.id,
        city: address.city,
        area: address.area,
        pincode: address.pincode,
        serviceabilityOverrides: overrides,
      },
      link.companyId,
    );
    if (beats.length === 0) unserved.push(link);
    else served.push({ ...link, beats });
  }
  return { served, unserved };
};

// ---------- Customer export ----------
//
// The Download on the list page. One row per customer with the details
// a seller needs to verify the shop and create it in their DMS. Address
// and coordinates come from the primary address.

export const EXPORT_COLUMNS = [
  "Phone Number",
  "Shop Name",
  "Address",
  "Latitude",
  "Longitude",
  "GST",
  "PAN",
  "Email Address",
] as const;

const escapeCsv = (v: string | number | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One-line postal address. Street lines often already name the area
 *  or city ("Shop 4, Opp Govt Hospital, Guntur"), so those parts are
 *  only appended when missing — a trailing city is dropped first so the
 *  area still lands before it. */
function formatExportAddress(a: DmsAddress): string {
  let line = (a.fullAddress ?? "").trim();
  const cityTail = `, ${a.city}`.toLowerCase();
  if (line.toLowerCase().endsWith(cityTail)) {
    line = line.slice(0, -cityTail.length);
  }
  for (const part of [a.area, a.city]) {
    if (part && !line.toLowerCase().includes(part.toLowerCase())) {
      line = line ? `${line}, ${part}` : part;
    }
  }
  return `${line}, ${a.state} - ${a.pincode}`;
}

export function buildCustomerExportCsv(rows: DmsCustomer[]): string {
  const header = EXPORT_COLUMNS.join(",");
  const body = rows.map((c) => {
    const addr = getDmsPrimaryAddress(c);
    return [
      c.mobile,
      c.shopName,
      formatExportAddress(addr),
      addr.latitude,
      addr.longitude,
      c.gstNumber ?? "",
      c.panNumber ?? "",
      c.email ?? "",
    ]
      .map(escapeCsv)
      .join(",");
  });
  return [header, ...body].join("\n");
}

export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
