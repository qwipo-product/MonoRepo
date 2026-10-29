import { SiteLink as Link } from "./SiteLink";
import { Arrow } from "./Arrow";
export function Action({
  href,
  children,
  light = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  const Tag = href.startsWith("#") ? "a" : Link;
  return (
    <Tag
      className={`action ${light ? "action-light" : ""} ${className}`}
      href={href}
    >
      <span>{children}</span>
      <span className="action-icon">
        <Arrow diagonal />
      </span>
    </Tag>
  );
}
