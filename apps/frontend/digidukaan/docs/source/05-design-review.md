# DigiDukaan design and validation

This records the original build. The [journey and motion revision](06-journey-and-motion-revision.md) supersedes its product imagery, motion-default behavior and final validation status.

Reviewed locally on 26 October 2026. This is a working Next.js application; it has not been publicly deployed.

## Design

**Beyond the beat** expresses DigiDukaan's role in connecting retailers with their existing distribution network beyond the next sales visit. Animated order routes, oversized type and genuine product/field imagery establish the identity. Brands and distributors are the primary audience, with partnership enquiries as the main action.

The implementation includes the landing page, a retailer-journey page, an intentional 404, an audience switch, responsive navigation, FAQs, a partnership email composer, page transitions and an explicit motion control. Qwipo's DMS and logistics roles remain visible alongside DigiDukaan.

- [Desktop opening](preview/desktop.jpg)
- [Mobile opening](preview/mobile.jpg)
- [Complete desktop page](preview/desktop-full.jpg)
- [Complete mobile page](preview/mobile-full.jpg)
- [Concept and design system](../DESIGN.md)

## Validation

Two production-build review passes covered the homepage, inner page and 404, including desktop and mobile layouts. Issues found during review were repaired, including mobile capability layouts, heading word spacing, same-page navigation in paused mode, a 404 animation warning, social-image metadata and the motion control's accessible label.

The independent final critic scored the reviewed version **7.38/10**: Design 7.6, Usability 7.3, Creativity 7.0 and Content 7.5, using the 40/30/20/10 weighting. This is an independent design critique, not an official Awwwards score or an award prediction. Its strongest remaining recommendation is to show more of the real product journey with additional approved screens or a more informative crop of existing imagery; an evidenced partner example would also strengthen the content.

After that critique, two heading whitespace gaps were repaired and verified in generated HTML. Static feature arrows became quieter route dots, and mobile motion controls gained a full-width bottom strip, safe-area spacing and content-bottom padding. The final source passes build, TypeScript, ESLint and formatting. Automatic approval review blocked the final browser recheck because it interpreted the user's instruction to stop the preview after testing as prohibiting reopening it. The last marker/toolbar refinements therefore have not been visually rechecked or rerun through axe. The server was stopped again and its port verified clear. Screenshots and accessibility results below describe the preceding reviewed build; the independent score has not been changed to credit unreviewed repairs.

| Check | Result |
| --- | --- |
| Production build and TypeScript | Pass |
| ESLint and source formatting | Pass |
| Automated axe accessibility checks | Zero violations on desktop/mobile home, inner page and 404 |
| Layout | No horizontal overflow at 320, 390, 768, 1024, 1440 and 1920 px |
| Keyboard | Skip link, main focus, visible focus, mobile-menu Escape/return tested |
| Interactions | Audience switch, FAQ, navigation, route transition, motion pause/resume and email-draft composition tested |
| Images | All supplied site images load; final complete-page captures include the field photographs |
| Metadata | Unique titles/descriptions, canonical tags, social image, favicon, robots and sitemap verified |
| Error route | Actual HTTP 404 with a designed return path |
| Preview | Noindex by default; optional review panel absent from the standard build |
| Client code weight | Homepage-referenced JavaScript totals approximately 235 KiB gzip |
| Cleanup | Temporary browser tab closed; local port 4400 server stopped and absence of a listener verified |

The contact action opens a draft in the visitor's email app. It does not send email, store personal information, or imply successful submission. The draft was checked without sending.

## Evidence limits

The browser review used desktop 1440 × 1000 and phone 390 × 844 viewports, plus additional responsive-width checks. Full-page screenshots use the pause control to avoid motion-stitching artifacts. Active viewport screenshots and a route-transition frame were also inspected.

Throttled-device performance, FPS, INP, a live screen-reader session and native operating-system reduced-motion emulation were not measured. Local cached paint readings are not a real-world speed claim. The visible pause/resume path was tested; system `prefers-reduced-motion` support is implemented. Automated accessibility results do not replace human assistive-technology testing.

Detailed raw evidence is available locally in `.shots/pass-2/`, including accessibility reports, responsive diagnostics, screenshots and the HTTP audit. Independent critic reports are retained in `.jury/digidukaan/`.

## Public content and remaining decisions

All seven supplied documents informed the content. Source-level distinctions and unresolved claims remain in [the research](01-qwipo-understanding.md) and [claims register](04-claims-and-decisions.md). No performance metrics, attributed testimonials or customer endorsements were invented.

The retailer journey is explicitly illustrative. Product availability, schemes, credit arrangements and off-beat delivery depend on the relevant distributor and operating conditions. The catalogue screenshot and field photographs are supplied source material; they are not a guarantee that every displayed product is currently available.

For publication, confirm the domain, business enquiry destination and public use of the supplied imagery; set `NEXT_PUBLIC_SITE_URL` and explicitly enable indexing. The existing email-draft action can be replaced with a connected enquiry form when its destination is agreed. Additional approved app screens and an evidenced partner story would make the product presentation more specific.

See [run instructions](../README.md) to reopen the local preview. Deployment was outside this build request and has not been performed.
