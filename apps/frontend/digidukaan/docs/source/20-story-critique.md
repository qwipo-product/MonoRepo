# DigiDukaan story critique and local refinement

Reviewed 28 October 2026. Scope: narrative, roles, information architecture and representative desktop/mobile checks. These findings record the local review before publication.

## Verdict

The previous site had a strong visual identity but asked visitors to infer the product definition, the reason for ONDC and Qwipo’s exact role. Benefits and motion arrived before a sufficiently clear explanation. The revised site answers those questions explicitly, while keeping the existing product imagery, logo and motion.

The intended story is:

1. **What:** DigiDukaan is a B2B ordering app for kirana stores, connecting them with participating distributors and wholesalers through ONDC.
2. **Why:** Replenishment can depend on visits, calls and separate brand channels. The app gives stores another way to discover supply and place orders between scheduled visits.
3. **How it feels:** The product section shows the retailer experience, with illustrative screens from the approved buyer mockup.
4. **ONDC’s role:** Common network standards connect participating buying and selling systems. Sellers provide the goods and commercial terms.
5. **What happens to an order:** Discovery → seller connection → order placement → seller acceptance/preparation and dispatch → delivery and confirmation.
6. **Where Qwipo fits:** A dedicated page explains Qwipo’s app, network integration, DMS connections, logistics software and operational information.
7. **Next action:** Brands and distributors can discuss their market, network, seller systems and delivery requirements.

The user confirmed the **existing distributor model: own fleet with optional 3PL**. The later DigiDukaan 2.0 dark-store model is not presented as the current offering.

## What changed

| Previous gap | Local change |
| --- | --- |
| “Beyond the beat” introduced a benefit before defining the product | Hero explicitly defines DigiDukaan and connects the beat concept to scheduled sales visits |
| The reason for the product remained broad | “Why DigiDukaan” describes fragmented replenishment and the role of a common ordering experience |
| ONDC appeared without a full explanation | New homepage section separates the ordering experience, open network and authorised sellers; it links to ONDC’s own overview |
| “About Qwipo” suggested a general company/ownership story | Renamed all visible navigation to “Qwipo for DigiDukaan” and built a dedicated technology-provider page |
| Software, supply and delivery could be conflated | Provider page assigns responsibilities explicitly to ONDC, Qwipo, sellers and delivery teams |
| DMS integration remained abstract | Added a two-direction information flow: catalogue data towards ordering channels, orders and status information through the agreed integration |
| The full journey required opening every tab | Added a concise, always-visible five-step synopsis |
| Several contact prompts were generic | Contact introduction now asks about market, distributor network and ordering process |
| Old page addresses could break | Next route redirects; deployment query route preserves a compatibility alias |

Routes: source `/qwipo-for-digidukaan`; deployment adaptation `?page=qwipo-for-digidukaan`. Existing preview prefixes and relative asset paths are retained.

## Evidence and factual boundaries

| Evidence | Use and boundary |
| --- | --- |
| User clarification in this conversation | Chooses distributor fleet plus optional approved 3PL as the current delivery model |
| [ONDC DigiDukaan overview](https://www.ondc.org/pages/digidukaan.html), accessed 28 October 2026 | Supports unified retailer ordering across participating businesses and continued distributor relationships. No public scale counters were copied |
| [About ONDC](https://www.ondc.org/pages/about-us.html) | Supports the open network and interoperability explanation |
| [ONDC technology service providers](https://www.ondc.org/pages/technology-service-provider.html) | Explains the general software-provider role; does not establish an exclusive Qwipo appointment or certification |
| `Qwipo-ITC-ONDC-DMSConnector Aug 2026 (1).pptx`, slides 1–2, extracted as `.research/extracted/S5.txt` | DMS master-data ownership, connector mapping, catalogue/stock/schemes and order/status exchange. This is a draft integration proposal; interfaces and timing remain engagement-specific |
| `Qwipo Business Model Apr 2026.pptx`, slides 7–8, extracted as `.research/extracted/S7.txt` | Retailer app and logistics software capabilities. Future AI propositions are excluded |
| `ONDC DigiDukaan 2.0.pptx`, full extracted transcript in `docs/evidence/ondc-digidukaan-2/transcript.txt` | Reveals the alternative consolidation model. The user chose the existing model for this website, so its dark-store, minimum-order and delivery promises are not imported |
| Existing `docs/01-qwipo-understanding.md` and `docs/04-claims-and-decisions.md` | Cross-document research and unresolved public-claim boundaries |

Qwipo is described by its technology contribution. The site makes no exclusive-provider, ONDC-ownership or universal-integration claim. Availability, delivery and integration scope remain conditional. The existing mockup disclaimer continues to distinguish screenshots from live prices, stock and delivery guarantees.

## Independent critique

Two separate critics reviewed before/after rendered evidence without source code or design notes. These are independent estimates using the skill’s rubric, not Awwwards scores or certification. The scope does not support a full award or performance assessment.

| Criterion | Before | After |
| --- | ---: | ---: |
| Design | 7.0 | 7.4 |
| Usability | 6.5 | 7.2 |
| Creativity | 6.5 | 7.0 |
| Content | 7.0 | 7.8 |
| Weighted estimate | 6.75 | 7.3 |

The second critic could correctly explain DigiDukaan, the replenishment problem, ONDC, Qwipo and physical fulfillment in one sentence. It highlighted the homepage role comparison and provider-page diagram as the clearest explanations. Scores preceded three minor final copy edits: earlier sales-visit wording, simpler dispatch signposting and removal of a repetitive integration disclaimer. Those edits were not rescored.

## Recommended next improvements

| Priority | Improvement | Why it matters |
| --- | --- | --- |
| 1 | Add one approved retailer/distributor story: situation, actual order, handoff, outcome | The site now explains its claims but still lacks concrete proof. Use verified results and dates; an invented case must be clearly illustrative |
| 2 | Use the same five stages in the homepage illustration and detailed journey | The current four-stage summary includes preparation within Order, while the detailed journey gives Dispatch its own step. The signpost makes this understandable, but identical boundaries would be easier to remember |
| 3 | Combine the mobile five-step synopsis with the selectable step navigation | Both are useful, but stacked together they postpone the active chapter. A single selectable list could retain the complete story with less repetition |
| 4 | Shorten the Qwipo page’s repeated capability descriptions | Keep the responsibility comparison and concrete DMS flow; move detailed integration conditions into expandable content |
| 5 | Make both brand and distributor outcomes visible at a glance | The audience switch currently hides one set of benefits. A brief parallel summary would help visitors understand value without interacting |
| 6 | Publish approved availability and integration scope | A dated list of supported markets and configured systems would help prospects qualify themselves. Do not infer it from old proposals or mockup screens |
| 7 | Improve source-capture sharpness and measure the complete mobile experience | Preserve the approved screenshot source and progressive loading. Wrapping pixels in SVG does not create genuine detail. Benchmark a throttled phone before adding more motion or media |

The existing full logistics explainer remains on the homepage as previously requested. No extra decorative animation was added.

## Verification and limitations

- Source Next.js lint and production build passed, including the new route and legacy redirect.
- Deployment adaptation lint, type-check and build passed: five successful tasks. Vite reports one JavaScript chunk at approximately 501.44 kB minified / 171.48 kB gzip, just over its default 500 kB warning threshold. This is a future route-splitting candidate, not a failed build.
- Desktop 1440×1000 and phone 390×844 review screenshots cover home, provider and journey. The provider header was also inspected at 900 and 820 pixels.
- Automated checks on the three mobile page states and the desktop provider page reported no horizontal overflow, no targets below the checker’s size threshold and zero axe violations. Some contrast and label checks remain incomplete; this is not full accessibility certification.
- Verified the new desktop link with Enter, mobile menu navigation to the ONDC section, destination focus, source legacy redirect and deployment legacy query alias. Representative runtime inspection found no console errors in the deployment preview.
- Product screenshots, hero spin, paired arrows, orbit choreography, logistics interactions and contact API implementation were not rewritten. No live enquiry was submitted.
- Full-page reading screenshots use the existing pause control. OS reduced-motion behavior, hover coverage, throttled mobile LCP and animation FPS were not benchmarked in this scoped narrative pass.
- Local evidence: `.jury/story-before/`, `.jury/story-after/`; review screenshots: `docs/verification/story/`.
- Temporary local preview servers were stopped after testing. At review time, Git HEAD was `4b0f163654415cfa09d94c4431df9b84a20286f3` and the changes were uncommitted and unpushed.
