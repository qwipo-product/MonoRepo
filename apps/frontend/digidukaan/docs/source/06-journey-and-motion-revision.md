# Journey, logistics and motion revision

Revised and tested locally on 26 October 2026. The audience remains brands and distributors seeking a partnership with Qwipo.

## Changes

| Request | Result |
| --- | --- |
| Richer journey without overload | Five selectable chapters: Discover, Connect, Order, Dispatch and Deliver. Each has a matching screen, icon, short explanation, three cues and optional detail. Arrow keys, Home and End operate the tabs. |
| Explain 3PL | Dedicated logistics sections on both pages define third-party logistics, show distributor fleet versus approved 3PL capacity, and explain prepare → plan → deliver → confirm. The distributor remains the seller. |
| Smooth page transition | Removed the timed curtain and delayed route interception. React ViewTransition coordinates page changes with the Next router. |
| Better product imagery | Six real captures from the user-provided mockup site replace the repeated single screen. |
| Better device motion | Screen crossfades, subtle floating/rotation, scroll-linked positioning and manual gallery controls. Automatic screen changes pause during hover/focus and when outside the viewport. |
| Scroll affordance | The hero’s “See how it works” uses a mouse/scroll symbol. |
| Smooth links and buttons | One persistent scroll driver handles same-page anchors, including repeated clicks; prevents the competing native hash jump, preserves router history and focuses the destination. Cross-page section links use the router. |
| Motion on at launch | Fresh visits start with motion on. Pause/Enable remains available and survives client navigation. Page-scoped effects handle development Strict Mode and retained route content. |

## Product-screen provenance

Source: https://mockups-buyer-app.bms.qwipo.com/ — captured through its visible buyer-app interface on 26 October 2026.

| Local asset | Captured view |
| --- | --- |
| `public/images/app/home.webp` | Home and discovery |
| `public/images/app/distributor.webp` | Authorised distributor storefront |
| `public/images/app/catalogue.webp` | Product list, packs, schemes and sellers |
| `public/images/app/cart.webp` | Seller-wise cart and delivery conditions |
| `public/images/app/orders.webp` | My Orders |
| `public/images/app/tracking.webp` | Tracking details for an out-for-delivery order |

Original captured pixels are retained in `.research/mockup-captures/`. WebP versions are 288 × 624 px, matching the visible source device capture. They are genuine mockup captures, not reconstructed interfaces. Product amounts, dates and order data are explicitly illustrative. The screens do not establish live stock, live serviceability or universal delivery promises.

## Verification

- [Order journey preview](preview/revision/order-journey.jpg)
- [Final mobile hierarchy](preview/revision/mobile-journey.jpg)
- [3PL route preview](preview/revision/logistics.jpg)

- Production build, TypeScript, ESLint and source formatting pass.
- Production homepage and journey reviewed at desktop and 390 px mobile sizes; no horizontal overflow at 320, 390, 768, 1024 and 1440 px.
- Updated mobile home and desktop/mobile journey axe checks report zero violations. Some SVG/transformed-text contrast checks require human review; zero automated violations is not a complete accessibility certification.
- Checked chapter selection, keyboard arrows, optional details, 3PL/fleet switching, gallery selection, automatic screen changes, pause/resume and pause persistence across navigation.
- Verified smooth anchor movement with intermediate scroll positions and settled target positions about 32 px below the viewport top. Repeated links and cross-page contact navigation reach the intended section.
- Fresh development and production loads start with motion on. Production console review found no warnings or errors.
- Repaired a gallery clipping issue caused by focus scrolling an overflow-hidden container; the stage now clips without becoming an internal scroll container.
- The standard build contains no review panel and remains `noindex, nofollow`.

Evidence is in `.shots/revision-1/` and `.shots/revision-2/`. Full-page captures may include fixed-position stitching artifacts; viewport images are the authority for composition and focus. Lazy field photography was inspected in the actual viewport and verified loaded. Next retains inactive routes using hidden containers; DOM and accessibility inspection confirmed only the current page is exposed. The review helper now filters inactive content from its headings and image reports.

The explicit motion-on default requested for this revision overrides this site's automatic `prefers-reduced-motion` response. The operating-system setting is untouched. Visitors can pause all decorative animation and smooth scrolling using the visible control. Native operating-system preference emulation, a screen-reader session, throttled mobile performance, FPS and field Web Vitals were not measured. No performance or award guarantee is implied.

Two independent visual critics reviewed the revision evidence. The later review scored Design 7.7, Usability 7.1, Creativity 7.2 and Content 7.7, weighted **7.42/10**. This is a critique, not an official award score. Its two recommendations were then implemented: the mobile chapter heading and explanation now appear immediately below the tabs, and the motion control uses a compact floating pill without a full-width tray. Both refinements were visually checked; final mobile home and journey audits again reported zero violations, no overflow and one active H1. The critique has not been rescored to credit these changes. Stronger evidenced customer outcomes and higher-resolution source screen exports would further improve the presentation.

No deployment or external message was performed. The enquiry action still prepares a draft in the visitor’s email application; it does not send anything.

The temporary production preview was stopped after testing and port 4400 was verified clear. The user's existing development server on port 3000 was left running. The final standard build was regenerated without the QA panel; generated HTML confirms motion starts on and indexing remains disabled. Temporary browser tabs were closed and the viewport override was reset.
