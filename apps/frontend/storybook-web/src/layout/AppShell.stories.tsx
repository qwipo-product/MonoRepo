import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Building2,
  FileSearch,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  AppShell,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  PageTitle,
  type NavItem,
} from "@mockups/web-ui";

const meta = {
  title: "Layout/App shell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The chrome every Qwipo product mockup wears: collapsible desktop sidebar, 56px top bar, animated mobile drawer, route progress and a theme-aware logo swap. Everything product-specific arrives as props — fork the nav, not the shell.",
      },
    },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Identity",
    icon: Fingerprint,
    subItems: [
      { name: "Retailers", href: "/identity/retailers" },
      { name: "Identity mappings", href: "/identity/mappings" },
    ],
  },
  { name: "Participants", href: "/participants", icon: Network },
  { name: "Relationships", href: "/relationships", icon: Building2 },
  { name: "Authorization", href: "/authorization", icon: ShieldCheck },
  { name: "Consent", href: "/consent", icon: KeyRound },
  { name: "Audit", href: "/audit", icon: FileSearch },
  {
    name: "Disputes",
    href: "/disputes",
    icon: Settings,
    disabled: true,
    disabledReason: "Lands in Phase 3",
  },
];

const USER = {
  name: "Network Operations",
  subtitle: "RIRN Console",
  initials: "NO",
};

export const Default: Story = {
  args: {
    navigation: NAV,
    title: "Network overview",
    user: USER,
    userMenu: (
      <>
        <DropdownMenuLabel>
          <p className="font-medium">{USER.name}</p>
          <p className="text-xs font-normal text-gray-600">{USER.subtitle}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </>
    ),
    children: (
      <div className="space-y-4 p-6">
        <PageTitle size="lg">Network overview</PageTitle>
        <p className="max-w-xl text-sm text-gray-600">
          Collapse the sidebar with the chevron, switch themes from the toolbar
          above, or narrow the viewport below <code>md</code> to see the mobile
          drawer take over.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {["Identity", "Relationship", "Authorization"].map((t) => (
            <div
              key={t}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <p className="text-sm font-medium text-gray-900">{t}</p>
              <p className="mt-1 text-xs text-gray-500">
                Separate concept, separate owner.
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    ...meta.parameters,
    viewport: { defaultViewport: "mobile1" },
  },
};
