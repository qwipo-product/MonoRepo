# Buyer Analytics — brief
date: 2026-10-01
status: built, then embedded in qwipo-analytics (Reports → DigiDukaan · Buyer → Buyer app analytics); the standalone app was retired 2026-10-01
kit: web
audience: Qwipo leadership, product, growth, category, ops and tech teams reviewing what buyer-app analytics (PostHog events) should show
user: an internal Qwipo team member on a laptop, reading the buyer app's product analytics
flows:
  - Leadership checks whether more buyers are ordering every week (Business Overview)
  - Growth sees where new buyers drop off between sign-up, KYC and first order (Onboarding & KYC)
  - Product and category teams see how buyers find products and which searches return nothing (Discovery)
  - Product and business find where carts stop turning into orders, and why (Cart & Checkout)
  - Business and sales see who is reordering and which regular buyers have gone quiet (Reorder & Retention)
  - Ops, support and tech see cancellations, support demand, slow screens and rage clicks (Orders, Support & App Health)
states: every list or chart responds to the shared filters (Date range, City, Platform, Buyer type, App version); "week not finished yet" cells in retention; Reset filters. No empty state: the sample data scales down with filters but never reaches zero
source: C:\Users\Admin\Downloads\Buyer App Analytics Dashboards.html (six 1440px boards, sample data, "Updated 30 Sep 2026")
data: app-local series under src/data/ (funnels, weekly trends, city split, retention cohorts, at-risk buyers). Not in @mockups/mock-data; one generated world so numbers agree across boards
share: laptop for now; deployed URL decided later (deploy-mockup)
done-when: Business Overview lands, and changing a filter visibly updates every chart on the page and the other five boards
out of scope: real PostHog connection, auth, session-recording playback, any backend; changes to qwipo-analytics
