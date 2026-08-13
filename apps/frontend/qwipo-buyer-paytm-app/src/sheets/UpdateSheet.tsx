/* What's New / app update — a bottom sheet over Home, same shell as the
   selling-units sheet, so an update never takes the buyer to a dead-end page.

   Two modes off one prop:
     • default   — Skip + Update Now, X closes it (the reference design)
     • required  — force update: no Skip, no X, the buyer can't dismiss it */

import { Button, Sheet } from '@mockups/ui';

interface Section {
  icon: string;
  title: string;
  points: string[];
}

const SECTIONS: Section[] = [
  {
    icon: '🚀',
    title: 'Smarter Search Experience',
    points: [
      'Faster search results with improved relevance.',
      'Search suggestions now include recent searches, trending products, categories, and brands.',
      'Better product matching, even with partial keywords.',
    ],
  },
  {
    icon: '📍',
    title: 'Beat Day–Based Shopping',
    points: [
      'Improved serviceability based on your assigned beat day.',
      'Product availability and seller listings are now accurate to your delivery day.',
      'Clearer delivery expectations on every product and cart.',
    ],
  },
  {
    icon: '🛒',
    title: 'Better Cart & Checkout',
    points: [
      'Price changes since you added an item are now shown per product.',
      'Minimum order value and weight alerts are grouped before checkout.',
    ],
  },
  {
    icon: '📦',
    title: 'Improved Order Management',
    points: [
      'Track every order from placed to delivered in one view.',
      'Reorder past purchases in a single tap.',
    ],
  },
];

export function UpdateSheet({
  open,
  onClose,
  onUpdate,
  required = false,
}: {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  /** Force update — removes Skip and the close affordance. */
  required?: boolean;
}) {
  return (
    <Sheet
      open={open}
      // A required update must not be dismissible — swallow backdrop taps too.
      onClose={required ? () => {} : onClose}
      showHandle={!required}
      size="tall"
      title={required ? '⚠️ Update required' : "🚀 What's new!"}
      footer={
        <div className="flex gap-3">
          {!required && (
            <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
              Skip
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={onUpdate}>
            Update Now
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-foreground">
        {required
          ? 'This version of the Qwipo Buyer App is no longer supported. Update to continue ordering — your cart and saved addresses are safe.'
          : "We're constantly improving the Qwipo Buyer App to make ordering from wholesalers, distributors, and brands faster, smarter, and more reliable. This release brings enhanced shopping experiences, better discovery, improved order management, and several performance upgrades to help you source products with ease."}
      </p>

      <div className="mt-5 text-sm font-semibold text-foreground">What's New in This Release?</div>

      <ul className="mt-2 space-y-4">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            <div className="flex items-start gap-2 text-sm font-semibold text-foreground">
              <span aria-hidden>{s.icon}</span>
              <span className="min-w-0">{s.title}</span>
            </div>
            <ul className="mt-1.5 space-y-1.5 pl-6">
              {s.points.map((p) => (
                <li
                  key={p}
                  className="relative text-sm leading-snug text-foreground-secondary before:absolute before:-left-3.5 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-foreground-tertiary"
                >
                  {p}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-foreground-secondary">Version 2.4.0 · 12 Aug 2026</p>
    </Sheet>
  );
}
