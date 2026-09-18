import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation } from "react-router";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { RouteProgress } from "./page-loader";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "./utils";

import logoLightDefault from "../assets/logos/Qwipo_Secondary_Logo_for_Light_BG@4x-8.png";
import logoDarkDefault from "../assets/logos/Qwipo_Secondary_Logo_for_Dark_BG.svg";
import iconLightDefault from "../assets/logos/Qwipo_Icon_Logo_for_Light_BG@4x-8.png";
import iconDarkDefault from "../assets/logos/Qwipo_Icon_Logo_for_Dark_BG.svg";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface NavItem {
  name: string;
  /** Internal route. Omit when the item is a group parent or external link. */
  href?: string;
  /** Renders the item as a new-tab link with an external-link affordance. */
  externalUrl?: string;
  icon: LucideIcon;
  /** Collapsible child routes. A parent with subItems ignores `href`. */
  subItems?: { name: string; href: string }[];
  /** Greys the item out and blocks navigation — for not-yet-built screens. */
  disabled?: boolean;
  /** Tooltip shown when `disabled`. */
  disabledReason?: string;
}

export interface BrandConfig {
  /** Wordmark for light surfaces. Defaults to the Qwipo secondary logo. */
  logoLight?: string;
  /** Wordmark for dark surfaces. */
  logoDark?: string;
  /** Square mark shown when the sidebar is collapsed. */
  iconLight?: string;
  iconDark?: string;
  alt?: string;
}

export interface ShellUser {
  name: string;
  /** Second line under the name — org, role, or business name. */
  subtitle?: string;
  /** 1–2 characters. Falls back to the first letter of `name`. */
  initials?: string;
  /** Tailwind bg class for the avatar disc. Defaults to the brand blue. */
  avatarClassName?: string;
}

export interface AppShellProps {
  navigation: NavItem[];
  /** Page title in the top bar. Most apps derive this from the route. */
  title: string;
  user?: ShellUser;
  /** Dropdown contents for the user menu. Rendered inside a DropdownMenu. */
  userMenu?: ReactNode;
  /** Extra controls in the top bar, placed left of the theme toggle. */
  topBarActions?: ReactNode;
  brand?: BrandConfig;
  /** Page content — typically react-router's `<Outlet />`. */
  children: ReactNode;
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

/**
 * The canonical Qwipo application chrome: collapsible desktop sidebar,
 * 56-px top bar, animated mobile drawer, route progress bar, and a
 * theme-aware logo swap.
 *
 * Extracted from the Seller Store's RootLayout so every product mockup
 * shares one shell instead of forking it. Everything product-specific
 * (navigation, title, user, brand) arrives as props — the shell itself
 * knows nothing about any one app.
 *
 * ```tsx
 * <AppShell navigation={NAV} title={useTitle()} user={USER}>
 *   <Outlet />
 * </AppShell>
 * ```
 */
export function AppShell({
  navigation,
  title,
  user,
  userMenu,
  topBarActions,
  brand,
  children,
}: AppShellProps) {
  const location = useLocation();

  // Theme-aware logo swap. `themeReady` mount-guards the first paint so
  // we don't flicker between the light and dark asset during hydration.
  const { resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => setThemeReady(true), []);
  const isDark = themeReady && resolvedTheme === "dark";

  const logoSrc = isDark
    ? brand?.logoDark ?? logoDarkDefault
    : brand?.logoLight ?? logoLightDefault;
  const iconSrc = isDark
    ? brand?.iconDark ?? iconDarkDefault
    : brand?.iconLight ?? iconLightDefault;
  const brandAlt = brand?.alt ?? "Qwipo";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (href: string) => {
    // Exact match for the root route so subpages don't keep it lit.
    if (href === "/") return location.pathname === "/";
    // Require a "/" boundary so "/relationships" doesn't light up
    // "/relationships-archive".
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isParentActive = (subItems?: { href: string }[]) =>
    !!subItems?.some(
      (s) =>
        location.pathname === s.href ||
        location.pathname.startsWith(s.href + "/"),
    );

  // Keep the sidebar in sync with deep links and back/forward navigation
  // by auto-expanding whichever parent owns the active sub-route.
  useEffect(() => {
    const activeParent = navigation.find(
      (item) => item.subItems && isParentActive(item.subItems),
    );
    if (activeParent && expandedMenu !== activeParent.name) {
      setExpandedMenu(activeParent.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigation]);

  const itemBase =
    "flex items-center rounded-lg px-3 py-2.5 transition-all hover:bg-blue-50";
  const itemActive = "bg-blue-50 text-blue-600 font-medium";
  const itemIdle = "text-gray-700 hover:text-gray-900";
  const itemDisabled = "text-gray-400 cursor-not-allowed hover:bg-transparent";

  /** One nav renderer drives both the desktop rail and the mobile drawer. */
  const NavLinks = ({
    isCollapsed = false,
    onNavigate,
  }: {
    isCollapsed?: boolean;
    onNavigate?: () => void;
  }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const hasSubItems = !!item.subItems?.length;
        const parentActive = hasSubItems && isParentActive(item.subItems);
        const isExpanded = expandedMenu === item.name;

        if (item.externalUrl) {
          return (
            <button
              key={item.name}
              type="button"
              disabled={item.disabled}
              title={item.disabled ? item.disabledReason : item.name}
              onClick={() => {
                if (item.disabled) return;
                window.open(item.externalUrl, "_blank", "noopener,noreferrer");
                onNavigate?.();
              }}
              className={cn(
                itemBase,
                "w-full",
                isCollapsed ? "justify-center" : "gap-3",
                item.disabled ? itemDisabled : itemIdle,
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm flex-1 flex items-center justify-between gap-2">
                  <span>{item.name}</span>
                  <ExternalLink
                    className={cn(
                      "h-3 w-3",
                      item.disabled ? "opacity-40" : "opacity-60",
                    )}
                  />
                </span>
              )}
            </button>
          );
        }

        if (hasSubItems) {
          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() =>
                  !isCollapsed &&
                  setExpandedMenu(isExpanded ? null : item.name)
                }
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  itemBase,
                  "w-full",
                  isCollapsed ? "justify-center" : "justify-between",
                  parentActive ? itemActive : itemIdle,
                )}
              >
                <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </div>
                {!isCollapsed &&
                  (isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  ))}
              </button>
              {!isCollapsed && isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.subItems!.map((sub) => (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-50",
                        isActive(sub.href)
                          ? itemActive
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (item.disabled) {
          return (
            <span
              key={item.name}
              title={item.disabledReason}
              className={cn(
                itemBase,
                isCollapsed ? "justify-center" : "gap-3",
                itemDisabled,
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </span>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.href!}
            onClick={onNavigate}
            title={isCollapsed ? item.name : undefined}
            className={cn(
              itemBase,
              isCollapsed ? "justify-center" : "gap-3",
              isActive(item.href!) ? itemActive : itemIdle,
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">{item.name}</span>}
          </Link>
        );
      })}
    </>
  );

  const initials =
    user?.initials ?? user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ---- Desktop sidebar ---- */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col border-r border-gray-200 bg-white transition-all duration-300",
          collapsed ? "md:w-16" : "md:w-56",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
          {!collapsed ? (
            <>
              <img src={logoSrc} alt={brandAlt} className="h-6 object-contain" />
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="w-full flex items-center justify-center"
            >
              <img
                src={iconSrc}
                alt={brandAlt}
                className="h-8 w-8 object-contain"
              />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLinks isCollapsed={collapsed} />
        </nav>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {topBarActions}
            <ThemeToggle />
            {user && (
              <UserChip user={user} initials={initials} menu={userMenu} />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <RouteProgress />
          {children}
        </main>
      </div>

      {/* ---- Mobile drawer ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <img src={logoSrc} alt={brandAlt} className="h-6 object-contain" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * User chip
 * ------------------------------------------------------------------ */

function UserChip({
  user,
  initials,
  menu,
}: {
  user: ShellUser;
  initials: string;
  menu?: ReactNode;
}) {
  const chip = (
    <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-50">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm",
          user.avatarClassName ?? "bg-blue-600",
        )}
      >
        {initials}
      </div>
      <div className="text-left hidden lg:block">
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        {user.subtitle && (
          <p className="text-xs text-gray-600">{user.subtitle}</p>
        )}
      </div>
      {menu && (
        <ChevronDown className="h-4 w-4 text-gray-600 hidden lg:block" />
      )}
    </Button>
  );

  if (!menu) return chip;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{chip}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {menu}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
