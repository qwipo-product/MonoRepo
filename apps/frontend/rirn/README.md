# Qwipo-WebApp — DigiDukaan by Qwipo

This application replaces the RIRN company discovery console. It presents the DigiDukaan product website for brands and distributors.
The source is `/Users/4nshuman/Development/Qwipo-WebApp`. Website refinements are mirrored into this Vite application while preserving its deployment-specific routing and assets.

The existing deployment identity is retained:

| Setting | Value |
| --- | --- |
| Application folder | `apps/frontend/rirn` |
| Package | `@mockups/rirn` |
| Development port | 5173 |
| Preview port | 6173 |
| Build output | `apps/frontend/rirn/dist` |
| Container port | 80 |
| Service | `mockups-rirn-company` |
| Build pipeline | `RIRN Company - Build` |
| Deploy pipeline | `RIRN Company - Deploy` |
| Version tag prefix | `rirn-company` |
| Configured development URL | `https://mockups-rirn-company.dev.bms.qwipo.com` |

The configured URL is a deployment target. Local validation does not confirm a remote deployment.
The former RIRN company console is available in Git history. The separate RIRN Retailer application remains unchanged.

## Run and verify

Use Bun 1.3.13. Run these commands from the repository root:

```sh
bun install --frozen-lockfile
bun dev --filter=@mockups/rirn
```

Open `http://localhost:5173`. For a production preview:

```sh
bun run build --filter=@mockups/rirn
bun run --cwd apps/frontend/rirn preview
```

Open `http://localhost:6173`. Run the application checks with:

```sh
bun run check --filter=@mockups/rirn... --continue --ui=stream
```

## Routes and interactions

| URL suffix | Content |
| --- | --- |
| `/` | Product landing page |
| `/?page=how-it-works` | Order journey, delivery options, FAQs, and contact |
| `/?page=unknown` | Page-not-found view |
| `/#product`, `/#network`, `/#qwipo`, `/#contact` | Landing-page sections |

The route table describes the suffix below the current application base. A preview can use `/builds/<branch>/<commit>/?page=how-it-works`.
Query navigation keeps the document path unchanged. Section anchors use the URL hash. Relative image URLs and Vite's `base: './'` keep assets inside the preview prefix.
Do not replace these links with host-root paths such as `/how-it-works` or `/images/file.webp`.

The site includes the brand/distributor audience switch, six hosted buyer-app screens, the animated device gallery, order journey tabs, two-leg logistics control, FAQs, and mobile navigation.
Motion starts enabled on a fresh visit. The Pause motion control keeps its selection during navigation. Native page transitions run in browsers that support them; navigation also works without that API.
Contact opens an email draft addressed to the supplied public Qwipo address. There is no submission backend and no message is sent by the website.

## Framework adaptation

The original site uses Next.js. This copy uses the existing React/Vite build so its Dockerfile, nginx configuration, Azure pipelines, and preview upload steps can remain unchanged.
The application is rendered in the browser. It does not run a Next.js server.

- `next/link` and `next/navigation` are replaced by React Router query navigation.
- Phone screens use self-contained SVGs, embedded previews and responsive AVIF/WebP fallbacks. The two small brand marks use normal image elements.
- Local WOFF2 fonts are loaded through CSS and preloaded from `index.html`.
- React Router coordinates native page transitions. GSAP and Lenis preserve the imported page motion.
- `public/opengraph-image.png` is a static rendering of the supplied social-card design. Its arrow uses an SVG path to avoid a remote emoji fetch during generation.
- `index.html` and `public/robots.txt` keep this mockup out of search indexes. No production domain or sitemap is asserted.
- Local review controls are enabled during development. Production builds omit those controls and their accessibility inspection library.
- The shared version badge displays the version and commit supplied by the existing pipeline.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/pages/Home.tsx` | Product landing page |
| `src/pages/HowItWorks.tsx`, `src/pages/NotFound.tsx` | Product journey and unknown-page view |
| `src/App.tsx`, `src/lib/navigation.ts`, `src/components/SiteLink.tsx` | Page selection, navigation, and focus |
| `src/data/site.ts` | Approved narrative, FAQs, and contact destinations |
| `src/data/image-assets.json`, `public/images/` | Responsive imagery and embedded previews |
| `src/data/app-screens.ts` | Screenshot labels and descriptions |
| `src/index.css`, `src/fonts/`, `licenses/` | Imported website design, fonts, and font licenses |
| `src/components/Motion.tsx`, `src/lib/motion-context.ts`, `src/lib/use-page-motion.ts` | Motion preference, scrolling, and animation cleanup |
| `src/components/ProductDevice.tsx`, `src/components/OrbitProductDevice.tsx` | Interactive app-screen galleries |
| `src/components/OrderJourney.tsx`, `src/components/Logistics.tsx` | Journey tabs and delivery modes |
| `src/components/ReviewTools.tsx` | Development-only page inspection |
| `docs/source/` | Original design decisions and image provenance; historical Next.js commands refer to the source project |

Preserve the imported website design. Do not add a shared theme provider that changes its colors or font layout.
Use the root catalog for dependencies. Existing applications retain their React and tooling versions.
To regenerate responsive images, use the original source project's `scripts/prepare-images.mjs` with its source captures. Copy the resulting assets and manifest here, and retain the `./images/` URL prefix.

## Existing deployment behavior

`Dockerfile`, `nginx.conf`, `docker-build.yml`, `azure-release.yaml`, and the shared pipeline templates retain their existing behavior.
The build still runs `@mockups/rirn` and copies `dist/` into nginx.

- `feature/*` branches upload static previews when the path filters match.
- `dev` builds the image for the development deployment.
- `testing`, `staging`, and `main` follow the existing environment mappings.

After an authorized merge and push to a deployment branch, this website replaces the company console in that branch's environment. The pipeline names continue to say RIRN Company.
Do not rename the package, service, folder, or pipeline as an incidental cleanup.
No commit, push, pipeline run, or remote deployment is part of local preparation.


## Secondary colour refinement

The website now uses warm apricot (`#F2CEAE`) in place of fluorescent lime. The semantic `--accent` token covers controls, route markers, logistics capacity highlights, enquiry emphasis and shimmer. Selected phone controls have a dark violet border. The favicon and static sharing image match the new accent. Motion timings, original product screenshots and deployment configuration are unchanged.

The source site's desktop/mobile visual review found no reported axe violations; measured accent contrast is 10.33:1 against violet ink, 4.59:1 against the violet field and 12.13:1 against dark plum. Some automated SVG/decorative checks remain incomplete. Independent colour review: 8/10, with no colour blockers. Repository validation uses the scoped lint/typecheck/build command above.

## DigiDukaan 2.0 content correction

The current narrative follows the supplied ONDC DigiDukaan 2.0 deck. See [the fact check](docs/source/16-content-fact-check.md) and [copy inventory](docs/source/evidence/website-content-inventory.md). The detailed route is Discover → Order → Pickup → Consolidate → Deliver. Authorised distributors and wholesalers supply the goods; 3PL partners collect from godowns and deliver through DigiDukaan dark stores. The deck specifies a ₹500 minimum, cash on delivery and delivery within 24 hours. Geographic coverage and detailed SLA/minimum calculation rules are not asserted.

The six phone screens now come solely from the hosted Qwipo buyer app, per the user’s subsequent instruction. SVG exports keep text/icons scalable and embed the site’s photos; tiny previews render immediately with AVIF/WebP fallbacks for SVG failures. Screenshot seller terms and delivery examples are illustrative. See [the source/loading record](docs/source/17-hosted-buyer-screens.md) and [capture provenance](docs/source/hosted-screen-provenance.json).
