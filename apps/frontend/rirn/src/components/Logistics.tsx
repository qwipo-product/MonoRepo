"use client";
import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { JourneyIcon } from "./JourneyIcon";
import { useMotion } from "../lib/motion-context";

export function Logistics({ compact = false }: { compact?: boolean }) {
  const titleId = useId();
  const [partner, setPartner] = useState(false);
  const enabled = useMotion();
  const route = useRef<SVGPathElement>(null);
  const van = useRef<SVGGElement>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!enabled || !route.current || !van.current) return;
    const path = route.current;
    const vehicle = van.current;
    const length = path.getTotalLength();
    let elapsed = 0;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    const tick = (_time: number, delta: number) => {
      if (!visible) return;
      elapsed += Math.min(delta, 50) / 1000;
      const point = path.getPointAtLength(((elapsed % 8) / 8) * length);
      vehicle.setAttribute("transform", `translate(${point.x} ${point.y})`);
    };
    gsap.ticker.add(tick);
    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [enabled, partner]);
  return (
    <section
      ref={root}
      className={`logistics-section section-space ${compact ? "logistics-compact" : ""}`}
      id="logistics"
      aria-labelledby={titleId}
    >
      <div className="logistics-intro">
        <span className="eyebrow">AFTER ACCEPTANCE / BEFORE ARRIVAL</span>
        <h2 id={titleId}>
          The right load. <br />
          The right ride.
        </h2>
        <p>
          An order on DigiDukaan still needs a physical journey. Route planning
          connects accepted orders with available delivery capacity. A 3PL
          (third-party logistics) partner adds external delivery capacity for
          approved overflow or service needs.
        </p>
      </div>
      <div className="logistics-workspace">
        <div
          className="fleet-switch"
          role="group"
          aria-label="Explore delivery arrangements"
        >
          <button
            type="button"
            aria-pressed={!partner}
            onClick={() => setPartner(false)}
          >
            <JourneyIcon name="truck" />
            Distributor fleet
          </button>
          <button
            type="button"
            aria-pressed={partner}
            onClick={() => setPartner(true)}
          >
            <JourneyIcon name="layers" />
            3PL partner
          </button>
        </div>
        <figure className="logistics-map">
          <svg
            viewBox="0 0 640 320"
            role="img"
            aria-label={
              partner
                ? "An accepted distributor order uses approved third-party logistics capacity to reach the retailer"
                : "An accepted distributor order is planned onto the distributor’s own fleet to reach the retailer"
            }
          >
            <path
              d="M85 160h70q35 0 35-35v-5q0-35 35-35h190q35 0 35 35v5q0 35 35 35h70"
              fill="none"
              stroke={partner ? "#d8cce7" : "#6c3bc8"}
              strokeWidth={partner ? 2 : 3}
            />
            <path
              d="M85 160h70q35 0 35 35v5q0 35 35 35h190q35 0 35-35v-5q0-35 35-35h70"
              fill="none"
              stroke={partner ? "#6c3bc8" : "#d8cce7"}
              strokeWidth={partner ? 3 : 2}
              strokeDasharray={partner ? undefined : "5 7"}
            />
            <path
              ref={route}
              d={
                partner
                  ? "M85 160h70q35 0 35 35v5q0 35 35 35h190q35 0 35-35v-5q0-35 35-35h70"
                  : "M85 160h70q35 0 35-35v-5q0-35 35-35h190q35 0 35 35v5q0 35 35 35h70"
              }
              fill="none"
              stroke="none"
            />
            <g transform="translate(50 125)">
              <rect width="70" height="70" rx="18" fill="#32125c" />
              <g transform="translate(17 16) scale(1.5)" color="#faf9f5">
                <path
                  d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10M7.5 4.5l9 5v5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </g>
            </g>
            <g transform="translate(520 125)">
              <rect width="70" height="70" rx="18" fill="#32125c" />
              <g transform="translate(17 16) scale(1.5)" color="#faf9f5">
                <path
                  d="M3 9 5 3h14l2 6M3 9v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9ZM5 15v6h14v-6M10 21v-5h4v5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </g>
            </g>
            <text x="85" y="224" textAnchor="middle">
              Distributor
            </text>
            <text x="555" y="224" textAnchor="middle">
              Retailer
            </text>
            <rect
              x="244"
              y="57"
              width="152"
              height="56"
              rx="28"
              fill={!partner ? "var(--accent)" : "#eae3f4"}
            />
            <text x="320" y="90" textAnchor="middle">
              Own fleet
            </text>
            <rect
              x="244"
              y="207"
              width="152"
              height="56"
              rx="28"
              fill={partner ? "var(--accent)" : "#eae3f4"}
            />
            <text x="320" y="240" textAnchor="middle">
              3PL capacity
            </text>
            <text
              className="map-centre-label"
              x="320"
              y="165"
              textAnchor="middle"
            >
              ORDER TO DELIVERY
            </text>
            <g ref={van} transform="translate(155 160)" aria-hidden="true">
              <circle
                r="17"
                fill="#faf9f5"
                stroke="#6c3bc8"
                strokeWidth="1.5"
              />
              <path
                d="M-9-6H3V5H-9Z M3-3h4l3 5v3H3 M-5 7h.1 M7 7h.1"
                fill="none"
                stroke="#32125c"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          </svg>
          <figcaption key={String(partner)}>
            <strong>
              {partner
                ? "3PL = third-party logistics."
                : "Make the most of the existing fleet."}
            </strong>{" "}
            {partner
              ? "An external delivery partner provides transport capacity for approved overflow or service needs. The distributor remains the seller."
              : "Group compatible orders, plan routes and use the distributor’s vehicles as the primary fulfillment path."}
          </figcaption>
        </figure>
        <ol className="logistics-handoffs">
          {[
            {
              icon: "box" as const,
              label: "Prepare",
              text: "Accepted orders ready for dispatch",
            },
            {
              icon: "route" as const,
              label: "Plan",
              text: "Group loads and allocate capacity",
            },
            {
              icon: "truck" as const,
              label: "Deliver",
              text: "Fleet or approved partner carries goods",
            },
            {
              icon: "check" as const,
              label: "Confirm",
              text: "Record delivery and handle exceptions",
            },
          ].map((step) => (
            <li key={step.label}>
              <JourneyIcon name={step.icon} />
              <strong>{step.label}</strong>
              {!compact && <span>{step.text}</span>}
            </li>
          ))}
        </ol>
        <p className="logistics-condition">
          Delivery options, 3PL availability, tracking and confirmation methods
          depend on serviceability and the agreed operating scope.
        </p>
      </div>
    </section>
  );
}
