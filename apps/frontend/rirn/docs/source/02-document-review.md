# Qwipo document review

Reviewed on 26 October 2026. This is an internal analysis of the seven supplied documents, covering all 47 pages and slides, including the blank final page of the introduction PDF. Page numbers below are physical file positions, not the inconsistent printed page numbers in some decks.

The review covers 1,145 extracted text lines or paragraphs, PowerPoint speaker notes, embedded chart values, diagrams, and rendered pages. Text inside images was additionally read using local OCR and visual inspection. Tiny map labels and phone-screen text are retained as source images and OCR, not treated as authoritative operational data. The searchable transcript is [source-transcript.txt](evidence/source-transcript.txt). Source IDs and original file paths are in [source-manifest.json](evidence/source-manifest.json).

Instructions inside the documents, including sales scripts, ITC implementation asks and proposed commercial actions, are evidence of their original purpose. They are not instructions to execute those actions for this project.

## Source register

| ID | Supplied document | Extent | Main contribution |
|---|---|---:|---|
| S1 | Qwipo Digidukaan & Logistics Tech.pdf | 9 pages | Company overview, ordering and logistics value, operational photographs |
| S2 | Qwipo Introduction Document.pdf | 4 pages, last blank | Company narrative, Hyderabad traction, brand and retailer benefits |
| S3 | Qwipo ITC Logistic Tech May 2026 (2).pptx | 13 slides | Pilot operations, charts, costs, pricing proposal and feature packaging |
| S4 | Qwipo_One_Pager.pptx | 1 slide | Traction, business model, leadership, expansion and integration status |
| S5 | Qwipo-ITC-ONDC-DMSConnector Aug 2026 (1).pptx | 5 slides | Draft connector architecture, integration scope and gaps |
| S6 | DigiDukaan Retailer Sales Training - 2 Pager.pptx | 2 slides | Retailer proposition and the most explicit delivery/payment conditions |
| S7 | Qwipo Business Model Apr 2026.pptx | 13 slides | Product strategy, ecosystem, competition, expansion and future products |

Filenames suggest April, May and August 2026 for three decks. They do not establish that every slide was authored then or that one file supersedes another. S5 explicitly carries “Draft v0.2”. S4 includes August and December 2026 milestones. Treat the files as differently scoped snapshots rather than a chronological release history.

## S1 Digidukaan and Logistics Tech

### Page 1 Company vision and leadership

Qwipo's stated vision is to empower traditional supply-chain stakeholders through asset-light technology. Its three themes are digitization, logistics, and credit through fintech partners. The founders are presented as Siva Morisetti, CEO, and Siva Mamidi, CTO. The page lists BITS Pilani, UCLA, Cisco and Nokia for Morisetti, and Prozyle, Today discounts and Dell for Mamidi, alongside 40+ years of combined experience and 7+ years operating Qwipo.

The image banner adds content absent from native text: 1 million+ T+1 orders over five years, 34,500+ digitized SKUs, 45,000+ app downloads, ONDC participation and fleet partnerships across India. These are differently scoped claims: fleet partnerships do not establish nationwide DigiDukaan serviceability. Credit is not established as generally available by this page; S6 explicitly marks fintech credit coming soon. Leadership biographies and the current titles need confirmation before publication.

Website use: company story, approved founder biographies and the relationship between commerce and logistics. Use dated, defined traction only after reconciliation.

### Page 2 Two principal offerings

DigiDukaan is the digital ordering interface between distributors and retailers. Logistics Tech is the operations platform for warehouse-to-delivery fulfillment. Catalogues, schemes and ordering convenience sit in the first offering; routes, loads and delivery visibility sit in the second. Their complementary roles are clearer than the broad “higher margins” and “growth story” labels.

Website use: the two main product pages and a simple explanation of how they connect. Correct duplicated wording and avoid promising measurable margin improvement without evidence.

### Page 3 Ordering problems and market statistics

The page identifies irregular sales visits, missed schemes, unclear prices/credit terms and quick-commerce pressure. It claims 20–30% supplier switching, 30–40% dependence on representatives, 25–35% buying elsewhere, a 67% drop in kirana sales and approximately 12–15% annual revenue loss. The source is only “Industry FMCG Distribution Studies 2024”, with no identifiable study, sample or geography.

The business problems are useful hypotheses for messaging. The percentages are not publication-ready evidence and differ from S2. Avoid broad allegations about named competitors. Website copy should describe the everyday problem without these numbers.

### Page 4 Ordering benefits

The six benefits are ordering anytime, faster DMS order processing, fewer manual errors, fuller product discovery, scheme-led purchase opportunities and more regular retailer engagement. These describe the intended value of a digital distributor channel.

“100% visibility”, “24/7 availability” and “0% manual errors” are absolute claims. Ordering convenience is not an uptime commitment, and direct digital orders do not eliminate all operational errors. Rewrite as “reduce manual order entry” and “help retailers see available products and schemes”. DMS automation applies to supported integrations.

### Page 5 Logistics problems

Manual route planning, unused vehicle capacity, missing ETAs and unmeasured driver time are the principal problems. Claims of 10–20% excess distance, 20–30% unused capacity, 10–25% lost driver time and up to 20% savings cite only a generic 2024 analytics source.

Website use: explain the operational problems and show product capabilities. The percentages need identifiable research or a clearly bounded Qwipo case study.

### Page 6 Logistics capabilities and examples

The solution combines route planning, load batching, tracking/ETA and OTP delivery confirmation. “Save approximately 10 km per route” and “reduce five trucks to four” have no specified dataset here. OTP supports proof of delivery but does not establish that disputes or pilferage cease.

Website use: capability explanation. Use those numbers only in a clearly labelled illustrative scenario, or replace them with a reconciled pilot result.

### Page 7 Why digital ordering needs logistics coordination

The diagrams contrast predictable sales-beat demand with orders arriving across multiple areas at arbitrary times. Existing operations are organized around visiting particular areas on particular days. Digital demand can arrive outside that pattern, requiring order grouping, capacity allocation and route planning.

This is the key connection between DigiDukaan and Logistics Tech. The “T+1: NO” label describes the problem with unsupported ad-hoc fulfillment; it is not a statement that Qwipo never provides next-day delivery. Some source sentences are incomplete and should be rewritten, not copied.

### Page 8 Route consolidation example

The map and accompanying text report five vehicles instead of six, or a 16.7% reduction, while combining Vajra and Unnati orders. The map illustrates geographic grouping and vehicle-level planning. It is one illustrated scenario, not the same measure as the pilot's average 4.84 trucks/day or the generic five-to-four example.

Website use: a case-study visual after checking the period, source and permission, and removing operational identifiers. Do not label map screenshots as a live public control tower.

### Page 9 Operations photographs

Photographs show distributor desk operations, route mapping, driver/mobile use, loading and retailer delivery interactions. A fragmented YouTube channel reference is present. These provide more credible visual context than generic stock supply-chain illustrations.

Website use: select original-resolution photographs after confirming publication permission. The photographed phone screens and maps are not specifications. Verify the video destination before embedding and obscure personal/order information.

## S2 Introduction Document

### Page 1 Company and scale

Qwipo describes itself as a technology-driven B2B commerce and logistics platform. It reports a Hyderabad operation with 11,000+ active kiranas, 1,500+ HoReCa customers, 150+ brands and distributors, 34,500+ SKUs, 45,000+ app downloads and 10 lakh+ delivered orders over five years. HoReCa is the hospitality and food-service customer segment.

The document distinguishes an integrated commerce-and-fulfillment offering from an independent enterprise logistics product. Both are described in an ONDC participation context. This supports presenting Logistics Tech as useful even when a prospect does not adopt DigiDukaan ordering.

The broad next-day-delivery statement must retain S6's distributor, serviceability and order-value conditions. The aggregate “brands and distributors” cannot be compared directly with S4's brands or S6's companies/brands. App downloads, active outlets, total registered retailers and cumulative delivered orders are different measures.

### Page 2 Distribution gap and ordering capabilities

Limited salesforce coverage leaves some outlets underserved and reduces visibility into products, prices and schemes. The proposed digital channel brings multiple distributors into one interface, with DMS order placement and more consistent replenishment.

The statistics are 35–40% reducing/shifting purchases, 30–35% dependent on reps for schemes and 25–30% switching channels. These differ from S1 and have no precise source. “All FMCG brands” is aspirational wording; use “participating brands and distributors available in your area”.

### Page 3 Brand business outcomes

The intended outcomes are wider outlet coverage, more frequent ordering, larger baskets, retailer retention, lower cost to serve, distributor-volume protection and better visibility. The strategic point is adding a digital ordering channel within existing distribution relationships.

Website use: brand page organized around outlet coverage, retailer engagement and distribution visibility. These are expected benefits, not quantified results measured by the supplied pilot. Claims of inevitable migration or “permanent” loss should not be repeated as facts.

### Page 4 Blank page

No substantive text or images. Included in the 47-page coverage count.

## S3 ITC Logistics Pilot

### Slide 1 Pilot context

The scope is an ITC x Qwipo Vajra + Unnati unified-logistics pilot in Hyderabad. The headline is fewer trucks, lower fuel/time costs, and better visibility into invoice aging and returns. This is a specific pilot context, not evidence of universal customer outcomes or a current national deployment.

### Slide 2 Mandate and economic proposal

The original mandate was D+1 Unnati delivery for one Hyderabad WD, with logistics cost within 4% and a longer-term 2% goal. The earlier independent 3PL arrangement is described as a six-month pilot at 4.3%. The proposed unified model uses spare space in the distributor's existing trucks and technology for route planning.

The January table lists Vajra cost 1.80%, Unnati 4.30% and blended 2.27%. Reimbursements are 1.20% and 4.30%, with 0.60% borne by the WD on Vajra. The proposal lists operating cost 1.80%, tech fee 0.26%, reimbursement 1.20% plus 0.26%, blended 1.46%, and savings 0.81%.

Important interpretation: 2.27 minus 1.46 is **0.81 percentage points**. The displayed 1.46% equals 1.20% reimbursement plus 0.26% technology, rather than 1.80% operating cost plus 0.26%. The payer/denominator and weighting must be clarified before describing this as an apples-to-apples total-cost reduction. The earlier six-month arrangement and March–April unified pilot are different periods.

### Slide 3 Pilot outcomes by stakeholder

Reported totals: ₹1.57 crore delivered value, 3,837 delivery points, 789 unique outlets, 4,035 orders delivered and 5,760 km. Reported benefits include avoiding an extra Unnati truck, approximately ₹1.22 lakh saved from 49 days at ₹2,500/day, average daily trucks reduced from 6 to 4.84, 16% distance/fuel savings, tracking and OTP delivery.

Calculated from the stated figures, 49 × ₹2,500 is ₹1,22,500 and 6 to 4.84 is about 19.3% fewer trucks. These calculations do not independently validate the underlying pilot. “100% of Unnati orders fit existing trucks” is a capacity statement; it is not a 100% D+1 delivery result. “No pilferage” should not become a permanent product guarantee.

### Slide 4 Returns and re-delivery attempts

The chart's RR measure includes actual returns and re-delivery attempts. Its invoice series totals 4,035 invoices and 428 returned-on-delivery invoices, or 10.6%. The embedded value series totals ₹151.6739 lakh delivered and ₹7.7085 lakh returned, approximately 5.08%. This explains the displayed 5.1% using underlying chart values; calculating from rounded “₹8 lakh / ₹1.52 crore” gives a different approximation.

The separate actual-returns table lists sales/SRN values: January ₹98,05,734/₹2,16,116 (2.20%), February ₹1,01,92,909/₹2,25,919 (2.20%), March ₹1,02,08,013/₹2,62,930 (2.60%), April ₹1,15,05,278/₹2,34,070 (2.00%). It supports a March-to-April decline, not an uninterrupted month-on-month decline across January–April.

The slide also reports repeat-return outlets, concentration of returns in 16% of sales beats, and three problematic beats. These are internal diagnostic details. A public case study should explain the ability to identify return causes without exposing outlet identities or conflating final returns with failed delivery attempts.

### Slide 5 Delivery aging

The image tables add material evidence absent from native slide text. March invoices: D+1 1,463; D+2 301; D+3 131; D+4+ 126, totaling 2,021. April: 1,395; 338; 194; 87, totaling 2,014. Across both months, D+1 is approximately 70.8% and D+4+ approximately 5.3%. Displayed rounded proportions are 71%, 16%, 8%, 5%.

The weekly table covers March 23–31 and four April periods, while its total column refers to March 3–April 30. Its visible weekly columns are therefore not the full period represented by that total. D+1 varies from 47% to 86% in these displayed periods. Returns/re-delivery and driver/helper availability are identified as aging causes.

Website implication: sell visibility and operational improvement. This evidence cannot support a universal next-day delivery guarantee. Confirm what D measures, the invoice cohort, order channel and exclusions before quoting SLA results.

### Slide 6 Driver performance

March shows 145 trips, 3,044 km, 2,225 delivery attempts, 479 returns and ₹95.9 lakh net sales. April shows 120 trips, 3,182 km, 1,933 attempts, 253 returns and ₹81.58 lakh net sales. Individual driver rows illustrate comparisons by trips, distance, sale contribution and returns.

The displayed total “17% returns” in each month does not equal returned-count divided by attempts: those ratios are approximately 21.5% and 13.1%. Some individual percentages likewise use an unclear denominator. The two-month totals give 6,226 km and ₹177.48 lakh, differing from slide 3's 5,760 km/₹157 lakh and slide 4's chart value of ₹151.67 lakh. These could be different cohorts; the source does not explain them. Do not silently choose or average them.

Website use: anonymized analytics capability, not named-driver rankings. Reconcile definitions before publishing metrics.

### Slide 7 Fleet and fuel utilization

The baseline is approximately six trucks/day, followed by 5.12 in March and 4.56 in April. The optimizer considers order volumetric weight, distance, vehicle time availability and vehicle capacity; April adds improved clustering. Fuel costs are ₹47,398 in January, ₹46,674 in February, ₹43,566 in March and ₹37,994 in April. Monthly fuel/sales ratios are shown as 0.48%, 0.46%, 0.43%, 0.33%.

The stated sequential declines of approximately 6.7% and 12.8% align with the fuel-cost table. February to April is approximately 18.6%, and January to April approximately 19.8%; neither should be substituted for the separate 16% headline without explaining the baseline. The simple average of 5.12 and 4.56 is 4.84, but the operational average needs weighting by comparable days.

### Slide 8 Unified route maps

The first map shows five geographically grouped truck routes. The second distinguishes Vajra circles and Unnati diamonds, illustrating mixed order sources on one fleet. This substantiates the explanation of consolidation. It does not, by itself, measure fuel savings or prove every route had no overlap.

### Slide 9 Planned versus actual distance

Three examples compare planned/actual distance: 23.5/48 km, 34.71/69 km and 43.11/76.16 km. Delivery completion is 19/20, 28/30 and 25/25 points. Native text includes “Total Potential Savings: 93 km”; the exact differences add to 91.84 km, while displayed whole-km row labels sum to 93 km.

These are unrealized route-adherence opportunities, not achieved savings. Different delivery completion also limits a direct route comparison. Screenshots state that some optimization details expire after seven days. This is a historical screen behavior, not a confirmed current retention policy.

### Slide 10 Further route comparisons

Two pairs of route screenshots illustrate the second and third cases. Native XML also contains unused customization text and inconsistent page labels that do not appear as substantive content in the rendered slide. They are template remnants, not a request to add content.

Website use: redraw a permission-cleared, anonymized explanation or use a prepared product demo. Do not publish screenshots containing identifiers or expired-detail messages.

### Slide 11 Pricing and expansion proposal

The existing pilot price is ₹200 per truck/day, approximately 120 truck-days/month and ₹24,000/month, stated as 0.24% of ₹1 crore monthly sales. “120 trucks/month” needs the truck-day interpretation for this arithmetic. The note about one truck/month saving ₹40,000 likewise needs a period definition.

The proposed enterprise arrangement is ₹7.5 lakh fixed monthly platform fee, waived at 100 WDs, plus a variable fee per WD, with at least 30 WDs to start. The image table gives ₹10,000/month for 1–2 trucks/day and sales below ₹75 lakh; ₹12,500 for 3–5 trucks/day and ₹75 lakh–₹1 crore sales; ₹15,000 for 6+ trucks/day and sales above ₹1 crore. Per-truck/day equivalents are ₹385/₹192, ₹160/₹96 and ₹96/₹58 for minimum/maximum usage. These imply operating-day/utilization assumptions not fully specified.

Treat all of this as a partner-specific proposal. Do not use it as the public pricing page or imply the variable fee is the full enterprise contract cost.

### Slide 12 Feature packaging

Basic lists own-fleet enablement, RTO handling, bulk ingestion, order-to-trip consolidation, driver/helper app, order/trip visibility, limited exception tracking, delivery/cost reports, basic efficiency insights, training and grievance support. COD tracking and payment gateway integration appear as add-ons.

Standard adds network/idle-fleet use, trip consolidation, second-trip/load optimization, time and idle tracking, live GPS, advanced reporting, payment reconciliation and planned returns/reverse logistics. Credit partner enablement remains an add-on. Premium adds DMS integration, OTP/photo/signature proof of delivery, a control tower, trend reports, recommendations, dedicated onboarding and account management. The side table includes cash handling, insurance, integrations, credit and gateway add-ons.

This is packaging evidence, not proof that every listed feature is live. OTP and DMS integration appear as broad benefits elsewhere but are Premium features here. Confirm scope and packaging before promising inclusion. The cost list describes Qwipo's development, network, cloud and account-management expenses, not a complete margin model.

### Slide 13 Closing

Thank-you slide with no additional business claims.

## S4 One Pager

### Slide 1 Company overview, commercial scale and team

The one-pager reiterates asset-light enablement of existing manufacturers, authorized distributors and retailers. It separates marketplace/ONDC services and credit partners from logistics SaaS. The competitor diagram includes infrastructure vendors, B2B marketplaces and quick-commerce businesses; their capabilities and economics are asserted without current comparative evidence.

Reported traction is 13.5 lakh+ fulfilled orders, 112 Greater Hyderabad pincodes, 10,600+ retailers, 81 brands, 56.8K+ tons (56K+ QFF and 800 Logistics Tech), ₹81.5 crore FY26 GMV, ₹3.61 crore FY26 gross margin, 45,513+ database SKUs and 3,750+ active selling SKUs. GMV is not company revenue; “gross margin” is reported as an amount, not a percentage. QFF is not expanded in these documents. Cumulative periods and metric definitions are incomplete.

Mumbai/Jaipur going live by end-August 2026 and 50,000 retailers/125+ brands by December are milestones or targets. The passage of those dates does not establish completion. Paytm integration is explicitly in progress. “First DigiDukaan of India” and 13+ media outlets need substantiation; the mission to digitize 1.4 crore kiranas is an ecosystem ambition, not Qwipo's customer count.

Founders are Siva Morisetti and Siva Mamidi. Manish Anand is presented as board advisor and Group CEO at Proveno Capital; Ravi Inukonda as board member and DoorDash CFO, formerly Uber. These external roles require current checks. The business contact listed is siva.morisetti@qwipo.com and +91 91542 97179. Confirm the intended public sales contact rather than automatically using a founder's number as support.

Website use: candidate proof points, company story and leadership. Keep targets, financials and internal commercial details out of default public copy until selected and confirmed.

## S5 DMS Connector

### Slide 1 Architecture and ownership

The DMS remains authoritative for product, price, stock, scheme and customer master data. Qwipo's connector maps and validates data, scopes reads/writes per distributor, publishes downstream information and pushes orders to the DMS. Status changes flow back. Buyer channels interact with the connector, not directly with the DMS.

“Never overwritten” refers to master-data authority; it cannot mean no DMS writes because the same slide explicitly pushes orders. “Any DMS” and “configured, not custom-built” describe a framework ambition, not a verified compatibility list or zero integration effort. Website use: explain compatibility with existing systems and agree scope per DMS.

### Slide 2 Data-flow mechanisms

The matrix associates catalogue and schemes with daily pulls, SKU/scheme changes with webhooks, inventory/pricing with pulls plus webhooks, and order creation with Qwipo pushes. The order-status row marks a Qwipo push plus a DMS webhook, whereas slide 3 specifies a status GET plus webhook. This directional inconsistency needs clarification.

“Daily” and “real-time” are configured per domain and partner. The website should not promise that all data always updates instantly.

### Slide 3 Core integration scope

Eight listed domains are catalogue, SKU updates, inventory, pricing, schemes, scheme updates, order creation and status. The draft includes example paths for paginated/delta SKU retrieval, inventory/pricing reads and webhooks, scheme reads/updates, order POST and status GET/webhook.

These are eight domains, not necessarily eight physical endpoints: several rows specify both pull and push mechanisms. The slide says all are required; its note allows Scheme Update to be deferred. Treat the paths and prerequisites as a draft partner integration design, not independently verified ONDC standards or available production endpoints.

### Slide 4 Incomplete additional scope

The title/text promise seven additional “ONDC-mandated” endpoints, but the visible slide and its native content include only Order Cancellation. Notes mention cancellation, returns, invoice and serviceability as common blockers but do not supply the six missing rows. P1/P2 are defined, yet no populated priority matrix follows.

This is a substantive source gap. Do not invent the missing APIs or publish a compliance claim from this deck. A later technical integration requires the actual applicable ONDC specification and complete partner contract.

### Slide 5 Effort and prerequisites

The slide lists six pull methods, five update mechanisms, and setup for distributors, serviceability and retailers. It groups work into catalogue foundation, updates and configuration and says ITC could go live within weeks. The six/five summary does not cleanly reconcile with the earlier endpoint/domain table and contains no estimated person-days or committed dates.

Its note asks ITC leadership to confirm owners and target dates. This is an internal ask, not authorization to contact ITC. Website use: an integration-discussion CTA and a phased onboarding description, with timing based on technical discovery.

## S6 Retailer Sales Training

### Slide 1 Retailer pitch and delivery modes

DigiDukaan connects retailers with authorized distributors and supports ordering between sales visits. Benefits include convenient ordering, genuine products, catalogue/pack-size visibility and scheme discovery. It reports 81+ companies and 120+ brands; “live now” names Colgate, Emami, NTR, Priyagold, Eastern Masala, Mysore Sandal and “Vico Turmeric”. Confirm the exact brand spellings and local availability rather than silently correcting them into a published list. Tata Consumer, HUL and Marico are explicitly coming soon in this guide.

Beat orders follow the distributor's regular route and schedule; the app is described as showing brand delivery days and the next beat. Next-day orders are outside that schedule, generally have a higher minimum order value, and require distributor approval. The guide describes a separate delivery trip; the actual fulfillment model can also consolidate digital orders, as S3 demonstrates. Do not promise one dedicated truck per urgent order.

The source describes a government-supported digitization initiative. Public wording should identify the ONDC relationship accurately and avoid implying that Qwipo is a government-operated service or that every order has government backing.

### Slide 2 Pricing, payment, credit and support

The guide promises offline distributor prices and no additional platform charges in this sales context. It lists Buy X Get Y, quantity discounts, free products, promotional and seasonal offers. This is not a universal lowest-price claim or proof of zero delivery charges for all fulfillment models.

Delivery stays with the retailer's distributor. Existing credit/cash terms continue. New retailers begin with cash, and any distributor credit is the distributor's decision. Fintech credit is explicitly coming soon, subject to eligibility and lending partners. The support categories are defined, but the support number, representative and representative number are blank.

Website use: retailer FAQ, reassurance about distributor continuity and delivery conditions. Confirm current commercial policy, support contact and credit availability before publishing. Do not turn the close into promises of guaranteed credit, all brands everywhere or unrestricted next-day service.

## S7 Business Model

### Slide 1 Positioning

Qwipo is framed as technology for FMCG and staples distribution, with an “operating system” ambition. The focused category framing is appropriate for the selected brand/distributor audience; the metaphor needs a plain explanation of actual products.

### Slide 2 Structural problems

The problems are limited digitization, missing on-demand logistics, capital tied up in trade credit, and competition from parallel distribution networks. “Over 90% offline” and a $250B+ network lack precise sources. Use the operational issues rather than unverified market percentages.

### Slide 3 Model and value chain

The diagram places Qwipo between distributors/wholesalers and retailers, offering marketplace technology, logistics SaaS and access to lending partners while preserving the supply chain. It explicitly describes an asset-light model and differentiates from owning inventory.

This supports the main company narrative. It does not establish the seller-of-record, invoicing, settlement or contractual liability for every transaction.

### Slide 4 Order and fulfillment flow

Retailers order through DigiDukaan; sellers manage orders through a Qwipo Seller App; Logistics Tech plans routes and matches capacity. The distributor fleet is the primary path, with a 3PL network handling overflow.

Website use: one connected journey. Keep the Seller App as a supporting operational component unless its independent product positioning is confirmed. Do not imply every order is physically delivered by Qwipo-owned vehicles.

### Slide 5 Competitive positioning

The diagram contrasts quick commerce, B2B commerce, legacy enablers and distributor-channel digitization. Qwipo's useful affirmative differentiators are no inventory ownership, distributor-to-retailer discovery and combined commerce/logistics capabilities.

Broad claims that competitors have no relevant tools, lose money or exclude all distributors need independent evidence. “Salescode Digivypar launched two months ago” is relative to an unspecified slide date. The diagram's 95%/5%/100% figures lack defined denominators. Exclude these comparisons from the launch website.

### Slide 6 Market sizing

The deck uses $250B FMCG sales, an assumed 1% software spend and a resulting $2.5B opportunity, alongside 4.5 lakh distributors and 200–400+ retailers per distributor. It projects $615B by FY28 and translates the opportunity to ₹20,000+ crore.

These are market-sizing assumptions, not Qwipo revenue or guaranteed software demand. Distributor networks may overlap, so multiplying distributors by retailer counts would not yield unique retailers. “Already integrated” on ONDC does not establish every integration or geography. This section belongs in internal strategy, not the main enquiry funnel.

### Slide 7 DigiDukaan

The product is a unified buyer app for kirana/retail store owners to browse catalogues, view schemes and order from local distributors at any time. Multi-brand access is the core proposition. The 40–60% salesforce coverage claim and negative “grey-market” language are not substantiated.

The screenshots show brand/distributor discovery, categories and cart-related surfaces. They establish examples of interface design, not current version completeness or universal availability. Replace “every retailer, every brand” with wording limited to participating distributors and serviceable locations.

### Slide 8 Logistics SaaS

The product covers routes, load planning, OTP, returns and dashboards for FMCG distribution. Its specific focus is the distributor-to-retailer last mile. The problem statements explain why driver adherence, packing, ETA visibility and returns tracking matter.

Website use: Logistics Tech page grounded in demonstrated workflows. Do not present the competitor-market assertion or 20–30% wasted space as independently established facts.

### Slide 9 White-label ordering SaaS

A third product direction is a brand-specific ordering app with catalogue/scheme access, AI stock suggestions, image-based shelf management and generated video advertising. Shikhar and Unnati screenshots are reference products, not Qwipo-built work. “Features unavailable in generic SaaS” is an unverified competitive claim.

The supplied material does not prove release status, deployments or performance of these AI features. Keep this as an internal opportunity or a separately qualified enterprise discussion until product ownership confirms availability.

### Slide 10 Momentum and pipeline

The deck describes outreach to 35 regional Hyderabad FMCG brands, possible ONDC support up to ₹5 crore for 40,000 outlets over 6–9 months, an oil-distributor entry strategy, logistics expansion to Punjab/Chandigarh, ten more planned cities and intended pitches to large brands.

Interest, willingness to invest, prospective pitches and planned cities are not executed contracts, disbursed funds or launched services. Lists of Nestle, Mondelez, Colgate-Palmolive, Godrej, Britannia and Dabur are not a customer roster. City expansion and ITC relationship scope need current evidence and permission for public use.

### Slide 11 Go-to-market strategy

The plan starts with two or three anchor FMCG clients over months 1–6, scales their distributors over months 7–18 and expands cities in years 2–3. The sales motion moves from headquarters to regional managers to distributors to retailers, supplemented by retailer self-activation.

This supports the chosen enterprise-first website with distinct brand and distributor paths. The phases are a strategy, not a dated delivery commitment. A public site should help visitors start an onboarding/pilot conversation rather than imply instant national rollout.

### Slide 12 Long-term vision

The 2030 ambition is broad adoption of Qwipo's distribution technology, with a $600B+ market forecast. It reinforces the asset-light intelligence role but does not establish present scale or market dominance. The FY28/FY30 forecasts elsewhere have different framing and no cited source.

Website use: a concise company ambition without market-size or inevitability claims.

### Slide 13 Closing and app screen

The closing positions Qwipo as B2B technology for consumer-goods supply chains. The app screenshot shows brand/vendor discovery and provides a visual reference; product listings in a screenshot do not prove current contracts, catalogue availability or brand endorsement.

## Cross-document conclusions

1. The consistent core is strengthening the existing FMCG distribution channel through digital ordering and delivery technology.
2. DigiDukaan and Logistics Tech are the clearest principal offerings; the Seller App and DMS connector support their workflows.
3. Logistics SaaS can be discussed independently from DigiDukaan marketplace participation.
4. The strongest numerical evidence is a bounded historical pilot, with several measures requiring reconciliation.
5. Retailer delivery and payment conditions are more specific in the sales guide than in the corporate summaries.
6. White-label AI commerce, fintech credit, Paytm integration and expansion claims have varying future/in-progress status.
7. Company metrics, brand counts and customer counts cannot be combined without dates and definitions.
8. The public website needs a governed content set; uploading these decks directly would expose proposals, operational identifiers, inconsistent claims and unfinished draft content.
