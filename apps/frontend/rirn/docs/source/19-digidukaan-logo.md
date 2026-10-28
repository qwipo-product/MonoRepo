# DigiDukaan supplied logo

Source: `Qwipo Digi Dukaan.svg`, supplied by the user on 28 October 2026.

- `public/images/brand/digidukaan-original.svg` is the unmodified supplied file.
- `public/images/brand/digidukaan-logo.svg` places the supplied symbol and wordmark side by side for the shared website header. The outer white artboard is omitted so it fits the existing background. The lettering was subsequently refined into vector outlines as described below.
- The browser icon uses the supplied purple symbol, with a tighter viewBox for readability at small sizes.
- The wordmark is an embedded PNG in the original SVG. The refined website asset follows that lettering’s contours; no replacement font or AI-generated artwork was introduced.
- Header dimensions are reserved to avoid image-loading layout shifts. Mobile width adapts from 168 to 196 pixels; desktop width is 222 pixels.
- Product screenshots and animations are unchanged.

Original SHA-256: `ff14b346a6c75f24cd809dd8421793c8372fe9c360ef759340a01200e6c2c9af`.

Validation: source Next.js lint/build and deployment application lint/type/build passed. Browser checks confirmed the loaded logo, mobile menu and return-home link at 320/390 pixels and desktop. No new dependencies or network image services were added.

## Vector refinement — 28 October 2026

The supplied SVG's text uses a pattern crop from an embedded 1809 × 238 PNG. The actual wordmark crop is approximately 346 × 76 pixels. SVG packaging did not make those letters resolution-independent; the original bitmap also contains visibly rough edges and colour noise when enlarged. The header already served the SVG unoptimized, so Next.js recompression was not the cause.

The website logo now contains vector outlines throughout. The original purple symbol paths are retained. The lettering is contour-traced from the supplied crop, with edge smoothing and a blue-to-cyan gradient sampled from its opaque pixels. This is a faithful vector refinement of the raster source, not a recovered original vector master. Nested viewports and the raster pattern are replaced with simple transformed groups. No embedded bitmap, font dependency or external resource remains.

- File size: 52,877 → 7,820 bytes, approximately 85% smaller.
- Header dimensions and layout remain 248 × 56 intrinsic, 222px desktop, 168–196px mobile.
- The supplied original is unchanged; its SHA-256 above still matches.
- Source and deployment-copy SVGs are byte-identical. No app dependency was added; tracing used a temporary local tool only.
- A transparent 2048px PNG export is available in `docs/verification/logo/digidukaan-hd.png`; the website uses the smaller SVG.
- Browser verification: desktop, 390px and 320px layouts; successful image load, no horizontal overflow at 320px and working mobile menu. Enlarged 4× before/after renders were also inspected.
- Deployment application lint/type/build passed. The existing JavaScript chunk-size warning is unrelated to the logo; shared version-badge checks came from cache.
- Verification was completed locally before publication. The temporary preview was stopped after verification.
