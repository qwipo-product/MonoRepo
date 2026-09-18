import type { Meta, StoryObj } from "@storybook/react-vite";
import { Network, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@mockups/web-ui";

const meta: Meta = { title: "Primitives/Feedback & overlays" };
export default meta;

export const Empty: StoryObj = {
  name: "Empty state",
  render: () => (
    <div className="rounded-lg border border-gray-200 bg-white">
      <EmptyState
        icon={Network}
        title="No relationships yet"
        description="Once a company or distributor approves this retailer, the relationship will appear here."
        action={<Button>Request company approval</Button>}
      />
    </div>
  ),
};

export const EmptyCompact: StoryObj = {
  name: "Empty state — compact",
  render: () => (
    <div className="max-w-sm rounded-lg border border-gray-200 bg-white">
      <EmptyState
        compact
        icon={Search}
        title="No matches"
        description="No retailer matched that phone number in your authorized set."
      />
    </div>
  ),
};

export const Loading: StoryObj = {
  name: "Loading skeletons",
  render: () => (
    <div className="max-w-lg space-y-3">
      <p className="text-xs text-gray-500">
        Skeletons match the shape of the real content. Never render a blank.
      </p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
        >
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  ),
};

export const Toasts: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.success("Relationship approved")}>
        Success
      </Button>
      <Button
        variant="destructive"
        onClick={() => toast.error("Authorization check failed")}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => toast("Consent expires in 7 days")}
      >
        Neutral
      </Button>
    </div>
  ),
};

export const Overlays: StoryObj = {
  render: () => (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Map participant ID</DialogTitle>
              <DialogDescription>
                Link an existing company retailer ID to this network identity.
                The company remains the owner of that ID.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create mapping</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Revoke access</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke buyer app access?</AlertDialogTitle>
              <AlertDialogDescription>
                This buyer app will immediately stop resolving this retailer.
                Existing orders are unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {/* Destructive primary sits on the right. Never on the left. */}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Six words or fewer</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};
