# P2P Search — Distributor Registration (Buyer App)

Feature **21492 · Buyer App Changes** · Iteration `Qwipo B2B\Product Enhancement Backlog`

Reference flow: **Tata Consumer Products (TCPL)** — the retailer registers with the company directly; no distributor selection.

<!-- STORY 21493 -->
## 21493 · Buyer App : Show the Register to Order Card on Authorised Distributors

<!-- DESCRIPTION -->
**As a** retailer browsing Authorised Distributors, **I want** a clear prompt that some companies sell only to registered shops, **So that** I know those catalogues exist and can unlock them instead of wondering why brands like Tata Tea or Sunfeast are missing.

---

### What the Card Shows

**Where** — Home → **Authorised Distributors**, pinned at the top of the **Categories**, **Brands** and **Sellers** tabs.

**Register to Order card** — A highlighted card with a **lock icon**, the heading **"Register to order from more distributors"**, a line naming the gated companies (e.g. *"ITC, TCPL, Colgate & Pepsi sell only to registered shops — register once to unlock their catalogues"*) and a **chevron**. Tapping it opens the **Register to Order** page.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | The card shows on all three tabs, in the same position, above the list. |
| BR-2 | The line names up to **four** companies that need registration in the retailer's area. |
| BR-3 | If no company in the retailer's area needs registration, the card is **not shown**. |

### Screenshot

![qwipo-tcpl-01-distributors-promo.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/e74eaa57-e7ab-4e9e-b9ef-b19a506477e3?fileName=qwipo-tcpl-01-distributors-promo.png?fileName=qwipo-tcpl-01-distributors-promo.png)

<!-- AC -->
**AC-1: Card on every tab**
- **Given** a retailer on Authorised Distributors
- **When** they open the Categories, Brands or Sellers tab
- **Then** the Register to Order card is pinned at the top of the list.

**AC-2: Companies named**
- **Given** TCPL and other companies need registration in the retailer's area
- **When** the card is shown
- **Then** its line names up to four of them, e.g. "ITC, TCPL, Colgate & Pepsi".

**AC-3: Card opens Register to Order**
- **Given** the card is visible
- **When** the retailer taps it
- **Then** the Register to Order page opens.

**AC-4: Nothing to register**
- **Given** no company in the retailer's area needs registration
- **When** they open Authorised Distributors
- **Then** the card is not shown and the existing list is unchanged.

<!-- STORY 21494 -->
## 21494 · Buyer App : List Gated Companies with Registration Status

<!-- DESCRIPTION -->
**As a** retailer, **I want** one list of every company that needs registration and where my registration stands with each, **So that** I can register with the ones I want and follow up on the ones in progress.

---

### What the Page Shows

**Register to Order page** — Header *"Register to Order"* with sub-title *"Unlock gated catalogues near you"*, and a short note: *"These companies and distributors sell only to registered shops. Register once, or link your existing customer ID, to unlock their full catalogue on Qwipo."* There are **no tabs** — every gated company is in one list.

**Company cards** — One card per company, showing the **company logo and name**, how it is served and its product count (e.g. *Tata Consumer Products (TCPL) — Register directly · 126 products*), a **status pill**, and **brand chips** (e.g. *Tata Tea · Tata Salt · Tata Sampann · Tetley · Himalayan*). Tapping a card opens that company's registration page **directly** — the retailer does not pick a distributor.

### Registration Status

| Status pill | Meaning |
| --- | --- |
| **Register** | Not registered yet; catalogue locked. |
| **Pending** | Request sent; waiting for the company to pick it up. |
| **In review** | The company is verifying the shop's details. |
| **Rejected** | The company turned the request down; retailer can re-apply. |
| **Registered** | Approved; catalogue unlocked. |

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | Only companies that need registration **and** serve the retailer's area are listed. |
| BR-2 | Each card shows **one** status pill — the retailer's current status with that company. |
| BR-3 | A status change is reflected on the card as soon as the retailer comes back to this page. |
| BR-4 | Long company names are truncated on the card (e.g. *Tata Consumer Pr…*); the full name shows on the registration page. |

### Screenshot

![qwipo-tcpl-02-register-to-order.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/95ff5fa6-4eb9-447f-b991-f7afc3785eac?fileName=qwipo-tcpl-02-register-to-order.png?fileName=qwipo-tcpl-02-register-to-order.png)

<!-- AC -->
**AC-1: Single list**
- **Given** the retailer opens Register to Order
- **When** the page loads
- **Then** all gated companies appear in one list, with no Companies / Distributors tabs.

**AC-2: Company cards**
- **Given** the list has loaded
- **When** the retailer views the TCPL card
- **Then** it shows the logo, "Tata Consumer Products (TCPL)", "Register directly · 126 products", a status pill and the brand chips.

**AC-3: Correct status**
- **Given** a retailer's registration is at any stage with a company
- **When** the page loads
- **Then** that company's card shows the matching pill: Register, Pending, In review, Rejected or Registered.

**AC-4: Open a company**
- **Given** any company card
- **When** the retailer taps it
- **Then** that company's registration page opens directly, with no distributor selection step.

<!-- STORY 21495 -->
## 21495 · Buyer App : Choose How to Register with a Company

<!-- DESCRIPTION -->
**As a** retailer not yet registered with a company, **I want** to choose between linking my existing customer ID and registering as a new customer, **So that** I can get connected either way without calling the company.

---

### What the Page Shows

Opened by tapping a company with the **Register** status (e.g. TCPL). The header shows the **short name** (*TCPL*), the **full name** below it (*Tata Consumer Products (TCPL)*) and the company logo. Two options sit below, separated by an **OR** divider:

**Already a customer of TCPL?** — *"Enter the customer ID from your TCPL bills to link your shop."* A **Customer ID** field (placeholder shows the company's ID format, e.g. *TCPL-48210*) and a **Link Customer ID** button.

**New to TCPL?** — *"Send a registration request with your shop's KYC — we pre-fill everything from your Qwipo profile. TCPL approves new outlets in 24–48 hrs."* A **Proceed to Registration** button.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | This page is shown only when the status is **Register**; other statuses open the request status view. |
| BR-2 | **Link Customer ID** is disabled until a customer ID is entered. |
| BR-3 | The company name in the copy and the ID placeholder always match the company tapped. |
| BR-4 | No distributor is named or chosen on this page — the request goes to the company. |

### Screenshots

![qwipo-tcpl-03-choose.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/a5873829-dd98-4802-8d26-4c6300fd889b?fileName=qwipo-tcpl-03-choose.png?fileName=qwipo-tcpl-03-choose.png)

![qwipo-tcpl-04-link-id-entered.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/86d56134-4a65-4d48-92c7-be8771a999e7?fileName=qwipo-tcpl-04-link-id-entered.png?fileName=qwipo-tcpl-04-link-id-entered.png)

<!-- AC -->
**AC-1: Two options**
- **Given** TCPL with the Register status
- **When** the retailer taps its card
- **Then** the page shows "Already a customer of TCPL?" and "New to TCPL?", separated by OR, with no distributor list.

**AC-2: Link button**
- **Given** the Customer ID field is empty
- **When** the retailer views the page
- **Then** Link Customer ID is disabled; it enables once an ID is entered.

**AC-3: New registration**
- **Given** the page is open
- **When** the retailer taps Proceed to Registration
- **Then** the shop details page opens.

**AC-4: Back**
- **Given** the page is open
- **When** the retailer taps Back
- **Then** they return to the Register to Order list.

<!-- STORY 21496 -->
## 21496 · Buyer App : Link an Existing Customer ID and Track Approval

<!-- DESCRIPTION -->
**As a** retailer who already buys from a company, **I want** to submit my customer ID and see where my approval stands, **So that** my Qwipo account is connected to my existing company account and I know when I can start ordering.

---

### Behaviour

**Submit** — The retailer enters their customer ID and taps **Link Customer ID**. A **"Request sent"** screen confirms: *"Your customer ID TCPL-48210 has been sent to TCPL for approval. We'll notify you once TCPL confirms — usually within 24–48 hrs."* **Back to Distributors** returns to the list, where the card now shows **Pending**.

**Request status** — Opening a Pending or In review company shows a status banner (*"Registration pending approval"* / *"Registration under review"*) and a three-step timeline: **Request sent → Under review → Approval**, with the current step highlighted.

**Registered** — Shows a green tick and *"Your shop is registered with TCPL. Their full catalogue is unlocked and products appear in your feed."*

**Rejected** — Shows the **reason** from the company (e.g. *"GSTIN could not be verified against the shop address on record."*) and a **Re-apply with Updated Details** button that opens the shop details page.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | Submitting a customer ID sets the status to **Pending**; the catalogue stays locked until approved. |
| BR-2 | Status moves **Pending → In review → Registered**, or to **Rejected**. |
| BR-3 | While a request is in progress, the retailer cannot send another one for the same company. |
| BR-4 | If the customer ID isn't found, the request is **Rejected** with that reason. |
| BR-5 | The retailer is notified when the request is Registered or Rejected. |

### Screenshots

![qwipo-tcpl-05-link-request-sent.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/6ce03599-7fe1-4f2a-bc30-c41a7e2fdf8b?fileName=qwipo-tcpl-05-link-request-sent.png?fileName=qwipo-tcpl-05-link-request-sent.png)

![qwipo-tcpl-06-pending-status.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/08c30cbe-c776-4257-99af-ea74611fa39b?fileName=qwipo-tcpl-06-pending-status.png?fileName=qwipo-tcpl-06-pending-status.png)

![qwipo-tcpl-10-rejected.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/dca0f0e4-9ab8-45f6-bffe-6540e0b823f7?fileName=qwipo-tcpl-10-rejected.png?fileName=qwipo-tcpl-10-rejected.png)

<!-- AC -->
**AC-1: Request sent**
- **Given** the retailer has entered a customer ID for TCPL
- **When** they tap Link Customer ID
- **Then** the "Request sent" screen shows the ID and TCPL's name, and TCPL's status becomes Pending.

**AC-2: Track progress**
- **Given** a request is Pending or In review
- **When** the retailer opens that company
- **Then** the timeline is shown with the current step highlighted, and no new request can be sent.

**AC-3: Registered**
- **Given** the company approves
- **When** the retailer opens that company
- **Then** the Registered view is shown and the company's products appear in the app.

**AC-4: Rejected**
- **Given** the company rejects the request
- **When** the retailer opens that company
- **Then** the reason and Re-apply with Updated Details are shown.

<!-- STORY 21497 -->
## 21497 · Buyer App : Request New Registration with Pre-filled Shop Details and Consent

<!-- DESCRIPTION -->
**As a** retailer new to a company, **I want** to send a registration request using the shop details Qwipo already has, **So that** I can get registered in a couple of taps without re-typing my KYC.

---

### Shop Details

Opened from **Proceed to Registration** or **Re-apply with Updated Details**. A note at the top reads *"These details come from your Qwipo KYC. Review them and send your registration request to TCPL."*

**Shop details box** — A single **read-only** box titled **Shop details** with a **lock icon** and *"From Qwipo KYC"* in its header. Values are shown as label–value rows, not input fields, so it's clear they can't be edited here:

| Row | Source |
| --- | --- |
| **Shop Name** | Qwipo KYC (e.g. *Lit Box*) |
| **Owner Name** | Qwipo KYC (e.g. *Rajesh Kumar*) |
| **Mobile Number** | Qwipo KYC, shown as *+91 9876543210* |
| **Shop Address** | Qwipo KYC (e.g. *Rai Durg, Hitech City, Hyderabad*) |
| **GSTIN** | Qwipo KYC (e.g. *36ABCDE1234F1Z5*) |
| **Documents shared** | Shop Image, Shop Owner Photo ID and GST Certificate, each marked **Attached**. |

**Helper note** — Below the box: *"Need to change something? Update it in My Account · Business Details first."*

**Consent** — A checkbox, unticked by default: *"I allow Qwipo to share my details with TCPL so they can create my account."*

**Request Registration** — The button is **disabled** until consent is ticked. After submitting, a **"Request sent"** screen confirms: *"Your registration is pending approval at TCPL. We'll notify you once TCPL approves — usually within 24–48 hrs."* The company's status becomes **Pending**.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | All values come from the Qwipo profile and are **read-only** on this page; there are no input fields. |
| BR-2 | To correct a value, the retailer updates **My Account · Business Details**; the next request uses the updated profile. |
| BR-3 | **Request Registration** enables only when consent is ticked. |
| BR-4 | After submitting, the request follows the same status tracking as a customer ID link. |

### Screenshots

![qwipo-tcpl-07-shop-details-consent-off.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/25cbfe6c-e9b9-44c3-a06a-5389f5c83d91?fileName=qwipo-tcpl-07-shop-details-consent-off.png?fileName=qwipo-tcpl-07-shop-details-consent-off.png)

![qwipo-tcpl-08-shop-details-consent-on.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/47dab973-18da-4e2b-be67-34a7733e563e?fileName=qwipo-tcpl-08-shop-details-consent-on.png?fileName=qwipo-tcpl-08-shop-details-consent-on.png)

![qwipo-tcpl-09-request-sent.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/8227f1a3-7039-4e1d-a74f-589bf24d7ee9?fileName=qwipo-tcpl-09-request-sent.png?fileName=qwipo-tcpl-09-request-sent.png)

<!-- AC -->
**AC-1: Read-only details**
- **Given** a retailer with a complete Qwipo profile
- **When** they tap Proceed to Registration
- **Then** the Shop details box shows all values and the three documents as Attached, and none of them can be edited.

**AC-2: Consent gates the button**
- **Given** the shop details page is open
- **When** the consent checkbox is unticked
- **Then** Request Registration is disabled; ticking it enables the button.

**AC-3: Request sent**
- **Given** consent is ticked
- **When** the retailer taps Request Registration
- **Then** the "Request sent" screen is shown and the company's status becomes Pending.

**AC-4: Change details**
- **Given** a value is wrong
- **When** the retailer reads the page
- **Then** the helper note points them to My Account · Business Details to update it.
