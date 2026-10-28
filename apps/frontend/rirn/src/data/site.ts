// Public copy distilled from the supplied Qwipo documents.
// No invented metrics, testimonials, partner endorsements or delivery guarantees.
// Enquiries use the contact API; the public email address is an alternative.
export const site = {
  name: "DigiDukaan",
  company: "Qwipo",
  email: "info@qwipo.com",
  companyUrl: "https://qwipo.com",
  appUrl: "https://play.google.com/store/apps/details?id=com.qwipo.b2b",
  description:
    "DigiDukaan is a B2B ordering app for kirana stores on ONDC, connecting retailers with participating FMCG distributors and wholesalers.",
  navigation: [
    { label: "The product", href: "/#product" },
    { label: "ONDC’s role", href: "/#ondc" },
    { label: "Qwipo for DigiDukaan", href: "/qwipo-for-digidukaan" },
  ],
  hero: {
    eyebrow: "DIGIDUKAAN / B2B ORDERING ON ONDC",
    lines: ["Beyond", "the beat."],
    description:
      "DigiDukaan is a B2B ordering app for kirana stores on ONDC. Retailers discover products and schemes from participating distributors and wholesalers, then order between scheduled sales visits.",
    primary: "Let’s talk business",
    secondary: "See how it works",
    footnote: "Retailers order. Authorised sellers supply.",
  },
  opportunity: {
    label: "01 / WHY DIGIDUKAAN",
    heading: ["Stock runs low.", "Business can’t wait."],
    intro:
      "Sales visits, phone calls and separate brand channels make replenishment fragmented. DigiDukaan gives kiranas one place to discover supply and place orders, including stores that regular visits do not reach.",
    caption: "Real stores. Real relationships. A digital way forward.",
  },
  audiences: [
    {
      id: "brands",
      label: "For brands",
      title: "Be there between visits.",
      text: "Help retailers discover your range and schemes, including outlets beyond regular sales visits, and order from participating authorised sellers.",
      items: [
        "Make your range easier to discover",
        "Reach beyond the sales visit",
        "Build visibility into outlet ordering",
      ],
      cta: "Discuss your brand",
    },
    {
      id: "distributors",
      label: "For distributors",
      title: "More ways to take the next order.",
      text: "Bring your catalogue, schemes and retailer relationships into a digital ordering channel that works alongside your business.",
      items: [
        "Receive orders digitally",
        "Retain your retailer relationships",
        "Connect ordering with fulfillment",
      ],
      cta: "Discuss your distribution business",
    },
  ],
  product: {
    label: "02 / MEET DIGIDUKAAN",
    heading: ["Familiar brands.", "A new way", "to order."],
    intro:
      "Browse participating brands, compare available products and schemes, and place orders with distributors and wholesalers serving the store’s location.",
    caption:
      "Screens captured from the DigiDukaan product mockup. Products, prices, delivery dates and order data are illustrative; availability varies by distributor.",
    features: [
      {
        number: "01",
        title: "A multi-brand catalogue",
        text: "Discover products and available schemes across participating distributors and wholesalers.",
      },
      {
        number: "02",
        title: "Relationships, retained",
        text: "Buy from participating authorised distributors and wholesalers serving the store’s area.",
      },
      {
        number: "03",
        title: "Orders beyond the visit",
        text: "Give retailers a way to place an order between the usual sales visits.",
      },
    ],
  },
  journey: {
    label: "04 / A NETWORK IN MOTION",
    heading: ["From discovery.", "To the shop door."],
    intro:
      "The retailer discovers supply, connects with a seller and places an order. The seller accepts and prepares it; its fleet or an approved 3PL partner delivers.",
    steps: [
      {
        number: "01",
        name: "Discover",
        text: "Find the products you need and the distributors serving your store.",
        tag: "AT THE RETAILER",
      },
      {
        number: "02",
        name: "Connect",
        text: "Connect with a distributor. Explore their catalogue, prices and schemes.",
        tag: "WITH THE DISTRIBUTOR",
      },
      {
        number: "03",
        name: "Order",
        text: "Place an order for the seller to accept, prepare and plan for dispatch.",
        tag: "RETAILER TO DISTRIBUTOR",
      },
      {
        number: "04",
        name: "Deliver",
        text: "The distributor’s fleet or an approved third-party logistics (3PL) partner brings it to the shop.",
        tag: "ON THE DELIVERY ROUTE",
      },
    ],
    note: "A beat is a scheduled sales or delivery route. The full journey also shows acceptance and dispatch before delivery. Off-beat delivery depends on distributor approval, serviceability and order requirements.",
  },
  ondc: {
    label: "03 / ONDC’S ROLE",
    heading: ["One open network.", "Many businesses."],
    text: "ONDC stands for Open Network for Digital Commerce. It provides common standards that let participating buying and selling systems discover each other and transact.",
    meaning:
      "For DigiDukaan, this connects a retailer’s ordering experience with participating sellers across the network. Available products and services still depend on the seller and the store’s location.",
    roles: [
      {
        name: "DigiDukaan",
        role: "THE ORDERING EXPERIENCE",
        text: "Kiranas discover products, view schemes and place orders.",
      },
      {
        name: "ONDC",
        role: "THE OPEN NETWORK",
        text: "Common standards connect participating buyer and seller systems.",
      },
      {
        name: "Authorised sellers",
        role: "THE SUPPLY",
        text: "Distributors and wholesalers provide the products and their commercial terms.",
      },
    ],
    source: "https://www.ondc.org/pages/digidukaan.html",
  },
  qwipo: {
    label: "QWIPO FOR DIGIDUKAAN",
    heading: ["The technology", "behind the", "connection."],
    text: "Qwipo provides technology for DigiDukaan: the retailer app, ONDC connectivity, distributor-system integration and logistics tools that support the order journey.",
    description:
      "Explore Qwipo’s technology contribution to DigiDukaan: the retailer app, ONDC connectivity, DMS integration and logistics tools.",
    capabilities: [
      {
        title: "Give retailers a way to order",
        label: "RETAILER EXPERIENCE",
        text: "Qwipo builds the app experience for discovering sellers, browsing products and schemes, and placing orders.",
        detail:
          "The retailer sees the participating sellers and assortment available for their store. The app is the customer-facing part of a wider network.",
      },
      {
        title: "Connect through ONDC",
        label: "NETWORK CONNECTIVITY",
        text: "Qwipo’s technology connects the ordering experience with participating seller systems through ONDC.",
        detail:
          "ONDC provides the common network standards. Qwipo supplies software that works with those standards for DigiDukaan’s commerce workflows.",
      },
      {
        title: "Connect the seller’s systems",
        label: "DMS INTEGRATION",
        text: "A distributor management system, or DMS, holds products, prices, stock, schemes and customer records. Qwipo’s connector can make this data available for ordering and pass orders back.",
        detail:
          "The DMS remains the source of truth for its master data. Data mapping, supported interfaces and update frequency are agreed for each integration.",
      },
      {
        title: "Support the physical journey",
        label: "LOGISTICS TECHNOLOGY",
        text: "Qwipo’s logistics tools support load consolidation, route planning, delivery visibility and confirmation workflows.",
        detail:
          "The software supports the teams moving goods. Delivery partners carry out transport; available tracking and confirmation features depend on the agreed operating scope.",
      },
      {
        title: "Make operations visible",
        label: "ORDER AND DELIVERY INFORMATION",
        text: "Digital order records and delivery reporting help teams see demand and follow fulfillment activity.",
        detail:
          "Reporting access, available fields and integration coverage are defined for the engagement.",
      },
    ],
  },
  contact: {
    label: "YOUR NETWORK. OUR NEXT CONVERSATION.",
    heading: ["Let’s move", "business", "forward."],
    text: "Tell us about your market, distributor network and current ordering process. We can discuss participation, system connections and delivery requirements.",
    roles: ["A Brand", "A Distributor", "An Ecosystem Partner"],
    button: "Send enquiry",
    note: "Your details and message will be sent to Qwipo so we can respond to your enquiry. Prefer email? Reach us below.",
  },
  details: {
    eyebrow: "THE DIGIDUKAAN JOURNEY",
    heading: "A new route for the next order.",
    intro:
      "Digital ordering is most useful when it fits the relationships already doing the work. Here’s how DigiDukaan fits into yours.",
    exampleLabel: "AN EVERYDAY ORDER, ILLUSTRATED",
    exampleIntro:
      "A neighbourhood shop runs low on a regular item between sales visits. Here is the route its next order can take.",
    examples: [
      "The shop owner opens DigiDukaan to look for a refill. The range and schemes they see depend on their location and the participating distributors available to them.",
      "The order follows an authorised relationship between retailer and distributor. The distributor remains the business partner serving the store; DigiDukaan adds a digital way to connect.",
      "The retailer places an order for the distributor to review. Where a DMS connection is in scope, the order can pass into the distributor’s system, using that system’s master data.",
      "An accepted order moves into the distributor’s fulfillment process. The usual beat can serve the store; an off-beat request needs approval and may have different minimum order requirements.",
    ],
    faqs: [
      {
        question: "How do DigiDukaan, ONDC and Qwipo fit together?",
        answer:
          "DigiDukaan is the retailer ordering experience. ONDC provides the open network standards connecting participating buying and selling systems. Qwipo provides technology for the app, integrations and supporting operations. Authorised sellers supply the goods; the distributor’s fleet or an approved 3PL partner delivers them.",
      },
      {
        question: "What is 3PL, and when does it enter the journey?",
        answer:
          "3PL means third-party logistics. After an order is accepted and prepared, an approved external delivery partner can provide transport capacity for overflow or an agreed service need. Load and route planning connect that capacity to the order. The distributor remains the seller, and its own fleet is the primary path in the described operating model.",
      },
      {
        question: "Does DigiDukaan replace the distributor?",
        answer:
          "DigiDukaan supports the distributor network. Retailers connect with authorised distributors serving their area and place orders through that relationship.",
      },
      {
        question: "Can a retailer order outside the regular beat?",
        answer:
          "Retailers can place orders between sales visits. Delivery outside the regular beat is subject to distributor approval, serviceability and the applicable order requirements. It is not a universal next-day promise.",
      },
      {
        question: "How do payments and credit work?",
        answer:
          "Existing cash and credit relationships continue. Credit for a new retailer is at the distributor’s discretion. A new fintech credit product is not presented here as a generally available service.",
      },
      {
        question: "Can DigiDukaan connect to a DMS?",
        answer:
          "A DMS connection can make master products, prices, stock and schemes available for ordering, and pass orders back. The DMS remains the source of truth for its master data. Supported interfaces and implementation scope need to be agreed for each system.",
      },
      {
        question: "Is the catalogue the same everywhere?",
        answer:
          "No. Products, schemes, distributor access and fulfillment depend on the retailer’s location and the participating distributors serving that area.",
      },
    ],
  },
};
