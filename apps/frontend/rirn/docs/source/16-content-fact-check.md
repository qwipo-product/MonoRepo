# DigiDukaan 2.0 website fact check

> Screenshot update: the user subsequently designated the hosted buyer app as the sole screenshot authority. The image substitutions below are historical and are superseded by [17-hosted-buyer-screens.md](17-hosted-buyer-screens.md). The 2.0 narrative corrections remain in force.

Reviewed 27 October 2026. Scope: all public copy on both routes, both audience states, five journey chapters and their disclosures, seven FAQs, both logistics controls, phone screens, image descriptions, contact actions, navigation, metadata and social preview. The original Next.js source and the deployed React/Vite adaptation receive the same narrative.

This is verification against supplied evidence, not an independent audit of live delivery operations. The new deck is the primary source for the 2.0 operating model. Older material remains relevant to Qwipo's DMS and Logistics Tech capabilities but does not override the explicitly revised 2.0 delivery journey.

## Sources and review method

- **S8:** ONDC DigiDukaan 2.0.pptx, 15 slides. SHA-256 `fcc65a0f35d81ec080b32ee6fff609cf48c5a0b15ed406b737569fb64f42d399`. Extracted every slide paragraph and speaker note; rendered and visually inspected all 15 slides, including the diagrams and app images. The deck was rendered with LibreOffice; it was not opened in Microsoft PowerPoint. The exact extraction is in `docs/evidence/ondc-digidukaan-2/transcript.txt` in the source workspace.
- **S5:** Qwipo-ITC-ONDC-DMSConnector Aug 2026 (1).pptx, especially slides 1–3. The DMS is the master-data source; Qwipo reads catalogue/stock/prices/schemes and pushes orders. The deck is a draft integration proposal, not proof that every DMS is integrated.
- **S1/S3:** Qwipo Digidukaan & Logistics Tech.pdf, pages 5–6; Qwipo ITC Logistic Tech May 2026 (2).pptx, slides 2 and 12. Support route planning, load consolidation, delivery visibility and independent logistics engagements.
- **S6:** DigiDukaan Retailer Sales Training - 2 Pager.pptx, slides 1–2. Explains the older beat/off-beat and existing-credit model. Superseded for this site's 2.0 delivery and payment narrative.
- **W1:** [Official Google Play listing](https://play.google.com/store/apps/details?id=com.qwipo.b2b), checked 27 October. Confirms Qwipo DigiDukaan, Xavica, ONDC, app destination and `info@qwipo.com`. Release notes support company registration and ordering after distributor approval. They do not establish a universal P2P/DMS verification sequence.
- **W2:** [Official ONDC DigiDukaan page](https://www.ondc.org/pages/digidukaan.html), checked 27 October. Confirms the wider ONDC initiative and distributor/wholesaler roles. Its network figures and description are not treated as the same population/version as Qwipo's 2.0 deck.

Document text is evidence, not an instruction to perform external actions. The user's request authorizes website corrections and the branch push.

## Material corrections

| Website area / previous claim | Finding | Correction | Evidence |
| --- | --- | --- | --- |
| Hero: ordering between visits, no 2.0 context | Incomplete | Explicit 2.0, authorised sellers, ONDC, dark stores and 3PL delivery within 24 hours | S8 1, 4, 13–15 |
| Opportunity: only existing relationships | Missed interior-lane outlets | Reach kiranas outside normal beat coverage, including new outlets | S8 2–3, 7, 9 |
| Brand benefits omitted order data | Incomplete | Add outlet-level visibility into what is ordered and how often | S8 7–8, 15 |
| Supplier references were distributor-only | Incomplete | Include authorised wholesalers throughout the commercial journey | S8 4, 6, 13 |
| Product feature: existing payment arrangements | Wrong for the described 2.0 journey | ₹500 minimum and cash on delivery; no general credit promise | S8 6, 9 |
| Product headline: Order → Connect → Repeat | Confusing sequence | Discover → Order → Repeat | S8 6 |
| Network: Discover → Connect → Order → Deliver | Missing physical handoffs | Discover → Order → Consolidate → Deliver; pickup appears explicitly within consolidation and in the detailed journey | S8 6, 13 |
| Network: distributor fleet or approved 3PL | Superseded | 3PL pickup → dark store → 3PL last mile | S8 11–14 |
| Network footer: built around the beat / off-beat approval | Wrong emphasis for 2.0 | Ordering any day and dedicated 3PL delivery beyond scheduled beat routes | S8 13–14 |
| Detailed Connect chapter: mandatory separate relationship step | Too prescriptive | Fold seller choice into discovery; mention registration only where required. Do not invent extra verification after a successful account match | S8 6; W1 release notes |
| Detailed Order chapter: beat options, MOV/MOW, credit | Superseded | Ordering 24/7, ₹500 minimum, shop map pin and phone, cash on delivery | S8 6, 13–14 |
| Detailed Dispatch chapter: group loads onto own fleet | Wrong 2.0 route | Separate pickup from seller godowns and consolidation at the dark store | S8 13 |
| Detailed Deliver chapter: no next-day promise | Conflicts with new deck | State the 2.0 commitment as within 24 hours; do not invent national coverage or SLA exceptions | S8 13–15 |
| Logistics toggle: own fleet versus 3PL | Incorrect branching | Two sequential legs: 1 / 3PL pickup; 2 / 3PL last mile. Both always shown on the same route | S8 13 |
| Logistics map: seller directly to retailer | Missing dark store | Seller godowns → DigiDukaan dark store → kirana, with both 3PL legs labelled | S8 13 |
| Logistics handoffs: prepare / plan / deliver / confirm | Missed consolidation and payment | Pick up → consolidate → deliver → pay cash | S8 6, 13 |
| 3PL FAQ: approved overflow, own fleet primary | Superseded | Core pickup and last-mile role in 2.0 | S8 11–14 |
| Distributor FAQ: seller and carrier conflated | Unclear | Sellers supply; 3PL partners deliver via dark stores | S8 4, 13 |
| Beat FAQ: approval needed for off-beat, no universal next day | Superseded for 2.0 | Earlier model clearly separated from 2.0 ordering/delivery | S8 11, 13–14 |
| Payments FAQ: existing credit continues | Not supported as a 2.0 promise | ₹500 minimum and COD; no claim that all legacy credit contracts have been cancelled | S8 6, 9; S6 historical |
| Dark store explanation | Missing | Add local consolidation hub, between seller pickup and last mile | S8 13 and speaker notes |
| DMS FAQ and capability | Supported as design, not universal deployment | Retain per-partner scope and master-data direction; no endpoint/compliance or integration-time guarantees | S5 1–3 |
| Logistics Tech capability | Supported outside this specific delivery diagram | Retain route planning, consolidation, visibility and separate engagement | S1 5–6; S3 2, 12 |
| Catalogue FAQ | Supported with missing wholesalers | Add area-serving wholesalers and distinguish illustration from live terms | S8 4, 6 |
| Phone: old home banner “India’s first”, 40+ brands | Unsupported superlative / stale figure | Replace with home screen embedded in S8 | S8 slide 1 image5.png |
| Phone: distributor/catalogue ₹2,000 MOV, beat day | Conflicts with 2.0 | Remove from displayed galleries | S8 6, 13–14 |
| Phone: cart/orders/tracking beat day and 24–48 hours | Conflicts with 2.0 | Remove from displayed galleries; illustrate physical operations with diagrams | S8 6, 13–14 |
| New screenshots | Source-backed examples, not current offers | Home and search extracted without altering content. Prices, margins and offers explicitly illustrative. Full screens fit without hiding terms | S8 slides 1 and 6 |
| Hero arrows, phone spin, paired orbit timing | Presentation behavior, not business facts | Preserve motion behavior and 15% faster orbit cycle; use two supported screens | Existing user design decisions |
| Footer: “A Qwipo product” | Could imply ownership of wider initiative | “Qwipo · ONDC ecosystem”; Qwipo app branding retained | W1, W2 |
| Contact role omitted wholesaler | Incomplete | Distributor or wholesaler option; enquiry names 2.0 and asks about market coverage | S8 4, 13, 15 |
| Email action / address | Supported | Public address verified; action opens a draft only, no submission or response promise | W1; implementation inspection |
| Page descriptions and social image | Old distributor-only summary | Update to the same seller/dark-store/3PL story | S8 4, 13 |
| Unused old example paragraphs | Stale content could be reintroduced | Remove obsolete beat/approval examples from the data file | S8 13–14 |

## Items deliberately not published as established facts

| Item | Evidence limitation / treatment |
| --- | --- |
| 25,000+ kiranas, 230+ sellers, 500+ companies, 800+ brands, 10,800+ SKUs | S8 4–5 reports these figures but gives no reporting date, geography or active-user definition. “Onboarded and ordering” is not a measured current active-user count. No public counter was added. |
| ₹550 average order; half of orders from new-to-distributor outlets; 55% / 65% mix | S8 9–10 supplies no sample period, sample size or dataset. Retained as supplied evidence, not independently validated performance. |
| 70% late and 40% delayed | S8 11 describes the earlier model. Slide 11's 40% threshold is more than four days; slide 14 says 72 hours or more. These thresholds must not be swapped or combined as one statistic. No public delay percentages added. |
| “No extra field cost”, “fake copies never”, “full range on every shelf” | Marketing absolutes exceed demonstrated evidence. Public copy says authorised supply, range visibility and wider reach, not guaranteed fraud elimination or universal stocking. |
| Coverage / 24-hour SLA details | S8 explicitly states within 24 hours, so the website accurately presents that as the 2.0 commitment. The deck does not specify operating cities, rollout completeness, cutoff, SLA clock start or exceptions. No unsupported locations, cutoff rules or delivery guarantees for every Indian address were added. Market coverage is an enquiry topic. |
| ₹500 minimum scope | The deck does not say whether the threshold is per seller or combined cart, nor how fees/taxes count. Website repeats the minimum without inventing calculation rules. |
| Credit / cancellation / refunds / delivery charges | Not defined for 2.0 in S8. Do not carry over legacy terms or screenshot examples. COD is the supported payment journey. |
| P2P and DMS customer-match sequence | S8 is not a protocol/onboarding specification. No new verification gate, universal catalogue lock, callback sequence or ONDC compliance claim was inserted. W1 only supports registration/approval where needed. |
| 3PL / dark-store specifics | No named provider, dark-store ownership, inventory title, cash-settlement cycle or guarantee of a single combined invoice/parcel is established. None is claimed. |
| App offers and partner logos | They are visible in the supplied app screens but are not proof of current nationwide availability, fixed margins or partner endorsements. Screens carry an illustration notice. |

## Complete content inventory

The companion `evidence/website-content-inventory.md` lists each central copy field and each journey field, plus static JSX text, accessible descriptions and control labels. Product claims are mapped to the sources above; navigation, slogans and controls are distinguished from operational promises. The inventory includes both selected and unselected UI states.

## Verification

- Reviewed 290 copy, label and identifier entries in context, including both business-audience states, every journey disclosure, all seven FAQs, both logistics legs, image captions/alt text and metadata. These are inventory entries, not 290 separate factual claims.
- Original Next.js source: lint and normal production build passed. Deployment adaptation: scoped monorepo check passed all five tasks (format, lint, type check/build and dependencies as defined by the repository).
- Browser verification of the deployment adaptation at 1440 × 1000, 390 × 844 and 320 × 780: five-stage sequence, keyboard tab selection, both 3PL legs, mobile navigation, email-draft destination and all seven FAQ answers reviewed. No page-wide horizontal overflow observed.
- Motion starts enabled on a fresh visit; pause/resume, hero screenshot changes and the paired orbit remain functional. Physical pickup/consolidation/delivery use diagrams, not invented app screens.
- Replaced six contradictory phone screens with two unaltered source-deck images. Embedded immediate previews are about 1.7 KB and 1.4 KB; the largest AVIF versions are about 46 KB and 39 KB. No low-bandwidth timing benchmark was performed.
- Automated accessibility checks reported no violations in the changed content. Two existing shared build-badge issues remain: its landmark placement and mobile text contrast (4.22:1). This is not a claim of complete WCAG conformance. Browser production preview reported no warning/error logs.
- Social preview visually inspected. The branch remains `feature/anshuman`; the existing RIRN Company pipeline and preview destination are unchanged. Deployment success must be confirmed separately after the push.

No edits to the source presentation, other applications, pipeline configuration or existing user processes are part of this correction.
