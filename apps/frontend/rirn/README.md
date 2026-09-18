# @mockups/rirn

**Retailer Identity & Relationship Network** — a trusted identity layer for
B2B commerce.

Built so far: the **company discovery console** — the vertical slice that
demonstrates the whole thesis.

```bash
bun dev --filter=@mockups/rirn
```

http://localhost:5173 · sign in as ITC, HUL or Britannia.

## The problem it mocks

The same retailer has a different ID in every system — `ITC-RET-1234` at one
company, `HUL-RET-7821` at another, `DIST-9281` at a distributor, plus one per
buyer app. Nothing can assert those are the same legitimate business.

The catch is that companies and distributors won't fix this by pooling their
customer masters — they fear competitors harvesting retailer lists and buyer
platforms approaching their retailers directly. So the product has to solve
identity fragmentation **without** becoming the central customer database
nobody will contribute to.

The answer in the PRD is an *authorization-aware identity graph*: a network ID
(`NRID-…`) that maps to each participant's existing IDs rather than replacing
them, with four concepts kept deliberately separate —

| Layer | Question | Owner |
|---|---|---|
| Identity | Who is this retailer? | Network / Retailer |
| Relationship | Does a company/distributor link exist? | Company / Distributor |
| Authorization | May this retailer transact? | Company / Distributor |
| Commercial terms | What price, MOQ, credit? | Company / Distributor (never the network) |

Knowing who a retailer is grants nothing. That separation is what makes the
network safe to join.

North star metric: verified retailer identities with **two or more** trusted
participant relationships — a single-relationship retailer proves no network
effect.

## Intended information architecture

Identity (retailers, mappings, resolution queue) · Participants (companies,
distributors, buyer & seller apps) · Relationships · Authorization · Consent ·
Audit · Settings.

## What's built: the company console

Search a locality or PIN code, see who's there, decide who to map. Shaped like
a property search — search bar, map, result rail — because that pattern is
well understood. **The disclosure runs the opposite way**, and that inversion
is the point.

### The contribution economy

The retailer base is Qwipo's asset. A company that browses it and maps nothing
is extracting value and returning none, so:

- Unlocking a retailer **costs 1** from a daily allowance of **20**
- A DMS-confirmed mapping **earns 5 back**

Browse-only runs dry; contribute and you keep going. That's PRD §15
anti-harvesting expressed as an economy rather than a wall, and the meter sits
in the top bar precisely so it can be felt. Both numbers are in
`src/lib/company-session.ts` and are the first thing to tune after a demo.

### Three levels of disclosure

| State | What's shown |
|---|---|
| **Locked** | Business name, category, locality, verification badge — plus the withheld fields, listed by name with their values obscured |
| **Unlocked** | GSTIN, address, proprietor, and the signals below |
| **Mapped** | Their DMS ID attached and confirmed |

Clicking a pin opens a card on the map. Before an unlock it names the fields
it is holding back — Address, GSTIN, Contact number — with the values blurred,
so the withholding is legible rather than looking like missing data.

Those blurred rows render a **decoy** string, never the real value. A CSS blur
is a visual effect, not a security boundary; blurring the true address would
still ship it in the DOM for anyone who opened devtools, quietly undoing the
model this mockup exists to argue for. Contact number has no real value to
leak — it isn't on the `Retailer` type at all.

The unlocked view **leads on what a company can't get from its own DMS** —
duplicate detection ("this matches your record RET-8891"), verification
provenance, distributor coverage, purchase band. Contact detail is almost an
afterthought, deliberately: if an unlock only returned an address, the company
would feel taxed rather than served, and the trade would collapse.

**Phone number is never shown, at any state.** §15.4 marks it "Controlled"
even for companies. It isn't even on the `Retailer` type.

### Approximate location until you earn precision

§16 puts approximate location at Level 1 (public) and the exact address at
Level 2 (consent). So an unmapped retailer renders as a **soft dashed disc,
offset up to ~400m from its true position** — you can see that a pocket of
Kondapur has fourteen kirana stores, but you can't drive to one. Map it and the
pin snaps to the real coordinates and turns blue.

The offset is deterministic per NRID. A fuzz that reshuffled every render would
look broken *and* average out to the true position for anyone patient enough to
watch.

### No total count

The rail says "Showing 12", never "158 results". §32: exposing a total for a
searchable query hands over an enumeration oracle — you can binary-search the
base without ever unlocking anything.

Search matches locality, PIN code or city, but **not business name**. Name
search would turn the base into a lookup service for a list you already have,
which is the harvesting path the design is trying to close.

### DMS verification

Nothing commits on the company's say-so — the ID round-trips to their DMS
first. `src/lib/dms.ts` fakes that, deterministically so demos can be
rehearsed:

| Input | Outcome |
|---|---|
| `RET-1000`–`RET-8999` | Confirmed, mapping commits, +5 unlocks |
| `RET-9000`+ | Not found in your DMS |
| An ID already mapped | Already bound, names the NRID holding it |
| `RET-4242`, `RET-5150` | GSTIN mismatch — refuses, suggests a dispute |
| Anything else | Bad format |

The GSTIN-mismatch branch is the interesting one: the ID is real, the retailer
is real, and they still shouldn't be linked without a human looking.

## Layout

```
src/lib/retailer-base.ts     the Qwipo-seeded base — 48 Hyderabad retailers
src/lib/company-session.ts   quota, unlocks, mappings (the economy)
src/lib/dms.ts               fake DMS round-trip incl. failure branches
src/components/retailer-map.tsx           leaflet + the fuzzing rule
src/components/retailer-detail-sheet.tsx  locked / unlocked / mapped
src/pages/discover.tsx       map + rail
```

## Not built yet

Distributor console, buyer-app retailer self-service, and the Qwipo Admin
screens (companies grid, retailer base map, identity-resolution queue, abuse
panel). Each is a variation on the same shell — `AppShell` from
`@mockups/web-ui` takes a `NavItem[]`, where `disabled` greys out screens that
don't exist yet.

Browse the available components at `bun dev --filter=@mockups/storybook-web`
(:6007) before writing your own.

The source PRD lives outside this repo at `/Users/apple/Qwipo/rirn/RIRN PRD.pdf`.
