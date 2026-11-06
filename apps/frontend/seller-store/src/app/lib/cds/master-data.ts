// Cross Dock Store (CDS) — master data for the Hyderabad network.
// Locations, distributors (sellers), retailers and the FMCG catalogue
// used to generate the interconnected synthetic operations data.

import type { CdsLocation, CdsProduct, CdsRetailer, CdsSeller, Rider } from "./types";

export const CDS_LOCATIONS: CdsLocation[] = [
  { id: "kkp", name: "Kukatpally CDS", code: "CDS-KKP", locality: "KPHB Colony", address: "Demo Dock 01, KPHB Colony", manager: "Demo Manager 01", phone: "0001000001", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 60, darkStoreId: "kphb" },
  { id: "myp", name: "Miyapur CDS", code: "CDS-MYP", locality: "Miyapur X Roads", address: "Demo Dock 02, Miyapur X Roads", manager: "Demo Manager 02", phone: "0001000002", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 48 },
  { id: "kdp", name: "Kondapur CDS", code: "CDS-KDP", locality: "Botanical Garden Road", address: "Demo Dock 03, Botanical Garden Road", manager: "Demo Manager 03", phone: "0001000003", status: "Active", inwardCutoff: "11:00", dispatchCutoff: "13:30", crates: 48 },
  { id: "gcb", name: "Gachibowli CDS", code: "CDS-GCB", locality: "Gopanpally Thanda", address: "Demo Dock 04, Gopanpally Thanda", manager: "Demo Manager 04", phone: "0001000004", status: "Active", inwardCutoff: "11:00", dispatchCutoff: "13:30", crates: 40 },
  { id: "mdp", name: "Madhapur CDS", code: "CDS-MDP", locality: "Ayyappa Society", address: "Demo Dock 05, Ayyappa Society", manager: "Demo Manager 05", phone: "0001000005", status: "Active", inwardCutoff: "11:00", dispatchCutoff: "13:30", crates: 36 },
  { id: "upl", name: "Uppal CDS", code: "CDS-UPL", locality: "Uppal Depot Road", address: "Demo Dock 06, Uppal Depot Road", manager: "Demo Manager 06", phone: "0001000006", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 36 },
  { id: "lbn", name: "LB Nagar CDS", code: "CDS-LBN", locality: "Sagar Ring Road", address: "Demo Dock 07, Sagar Ring Road", manager: "Demo Manager 07", phone: "0001000007", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 36 },
  { id: "amp", name: "Ameerpet CDS", code: "CDS-AMP", locality: "SR Nagar", address: "Demo Dock 08, SR Nagar", manager: "Demo Manager 08", phone: "0001000008", status: "Active", inwardCutoff: "11:00", dispatchCutoff: "13:30", crates: 30 },
  { id: "sec", name: "Secunderabad CDS", code: "CDS-SEC", locality: "Paradise Circle", address: "Demo Dock 09, Paradise Circle", manager: "Demo Manager 09", phone: "0001000009", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 30 },
  { id: "alw", name: "Alwal CDS", code: "CDS-ALW", locality: "Lothkunta", address: "Demo Dock 10, Lothkunta", manager: "Demo Manager 10", phone: "0001000010", status: "Active", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 30, darkStoreId: "alwal" },
  { id: "kmp", name: "Kompally CDS", code: "CDS-KMP", locality: "Suchitra Circle", address: "Demo Dock 11, Suchitra Circle", manager: "Demo Manager 11", phone: "0001000011", status: "Onboarding", goLive: "20 Nov 2026", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 30 },
  { id: "dsn", name: "Dilsukhnagar CDS", code: "CDS-DSN", locality: "Kothapet", address: "Demo Dock 12, Kothapet", manager: "Demo Manager 12", phone: "0001000012", status: "Onboarding", goLive: "20 Nov 2026", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 30 },
  { id: "mhp", name: "Mehdipatnam CDS", code: "CDS-MHP", locality: "Rethibowli", address: "Demo Dock 13, Rethibowli", manager: "Demo Manager 13", phone: "0001000013", status: "Onboarding", goLive: "27 Nov 2026", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 30 },
  { id: "trk", name: "Tarnaka CDS", code: "CDS-TRK", locality: "Lalapet Road", address: "Demo Dock 14, Lalapet Road", manager: "Demo Manager 14", phone: "0001000014", status: "Onboarding", goLive: "04 Dec 2026", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 24 },
  { id: "atp", name: "Attapur CDS", code: "CDS-ATP", locality: "Pillar 140, PVNR Expressway", address: "Demo Dock 15, Pillar 140, PVNR Expressway", manager: "Demo Manager 15", phone: "0001000015", status: "Onboarding", goLive: "04 Dec 2026", inwardCutoff: "11:30", dispatchCutoff: "14:00", crates: 24 },
];

/** Relative order volume per active CDS. */
export const CDS_INTENSITY: Record<string, number> = {
  kkp: 1, myp: 0.85, kdp: 0.8, gcb: 0.7, mdp: 0.5, upl: 0.45, lbn: 0.45, amp: 0.35, sec: 0.35, alw: 0.35,
};

export const PRODUCTS: CdsProduct[] = [
  { sku: "ITC-AAT-10", name: "Aashirvaad Shudh Chakki Atta 10 kg", brand: "ITC", uom: "Bag 10 kg", price: 468 },
  { sku: "ITC-SDF-150", name: "Sunfeast Dark Fantasy Choco Fills 150 g", brand: "ITC", uom: "Box of 12", price: 396 },
  { sku: "ITC-BNG-90", name: "Bingo Mad Angles Achaari 90 g", brand: "ITC", uom: "Box of 20", price: 360 },
  { sku: "ITC-YPN-70", name: "YiPPee! Magic Masala Noodles 70 g", brand: "ITC", uom: "Case of 48", price: 528 },
  { sku: "ITC-SNT-125", name: "Savlon Glycerin Soap 125 g", brand: "ITC", uom: "Pack of 12", price: 444 },
  { sku: "CLG-STG-200", name: "Colgate Strong Teeth 200 g", brand: "Colgate-Palmolive", uom: "Pack of 12", price: 1176 },
  { sku: "CLG-MAX-150", name: "Colgate MaxFresh Gel 150 g", brand: "Colgate-Palmolive", uom: "Pack of 12", price: 1224 },
  { sku: "CLG-PLM-125", name: "Palmolive Naturals Soap 125 g", brand: "Colgate-Palmolive", uom: "Pack of 12", price: 516 },
  { sku: "CLG-ZIG-1", name: "Colgate ZigZag Toothbrush", brand: "Colgate-Palmolive", uom: "Pack of 24", price: 672 },
  { sku: "EMM-NAV-200", name: "Navratna Ayurvedic Cool Oil 200 ml", brand: "Emami", uom: "Pack of 12", price: 1404 },
  { sku: "EMM-BOR-80", name: "BoroPlus Antiseptic Cream 80 ml", brand: "Emami", uom: "Pack of 12", price: 1068 },
  { sku: "EMM-ZDB-25", name: "Zandu Balm 25 ml", brand: "Emami", uom: "Pack of 24", price: 1680 },
  { sku: "EMM-KSK-100", name: "Kesh King Ayurvedic Oil 100 ml", brand: "Emami", uom: "Pack of 12", price: 1500 },
  { sku: "HUL-SRF-1", name: "Surf Excel Easy Wash 1 kg", brand: "Hindustan Unilever", uom: "Bag of 10", price: 1240 },
  { sku: "HUL-RIN-250", name: "Rin Detergent Bar 250 g", brand: "Hindustan Unilever", uom: "Pack of 24", price: 576 },
  { sku: "HUL-VIM-300", name: "Vim Dishwash Bar 300 g", brand: "Hindustan Unilever", uom: "Pack of 24", price: 624 },
  { sku: "HUL-RDL-500", name: "Brooke Bond Red Label Tea 500 g", brand: "Hindustan Unilever", uom: "Pack of 12", price: 3240 },
  { sku: "HUL-CLP-175", name: "Clinic Plus Strong & Long Shampoo 175 ml", brand: "Hindustan Unilever", uom: "Pack of 12", price: 1308 },
  { sku: "TAT-SLT-1", name: "Tata Salt 1 kg", brand: "Tata Consumer", uom: "Bag of 25", price: 600 },
  { sku: "TAT-TEA-1", name: "Tata Tea Premium 1 kg", brand: "Tata Consumer", uom: "Pack of 6", price: 2940 },
  { sku: "TAT-SMP-1", name: "Tata Sampann Toor Dal 1 kg", brand: "Tata Consumer", uom: "Pack of 10", price: 1680 },
  { sku: "FRD-SFO-1", name: "Freedom Refined Sunflower Oil 1 L", brand: "Gemini Edibles", uom: "Box of 10", price: 1390 },
  { sku: "FRD-SFO-5", name: "Freedom Refined Sunflower Oil 5 L", brand: "Gemini Edibles", uom: "Jar 5 L", price: 698 },
  { sku: "FRT-SFO-1", name: "Fortune Sunlite Sunflower Oil 1 L", brand: "Adani Wilmar", uom: "Box of 10", price: 1420 },
  { sku: "FRT-RCB-1", name: "Fortune Rice Bran Oil 1 L", brand: "Adani Wilmar", uom: "Box of 10", price: 1520 },
  { sku: "PRL-PGB-800", name: "Parle-G Gold Biscuits 800 g", brand: "Parle", uom: "Case of 12", price: 1080 },
  { sku: "PRL-MNC-120", name: "Parle Monaco Classic 120 g", brand: "Parle", uom: "Case of 24", price: 576 },
  { sku: "BRT-GDY-200", name: "Britannia Good Day Cashew 200 g", brand: "Britannia", uom: "Case of 24", price: 1128 },
  { sku: "BRT-MRG-250", name: "Britannia Marie Gold 250 g", brand: "Britannia", uom: "Case of 24", price: 864 },
  { sku: "NST-MGI-12", name: "Maggi 2-Minute Masala Noodles 12-pack", brand: "Nestle", uom: "Case of 8", price: 1312 },
  { sku: "NST-NSC-50", name: "Nescafe Classic 50 g", brand: "Nestle", uom: "Pack of 12", price: 2016 },
  { sku: "MRC-PCH-300", name: "Parachute Coconut Oil 300 ml", brand: "Marico", uom: "Pack of 12", price: 1596 },
  { sku: "MRC-SFL-1", name: "Saffola Gold Oil 1 L", brand: "Marico", uom: "Box of 10", price: 1890 },
  { sku: "PTJ-DNT-200", name: "Patanjali Dant Kanti 200 g", brand: "Patanjali", uom: "Pack of 12", price: 1032 },
  { sku: "PTJ-GHE-1", name: "Patanjali Cow Ghee 1 L", brand: "Patanjali", uom: "Pack of 6", price: 3690 },
  { sku: "VJD-TDL-25", name: "Vijayalakshmi Toor Dal 25 kg", brand: "Vijayalakshmi Dall Mill", uom: "Bag 25 kg", price: 3875 },
  { sku: "SRK-SNR-25", name: "Sri Krishna Sona Masoori Rice 25 kg", brand: "Sri Krishna Rice Industries", uom: "Bag 25 kg", price: 1450 },
  { sku: "MHT-BPT-26", name: "Mahateja BPT Raw Rice 26 kg", brand: "Mahateja Ricemills", uom: "Bag 26 kg", price: 1560 },
  { sku: "RNK-SGR-1", name: "Renuka Sugar 1 kg", brand: "Shree Renuka Sugars", uom: "Bag of 30", price: 1350 },
  { sku: "KRN-CHL-500", name: "Karani Chilli Powder 500 g", brand: "Karani Spices", uom: "Pack of 20", price: 2600 },
];

export const SELLERS: CdsSeller[] = [
  { id: "s-rmt", name: "ABC Distributors", area: "Balanagar", contact: "Rajesh Kumar", phone: "0002000001", brands: ["ITC", "Parle", "Britannia"], cdsIds: ["kkp", "myp", "sec"] },
  { id: "s-ssr", name: "Demo Distributor 02", area: "Kukatpally", contact: "Demo Contact 02", phone: "0002000002", brands: ["Hindustan Unilever", "Nestle"], cdsIds: ["kkp", "kdp", "amp"] },
  { id: "s-jga", name: "Demo Distributor 03", area: "Moosapet", contact: "Demo Contact 03", phone: "0002000003", brands: ["Emami"], cdsIds: ["kkp", "myp", "alw"] },
  { id: "s-yln", name: "Demo Distributor 04", area: "Jeedimetla", contact: "Demo Contact 04", phone: "0002000004", brands: ["Colgate-Palmolive"], cdsIds: ["kkp", "myp", "sec", "alw"] },
  { id: "s-knt", name: "Demo Distributor 05", area: "Chandanagar", contact: "Demo Contact 05", phone: "0002000005", brands: ["Colgate-Palmolive", "Marico"], cdsIds: ["kkp", "kdp", "gcb"] },
  { id: "s-mas", name: "Demo Distributor 06", area: "Madhapur", contact: "Demo Contact 06", phone: "0002000006", brands: ["Emami", "Patanjali"], cdsIds: ["kdp", "gcb", "mdp"] },
  { id: "s-skt", name: "Demo Distributor 07", area: "Begum Bazar", contact: "Demo Contact 07", phone: "0002000007", brands: ["Tata Consumer", "Vijayalakshmi Dall Mill", "Sri Krishna Rice Industries", "Shree Renuka Sugars"], cdsIds: ["kkp", "myp", "kdp", "gcb", "upl", "lbn"] },
  { id: "s-jgn", name: "Demo Distributor 08", area: "Miyapur", contact: "Demo Contact 08", phone: "0002000008", brands: ["Emami", "Gemini Edibles"], cdsIds: ["myp", "kkp"] },
  { id: "s-blj", name: "Demo Distributor 09", area: "Uppal", contact: "Demo Contact 09", phone: "0002000009", brands: ["Hindustan Unilever", "Britannia"], cdsIds: ["upl", "lbn", "sec"] },
  { id: "s-lve", name: "Demo Distributor 10", area: "Dilsukhnagar", contact: "Demo Contact 10", phone: "0002000010", brands: ["Adani Wilmar", "Gemini Edibles"], cdsIds: ["lbn", "upl"] },
  { id: "s-svt", name: "Demo Distributor 11", area: "Ameerpet", contact: "Demo Contact 11", phone: "0002000011", brands: ["Parle", "Nestle"], cdsIds: ["amp", "mdp", "kdp"] },
  { id: "s-hng", name: "Demo Distributor 12", area: "Secunderabad", contact: "Demo Contact 12", phone: "0002000012", brands: ["Tata Consumer", "Marico"], cdsIds: ["sec", "alw", "upl"] },
  { id: "s-afd", name: "Demo Distributor 13", area: "Kondapur", contact: "Demo Contact 13", phone: "0002000013", brands: ["Mahateja Ricemills", "Sri Krishna Rice Industries", "Karani Spices"], cdsIds: ["kdp", "gcb", "mdp", "myp"] },
  { id: "s-dfd", name: "Demo Distributor 14", area: "Attapur", contact: "Demo Contact 14", phone: "0002000014", brands: ["ITC", "Hindustan Unilever"], cdsIds: ["gcb", "mdp", "amp"] },
  { id: "s-bhm", name: "Demo Distributor 15", area: "LB Nagar", contact: "Demo Contact 15", phone: "0002000015", brands: ["Colgate-Palmolive", "Britannia"], cdsIds: ["lbn", "upl"] },
  { id: "s-sda", name: "Demo Distributor 16", area: "Alwal", contact: "Demo Contact 16", phone: "0002000016", brands: ["Parle", "Adani Wilmar"], cdsIds: ["alw", "sec"] },
  { id: "s-vse", name: "Demo Distributor 17", area: "Gachibowli", contact: "Demo Contact 17", phone: "0002000017", brands: ["Nestle", "Marico", "Patanjali"], cdsIds: ["gcb", "kdp", "mdp"] },
  { id: "s-gwh", name: "Demo Distributor 18", area: "Mehdipatnam", contact: "Demo Contact 18", phone: "0002000018", brands: ["Gemini Edibles", "Shree Renuka Sugars", "Tata Consumer"], cdsIds: ["amp", "mdp"] },
];

/** The seller account that operates the CDS module in this demo. */
export const OPERATOR_SELLER_ID = "s-rmt";

const RETAILER_PREFIX = [
  "Sri Lakshmi", "Venkateswara", "Balaji", "Sai Ram", "Durga Bhavani", "Ganesh", "Hanuman", "Annapurna", "Manjeera", "New Krishna", "Om Sai", "Sree Ram", "Vijaya", "Siddhi Vinayaka", "Mahalaxmi", "Kanaka Durga", "Sri Venkata Sai", "Raghavendra", "Padmavathi", "Tirumala", "Royal", "Star", "Fresh Choice", "Green Basket", "Daily Needs", "Sri Sai Balaji", "Anjaneya", "Bhagyalakshmi", "Srinivasa", "Sai Krupa",
];
const RETAILER_SUFFIX: { s: string; t: CdsRetailer["type"] }[] = [
  { s: "Kirana", t: "Kirana" },
  { s: "Kirana & General Stores", t: "Kirana" },
  { s: "General Stores", t: "General Store" },
  { s: "Super Market", t: "Supermarket" },
  { s: "Provision Stores", t: "Kirana" },
  { s: "Mart", t: "Supermarket" },
  { s: "Medical & General", t: "Medical & General" },
  { s: "Bakery & Stores", t: "Bakery" },
];
const OWNER_FIRST = ["Ramesh", "Suresh", "Srinivas", "Venkat", "Lakshmi", "Padma", "Narayana", "Mohan", "Raju", "Shankar", "Anil", "Kiran", "Ravi", "Sridevi", "Prasad", "Naresh", "Yadagiri", "Mallesh", "Feroz", "Salim", "Kavitha", "Satyanarayana", "Bhaskar", "Chandra"];
const OWNER_LAST = ["Reddy", "Goud", "Yadav", "Rao", "Naidu", "Chary", "Gupta", "Shaik", "Agarwal", "Mudiraj", "Patel", "Varma"];

export const CDS_AREAS: Record<string, string[]> = {
  kkp: ["KPHB Colony", "Vivekananda Nagar", "Moosapet", "Balaji Nagar", "Allwyn Colony", "Kukatpally Y Junction"],
  myp: ["Miyapur", "Madinaguda", "Hafeezpet", "Chandanagar", "Deepthisri Nagar"],
  kdp: ["Kondapur", "Kothaguda", "Hafeezpet", "Masjid Banda", "Raghavendra Colony"],
  gcb: ["Gachibowli", "Gopanpally", "Nanakramguda", "Telecom Nagar", "Indira Nagar"],
  mdp: ["Madhapur", "Ayyappa Society", "Guttala Begumpet", "Kavuri Hills"],
  upl: ["Uppal", "Ramanthapur", "Habsiguda", "Boduppal", "Peerzadiguda"],
  lbn: ["LB Nagar", "Vanasthalipuram", "Hayathnagar", "Saroornagar", "Kothapet"],
  amp: ["Ameerpet", "SR Nagar", "Erragadda", "Sanjeeva Reddy Nagar"],
  sec: ["Secunderabad", "Marredpally", "Bowenpally", "Trimulgherry"],
  alw: ["Alwal", "Lothkunta", "Macha Bollaram", "Old Alwal"],
};

export const RIDERS: Rider[] = [
  { name: "Demo Rider 01", phone: "0003000001", vehicle: "DEMO-001 · Tata Ace" },
  { name: "Demo Rider 02", phone: "0003000002", vehicle: "DEMO-002 · Piaggio Ape EV" },
  { name: "Demo Rider 03", phone: "0003000003", vehicle: "DEMO-003 · Mahindra Jeeto" },
  { name: "Demo Rider 04", phone: "0003000004", vehicle: "DEMO-004 · Tata Ace Gold" },
  { name: "Demo Rider 05", phone: "0003000005", vehicle: "DEMO-005 · Ashok Leyland Dost" },
  { name: "Demo Rider 06", phone: "0003000006", vehicle: "DEMO-006 · Piaggio Ape EV" },
  { name: "Demo Rider 07", phone: "0003000007", vehicle: "DEMO-007 · Mahindra Supro" },
  { name: "Demo Rider 08", phone: "0003000008", vehicle: "DEMO-008 · Tata Ace" },
  { name: "Demo Rider 09", phone: "0003000009", vehicle: "DEMO-009 · Euler HiLoad EV" },
  { name: "Demo Rider 10", phone: "0003000010", vehicle: "DEMO-010 · Mahindra Jeeto" },
  { name: "Demo Rider 11", phone: "0003000011", vehicle: "DEMO-011 · Tata Ace" },
  { name: "Demo Rider 12", phone: "0003000012", vehicle: "DEMO-012 · Piaggio Ape EV" },
  { name: "Demo Rider 13", phone: "0003000013", vehicle: "DEMO-013 · Tata Ace" },
  { name: "Demo Rider 14", phone: "0003000014", vehicle: "DEMO-014 · Mahindra Jeeto" },
  { name: "Demo Rider 15", phone: "0003000015", vehicle: "DEMO-015 · Piaggio Ape EV" },
  { name: "Demo Rider 16", phone: "0003000016", vehicle: "DEMO-016 · Tata Ace Gold" },
  { name: "Demo Rider 17", phone: "0003000017", vehicle: "DEMO-017 · Euler HiLoad EV" },
  { name: "Demo Rider 18", phone: "0003000018", vehicle: "DEMO-018 · Ashok Leyland Dost" },
  { name: "Demo Rider 19", phone: "0003000019", vehicle: "DEMO-019 · Mahindra Supro" },
  { name: "Demo Rider 20", phone: "0003000020", vehicle: "DEMO-020 · Piaggio Ape EV" },
  { name: "Demo Rider 21", phone: "0003000021", vehicle: "DEMO-021 · Tata Ace" },
  { name: "Demo Rider 22", phone: "0003000022", vehicle: "DEMO-022 · Mahindra Jeeto" },
  { name: "Demo Rider 23", phone: "0003000023", vehicle: "DEMO-023 · Tata Ace" },
  { name: "Demo Rider 24", phone: "0003000024", vehicle: "DEMO-024 · Euler HiLoad EV" },
  { name: "Demo Rider 25", phone: "0003000025", vehicle: "DEMO-025 · Piaggio Ape EV" },
  { name: "Demo Rider 26", phone: "0003000026", vehicle: "DEMO-026 · Tata Ace Gold" },
  { name: "Demo Rider 27", phone: "0003000027", vehicle: "DEMO-027 · Mahindra Jeeto" },
  { name: "Demo Rider 28", phone: "0003000028", vehicle: "DEMO-028 · Ashok Leyland Dost" },
];

/** Deterministic retailer roster per active CDS. */
export function buildRetailers(rand: () => number): CdsRetailer[] {
  const out: CdsRetailer[] = [];
  const used = new Set<string>();
  let n = 1;
  for (const loc of CDS_LOCATIONS) {
    if (loc.status !== "Active") continue;
    const count = Math.round(8 + 10 * (CDS_INTENSITY[loc.id] ?? 0.3));
    const areas = CDS_AREAS[loc.id] ?? [loc.locality];
    for (let i = 0; i < count; i++) {
      let name = "";
      let type: CdsRetailer["type"] = "Kirana";
      for (let guard = 0; guard < 50; guard++) {
        const p = RETAILER_PREFIX[Math.floor(rand() * RETAILER_PREFIX.length)];
        const sfx = RETAILER_SUFFIX[Math.floor(rand() * RETAILER_SUFFIX.length)];
        name = `${p} ${sfx.s}`;
        type = sfx.t;
        if (!used.has(name)) break;
      }
      used.add(name);
      const area = areas[i % areas.length];
      out.push({
        id: `r-${String(n).padStart(3, "0")}`,
        name,
        owner: `${OWNER_FIRST[Math.floor(rand() * OWNER_FIRST.length)]} ${OWNER_LAST[Math.floor(rand() * OWNER_LAST.length)]}`,
        phone: `0004${String(n).padStart(6, "0")}`,
        area,
        cdsId: loc.id,
        // Allwyn Colony sits on the Kukatpally / Miyapur border — the
        // serviceability check routes these retailers via Miyapur CDS.
        serviceableCdsId: loc.id === "kkp" && area === "Allwyn Colony" ? "myp" : loc.id,
        type,
      });
      n++;
    }
  }
  return out;
}
