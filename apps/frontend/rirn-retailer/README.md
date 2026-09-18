# @mockups/rirn-retailer

The **retailer-facing** half of RIRN — the pages a shop owner sees inside a
buyer app's WebView. Search a company, give them your customer ID, see which
companies you're already connected to.

```bash
bun dev --filter=@mockups/rirn-retailer
```

http://localhost:5176 · demo shop pre-filled, **OTP is `1234`**

## Why it's a phone app, not part of the RIRN console

`@mockups/rirn` is a desktop admin console for company staff.
This is a kirana owner on a phone, in a WebView, between customers.

So it's built on the **mobile kit** — `@mockups/ui` + `@mockups/design-tokens`
— with 44px targets, one-thing-per-screen and a bottom sheet. Building it with
`@mockups/web-ui` would have made it look right on a laptop and wrong on the
only device that matters.

## No quota, no locked cards

Everything metering the company console exists because a company browsing the
retailer base is drawing down Qwipo's asset. Here the retailer is declaring
**their own** IDs about **their own** shop. There's nothing to harvest, so
there's nothing to ration — no unlock economy, no fuzzed locations, no
withheld fields. Company names and brands are public, so search is
unrestricted.

It's also the cheapest way to seed the graph: a retailer who self-declares
"my ITC ID is RET-1234" has done, free, the work a company spends an unlock on.

## The risk that replaces harvesting

**The company-side DMS check does not work here**, and this is the important
bit.

When ITC types `RET-1234`, the network confirms the ID exists in ITC's DMS —
ITC is asserting something about its own records, so existence is enough. When
a *retailer* types `RET-1234`, existence proves nothing: the ID is real, but
is it *theirs*? Unchecked, a retailer could guess IDs and attach themselves to
a neighbour's relationship — which corrupts the graph rather than merely
leaking from it.

So this side checks **ownership**, in two tiers:

1. **GSTIN match** — the DMS record's GSTIN equals the retailer's verified
   GSTIN. Instant, silent, no human involved.
2. **Company approval** — everything else is recorded as *pending* and a human
   at the company confirms it. PRD §7.2 already lists company approval as a
   valid verification path.

Never auto-bind on the ID alone.

## Card states

The list is the product. Connected companies float to the top, and the three
states are different *shapes* rather than different badge colours — a shop
owner should be able to tell them apart at a glance, without reading.

| State | Card |
|---|---|
| **Connected** | Green surface, green left edge, the ID shown large |
| **Pending** | Same shape in amber, "Awaiting confirmation" |
| **Not added** | Plain white card with an **Add ID** button |

## Demo inputs

`src/lib/dms.ts`, deterministic so a demo can be rehearsed:

| Input | Outcome |
|---|---|
| Even serial, e.g. `RET-2468` | GSTIN matched → **connected instantly** |
| Odd serial, e.g. `RET-3337` | → **pending company approval** |
| Ends in `0`, e.g. `RET-4230` | Belongs to another shop → rejected |
| `RET-9000`+ | Not in that company's DMS → rejected |
| Anything else | Bad format |

ITC and Britannia start connected/pending so both card states are visible on
first load.

## Layout

```
src/lib/companies.ts         16 FMCG companies, searchable by name or brand
src/lib/retailer-session.ts  the retailer + their claimed IDs (no quota)
src/lib/dms.ts               ownership check — GSTIN match, else approval
src/components/CompanyCard.tsx   the three card states
src/components/ClaimSheet.tsx    the give-us-your-ID bottom sheet
src/screens/Login.tsx        mobile + OTP
src/screens/Companies.tsx    identity header, search, list
```

## Not built yet

Distributor access requests (§7.3), the consent screens — *who can see my
information* with revoke, plus access history (§18). Both are retailer-facing
and belong here rather than in the console.
