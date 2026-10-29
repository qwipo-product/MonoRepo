# Product panel layout revision

## Problem and result

The oversized “Order. Connect. Repeat.” copy sat behind the moving phone and was partially hidden. The exhibit now reserves separate rows for the headline, device, screen navigation and attribution. The phone can move within its own space, while the screen selectors remain stationary and easy to target.

The headline uses panel-relative sizing. Narrow panels arrange the four selectors in two columns; every selector has a minimum height of 44px. “Explore the app” explains their purpose. At the standard 390px phone width, the device grows from 190px to 210px. The existing illustrative-data disclaimer is larger and darker.

## Implementation scope

- `src/app/page.tsx`: readable headline content in three spans.
- `src/app/globals.css`: content-driven panel grid, responsive headline and device sizing, stationary navigation, larger targets and disclaimer type.
- `src/components/ProductDevice.tsx`: navigation cue and wrapper; existing selection behavior retained.
- `src/components/Motion.tsx`: product scroll animation targets the frame instead of the entire phone-and-controls wrapper.

The hero phone animation, hero arrows, image loading pipeline and journey animation are unchanged.

## Verification

Two passes used a production build and browser inspection. Evidence is under `.shots/product-layout/pass-1/` and `.shots/product-layout/final/`.

| Check | Result |
| --- | --- |
| 320px, 390px, 768px and 1280px viewports | No document overflow or headline/device/control collisions |
| Narrow controls | Two columns at 320px; 44px-tall buttons |
| Screen selectors | Connect, Choose, Order and Track select their corresponding screenshots |
| Keyboard | Tab reaches Track; Space activates the tracking screenshot; visible 2px focus outline |
| Scroll and idle motion | Phone moves; controls have no transform and retain their own layout space |
| Pause | Readable static panel and usable manual controls |
| Desktop and mobile axe scans | Zero reported violations; no targets below 24px |
| Disclaimer contrast | 12.20:1, calculated from rendered ink `rgb(50,18,92)` on lilac `rgb(234,227,244)` |
| Browser console | No captured warnings or errors on desktop, phone or tablet |
| Build and lint | Passed |

Accessibility scans retain incomplete items for manual interpretation; zero reported violations is not a complete accessibility certification. Testing used an unthrottled local browser, so no field performance or mobile frame-rate claim is made. Screenshot text inside the phone remains illustrative product imagery rather than a replacement for the readable feature descriptions beside it.

Temporary QA instrumentation is excluded from the normal production build. Only Codex-owned preview processes are stopped after testing; the user's existing development server remains available.

## Independent visual review

The first critic pass recommended a clearer selector cue, a larger phone preview and a more readable disclaimer. The second pass incorporated those changes and the narrow two-column control layout. A fresh evidence-only critic scored the section 7.46/10 overall: Design 7.6, Usability 7.5, Creativity 7.0 and Content 7.6. Responsive design scored 8.0. These are scoped estimates, not an award or a whole-site certification.

The final critic found no remaining blockers for text/device collisions, target sizing or the tested keyboard interaction. Optional follow-up: the existing benefit-row decorative dots could be removed or realigned at tablet width. The critic's request for a clean screenshot and disclaimer contrast verification was completed after the review; see `desktop-clean.jpg` and `mobile-clean.jpg` in the final evidence directory.
