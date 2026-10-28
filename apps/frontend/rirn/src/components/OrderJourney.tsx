"use client";
import { useId, useRef, useState } from "react";
import { ProductDevice } from "./ProductDevice";
import type { AppScreen } from "../data/app-screens";
import { JourneyIcon, type JourneyIconName } from "./JourneyIcon";

const chapters: {
  title: string;
  icon: JourneyIconName;
  screen: AppScreen;
  actor: string;
  heading: string;
  text: string;
  points: string[];
  detail: string;
}[] = [
  {
    title: "Discover",
    icon: "search",
    screen: "home",
    actor: "AT THE RETAILER",
    heading: "Start with what the shelf needs.",
    text: "Find a product or brand, then explore the distributors serving your store.",
    points: ["Search products", "Find local sellers", "Explore the range"],
    detail:
      "Product discovery begins with the store’s location. The range shown depends on participating distributors and their service area. The screens here are product mockups, not live stock or price quotations.",
  },
  {
    title: "Connect",
    icon: "store",
    screen: "distributor",
    actor: "WITH THE DISTRIBUTOR",
    heading: "A digital connection. A familiar partner.",
    text: "Choose a distributor and establish the authorised retailer relationship before ordering from their catalogue.",
    points: [
      "Check serviceability",
      "Confirm the relationship",
      "See delivery conditions",
    ],
    detail:
      "An existing relationship can be recognised; a new connection may need the distributor’s approval. The distributor continues to serve the retailer. DigiDukaan adds an ordering channel to that relationship.",
  },
  {
    title: "Order",
    icon: "cart",
    screen: "cart",
    actor: "BACK AT THE STORE",
    heading: "The right packs. The right delivery option.",
    text: "Choose quantities and schemes, review the seller-wise cart, then place the order for the distributor to accept.",
    points: [
      "Choose packs & schemes",
      "Review order requirements",
      "Select an available delivery",
    ],
    detail:
      "The regular beat is the scheduled delivery route. An off-beat option needs approval and may have a different minimum order value or weight. Cash and credit remain subject to the distributor’s terms. These mockup amounts are illustrative.",
  },
  {
    title: "Dispatch",
    icon: "box",
    screen: "orders",
    actor: "AT DISTRIBUTOR OPERATIONS",
    heading: "From accepted order to planned trip.",
    text: "The distributor reviews and prepares the order. Logistics tools help group loads and plan the delivery route.",
    points: [
      "Accept & prepare",
      "Group orders by route",
      "Allocate vehicle capacity",
    ],
    detail:
      "Where agreed, the DMS connector passes orders into the distributor’s system and reads its catalogue, stock, prices and schemes. Logistics Tech can plan the distributor’s own fleet and use approved 3PL capacity for overflow, subject to the engagement.",
  },
  {
    title: "Deliver",
    icon: "truck",
    screen: "tracking",
    actor: "ON THE ROAD",
    heading: "One order. A clear route to the shop.",
    text: "The allocated fleet or 3PL partner carries the goods to the retailer, with delivery progress and confirmation handled through the agreed workflow.",
    points: ["Dispatch & track", "Deliver to the retailer", "Confirm delivery"],
    detail:
      "3PL means third-party logistics: an external delivery partner providing transport capacity. The distributor is still the seller. Tracking and proof-of-delivery methods depend on the implemented logistics scope; next-day delivery is not a universal promise.",
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
          <ProductDevice
            screens={chapters.map((step) => step.screen)}
            active={active}
          />
          <p className="mockup-caption">Product mockup · Illustrative data</p>
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
