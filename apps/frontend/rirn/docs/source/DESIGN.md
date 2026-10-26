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
- Screenshot: Oversized dark-violet typography on a pale lilac field, a real DigiDukaan phone at an angle, and a lime order marker on a continuous route.

## Design system

- Violet ink #32125C; violet field #6C3BC8; pale lilac #EAE3F4; warm paper #FAF9F5; lime accent #D2F86A; dark plum #1D122A.
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
