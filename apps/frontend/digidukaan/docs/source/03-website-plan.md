# Qwipo and DigiDukaan website build plan

Build a public website that helps **FMCG brands and distributors understand Qwipo, see how DigiDukaan and Logistics Tech fit their existing operations, and request a partnership discussion or product demonstration**. Retailers remain an important supporting audience, with a clear route to product information and the existing app.

This plan covers a product showcase and enquiry application. Ordering, payments, credit applications, retailer authentication and operational dashboards remain in the existing products. Adding any of those workflows later requires its own product and integration scope.

## Positioning and brand structure

Qwipo is the parent company. DigiDukaan is the retailer-ordering product. Qwipo Logistics Tech is the fulfillment product. DMS connectivity explains how Qwipo works with enterprise systems. This gives a prospect a clear company-to-product relationship without presenting every internal component as a separate offering.

The central message is that brands and distributors can add digital ordering and improve delivery operations while retaining their distribution relationships. The website should answer, in order: who this is for, what business problem it addresses, how it works, what evidence supports it, and how to start.

Provisional opening copy:

> **Digital ordering and delivery technology for your distribution network.**
>
> Qwipo helps FMCG brands and distributors connect with retailers through DigiDukaan, integrate orders with distributor systems, and plan fulfillment with Logistics Tech.
>
> **Request a demo** · **Explore our solutions**

This is proposed website copy, not an approved commercial commitment. Product-specific pages will state relevant integration and serviceability conditions.

## Audience journeys

| Visitor | Likely question | Suggested route | Main action |
|---|---|---|---|
| Brand sales/distribution leader | How can we reach more outlets through our distributors? | Home → For Brands → DigiDukaan → evidence → enquiry | Discuss my distribution network |
| Brand supply-chain/operations leader | Can we improve distributor delivery operations? | Home → Logistics Tech → pilot story → enquiry | Request a logistics demo |
| Distributor owner | Can I receive digital orders and manage my existing fleet? | Home → For Distributors → ordering and delivery walkthrough → enquiry | Become a distribution partner |
| Enterprise technology evaluator | How does this fit our DMS? | Integrations → data ownership and onboarding → enquiry | Discuss an integration |
| Retailer | Can I order from my distributor and how does delivery work? | DigiDukaan → retailer FAQ → verified app destination | Get DigiDukaan |

The primary enquiry buttons should be present on mobile and desktop. The app-download route should be visible without competing with the enterprise objective in the hero.

## Sitemap and page requirements

| Page | Proposed route | Content | Primary action |
|---|---|---|---|
| Home | `/` | Enterprise proposition, connected product story, audience paths, selected proof, partnership process | Request a demo |
| DigiDukaan | `/digidukaan` | Retailer-ordering experience, catalogues/schemes, distributor relationship, beat/next-day explanation, FAQ | Discuss DigiDukaan for my network |
| Logistics Tech | `/logistics-tech` | Planning, load allocation, driver workflow, tracking, aging/returns, reporting | Request a logistics demo |
| For Brands | `/for-brands` | Outlet engagement, scheme visibility, distribution coordination, pilot approach | Discuss my distribution network |
| For Distributors | `/for-distributors` | Order capture, own-fleet use, delivery visibility, daily workflow | Become a partner |
| Integrations | `/integrations` | DMS source-of-truth model, data domains, supported connections and onboarding prerequisites | Discuss an integration |
| Case Studies | `/case-studies` and `/case-studies/[slug]` | Approved, dated stories with context, baseline, intervention and results | Discuss a similar pilot |
| About Qwipo | `/about` | Mission, operating experience, approved leadership, ONDC context | Talk to Qwipo |
| Contact | `/contact` | Short enquiry form with audience/product context | Submit enquiry |
| Policies | Existing or agreed policy routes | Applicable privacy and terms content | Relevant policy/support contact |

If an approved case study is unavailable at launch, keep that route in draft and use a product walkthrough in its homepage position. Do not manufacture testimonials or an anonymous “customer” story. Optional editorial/blog work follows launch once there is an owner and a publishing plan.

## Homepage sequence

1. **Opening proposition.** Name brands and distributors, explain the two offerings, and show the primary demo action. Use an approved product screen or an authentic operational image.
2. **The daily problem.** Show how missed visits, fragmented ordering and ad-hoc demand affect existing distributor operations. Avoid unsupported market-loss statistics.
3. **How Qwipo connects the workflow.** Retailer demand enters digitally; supported integrations carry it into distributor operations; delivery tools help plan and monitor fulfillment.
4. **Two product explanations.** Give DigiDukaan and Logistics Tech a clear purpose, a relevant screen, and a link to learn more. State that Logistics Tech can be discussed independently.
5. **Audience-specific value.** Brands see network/outlet engagement benefits. Distributors see ordering and delivery benefits. Each path leads to its relevant page.
6. **Evidence.** Use approved operational facts or a bounded pilot story, with period and context. Do not combine company-wide numbers with pilot results.
7. **Integration reassurance.** Explain that the DMS remains authoritative and integration scope is agreed with the prospect's team.
8. **Partnership process.** Discuss the operation, scope the connection and service area, agree a pilot, review results, then expand where appropriate. This is a proposed sales process to confirm with Qwipo.
9. **Questions and enquiry.** Answer the main objections and invite a focused conversation.

## Product demonstrations

### DigiDukaan walkthrough

Use a short guided sequence that shows product discovery, distributor selection, retailer eligibility/account linking where needed, catalogue and scheme browsing, order placement, and delivery choice. Clearly label any clickable prototype as a demonstration using sample data.

Prior Qwipo journey decisions recorded in earlier work placed distributor selection and retailer-account matching before catalogue access, with a successful existing-account match continuing directly and new registration potentially waiting for approval. These are prior-session requirements, not newly verified live behavior. Reconfirm the current release before reproducing the exact flow. The public showcase can explain the journey without displaying technical protocol names.

A small comparison of normal beat delivery and approved next-day delivery is useful. It must show distributor approval and minimum-order conditions and must not invent dates, prices or universal availability.

### Logistics walkthrough

Show a representative workflow: ingest orders, review capacity, group delivery points, assign a trip, execute with the driver/helper app, confirm delivery, and review exceptions. Use a scrubbed current product recording where available. If using a simulation, mark all locations, orders and results as illustrative.

A before/after route illustration can help explain consolidation. Do not make its numbers look like measured savings. Defer a savings calculator until its inputs, assumptions, pricing and calculation method have been agreed.

### Integration explanation

Use a readable diagram of DMS data flowing through the Qwipo connector to supported channels, with orders and status moving in the relevant directions. Explain master-data ownership and distributor scoping. The website is an entry point to technical discovery, not a replacement for a complete API contract.

## Enquiry application

Use **Request a demo** when the visitor is submitting interest. Use **Book a demo** only if an actual scheduling connection is added and a slot is confirmed.

The first form should request: name, business name, role (brand/distributor/other), city or service region, area of interest, and a preferred contact method with the relevant email or phone field. Keep fleet size, outlet count, DMS name and further details optional or collect them during follow-up. Distributor owners should not be rejected merely for using a personal email address.

Carry the selected product/audience into the form visibly. A successful submission means that the enquiry has been stored or accepted by the configured system, not that the business is onboarded or a meeting is booked. Show a clear failure state and preserve entered information if submission fails. Do not display a promised response time until sales agrees to it.

Proposed processing: validate fields on the server, reject spam and excessive repeats, create an enquiry record, and route it to the confirmed sales destination. Record the originating page and campaign only as appropriate to the agreed analytics/privacy setup. Keep contact details out of analytics events and URLs. Obtain a real destination and policy text before enabling production submissions; no messages or test leads have been sent during this planning work.

## Visual direction

Use the existing purple Qwipo logo as the starting identity, subject to official assets. The decks also use blue/orange and teal/orange, so they do not establish one consistent design system. Resolve that before producing a full page set.

Recommended treatment: light backgrounds, strong readable typography, restrained use of purple, real app/operations imagery and generous spacing. Choose one accent for DigiDukaan and a distinct but related accent for Logistics Tech. Avoid generic “AI” imagery and dashboards full of invented activity.

The visual hierarchy should make the product name, business value and next action obvious. Keep diagrams readable on a phone. Motion should help explain an order or delivery sequence, with a static alternative. Show genuine customer/partner marks only with the correct relationship and permission.

## Content and evidence model

Keep page content separate from layout so wording, product conditions and evidence can be updated consistently. Each published metric should contain its value/unit, definition, reporting period, geography, product scope, source and publication status. Keep an internal owner and review date. Product features need availability status; integrations need supported scope; case studies need permission and a defined measurement period.

Do not ship the research corpus or internal approval metadata in public assets. Public pages should receive only the approved content fields. Build-time checks should catch placeholders, unapproved claims and missing required destination links.

For launch, content can live in versioned structured files. Add a content management system if business teams need frequent direct editing. Avoid building a custom administration app solely for a small first release.

## Proposed implementation

Use **Next.js and TypeScript** as a practical starting point for indexable product pages, a small interactive walkthrough and server-validated enquiry handling. Keep most content rendered as HTML and use client-side interactivity only where needed. This is a proposed stack, not a requirement inferred from the currently empty workspace.

The official documentation supports [page metadata and social previews](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) and [server-side form handling, validation and submission states](https://nextjs.org/docs/app/guides/forms). Select the supported release and compatible deployment environment when implementation begins. A production enquiry handler requires a server-capable destination or an explicit external form endpoint; a static-only export is insufficient for the proposed server processing.

Initial architecture:

- Product and audience pages with shared navigation, footer, CTA and evidence components.
- Structured content for products, claims, FAQs, integrations and case studies.
- Small isolated components for guided walkthroughs and the enquiry form.
- Server submission handler connected to the agreed CRM or lead store.
- Deployment preview with indexing disabled, then controlled publication to the agreed domain.

Public-site delivery should be independent of operational order/DMS systems in this phase. The showcase needs explanatory content and approved media, not production credentials or live order access.

## Search visibility and migration

Give each product and audience page a distinct title, description and canonical URL. Add a sitemap, appropriate robots rules and social preview images. Use descriptive links and structured headings, and keep essential content available without requiring an animation or app login.

The existing site has `/about`, `/services`, `/blogs`, `/career`, `/partners` and `/contact-us` destinations visible in its navigation. Before replacing it, inventory actual indexed URLs and retain, map or redirect them deliberately. Preserve existing app privacy-policy and app-store destinations. Do not remove unrelated company content merely because it is outside the new hero narrative.

The preferred final domain remains a decision. Keep the first implementation as a private review deployment until content, enquiry handling and domain changes are ready.

## Delivery phases

| Phase | Work | Exit condition |
|---|---|---|
| 1 Content decisions | Confirm naming, live products, claims, selected visuals, contacts and page scope | Approved content inventory with clear unresolved items |
| 2 Experience design | Homepage and key product/audience layouts, mobile navigation, enquiry flow | Reviewable desktop/mobile prototype and complete page copy |
| 3 Working showcase | Build pages, reusable components, approved media and product walkthrough | All launch routes work in a private preview |
| 4 Enquiry and evidence | Connect agreed lead destination, add permitted case studies, validate failure states | End-to-end submission verified with the agreed test destination |
| 5 Release preparation | Accessibility, browser/device checks, metadata, link migration, policy content and domain setup | Launch checklist satisfied and publication decision concrete |
| 6 Iteration | Review enquiry quality, audience behavior and sales feedback | Prioritized improvements based on real use |

An implementation schedule should be set after confirming available assets, lead destination and content reviewers. Copy, design and component work can progress while historical numerical claims are being reconciled.

## Acceptance criteria

- A brand or distributor visitor can identify Qwipo's role, distinguish the principal products and find the relevant enquiry route.
- DigiDukaan copy preserves area/distributor availability, delivery conditions and payment relationships.
- All public metrics have the appropriate date, scope and approval; draft features and prospective partners do not appear as live offerings.
- Every primary CTA reaches a functioning destination. Enquiry success is reported only after actual acceptance; invalid input, network failure and duplicate clicks have useful behavior.
- Navigation and forms work with keyboard input, visible focus, readable contrast and clear labels. Layouts fit common mobile, tablet and desktop widths without horizontal overflow.
- Product images load efficiently with appropriate sizing and alternative descriptions. Essential copy remains readable if optional animation is disabled.
- Metadata, canonical links, social previews and sitemap are correct; private preview indexing is disabled and production rules are checked at launch.
- Existing important URLs and policy links are preserved or deliberately redirected.
- Internal research, partner proposals, operational identifiers and credentials are absent from the publicly served build.

## Success measures

The primary measure is qualified brand/distributor enquiries, followed by demos held and pilots or partnerships initiated. Track product interest and audience type so the team can distinguish useful pipeline from general traffic. Supporting events include enquiry starts, accepted submissions, walkthrough completion and retailer app-link clicks. Establish a baseline after launch before setting numerical targets.

## First implementation slice

Start with the homepage, DigiDukaan, Logistics Tech, a shared enquiry page and the navigation/footer. Prepare brand/distributor audience pages and integrations using the same content system. Add the ITC case study only when its evidence and public use are agreed. This produces a coherent first release without making unresolved statistics a dependency for every design task.
