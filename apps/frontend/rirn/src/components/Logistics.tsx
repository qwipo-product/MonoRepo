import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { JourneyIcon } from "./JourneyIcon";
import { useMotion } from "../lib/motion-context";

// Both legs form one route. Source: DigiDukaan 2.0, slide 13.
export function Logistics({ compact = false }: { compact?: boolean }) {
  const titleId = useId();
  const [lastMile, setLastMile] = useState(false);
  const enabled = useMotion();
  const route = useRef<SVGPathElement>(null);
  const van = useRef<SVGGElement>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!route.current || !van.current) return;
    const path = route.current;
    const vehicle = van.current;
    const length = path.getTotalLength();
    const place = (progress: number) => {
      const point = path.getPointAtLength(progress * length);
      vehicle.setAttribute("transform", `translate(${point.x} ${point.y})`);
    };
    place(0.5);
    if (!enabled) return;
    let elapsed = 0;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    const tick = (_time: number, delta: number) => {
      if (!visible) return;
      elapsed += Math.min(delta, 50) / 1000;
      place((elapsed % 4) / 4);
    };
    gsap.ticker.add(tick);
    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [enabled, lastMile]);
  return (
    <section
      ref={root}
      className={`logistics-section section-space ${compact ? "logistics-compact" : ""}`}
      id="logistics"
      aria-labelledby={titleId}
    >
      <div className="logistics-intro">
        <span className="eyebrow">DIGIDUKAAN 2.0 / THE PHYSICAL JOURNEY</span>
        <h2 id={titleId}>
          Two legs.
          <br />
          One connected delivery.
        </h2>
        <p>
          3PL means third-party logistics. These partners collect from sellers,
          bring orders together at DigiDukaan dark stores, and deliver to
          kiranas within 24 hours. The dark store connects the two delivery
          legs.
        </p>
      </div>
      <div className="logistics-workspace">
        <div
          className="fleet-switch"
          role="group"
          aria-label="Explore the two delivery legs"
        >
          <button
            type="button"
            aria-pressed={!lastMile}
            onClick={() => setLastMile(false)}
          >
            <JourneyIcon name="truck" />1 / 3PL pickup
          </button>
          <button
            type="button"
            aria-pressed={lastMile}
            onClick={() => setLastMile(true)}
          >
            <JourneyIcon name="route" />2 / 3PL last mile
          </button>
        </div>
        <figure className="logistics-map logistics-map--sequential">
          <svg
            viewBox="0 0 640 230"
            role="img"
            aria-label="Seller godowns to 3PL pickup to DigiDukaan dark store to 3PL last-mile delivery to kirana"
          >
            <path
              d="M85 110H320H555"
              fill="none"
              stroke="#c9b7df"
              strokeWidth="3"
            />
            <path
              ref={route}
              d={lastMile ? "M365 110H510" : "M130 110H275"}
              fill="none"
              stroke="#6c3bc8"
              strokeWidth="4"
            />
            <g transform="translate(50 75)">
              <rect width="70" height="70" rx="18" fill="#32125c" />
              <g
                transform="translate(17 16) scale(1.5)"
                fill="none"
                stroke="#faf9f5"
                strokeWidth="1.5"
              >
                <path d="m3 8 9-5 9 5v13H3V8Zm4 13V10h10v11M7 14h10M7 18h10" />
              </g>
            </g>
            <g transform="translate(275 65)">
              <rect
                width="90"
                height="90"
                rx="24"
                fill="var(--accent)"
                stroke="#32125c"
              />
              <g
                transform="translate(21 21) scale(2)"
                fill="none"
                stroke="#32125c"
                strokeWidth="1.5"
              >
                <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10M7.5 4.5l9 5v5" />
              </g>
            </g>
            <g transform="translate(520 75)">
              <rect width="70" height="70" rx="18" fill="#32125c" />
              <g
                transform="translate(17 16) scale(1.5)"
                fill="none"
                stroke="#faf9f5"
                strokeWidth="1.5"
              >
                <path d="M3 9 5 3h14l2 6M3 9v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9ZM5 15v6h14v-6M10 21v-5h4v5" />
              </g>
            </g>
            <text x="202" y="80" textAnchor="middle">
              3PL pickup
            </text>
            <text x="438" y="80" textAnchor="middle">
              3PL last mile
            </text>
            <text x="85" y="181" textAnchor="middle">
              Seller godowns
            </text>
            <text x="320" y="191" textAnchor="middle">
              Dark store
            </text>
            <text x="555" y="181" textAnchor="middle">
              Kirana
            </text>
            <g ref={van} transform="translate(202 110)" aria-hidden="true">
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
          <figcaption key={String(lastMile)}>
            <strong>
              {lastMile
                ? "Then, from dark store to kirana."
                : "First, from sellers to the dark store."}
            </strong>{" "}
            {lastMile
              ? "After consolidation, dedicated 3PL partners deliver to the shop using its map pin and phone number. The retailer pays cash on delivery."
              : "3PL partners pick up from distributor and wholesaler godowns. Orders are aggregated at a DigiDukaan dark store near kirana clusters."}
          </figcaption>
        </figure>
        <ol className="logistics-handoffs">
          {[
            {
              icon: "truck" as const,
              label: "Pick up",
              text: "3PL collects from seller godowns",
            },
            {
              icon: "layers" as const,
              label: "Consolidate",
              text: "Orders aggregated at the dark store",
            },
            {
              icon: "route" as const,
              label: "Deliver",
              text: "3PL last mile to the kirana",
            },
            {
              icon: "check" as const,
              label: "Pay cash",
              text: "Retailer pays on delivery",
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
          Sellers supply the goods. 3PL partners move them. DigiDukaan 2.0
          connects the journey through dark stores.
        </p>
      </div>
    </section>
  );
}
