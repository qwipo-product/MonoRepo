/**
 * @mockups/ui — the shared kit every mockup pulls from.
 *
 *   import { Button, Card, Sheet, Chip, cn, useTheme } from '@mockups/ui';
 *
 * These primitives are token-driven: they reference Tailwind utilities like
 * `bg-primary` / `text-foreground-secondary`, resolved from
 * `@mockups/design-tokens/theme.css` (imported by each app). That's the split —
 * the component shape is shared, the tokens define the look.
 *
 * Tailwind does not scan node_modules, so an app that uses these components
 * must point at this package's source with an `@source` directive in its CSS.
 */
export { cn } from './cn';

export { ThemeProvider, useTheme, type ThemeMode } from './theme';

export { Badge, badgeVariants, type BadgeProps } from './badge';
export { Button, buttonVariants, type ButtonProps } from './button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from './card';
export { Input } from './input';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Sheet, type SheetProps } from './sheet';
export {
  SegmentedControl,
  type SegmentOption,
  type SegmentedControlProps,
} from './segmented-control';
export { Chip, chipVariants, type ChipProps } from './chip';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { InlineMessage, inlineMessageVariants, type InlineMessageProps } from './inline-message';
export { Toast, toastVariants, type ToastProps } from './toast';
export { FieldError, type FieldErrorProps } from './field-error';
export { QtyStepper, type QtyStepperProps } from './qty-stepper';
export { SelectableCard, type SelectableCardProps } from './selectable-card';
export { Switch, type SwitchProps } from './switch';
export { StatusBar } from './status-bar';
export { TabBar, type TabBarProps, type TabBarTab } from './tab-bar';
