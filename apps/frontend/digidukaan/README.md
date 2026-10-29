# DigiDukaan website — DigiDukaan and Qwipo for DigiDukaan

This application is the public DigiDukaan product website for brands and distributors.
It is hosted in production at https://digidukaan.qwipo.com.
The source is `/Users/4nshuman/Development/Qwipo-WebApp`. Website refinements are mirrored into this Vite application while preserving its deployment-specific routing and assets.

The website has its own deployment identity. The RIRN Company console in `apps/frontend/rirn` and its pipelines are separate and unchanged.

| Setting | Value |
| --- | --- |
| Application folder | `apps/frontend/digidukaan` |
| Package | `@mockups/digidukaan` |
| Development port | 5178 |
| Preview port | 6178 |
| Build output | `apps/frontend/digidukaan/dist` |
| Container port | 80 |
| Service | `mockups-digidukaan` |
| Kubernetes deployment and service | `mkd-web`, `mkd-web-svc` |
| Build pipeline | `DigiDukaan - Build` |
| Deploy pipeline | `DigiDukaan - Deploy` |
| Version tag prefix | `digidukaan` |
| Production URL | `https://digidukaan.qwipo.com` |

The production URL is the only deployment target. Local validation does not confirm a remote deployment.

## Run and verify

Use Bun 1.3.13. Run these commands from the repository root:

```sh
bun install --frozen-lockfile
bun dev --filter=@mockups/digidukaan
```

Open `http://localhost:5178`. For a production preview:

```sh
bun run build --filter=@mockups/digidukaan
bun run --cwd apps/frontend/digidukaan preview
```

Open `http://localhost:6178`. Run the application checks with:

```sh
bun run check --filter=@mockups/digidukaan... --continue --ui=stream
```

## Routes and interactions

| URL suffix | Content |
| --- | --- |
| `/` | Product landing page |
| `/?page=how-it-works` | Order journey, delivery options, FAQs, and contact |
| `/?page=qwipo-for-digidukaan` | Qwipo’s technology contribution: app, ONDC connectivity, DMS integration and logistics tools |
| `/?page=about-qwipo` | Compatibility alias for Qwipo for DigiDukaan |
| `/?page=unknown` | Page-not-found view |
| `/#product`, `/#ondc`, `/#network`, `/#contact` | Landing-page sections |

The route table describes the suffix below the current application base. A preview can use `/builds/<branch>/<commit>/?page=how-it-works`.
Query navigation keeps the document path unchanged. Section anchors use the URL hash. Relative image URLs and Vite's `base: './'` keep assets inside the preview prefix.
Do not replace these links with host-root paths such as `/how-it-works` or `/images/file.webp`.

The site includes the brand/distributor audience switch, six app screenshots, the animated device gallery, order journey tabs, delivery-mode control, FAQs, and mobile navigation.
Motion starts enabled on a fresh visit. The Pause motion control keeps its selection during navigation. Native page transitions run in browsers that support them; navigation also works without that API.
Contact submits directly to `https://qwipo-website-api.bms.qwipo.com/api/contact_us` using the five JSON fields `first_name`, `last_name`, `email`, `phone` and `message`. Business type and optional company are appended to `message`. Browser-managed curl headers are omitted. Input validation, a pending state, duplicate-click protection and a 15-second timeout are included. HTTP 2xx confirms submission; errors retain the input. Email remains an alternative. The form is shared by the landing, journey and company pages.

Run the isolated contact tests with `bun test apps/frontend/digidukaan/tests/contact.test.ts` from the repository root. These tests mock the response and never submit an enquiry to the live API.

## Framework adaptation

The original site uses Next.js. This copy uses the existing React/Vite build so its Dockerfile, nginx configuration, Azure pipelines, and preview upload steps can remain unchanged.
The application is rendered in the browser. It does not run a Next.js server.

- `next/link` and `next/navigation` are replaced by React Router query navigation.
- The existing responsive AVIF/WebP images and embedded previews remain in use. The two small brand marks use normal image elements.
- Local WOFF2 fonts are loaded through CSS and preloaded from `index.html`.
- React Router coordinates native page transitions. GSAP and Lenis preserve the imported page motion.
- `public/opengraph-image.png` is a static rendering of the supplied social-card design. Its arrow uses an SVG path to avoid a remote emoji fetch during generation.
- `index.html` and `public/robots.txt` currently keep the site out of search indexes, including on the production domain. Removing them is a product decision. No sitemap is asserted.
- Local review controls are enabled during development. Production builds omit those controls and their accessibility inspection library.
- The shared version badge displays the version and commit supplied by the existing pipeline.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/pages/Home.tsx` | Product landing page |
| `src/pages/HowItWorks.tsx`, `src/pages/QwipoForDigiDukaan.tsx`, `src/pages/NotFound.tsx` | Product journey, provider contribution and unknown-page view |
| `src/App.tsx`, `src/lib/navigation.ts`, `src/components/SiteLink.tsx` | Page selection, navigation, and focus |
| `src/components/Contact.tsx`, `src/lib/contact.ts` | Enquiry form, validation and API submission |
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

## Deployment

`Dockerfile`, `nginx.conf`, `docker-build.yml`, and `azure-release.yaml` were generated by `bun run deploy:add digidukaan --label "DigiDukaan" --branch dev`, then narrowed to production only.
They extend the shared mockup pipeline templates. The build runs `@mockups/digidukaan` and copies `dist/` into nginx.

DigiDukaan has no dev, testing, staging, or preview deployment.

- Only a `main` push triggers `DigiDukaan - Build`. Pushes to `dev`, `testing`, `staging`, and `feature/*` do not build this app.
- Each `main` build reserves a `digidukaan-v<version>` tag. `DigiDukaan - Deploy` then waits for the `mockups-production` approval.
- The build path filter lists only the shared packages this app uses: `version-badge`, `tsconfig`, and `eslint-config`.

The only GitOps manifest is `bms-chart/production/mockups-digidukaan.yaml` in the `Qwipo B2B/k8s` repository.
It serves only the custom domain `digidukaan.qwipo.com`, with its own Let's Encrypt certificate and at least two replicas.

The nginx configuration has no `/builds/` preview proxy. That path returns 404.

This image is public. Treat every `main` change under this folder as a website release.
No commit, push, pipeline run, or remote deployment is part of local preparation.

## Secondary colour refinement

The website now uses warm apricot (`#F2CEAE`) in place of fluorescent lime. The semantic `--accent` token covers controls, route markers, logistics capacity highlights, enquiry emphasis and shimmer. Selected phone controls have a dark violet border. The favicon and static sharing image match the new accent. Motion timings, original product screenshots and deployment configuration are unchanged.

The source site's desktop/mobile visual review found no reported axe violations; measured accent contrast is 10.33:1 against violet ink, 4.59:1 against the violet field and 12.13:1 against dark plum. Some automated SVG/decorative checks remain incomplete. Independent colour review: 8/10, with no colour blockers. Repository validation uses the scoped lint/typecheck/build command above.
