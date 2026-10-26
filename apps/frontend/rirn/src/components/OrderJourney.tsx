import { useId, useRef, useState } from "react";
import { ProductDevice } from "./ProductDevice";
import type { AppScreen } from "../data/app-screens";
import { JourneyIcon, type JourneyIconName } from "./JourneyIcon";
import { NetworkScene } from "./NetworkScene";

const chapters: {
  title: string;
  icon: JourneyIconName;
  screen?: AppScreen;
  scene?: number;
  actor: string;
  heading: string;
  text: string;
  points: string[];
  detail: string;
}[] = [
  {
    title: "Discover",
    icon: "search",
    screen: "marketplace",
    actor: "AT THE RETAILER",
    heading: "Start with what the shelf needs.",
    text: "Search products and see authorised distributors and wholesalers serving the kirana’s area.",
    points: [
      "Find sellers in your area",
      "Explore products & schemes",
      "Choose an authorised seller",
    ],
    detail:
      "The store’s location determines the sellers available. Complete any seller registration required before ordering; the app supports ordering from newly approved distributors. The screens here are illustrative, not live stock or price quotations.",
  },
  {
    title: "Order",
    icon: "cart",
    screen: "search",
    actor: "AT THE KIRANA",
    heading: "Order when the shop needs it.",
    text: "Choose from the seller’s range at distributor prices, with company schemes. Place orders any day, from ₹500.",
    points: [
      "Order 24/7",
      "₹500 minimum order",
      "Include the shop’s map pin & phone",
    ],
    detail:
      "Each order carries the shop’s map pin and phone number so the delivery partner can find it, including in interior lanes. The 2.0 journey uses cash on delivery. The app image shows product selection; it is not a checkout or a live price quotation.",
  },
  {
    title: "Pickup",
    icon: "truck",
    scene: 4,
    actor: "FROM SELLER GODOWNS",
    heading: "The first leg starts with the seller.",
    text: "3PL partners collect goods from distributor and wholesaler godowns and bring them to a DigiDukaan dark store.",
    points: [
      "Distributor & wholesaler godowns",
      "Pickup by a 3PL partner",
      "Transfer to the dark store",
    ],
    detail:
      "3PL means third-party logistics. The seller supplies the goods; the logistics partner moves them. Pickup is the first physical leg of the 2.0 model, before consolidation and last-mile delivery.",
  },
  {
    title: "Consolidate",
    icon: "layers",
    scene: 2,
    actor: "AT THE DIGIDUKAAN DARK STORE",
    heading: "Orders come together, closer to the shop.",
    text: "Goods collected from sellers are aggregated at a DigiDukaan dark store near kirana clusters, ready for the last mile.",
    points: [
      "Receive goods from sellers",
      "Aggregate orders at the dark store",
      "Hand over for last-mile delivery",
    ],
    detail:
      "A dark store is a local fulfilment hub. It is the intermediate stop in the 2.0 delivery route: seller godown → 3PL pickup → dark store → 3PL last mile → kirana. It does not replace the authorised seller.",
  },
  {
    title: "Deliver",
    icon: "truck",
    scene: 3,
    actor: "FROM DARK STORE TO SHOP COUNTER",
    heading: "The last mile. Within 24 hours.",
    text: "Dedicated 3PL partners deliver from the dark store to the kirana. The retailer receives the goods and pays cash on delivery.",
    points: [
      "3PL last-mile delivery",
      "Use the shop’s map pin & phone",
      "Receive goods & pay cash",
    ],
    detail:
      "DigiDukaan 2.0’s delivery commitment is within 24 hours. The dedicated 3PL fleet connects the dark store to interior-lane outlets without waiting for the distributor’s regular beat. Discuss 2.0 coverage for your markets with the team.",
  },
];

export function OrderJourney() {
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const chapter = chapters[active];
  return (
    <div className="order-story">
      <div className="story-tabs" role="tablist" aria-label="Follow an order">
        {chapters.map((step, index) => (
          <button
            key={step.title}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight")
                next = (active + 1) % chapters.length;
              else if (event.key === "ArrowLeft")
                next = (active + chapters.length - 1) % chapters.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = chapters.length - 1;
              else return;
              event.preventDefault();
              setActive(next);
              buttons.current[next]?.focus();
            }}
          >
            <span className="story-tab-icon">
              <JourneyIcon name={step.icon} />
            </span>
            <span>
              <small>0{index + 1}</small>
              {step.title}
            </span>
          </button>
        ))}
      </div>
      <div
        className="story-stage"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        <div className="story-visual">
          <div className="story-orbit" aria-hidden="true" />
          <span className="story-visual-icon" aria-hidden="true">
            <JourneyIcon name={chapter.icon} />
          </span>
          {chapter.screen ? (
            <ProductDevice
              key={chapter.screen}
              screens={[chapter.screen]}
              active={0}
            />
          ) : (
            <div className="story-operation-art" key={chapter.title}>
              <NetworkScene stage={chapter.scene!} />
              <span>
                {chapter.title === "Pickup"
                  ? "SELLER → DARK STORE"
                  : chapter.title === "Consolidate"
                    ? "ORDERS AGGREGATED"
                    : "DARK STORE → KIRANA"}
              </span>
            </div>
          )}
          <p className="mockup-caption">
            {chapter.screen
              ? "App screen · Illustrative products & prices"
              : "DigiDukaan 2.0 · Delivery flow illustrated"}
          </p>
        </div>
        <div className="story-copy" key={active}>
          <span className="eyebrow">{chapter.actor}</span>
          <h2>{chapter.heading}</h2>
          <p>{chapter.text}</p>
          <ul className="story-points">
            {chapter.points.map((point, index) => (
              <li key={point}>
                <span>0{index + 1}</span>
                {point}
              </li>
            ))}
          </ul>
          <details className="story-detail">
            <summary>
              A little more detail <span aria-hidden="true">+</span>
            </summary>
            <p>{chapter.detail}</p>
          </details>
          <div className="story-navigation">
            <span>
              0{active + 1} <span>/ 05</span>
            </span>
            <button
              type="button"
              onClick={() => setActive((active + 1) % chapters.length)}
            >
              {active === 4
                ? "Back to discovery"
                : `Next: ${chapters[active + 1].title}`}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
