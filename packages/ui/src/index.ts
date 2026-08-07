/**
 * @mockups/ui — the shared kit every mockup pulls from.
 *
 *   import { Button, Card, cn, useTheme } from '@mockups/ui';
 *
 * These primitives are token-driven: they reference Tailwind utilities like
 * `bg-primary` / `text-muted-foreground`, and each app defines what those
 * mean in its own `src/index.css` `@theme` block. That's the split — the
 * component shape is shared, the brand is per-mockup.
 *
 * Tailwind does not scan node_modules, so an app that uses these components
 * must point at this package's source with an `@source` directive in its CSS.
 * Every app template already does — see any app's `src/index.css`.
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
} from './card';
export { Input } from './input';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
