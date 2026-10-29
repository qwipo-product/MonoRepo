# Sharp images with progressive loading

26 October 2026

The phone imagery now uses genuine 1170 × 2532 source-app captures instead of 288 × 624 screenshots. Each screen has 390, 780 and 1170 pixel AVIF and WebP variants. The browser chooses a size for its viewport and pixel density. The retailer and delivery photos also use progressive loading, without upscaling beyond their supplied resolution.

## What a visitor sees

An 80-pixel preview is embedded in the server-rendered HTML and appears when that content arrives; it needs no separate image request. It cannot eliminate the initial document/network wait. The sharp image is decoded before a 240 ms crossfade. A failed request keeps the preview visible. Fixed aspect ratios prevent image-driven layout shifts. Pausing motion also disables the crossfade transition.

The hero's first full image is present in the server HTML with high fetch priority. Other phone screens are requested only when selected and their device is visible. Once requested they remain mounted, avoiding canceled requests and repeated decoding. The carousel waits for the current sharp image before starting its five-second dwell. Field photos begin loading near the viewport. Hashed image URLs have immutable cache headers; format conversion happens during asset preparation, not on a visitor's first request.

## Why these full screens are not SVGs

Wrapping the old screenshots in SVG would preserve their original low resolution. A real DOM-to-SVG export was also tested: the home screen was about 3.9 MB before optimization, with embedded photos, fonts and styles. It used HTML `foreignObject` content, and its rendering changed line wrapping in price and cart labels. A reduced version still measured about 2 MB before compression. Those exports remain internal diagnostics in `.research/quality-export/output/`; they are not shipped as accurate design masters.

The production images therefore come from the browser's actual 3× rendering, checked against the source UI. The site's existing icons and logistics illustrations remain SVG. Editable vector artwork would require a clean source-design export or separately implemented vector UI.

## Source and asset records

- Source app: `/Users/4nshuman/Documents/MockupLabs/apps/frontend/qwipo-buyer-paytm-app`, existing local `dist` build copied into an isolated export workspace. The original application was not edited.
- This source build identifies itself as a feature branch and can differ from the hosted mockup revision. These captures are not represented as live production screens.
- Captures: Home, Authorised Distributor Storefront, Product List, Cart Summary, My Orders, and the ITC tracking panel. Products, prices, order identifiers, dates and delivery examples remain illustrative.
- Source captures: `design-assets/screens/*.jpg`, 1170 × 2532. Browser capture is JPEG; it is not represented as a lossless or infinitely scalable original.
- Generated public files: `public/images/optimized/`.
- Metadata and embedded previews: `src/data/image-assets.json`.
- Generator: `npm run images:prepare`, using the pinned Sharp development dependency. Size report: `design-assets/image-sizes.json`.
- Existing field-photo provenance is unchanged: page 9 of the supplied DigiDukaan & Logistics Tech PDF.

## Measured sizes

Sizes below are decimal KB, before transport compression. Inline previews incur roughly one-third base64 overhead before document compression.

| Screen | Preview bytes | 780px AVIF | 780px WebP |
| --- | ---: | ---: | ---: |
| Discover | 1,696 | 74.6 KB | 115.0 KB |
| Connect | 1,016 | 46.3 KB | 70.5 KB |
| Choose | 1,176 | 49.6 KB | 73.3 KB |
| Order | 1,028 | 41.0 KB | 59.6 KB |
| Follow | 1,226 | 51.3 KB | 76.6 KB |
| Track | 674 | 32.6 KB | 44.7 KB |

The home screen's AVIF variants measure 31.0 KB at 390px, 74.6 KB at 780px and 124.7 KB at 1170px.

## Verification

- Production build, TypeScript, ESLint and formatting checks pass.
- All 44 generated variants were decoded and checked against their declared widths. All eight image previews are below 2.5 KB before base64 encoding.
- Production home HTML contains nine embedded preview elements and only one full-resolution picture initially. This confirms the preview and first image do not depend on client initialization to be discovered.
- A local browser harness used the actual components, holding the home image response until explicitly released and returning 404 for another image. While held, the home preview remained visible, the next slide stayed unrequested, and autoplay stayed on Home beyond its normal dwell. After release, the image reached `ready` and autoplay advanced. The failed image retained its preview with state `error`, including when the failure preceded hydration.
- Desktop and 390 × 844 mobile checks on `127.0.0.1:3000` verified screen switching, no horizontal overflow, and motion enabled by default. Production-build smoke testing used a separate temporary local server.
- Screenshots: `.shots/image-quality/product-preview.jpg`, `product-desktop.jpg`, `journey-mobile.jpg`, and `held-and-failed.jpg`.
- The hold/failure harness is deterministic loading-behavior evidence, not a measured 3G/4G throughput or real-device performance benchmark.

Temporary export and test servers are stopped after review; the user's port-3000 development server remains running.
