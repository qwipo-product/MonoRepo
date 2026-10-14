import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fingerprint, Pencil } from "lucide-react";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from "@mockups/web-ui";

const meta = {
  title: "Primitives/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "Canonical anatomy is `Card + CardHeader + CardTitle + CardContent`. Actions belong in `CardAction` inside the header — never floating in the body.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Anatomy: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Network identity
        </CardTitle>
        <CardDescription className="text-sm">
          Issued once, portable across every participant.
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Network retailer ID" value="NRID-10001" mono />
        <Field label="Business name" value="Sri Balaji Kirana Stores" />
        <Field label="GSTIN" value="36AABCS1429B1ZQ" mono />
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-gray-600">Verification</span>
          <StatusBadge tone="success">Business verified</StatusBadge>
        </div>
      </CardContent>
    </Card>
  ),
};

export const KpiTile: Story = {
  name: "KPI tile pattern",
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
      {[
        { label: "Verified identities", value: "12,480", note: "+412 this week" },
        { label: "With 2+ relationships", value: "7,116", note: "57% of verified" },
        { label: "Pending approvals", value: "218", note: "avg 1.4 days" },
      ].map((k) => (
        <Card key={k.label} className="gap-0 py-5">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Fingerprint className="h-4 w-4 text-blue-600" />
              </span>
              <span className="text-sm text-gray-600">{k.label}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500">{k.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm text-gray-900 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
