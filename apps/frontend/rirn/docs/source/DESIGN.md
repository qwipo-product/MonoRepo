# DigiDukaan: Beyond the beat

Audience: FMCG brands and distributors. Primary outcome: a partnership conversation. Retailers are the people at the heart of the story, with a secondary app-store route. This is a public product showcase, not an ordering application.

## Concept selection

Scores out of 5; portability is better when lower.

| Territory | Originality | Product fit | Feasibility | Portability |
|---|---:|---:|---:|---:|
| Beyond the beat: the order travels beyond a scheduled visit | 5 | 5 | 5 | 1 |
| The everyday shelf: an editorial portrait of the neighbourhood shop | 4 | 5 | 5 | 3 |
| A connected India: an expansive geographic network | 3 | 3 | 4 | 4 |

Selected: Beyond the beat. The word beat belongs to distribution, and the moving order makes the product intelligible. Geographic claims would need more evidence; an exclusively photographic story would hide the product.

## Concept card

- Idea: Give the next order a way through, between scheduled sales visits.
- Metaphor: A distribution route becomes the visual thread of the page.
- Signature: A moving order travels through a route diagram as the product journey unfolds. The same advancing line, circle and arrow appear in section markers, controls and navigation.
- Emotion: Optimistic, capable, human. Enterprise technology with the energy of everyday commerce.
- Motion verb: Advance. Lines draw forward, text rises into place, arrows travel, product imagery gently changes angle with progress.
- Screenshot: Oversized dark-violet typography on a pale lilac field, a real DigiDukaan phone at an angle, and a warm apricot order marker on a continuous route.

## Design system

- Violet ink #32125C; violet field #6C3BC8; pale lilac #EAE3F4; warm paper #FAF9F5; warm apricot accent #F2CEAE; dark plum #1D122A.
- Bricolage Grotesque variable display, DM Sans variable body, both self-hosted WOFF2. Fluid display 64–176px; body 16–20px; labels 11–13px.
- Desktop 12-column layout, 48–64px gutters; mobile four-column logic, 22px gutters. Wide content capped at 1760px.
- Mostly squared editorial sections. Rounded ends reserved for route nodes, action buttons and the product stage. No repeated card grid.
- Motion: power3.out for advancing interactions; expo.out for one intro. Hover 250–400ms; reveal 900ms; navigation wipe 400ms each way. One GSAP ticker also drives Lenis. The route phase is the shared concept driver.

## Section compositions

```text
Navigation    [Q + DigiDukaan]          [Product / Network / Qwipo] [Let's talk ↗]
Hero          [Beyond                 ] [route + real phone]
              [the beat.              ] [product caption]
              [clear enterprise copy ] [moving order node]
              [primary CTA / watch journey]          [scroll ↓]
Opportunity   [01 / label] [Your relationships. A wider reach.]
              [retailer photo]        [Brands / Distributors switch + details]
Product       [02 / label] [A familiar way to do more.]
              [large phone on purple] [numbered product story / line links]
Journey       [03 / label] [From intent to order.]
              [01 discover] ─── [02 connect] ─── [03 order] ─── [04 deliver]
Qwipo         [large oversized Qwipo statement]
              [operations photo] [DMS / Logistics explanatory rows]
Enquiry       [Let's move your       ] [audience-select email brief]
              [business forward.     ] [Open email enquiry ↗]
Footer        [DigiDukaan wordmark] [company / app / back to top]
```

## Implementation and truthfulness

Next.js App Router and TypeScript: server-rendered product content with isolated interactive audience, motion and enquiry components. No WebGL is needed for a clear route metaphor. Source assets are genuine, extracted from the supplied presentations/PDF; screenshots remain visibly identified as product imagery, not current stock or partner endorsements.

The contact panel prepares an email draft to the public Qwipo address. It does not pretend to send or save an enquiry, and no lead service is configured. No numerical traction claims, customer testimonials, guaranteed delivery or instant credit promises. Delivery, catalogue, credit and integration conditions are carried into the product narrative.

The preview is noindex. Production URL is environment-configurable; launch requires a final domain and enquiry routing decision. No public deployment is authorized yet.

## Genericness test

The headline, beat explanation, route sequence, distributor-preserving story and real app image do not survive a name swap into a generic SaaS site. The design uses one subject-specific route motif, not unrelated animated ornaments. The app remains real imagery; the route is explicitly a conceptual illustration. Real field photographs balance the abstract motion.

## Accessibility and motion

All essential content is visible in initial HTML. A visible motion toggle pauses ambient route movement; system reduced motion skips smooth scrolling, reveals, parallax and page transitions. A native cursor, focus outlines, skip link and 44px primary targets are retained. The mobile composition has its own stack and simplified route.

## Review

Two production-build passes will cover desktop/mobile/reduced-motion layouts, navigation, controls and the inner page/404. Independent critics receive only rendered evidence and the rubric. Browser tooling limitations will be documented rather than replaced with invented performance or accessibility scores.

## Revision: product journey and motion

The 26 October refinement keeps the existing art direction. The inner journey uses five selectable chapters (discover, connect, order, dispatch, deliver), one matching mockup screen and three concise details per chapter. Longer conditions are progressively disclosed. A fleet/3PL route diagram follows the digital journey and explains third-party logistics without asserting universal availability.

Product visuals are six genuine viewport captures from the user-provided buyer mockup, not recreated interfaces. Screen data is explicitly illustrative. Hero screens cycle; the product exhibit also has direct screen controls; journey screens follow the chosen chapter.

Navigation map: home to journey and journey to home use short native React View Transitions. Same-page hash links use one explicit Lenis handler; cross-page hash links remain Next Links. The global scroll engine persists across routes. Per-page animation is scoped to the hydrated page to avoid retained/hidden route DOM. No full-screen navigation curtain remains.

The user explicitly requested motion enabled by default. Each visit therefore starts with motion on (including when the browser reports reduced motion), with a persistent Pause/Enable control available. Pause disables automatic screen changes, floating devices, route markers, scroll smoothing and page transitions; manual controls remain usable. This is an intentional user-directed override of the previous system-locked setting, and no OS settings are changed.

## Revision: a clearer network in motion

The four summary-stage icons stand directly on the paper background, without circular badges. The route uses a 6px violet line and a lime chevron with a trailing highlight. A 7.2-second forward pass continues while the section is visible, fades before restarting, and stops off screen. On phones the same route runs vertically beside the icons and text. The existing global motion control restores a complete static line. This replaces the previous scroll-only line and hidden mobile track; the detailed journey's tab icons retain their separate treatment.

## Revision: stages follow the line

The network sequence now uses only a growing line and its inline highlight, without an arrowhead. As the leading edge reaches each stage, that stage scales to 1.045 on desktop or 1.035 on phones and a lime underline advances beneath its title. Visited stages remain emphasized until the pass ends; they then return together to their original scale. Stage timing comes from layout offsets so the vertical phone route follows the actual copy height. One GSAP timeline coordinates the route and stages; no frame-by-frame React state updates are added.

The full-journey link is a high-contrast pill with a brief shimmer every few seconds while visible. Both animations use the existing clock, stop off screen, revert on navigation, and stop through the motion control. The complete line, readable stages, and clearly styled CTA remain in the paused state.

## Revision: hero screen-change spin

Only the hero phone uses a rapid 0.8-second full turn around its vertical axis when its next screenshot is ready. The screen changes halfway through, while the front faces away. A simple shaded phone back prevents mirrored app text during the rotation. The spin settles at the same orientation. Its own nested wrapper composes with the unchanged scroll tilt/translation and existing idle float; other devices retain their existing screen transitions.

The next hero screenshot preloads only after the current one is decoded and while the device is visible. The spin waits for it to be ready, preserving the fast embedded first preview and avoiding a blank reveal on slow connections. The existing motion control and off-screen cleanup stop pending changes and return a partially turned phone to a readable face. The animation uses GSAP's clock and updates React state only at the screen swap.

## Revision: mirrored phone tilt and paired route arrows

Each hero spin now mirrors the phone's current composed tilt about its centre. At the top of the page the existing -10-degree pose becomes +10 degrees, then alternates back; -25 degrees would likewise become +25. The spin's inner rotation compensates for the current outer scroll angle, leaving the scroll animation's translation, endpoint and timing unchanged. Pause and off-screen cleanup keep the current screen readable at its committed tilt.

Two lime arrows travel on the same route, half a cycle apart, using the existing GSAP clock. Their travel is limited to the horizontally visible part of the rail with edge clearance. Compact desktop and mobile rails spread around the phone to prevent both arrows being hidden together; the wide desktop rail retains its existing shape. Responsive route geometry is measured on resize, not every frame. The original artwork, labels and product screenshots remain in place.

## Revision: a readable product exhibit

The product exhibit now has three separate areas: a readable “Order. Connect. Repeat.” line above the phone, a centred device with space for motion, and stationary screen controls beneath an “Explore the app” cue. This replaces the oversized background text that the phone obscured. The violet field, orbit lines and lime selection state retain the existing visual identity.

The panel uses content-driven grid rows rather than absolute text positioning or fixed minimum heights. Its headline scales with the panel width. The 390px phone layout uses a larger 210px device; narrow panels switch to a 190px device and two columns of 44px-tall controls. The product scroll transform targets only the device frame, leaving controls level and stationary. Hero spin, mirrored tilt and paired arrows are unchanged.

The screenshot disclaimer has a 12px type size and ink colour. Production checks cover 320px, 390px, 768px and 1280px layouts, automatic and paused motion, screen selection and keyboard focus. See `docs/13-product-panel-layout.md` for evidence and review limits.

## Revision: paired circular phone transitions

The product exhibit now advances a pair of real phone frames around an invisible centre below the violet panel. On every screen change, the outgoing phone curves down and right while the incoming phone curves up from the left; both tilt with the circle and move simultaneously. This choreography is explicitly confirmed by the user and applies to automatic and manual changes.

The existing Next.js, React and GSAP stack keeps this scoped animation in its own client component. One timeline rotates both phones around the same measured centre. A clipped preview area protects the fixed headline and controls. Screen images retain embedded previews and progressive loading; the next automatic screen preloads after the current image is ready. Rapid selections queue the latest destination without creating more moving phones. Pause and off-screen cleanup settle to a readable selected screen. This replaces the product exhibit's prior scroll tilt and floating fade; the hero animation is separate.


## Revision: a softer secondary colour

The fluorescent lime is replaced by warm apricot (#F2CEAE). This keeps violet as the dominant brand field and gives actions and order markers a warmer, quieter character suited to the existing product and field imagery. Soft sage was considered but weakened the warm/cool separation; muted amber felt too yellow beside the lilac. Apricot preserves a clear secondary role without the fluorescent effect.

The semantic `--accent` token now drives buttons, selected screens, route arrows, stage highlights, the journey shimmer, enquiry highlights and focus details. The favicon and sharing image use the same colour. Selected phone controls also receive a violet-ink border so the softer fill remains easy to distinguish from neighbouring paper buttons. Original product screenshots and supplied brand assets retain their source colours. Earlier revision descriptions of lime document the previous palette.

Contrast ratios: violet ink on apricot 10.33:1, apricot on violet 4.59:1, and apricot on dark plum 12.13:1. Apricot is a fill or decorative highlight on light backgrounds, never small text on paper. Layout, choreography and animation timings are unchanged.

## Revision: an illustrated network route

The network summary felt detached: its moving rail sat above small utility icons, with generic sublabels and long descriptions below. Three directions were considered: a schematic transit line (clear but impersonal), a single changing order card (compact but hides the sequence), and an illustrated distribution street (clear physical handoffs with all four steps visible). The illustrated street best fits DigiDukaan's retailer/distributor relationships and the existing advancing-line concept.

The revised section pairs four lightweight inline SVG scenes with the route: a stocked shelf and product search, the connected distributor storefront, an order and parcel, and a delivery vehicle at the shop. A line runs directly under the scenes, with small straight ticks connecting each stop. Actor labels replace abstract taglines; the headline now includes the delivery destination. Artwork is conceptual illustration, not a screenshot or a claim about live operations. The adjacent detailed logistics section retains the operating conditions.

One existing GSAP timeline drives the line, stage scale, artwork lift and title highlight. Visited stops remain emphasized until the route completes and then reset together. There is no arrowhead, circular icon badge, extra animation loop or image download. The full-journey CTA retains its shimmer. On phones, a vertical route supports compact rows with the artwork beside the title and copy below. Pause restores a fully readable static route. The original user-directed motion-on default remains in force.

Existing Next.js source and the repository's React/Vite adaptation are retained. No dependency is added. This refinement changes only the network summary and its scoped styles/motion.

Verification: production layouts checked at 320px, 390px, 768px and desktop width; no horizontal overflow in the checked states. The paused route restores readable untransformed stages, and both Next and Vite journey links open the detailed journey. Desktop and mobile axe runs reported zero violations; automated contrast inspection retains incomplete checks on some existing decorative content. Scoped repository lint/type/build passed, with only unchanged version-badge checks served from cache. Two independent screenshot critiques informed additional mobile scale clearance and stronger role-label typography. Their latest scoped score was 7.25/10 before the final label adjustment, not a whole-site award score. Real-device throttled performance and keyboard hover measurements were not benchmarked in this scoped pass.


## Revision: distinct product and company stories

The homepage is dedicated to DigiDukaan. The header and phone exhibit use the product name alone; About Qwipo navigation, footer credit and enquiry recipient disclosure preserve the company connection. The full delivery explainer stays on home, framed around accepted DigiDukaan orders, own-fleet delivery and approved 3PL capacity.

About Qwipo is a separate editorial page: a company introduction with existing field photography, a clear company/product relationship, and DMS and Logistics Tech capabilities with their implementation conditions. It uses the established palette, fonts, progressive imagery and page transitions. It is intentionally quieter at rest than the product homepage; existing interactive feedback and page reveals provide continuity without a second signature animation.

Decorative photo arrows, section arrows, audience arrows and the footer arrow are removed. The two moving hero route arrows, phone choreography and useful action/scroll indicators remain. Contact role labels are title case; the compact form and API contract are unchanged. Journey metadata now describes the visible five-step flow.

Source: Next.js route /about-qwipo. Deployment mirror: query route ?page=about-qwipo, preserving preview base paths. Existing research in docs/01-qwipo-understanding.md supports the company/capability copy; no new metrics, partner endorsements or universal service promises were added.


## Story and technology-provider refinement — 28 October 2026

The homepage must explain what DigiDukaan is, why kiranas need it, ONDC's network role and the order handoffs. The user confirmed the existing distributor model: own fleet with optional approved 3PL. Do not insert the 2.0 dark-store model into this version.

Qwipo for DigiDukaan is a dedicated technology-provider page, not a general company profile or an ownership diagram. Use the existing type, colours and motion. Its functional diagram replaces the generic delivery photograph and separates software responsibilities from supply and transport. ONDC is the open network; Qwipo provides technology; sellers supply and accept orders; delivery teams transport goods. No exclusive-provider claim, universal integration promise or unverified scale metrics.

The new explanation uses static HTML and CSS, with existing reveal motion only. No extra animation library, screen capture source or heavy image is added. Keep all changes local and uncommitted; no push or deployment without a new explicit user instruction.


## Hero introduction — 29 October 2026

The user-approved product introduction appears as two complete paragraphs beneath “Beyond the beat.” The first defines DigiDukaan, its retailer audience and distributor connection; the second describes discovery, ordering and delivery. Both remain visible, with a slightly stronger first paragraph, a wider reading measure and one shared entrance using the existing animation system. No carousel or additional animation library is introduced.

Desktop spacing is tightened to keep the primary actions visible at 1280 × 720. Mobile body text is 16px, reducing to 15px on the narrowest layout. The existing phone scroll, spin, alternating tilt, screenshot cycle and two route arrows are unchanged.

Validation: source lint and production build passed; the deployment app's scoped lint, type and build checks passed. Browser checks covered 320px, 390px, 768px and 1280px layouts, including paused motion, with no horizontal overflow or text/device overlap in the checked states. This was a scoped copy/layout check, not a new whole-site performance benchmark. The user explicitly authorized pushing this update and monitoring its feature-branch deployment.
