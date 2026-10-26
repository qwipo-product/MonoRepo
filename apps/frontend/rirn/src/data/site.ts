// Current operating model: ONDC DigiDukaan 2.0, slides 4, 6, 7, 13–15.
// Earlier beat-delivery and credit copy is superseded for this 2.0 journey.
// Evidence and unresolved source questions: docs/16-content-fact-check.md.
// Email enquiry is a draft in the visitor's mail app; no submission backend is implied.
export const site = {
  name: "DigiDukaan",
  company: "Qwipo",
  email: "info@qwipo.com",
  companyUrl: "https://qwipo.com",
  appUrl: "https://play.google.com/store/apps/details?id=com.qwipo.b2b",
  description:
    "DigiDukaan 2.0 by Qwipo connects kiranas with authorised distributors and wholesalers on ONDC, with dark-store consolidation and 3PL delivery within 24 hours.",
  navigation: [
    { label: "The product", href: "/#product" },
    { label: "The network", href: "/#network" },
    { label: "Why Qwipo", href: "/#qwipo" },
  ],
  hero: {
    eyebrow: "FOR BRANDS. FOR DISTRIBUTORS. FOR EVERYDAY BUSINESS.",
    lines: ["Beyond", "the beat."],
    description:
      "Reach kiranas beyond the sales visit. DigiDukaan 2.0 brings authorised sellers together on ONDC, with dark stores and 3PL delivery within 24 hours.",
    primary: "Let’s talk business",
    secondary: "See how it works",
    footnote: "Order 24/7. Reach further. Deliver through DigiDukaan 2.0.",
  },
  opportunity: {
    label: "01 / THE OPPORTUNITY",
    heading: ["Your relationships.", "A wider reach."],
    intro:
      "Reach the small stores in interior lanes that regular beat plans miss. Give kiranas a direct way to order from authorised distributors and wholesalers.",
    caption: "Local stores. Strong relationships. A digital way forward.",
  },
  audiences: [
    {
      id: "brands",
      label: "For brands",
      title: "See demand beyond the beat.",
      text: "Make your range and launches visible to more kiranas, with outlet-level data on what they order and how often.",
      items: [
        "Show your range and company schemes",
        "Reach outlets outside regular beat coverage",
        "Understand demand at outlet level",
      ],
      cta: "Discuss your brand",
    },
    {
      id: "distributors",
      label: "For distributors",
      title: "More ways to take the next order.",
      text: "Take digital orders from existing and new kiranas. In DigiDukaan 2.0, 3PL partners collect from seller godowns and deliver through nearby dark stores.",
      items: [
        "Receive orders digitally",
        "Reach kiranas beyond your regular beat",
        "Connect supply to dark-store delivery",
      ],
      cta: "Discuss your distribution business",
    },
  ],
  product: {
    label: "02 / MEET DIGIDUKAAN 2.0",
    heading: ["Familiar brands.", "A new way", "to order."],
    intro:
      "One app for authorised distributors and wholesalers serving a kirana’s area. Explore the range, compare seller offers and order whenever stock is needed.",
    caption:
      "Screens captured from the Qwipo buyer-app website. Products, prices, seller terms and delivery examples are illustrative.",
    features: [
      {
        number: "01",
        title: "A multi-brand catalogue",
        text: "Explore products, pack sizes and company schemes from authorised distributors and wholesalers.",
      },
      {
        number: "02",
        title: "Orders from ₹500",
        text: "Place orders any day, at distributor prices with company schemes. The 2.0 journey uses cash on delivery.",
      },
      {
        number: "03",
        title: "Delivery within 24 hours",
        text: "3PL partners pick up from sellers, consolidate orders at DigiDukaan dark stores and deliver to the kirana.",
      },
    ],
  },
  journey: {
    label: "03 / A NETWORK IN MOTION",
    heading: ["From discovery.", "To the shop door."],
    intro:
      "Find an authorised seller. Order any day. Follow the goods through a DigiDukaan dark store to the kirana.",
    steps: [
      {
        number: "01",
        name: "Discover",
        text: "Find products and authorised distributors or wholesalers serving your area.",
        tag: "AT THE RETAILER",
      },
      {
        number: "02",
        name: "Order",
        text: "Order anytime from ₹500, with company schemes, your shop’s map pin and phone number.",
        tag: "WITH YOUR SELLER",
      },
      {
        number: "03",
        name: "Consolidate",
        text: "3PL partners collect from seller godowns. Orders come together at a DigiDukaan dark store.",
        tag: "VIA 3PL PICKUP",
      },
      {
        number: "04",
        name: "Deliver",
        text: "3PL partners deliver from the dark store to the kirana within 24 hours, with cash on delivery.",
        tag: "3PL LAST MILE",
      },
    ],
    note: "The 2.0 model combines ordering any day with dark-store consolidation and dedicated 3PL delivery, reaching beyond scheduled beat routes.",
  },
  qwipo: {
    label: "04 / THE QWIPO CONNECTION",
    heading: ["Good technology.", "Grounded in", "real business."],
    text: "Qwipo brings retailer ordering and distribution technology to the ONDC ecosystem. DigiDukaan 2.0 connects authorised supply with kiranas, supported by dark stores and 3PL partners.",
    capabilities: [
      {
        title: "Connect the systems",
        label: "DMS CONNECTIVITY",
        text: "Connect catalogue, prices, stock and schemes with distributor systems, and pass orders back. Integration scope is agreed with each partner.",
      },
      {
        title: "Keep fulfillment moving",
        label: "LOGISTICS TECH",
        text: "Bring route planning, load consolidation and delivery visibility into the operation. Logistics Tech can also support a separate logistics engagement.",
      },
    ],
  },
  contact: {
    label: "YOUR NETWORK. OUR NEXT CONVERSATION.",
    heading: ["Let’s move", "business", "forward."],
    text: "Bring your authorised seller network onto DigiDukaan 2.0. Let’s discuss the kiranas you want to reach and delivery coverage in your markets.",
    roles: ["A brand", "A distributor or wholesaler", "An ecosystem partner"],
    button: "Open email enquiry",
    note: "Opens your email app with a draft. Nothing is sent until you send it.",
  },
  details: {
    eyebrow: "THE DIGIDUKAAN 2.0 JOURNEY",
    heading: "A new route for the next order.",
    intro:
      "A kirana orders from an authorised seller. 3PL partners pick up the goods, bring orders together at a DigiDukaan dark store and deliver to the shop within 24 hours.",
    faqs: [
      {
        question: "What is 3PL, and when does it enter the journey?",
        answer:
          "3PL means third-party logistics. In DigiDukaan 2.0, these partners handle two legs: pickup from distributor and wholesaler godowns to a DigiDukaan dark store, then last-mile delivery from that store to the kirana. They are part of the core delivery model, rather than only overflow capacity.",
      },
      {
        question: "Who sells the goods, and who delivers them?",
        answer:
          "Authorised distributors and wholesalers remain the sellers. In the 2.0 model, 3PL partners collect from their godowns and deliver through DigiDukaan dark stores. The seller and the delivery partner have different roles.",
      },
      {
        question: "How does 2.0 change beat-day delivery?",
        answer:
          "A beat is a scheduled sales or delivery route. The earlier model relied on distributor delivery. DigiDukaan 2.0 supports ordering 24/7, with dark-store consolidation and dedicated 3PL delivery within 24 hours. Talk to the team about 2.0 coverage in your markets.",
      },
      {
        question: "What is the minimum order, and how is it paid?",
        answer:
          "The DigiDukaan 2.0 journey has a ₹500 minimum order and cash on delivery. The retailer pays when the goods reach the shop. Distributor credit and fintech lending are not included in the 2.0 journey shown here.",
      },
      {
        question: "What happens at a dark store?",
        answer:
          "A dark store is a local fulfilment hub. Orders collected from distributor and wholesaler godowns are aggregated there, close to kirana clusters, before 3PL partners take them on the last mile. It is an operational stop between the seller and the shop.",
      },
      {
        question: "Can DigiDukaan connect to a DMS?",
        answer:
          "Qwipo’s DMS connector is designed to read master products, prices, stock and schemes, and push orders back. The DMS remains the source of truth for its master data. Supported interfaces and implementation scope need to be agreed for each system.",
      },
      {
        question: "Is the catalogue the same everywhere?",
        answer:
          "No. The app shows authorised distributors and wholesalers serving the kirana’s area. The available range and company schemes depend on those sellers. Screens on this website are illustrations, not live stock, prices or guaranteed margins.",
      },
    ],
  },
};
