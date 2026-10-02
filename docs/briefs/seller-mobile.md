# Seller Mobile — brief
date: 2026-10-02
kit: mobile
audience: distributors in a usability test, on a phone; findings feed the React Native seller app plan
user: a distributor (seller login only, never super admin) — the owner and their ops staff; not tech-savvy, so every action — single or bulk — is easy to find and done in as few taps as possible; look and sizing follow the customer app (qwipo-buyer-paytm-app)
flows:
  - Seller logs in with mobile + OTP and, with more than one seller membership, picks the seller.
  - Owner opens the app and sees today's new orders and sales on the dashboard.
  - Ops staff confirms a new order — first changing a line's quantity or removing an unavailable item if needed — or cancels it with a reason, then marks it delivered. One at a time or several at once (bulk confirm / cancel / deliver, as in the portal). Tabs: New · Confirmed · Delivered · Cancelled. Every New / Confirmed order shows its beat name (or quick delivery) and expected delivery date, filterable by delivery day.
  - Ops staff searches a SKU and changes its stock or price, or switches it off.
  - Owner looks up a customer and sees their orders.
  - Owner views offers and creates a slab scheme (buy at least N units, get X% off) on chosen SKUs.
  - Owner checks profile and store settings, and contacts support.
states: empty (day-one seller, every list) | loading | error | new order arriving | item unavailable → change quantity or remove before confirm | SKU not ONDC-compliant (shown disabled)
source: seller portal — /Users/admin/git/qwipo/seller-platform/apps/frontend/seller-portal (Angular, real pages); seller-store mockup (web, same features); qwipo-buyer-paytm-app for the mobile look and patterns
data: extend @mockups/mock-data with seller-side fixtures (orders with lines and statuses, SKUs with stock/price/compliance, customers, schemes); today they live only inside seller-store
share: deployed URL like the buyer app — mockups-seller-mobile.dev.bms.qwipo.com (deploy-mockup); Network URL on a phone until then
done-when: a distributor, without help, confirms a new order and marks it delivered on the phone
out of scope: super-admin pages (Sellers, Companies & Brands, Category Master), Connectors / DMS / Dark Stores, SKU bulk update, Reports, order / serviceability / communication settings, salesperson order-taking, the React Native build itself
