import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Checkbox,
  Input,
  Label,
  LabeledField,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@mockups/web-ui";

const meta: Meta = {
  title: "Primitives/Forms",
  parameters: {
    docs: {
      description: {
        component:
          "Field rhythm is `space-y-2` between Label and control, `gap-4` between fields in a row. Errors render below the input, never only in a toast.",
      },
    },
  },
};
export default meta;

export const TextInputs: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business">Business name</Label>
        <Input id="business" placeholder="Sri Balaji Kirana Stores" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gstin">GSTIN</Label>
        <Input id="gstin" defaultValue="36AABCS1429B1ZQ" className="font-mono" />
      </div>

      <LabeledField
        label="Registered mobile"
        required
        error="Enter a valid 10-digit mobile number"
      >
        <Input defaultValue="+91 98" aria-invalid />
      </LabeledField>

      <div className="space-y-2">
        <Label htmlFor="notes">Verification notes</Label>
        <Textarea id="notes" placeholder="Optional context for the reviewer" />
      </div>
    </div>
  ),
};

export const Selection: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label>Business type</Label>
        <Select defaultValue="kirana">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kirana">Kirana store</SelectItem>
            <SelectItem value="supermarket">Supermarket</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="pharmacy">Pharmacy</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Select handles up to 8 options. Beyond that, switch to Combobox.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Verification method</Label>
        <RadioGroup defaultValue="gstin" className="space-y-2">
          {[
            ["gstin", "GSTIN lookup", "Deterministic — highest confidence"],
            ["otp", "Mobile OTP", "Confirms control of the number"],
            ["dms", "Company DMS", "Company confirms the mapping"],
          ].map(([value, label, hint]) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-blue-50"
            >
              <RadioGroupItem value={value} id={value} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  {label}
                </span>
                <span className="block text-xs text-gray-500">{hint}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>Disclosure defaults</Label>
        {[
          ["share-nrid", "Share network retailer ID", true],
          ["share-dms", "Share company DMS retailer ID", false],
          ["share-gstin", "Share GSTIN", false],
        ].map(([id, label, checked]) => (
          <div key={id as string} className="flex items-center gap-2">
            <Checkbox id={id as string} defaultChecked={checked as boolean} />
            <Label htmlFor={id as string} className="text-sm font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Allow tokenized relationships
          </p>
          <p className="text-xs text-gray-500">
            Buyer apps transact against a token, not your retailer ID.
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  ),
};
