# Hosted buyer-app screens

Updated 27 October 2026 at the user's explicit request. The sole authority for every phone screenshot is [the hosted Qwipo buyer app](https://mockups-buyer-app.bms.qwipo.com), observed build **v1.0.2 / cf477a9**. This restores the earlier six-screen selection using fresh exports of that hosted build. No phone screen comes from a presentation, invented UI, or a local buyer-app build.

This supersedes the screenshot substitutions in `16-content-fact-check.md`. The fact-checked DigiDukaan 2.0 narrative and physical journey remain unchanged. The hosted mockups contain illustrative prices, seller conditions, beat-day examples and delivery times; those pixels are preserved as requested, not promoted into universal 2.0 business rules. The product caption and cart disclosure make this distinction visible.

## Screens and export method

Home, distributor storefront, product catalogue, cart, orders and the ITC tracking sheet were reviewed on the hosted site at its 390 × 844 phone layout. Exact URLs, the tracking interaction and hashes are recorded in `hosted-screen-provenance.json`.

The site's own Download screenshot action timed out while reporting cross-origin stylesheet/font errors. Instead, the visible phone DOM, actual hosted stylesheet, observed font and website media were captured read-only. Self-contained SVGs preserve scalable text, layout and existing SVG icons inside an SVG foreignObject. Product photos and banners remain embedded raster media; these are not path-only vector illustrations. Unseen, below-viewport home footer images are omitted from the export payload. Browser renders at 1170 × 2532 provide the responsive raster fallbacks. No screenshot copy, prices or product data was redrawn or rewritten.

All assets are self-hosted; visitors do not contact the buyer app to render a phone. The internal DOM snapshots and comparison captures remain in the original workspace's `design-assets/hosted-buyer/`. They are not public site resources.

## Progressive loading

An embedded 80px WebP preview paints as soon as the page renders, without another image request. The selected screen then loads its SVG, decodes it, and crossfades over the preview. Other screens are requested as needed by the existing gallery. If SVG loading fails, the component retries the responsive AVIF/WebP image set. If all full-size requests fail, the embedded preview remains visible. Intrinsic dimensions reserve the layout throughout.

Raster variants are 390, 780 and 1170px wide. Photo assets outside the phones are unchanged.

| Screen | Embedded preview | SVG file | Local gzip estimate |
| --- | ---: | ---: | ---: |
| home | 1,700 B | 499.2 kB | 336.3 kB |
| distributor | 1,086 B | 275.1 kB | 175.4 kB |
| catalogue | 1,278 B | 179.4 kB | 93.5 kB |
| cart | 1,060 B | 168.3 kB | 93.3 kB |
| orders | 1,270 B | 128.7 kB | 62.2 kB |
| tracking | 752 B | 133.9 kB | 62.9 kB |

The gzip column is an estimate, not a measured hosting transfer or slow-network benchmark. These SVGs prioritize faithful scalable UI; the immediate preview prevents a blank phone while their payload arrives.

## Validation

- Original Next.js production build and lint pass. Deployment application scoped lint/type checks/build pass, including workspace dependencies (two dependency checks cached).
- Compared all six exports with clipped screenshots of the same hosted phone states; checked the small chevrons and tracking close icon as well as text, product art and spacing.
- Browser loading fixture built from the actual image component: held SVG retains preview; releasing it reaches ready with SVG; forced SVG failure reaches ready with AVIF; failure of SVG and raster retains preview.
- Production browser check: all six phone SVGs reach ready; desktop gallery selection and paired motion work. Mobile layout checked in a 390px iframe (375px content width with scrollbar), including Track selection; no horizontal overflow. Journey Discover and Order use hosted home and cart screens. No normal-page browser errors observed.
- Existing hero spin, alternating tilt, scroll motion, two route arrows, paired circular gallery and its 15% faster cycle retain their implementation and timings.

This is an image-source and loading change. It does not change delivery rules, pricing policy, contact handling, routing or pipeline configuration.
