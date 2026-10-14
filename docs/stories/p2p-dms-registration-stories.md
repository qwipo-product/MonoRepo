# P2P Search — Distributor Registration (Buyer App)

Status: Historical requirements. The Buyer prototype no longer includes this flow.
Do not restore the registration card or screens unless the user requests them.

Feature **21492 · Buyer App Changes** · Iteration `Qwipo B2B\Product Enhancement Backlog`

Reference flow: **Tata Consumer Products (TCPL)**.
The retailer registers with the company directly without distributor selection.

These stories give the prototype requirements for feature 21492.
Keep the story identifiers, business rules, and quoted interface text.
The quoted approval times are demonstration text. They are not a verified partner service commitment.
Before an engineering implementation, get verified production contracts and times from their owners.

<!-- STORY 21493 -->
## 21493 · Buyer App : Show the Register to Order Card on Authorised Distributors

<!-- DESCRIPTION -->
The retailer must find companies that sell only to registered shops.
The card explains how registration gives access to those catalogs.

---

### What the Card Shows

Open **Authorised Distributors** from Home.
The card appears above the list in the **Categories**, **Brands**, and **Sellers** tabs.

The **Register to Order** card contains:

- A lock icon.
- The heading **"Register to order from more distributors"**.
- A line with the applicable company names.
- A chevron.

Example interface text: *"ITC, TCPL, Colgate & Pepsi sell only to registered shops — register once to unlock their catalogues"*.
When the retailer taps the card, the application opens **Register to Order**.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | The card shows on all three tabs, in the same position, above the list. |
| BR-2 | The line names up to **four** companies where registration is necessary in the retailer's area. |
| BR-3 | If registration is unnecessary for all companies in the retailer's area, the application hides the card. |

### Screenshot

![qwipo-tcpl-01-distributors-promo.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/e74eaa57-e7ab-4e9e-b9ef-b19a506477e3?fileName=qwipo-tcpl-01-distributors-promo.png)

<!-- AC -->
**AC-1: Card on every tab**
- **Given** a retailer on Authorised Distributors
- **When** they open the Categories, Brands or Sellers tab
- **Then** the Register to Order card is pinned at the top of the list.

**AC-2: Companies named**
- **Given** registration is necessary for TCPL and other companies in the retailer's area
- **When** the card is shown
- **Then** its line names up to four of them, e.g. "ITC, TCPL, Colgate & Pepsi".

**AC-3: Card opens Register to Order**
- **Given** the card is visible
- **When** the retailer taps it
- **Then** the Register to Order page opens.

**AC-4: Nothing to register**
- **Given** registration is unnecessary for all companies in the retailer's area
- **When** they open Authorised Distributors
- **Then** the card is not shown and the existing list is unchanged.

<!-- STORY 21494 -->
## 21494 · Buyer App : List Gated Companies with Registration Status

<!-- DESCRIPTION -->
The retailer uses one list of companies where registration is necessary.
Each company card shows the retailer's current registration status.

---

### What the Page Shows

The page has the header *"Register to Order"* and subtitle *"Unlock gated catalogues near you"*.
The page shows this interface text:

> These companies and distributors sell only to registered shops. Register once, or link your existing customer ID, to unlock their full catalogue on Qwipo.

The page contains one list without tabs.

Each company has one card with its logo, name, service method, product count, status, and brands.
The TCPL example shows *"Register directly · 126 products"*.
Its brand chips show *"Tata Tea · Tata Salt · Tata Sampann · Tetley · Himalayan"*.
When the retailer taps a card, the application opens that company's registration page.
The retailer does not select a distributor.

### Registration Status

| Status pill | Meaning |
| --- | --- |
| **Register** | The retailer has no registration. The catalog is locked. |
| **Pending** | The request awaits company review. |
| **In review** | The company examines the shop's details. |
| **Rejected** | The company rejected the request. The retailer can reapply. |
| **Registered** | The company gave approval for the request. The catalog is available. |

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | The list contains companies where registration is necessary. Include only companies that serve the retailer's area. |
| BR-2 | Each card shows **one** status pill — the retailer's current status with that company. |
| BR-3 | When the retailer returns to this page, the card shows the current status. |
| BR-4 | The card truncates long company names (for example, *Tata Consumer Pr…*). The registration page shows the full name. |

### Screenshot

![qwipo-tcpl-02-register-to-order.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/95ff5fa6-4eb9-447f-b991-f7afc3785eac?fileName=qwipo-tcpl-02-register-to-order.png)

<!-- AC -->
**AC-1: Single list**
- **Given** the retailer opens Register to Order
- **When** the page loads
- **Then** all gated companies appear in one list, with no Companies / Distributors tabs.

**AC-2: Company cards**
- **Given** the list has loaded
- **When** the retailer views the TCPL card
- **Then** the card shows the logo and "Tata Consumer Products (TCPL)".
- It also shows "Register directly · 126 products", a status pill, and the brand chips.

**AC-3: Correct status**
- **Given** a retailer's registration is at any stage with a company
- **When** the page loads
- **Then** that company's card shows the matching pill: Register, Pending, In review, Rejected or Registered.

**AC-4: Open a company**
- **Given** any company card
- **When** the retailer taps it
- **Then** that company's registration page opens directly, with no distributor selection step.

<!-- STORY 21495 -->
## 21495 · Buyer App : Select How to Register with a Company

<!-- DESCRIPTION -->
The retailer can submit an existing customer ID or a new registration request.
Both paths connect the Qwipo shop to the selected company.

---

### What the Page Shows

When the retailer taps a company with **Register** status, the application opens this page.
The header shows the short name, full name, and company logo.
For TCPL, the full name is **Tata Consumer Products (TCPL)**.
The page contains two options with an **OR** divider.

The first option is **Already a customer of TCPL?**.
Its instruction is *"Enter the customer ID from your TCPL bills to link your shop."*
It contains a **Customer ID** field and **Link Customer ID** button.
The placeholder uses the company's ID format, such as `TCPL-48210`.

The second option is **New to TCPL?** with a **Proceed to Registration** button.
Its interface text is:

> Send a registration request with your shop's KYC — we pre-fill everything from your Qwipo profile. TCPL approves new outlets in 24–48 hrs.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | The application shows this page only when the status is **Register**. Other statuses open the request status view. |
| BR-2 | **Link Customer ID** is disabled until a customer ID is entered. |
| BR-3 | The company name in the copy and the ID placeholder always match the company tapped. |
| BR-4 | This page has no distributor name or selection. The company receives the request. |

### Screenshots

![qwipo-tcpl-03-choose.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/a5873829-dd98-4802-8d26-4c6300fd889b?fileName=qwipo-tcpl-03-choose.png)

![qwipo-tcpl-04-link-id-entered.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/86d56134-4a65-4d48-92c7-be8771a999e7?fileName=qwipo-tcpl-04-link-id-entered.png)

<!-- AC -->
**AC-1: Two options**
- **Given** TCPL with the Register status
- **When** the retailer taps its card
- **Then** the page shows "Already a customer of TCPL?" and "New to TCPL?" with an OR divider.
- The page has no distributor list.

**AC-2: Link button**
- **Given** the Customer ID field is empty
- **When** the retailer views the page
- **Then** Link Customer ID is disabled. Entry of an ID enables the button.

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
The retailer submits an existing customer ID and checks the approval status.
These prototype requirements keep the catalog locked until approval.

---

### Behavior

The retailer enters a customer ID and taps **Link Customer ID**.
The application shows **"Request sent"** with this interface text:

> Your customer ID TCPL-48210 has been sent to TCPL for approval. We'll notify you once TCPL confirms — usually within 24–48 hrs.

**Back to Distributors** returns to the list.
The company card then shows **Pending**.

For a **Pending** or **In review** request, the page shows the applicable status banner.
The banner is *"Registration pending approval"* or *"Registration under review"*.
The timeline shows **Request sent → Under review → Approval** with the current step highlighted.

The **Registered** view shows a green tick and this interface text:

> Your shop is registered with TCPL. Their full catalogue is unlocked and products appear in your feed.

The **Rejected** view shows the company's reason.
Example reason: *"GSTIN could not be verified against the shop address on record."*
The **Re-apply with Updated Details** button opens the shop details page.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | Submission of a customer ID sets the status to **Pending**. The catalog stays locked until approval. |
| BR-2 | Status moves **Pending → In review → Registered**, or to **Rejected**. |
| BR-3 | While a request is in progress, the retailer cannot send another one for the same company. |
| BR-4 | If the company cannot find the customer ID, the request becomes **Rejected** with that reason. |
| BR-5 | The application sends a notification to the retailer when the request becomes Registered or Rejected. |

### Screenshots

![qwipo-tcpl-05-link-request-sent.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/6ce03599-7fe1-4f2a-bc30-c41a7e2fdf8b?fileName=qwipo-tcpl-05-link-request-sent.png)

![qwipo-tcpl-06-pending-status.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/08c30cbe-c776-4257-99af-ea74611fa39b?fileName=qwipo-tcpl-06-pending-status.png)

![qwipo-tcpl-10-rejected.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/dca0f0e4-9ab8-45f6-bffe-6540e0b823f7?fileName=qwipo-tcpl-10-rejected.png)

<!-- AC -->
**AC-1: Request sent**
- **Given** the retailer has entered a customer ID for TCPL
- **When** they tap Link Customer ID
- **Then** the "Request sent" screen shows the ID and TCPL's name.
- TCPL's status becomes Pending.

**AC-2: Track progress**
- **Given** a request is Pending or In review
- **When** the retailer opens that company
- **Then** the page shows the timeline with the current step highlighted.
- The retailer cannot send another request.

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
The retailer sends a registration request with existing Qwipo shop details.
The retailer does not enter the same KYC data again.

---

### Shop Details

The retailer opens this page through **Proceed to Registration** or **Re-apply with Updated Details**.
The page shows this interface text:

> These details come from your Qwipo KYC. Review them and send your registration request to TCPL.

The **Shop details** box is read-only.
Its header contains a lock icon and *"From Qwipo KYC"*.
The box shows label–value rows instead of editable fields.

| Row | Source |
| --- | --- |
| **Shop Name** | Qwipo KYC (e.g. *Lit Box*) |
| **Owner Name** | Qwipo KYC (e.g. *Rajesh Kumar*) |
| **Mobile Number** | Qwipo KYC, shown as *+91 9876543210* |
| **Shop Address** | Qwipo KYC (e.g. *Rai Durg, Hitech City, Hyderabad*) |
| **GSTIN** | Qwipo KYC (e.g. *36ABCDE1234F1Z5*) |
| **Documents shared** | Shop Image, Shop Owner Photo ID and GST Certificate, each marked **Attached**. |

The helper text below the box is:

> Need to change something? Update it in My Account · Business Details first.

The consent checkbox is clear by default.
Its label is *"I allow Qwipo to share my details with TCPL so they can create my account."*

The **Request Registration** button remains disabled until the retailer selects consent.
After submission, the application shows **"Request sent"** with this interface text:

> Your registration is pending approval at TCPL. We'll notify you once TCPL approves — usually within 24–48 hrs.

The company's status becomes **Pending**.

### Business Rules

| # | Rule |
| --- | --- |
| BR-1 | All values come from the Qwipo profile and are **read-only** on this page. There are no input fields. |
| BR-2 | To correct a value, the retailer updates **My Account · Business Details**. The next request uses the updated profile. |
| BR-3 | **Request Registration** enables only when consent is ticked. |
| BR-4 | After submission, the request uses the same status sequence as a customer ID link. |

### Screenshots

![qwipo-tcpl-07-shop-details-consent-off.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/25cbfe6c-e9b9-44c3-a06a-5389f5c83d91?fileName=qwipo-tcpl-07-shop-details-consent-off.png)

![qwipo-tcpl-08-shop-details-consent-on.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/47dab973-18da-4e2b-be67-34a7733e563e?fileName=qwipo-tcpl-08-shop-details-consent-on.png)

![qwipo-tcpl-09-request-sent.png](https://dev.azure.com/xavica/5e02b66b-5a4e-4db8-9e08-4a806aabb6bb/_apis/wit/attachments/8227f1a3-7039-4e1d-a74f-589bf24d7ee9?fileName=qwipo-tcpl-09-request-sent.png)

<!-- AC -->
**AC-1: Read-only details**
- **Given** a retailer with a complete Qwipo profile
- **When** they tap Proceed to Registration
- **Then** the Shop details box shows all values and the three documents as Attached.
- These values and attachments are read-only.

**AC-2: Consent gates the button**
- **Given** the shop details page is open
- **When** the consent checkbox is unticked
- **Then** Request Registration is disabled. Selection of consent enables the button.

**AC-3: Request sent**
- **Given** consent is ticked
- **When** the retailer taps Request Registration
- **Then** the "Request sent" screen is shown and the company's status becomes Pending.

**AC-4: Change details**
- **Given** a value is wrong
- **When** the retailer reads the page
- **Then** the helper note points them to My Account · Business Details to update it.
