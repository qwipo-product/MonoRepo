import { ProductDevice } from "./ProductDevice";

const route =
  "M-70 390h205q65 0 65-65V160q0-65 65-65h140q65 0 65 65v340q0 65 65 65h180";
const mobileRoute =
  "M-70 390h95q65 0 65-65V160q0-65 65-65h370q65 0 65 65v340q0 65 65 65h60";
const compactRoute =
  "M-70 390h95q65 0 65-65V160q0-65 65-65h350q65 0 65 65v340q0 65 65 65h80";
const secondRoute =
  "M-70 443h205q118 0 118-118V160q0-12 12-12h140q12 0 12 12v340q0 118 118 118h180";
const mobileSecondRoute =
  "M-70 443h95q118 0 118-118V160q0-12 12-12h370q12 0 12 12v340q0 118 118 118h60";
const compactSecondRoute =
  "M-70 443h95q118 0 118-118V160q0-12 12-12h350q12 0 12 12v340q0 118 118 118h80";

export function RouteArtwork() {
  return (
    <div className="hero-art" data-hero-art>
      <div className="art-disc" aria-hidden="true" />
      <svg
        className="hero-routes"
        viewBox="0 0 620 660"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="route-rail"
          d={route}
          data-route-desktop={route}
          data-route-mobile={mobileRoute}
          data-route-compact={compactRoute}
        />
        <path
          className="route-rail second"
          d={secondRoute}
          data-route-desktop={secondRoute}
          data-route-mobile={mobileSecondRoute}
          data-route-compact={compactSecondRoute}
        />
        <path
          data-route-track
          id="hero-route-track"
          d={route}
          data-route-desktop={route}
          data-route-mobile={mobileRoute}
          data-route-compact={compactRoute}
          stroke="transparent"
        />
        {[0, 0.5].map((offset) => (
          <g
            key={offset}
            data-route-parcel
            data-route-offset={offset}
            transform={
              offset === 0 ? "translate(80 390)" : "translate(470 470)"
            }
          >
            <rect
              x="-18"
              y="-18"
              width="36"
              height="36"
              rx="10"
              fill="var(--accent)"
              stroke="#32125C"
              strokeWidth="1.5"
            />
            <path d="M-7 0H7M1-6l6 6-6 6" stroke="#32125C" strokeWidth="1.5" />
          </g>
        ))}
        <circle
          cx="200"
          cy="210"
          r="6"
          fill="#32125C"
          data-route-node="200"
          data-mobile-x="90"
          data-compact-x="90"
        />
        <circle
          cx="470"
          cy="470"
          r="6"
          fill="#32125C"
          data-route-node="470"
          data-mobile-x="590"
          data-compact-x="570"
        />
      </svg>
      <div className="hero-phone" data-hero-phone>
        <ProductDevice
          screens={["home", "catalogue", "orders", "tracking"]}
          priority
          cycleTransition="spin"
        />
      </div>
      <div className="route-tag tag-top">
        <span className="status-dot" />
        Your network. Connected.
      </div>
      <div className="route-tag tag-bottom">
        <span className="order-symbol" aria-hidden="true">
          ↗
        </span>
        <span>
          THE NEXT ORDER
          <br />
          <strong>Starts with a connection.</strong>
        </span>
      </div>
      <span className="art-coordinate coordinate-one" aria-hidden="true">
        01 / DISCOVER
      </span>
      <span className="art-coordinate coordinate-two" aria-hidden="true">
        02 / ORDER
      </span>
    </div>
  );
}
