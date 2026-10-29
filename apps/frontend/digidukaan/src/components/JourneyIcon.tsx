export type JourneyIconName =
  | "search"
  | "store"
  | "cart"
  | "box"
  | "truck"
  | "route"
  | "check"
  | "layers"
  | "scroll";
export function JourneyIcon({
  name,
  className = "",
}: {
  name: JourneyIconName;
  className?: string;
}) {
  const paths: Record<JourneyIconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5M8 10.5h5m-2.5-2.5v5" />
      </>
    ),
    store: (
      <>
        <path d="M3 9 5 3h14l2 6M3 9v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9ZM5 15v6h14v-6M10 21v-5h4v5M9 3v6m6-6v6" />
      </>
    ),
    cart: (
      <>
        <path d="M2 3h3l3 12h11l3-9H6M9 10h8" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    box: (
      <>
        <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10M7.5 4.5l9 5v5" />
      </>
    ),
    truck: (
      <>
        <path d="M2 5h12v12H2V5Zm12 5h5l3 4v3h-8M17 10v4h5M6 9h5" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    route: (
      <>
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M5 7v8a4 4 0 0 0 4 4h8M9 5h6a4 4 0 0 1 4 4v6M15 12l4 3 3-3" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m7 12 3 3 7-7" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5" />
      </>
    ),
    scroll: (
      <>
        <rect x="7" y="2" width="10" height="15" rx="5" />
        <path d="M12 5v4m-4 10 4 3 4-3" />
      </>
    ),
  };
  return (
    <svg
      className={`journey-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
