/**
 * @mockups/web-ui — public surface.
 *
 *   import { Button, Card, StatusBadge, AppShell } from '@mockups/web-ui';
 *
 * Deep imports work too, for the rare case you want one file:
 *   import { Button } from '@mockups/web-ui/button';
 *
 * Tokens are deliberately NOT re-exported here. Components reference
 * semantic utilities (`bg-primary`, `text-foreground`) and the app's CSS
 * resolves them from `@mockups/web-tokens/theme.css`. If you need token
 * VALUES in TypeScript (chart series colours, say), import them straight
 * from `@mockups/web-tokens` — same rule as `@mockups/ui`.
 *
 * Two exports are renamed because their source files collide on a name;
 * both alternatives are still reachable by deep import.
 */

/* ── utilities ─────────────────────────────────────────────────────── */

export { cn } from './components/utils';
export { useIsMobile } from './components/use-mobile';

/* ── layout & app chrome ───────────────────────────────────────────── */

export { AppShell } from './components/app-shell';
export type { AppShellProps, NavItem, BrandConfig, ShellUser } from './components/app-shell';
export { ThemeToggle } from './components/theme-toggle';
export { PageHeader, PageTitle, SectionTitle } from './components/page-header';
export { RouteProgress, PageLoader } from './components/page-loader';

/* ── forms & inputs ────────────────────────────────────────────────── */

export { Button, buttonVariants } from './components/button';
export { Input } from './components/input';
export { Textarea } from './components/textarea';
export { Label } from './components/label';
export * from './components/select';
export * from './components/command';
export * from './components/multi-select';
export * from './components/radio-group';
export { Checkbox } from './components/checkbox';
export { Switch } from './components/switch';
export { Toggle, toggleVariants } from './components/toggle';
export * from './components/toggle-group';
export { Slider } from './components/slider';
export { Calendar } from './components/calendar';
export * from './components/input-otp';
export * from './components/image-uploader';

/** react-hook-form bindings: Form, FormField, FormItem, FormLabel, … */
export * from './components/form';

/**
 * Standalone "label + control + inline error" wrapper. Named `LabeledField`
 * because the react-hook-form `FormField` above owns that name — reach for
 * this one when you are NOT wiring react-hook-form.
 */
export { FormField as LabeledField } from './components/form-field';

/* ── display ───────────────────────────────────────────────────────── */

export { Badge, badgeVariants } from './components/badge';
export { StatusBadge } from './components/status-badge';
export type { StatusTone } from './components/status-badge';
export * from './components/card';
export * from './components/avatar';
export { Progress } from './components/progress';
export { Separator } from './components/separator';
export { Skeleton } from './components/skeleton';
export { AspectRatio } from './components/aspect-ratio';
export * from './components/alert';
export * from './components/carousel';
export { EmptyState } from './components/empty-state';
export * from './components/error-state';
export { CopyOnHover } from './components/copy-on-hover';

/* ── overlays ──────────────────────────────────────────────────────── */

export * from './components/dialog';
export * from './components/alert-dialog';
export * from './components/sheet';
export * from './components/drawer';
export * from './components/popover';
export * from './components/hover-card';
export * from './components/tooltip';
export * from './components/dropdown-menu';
export * from './components/context-menu';
export * from './components/menubar';
export { Toaster } from './components/sonner';
export { toast } from 'sonner';

/* ── navigation ────────────────────────────────────────────────────── */

export * from './components/tabs';
export * from './components/accordion';
export * from './components/breadcrumb';
export * from './components/pagination';
export { ListPagination, paginate } from './components/list-pagination';
export * from './components/navigation-menu';
export * from './components/sidebar';

/* ── data display ──────────────────────────────────────────────────── */

export * from './components/table';

/** Pre-styled table primitives — the canonical list-page table. */
export * from './components/data-table-shell';

/**
 * Column-config-driven table. Named `DataGrid` because the styled
 * primitives above own `DataTable` — use this when you'd rather declare
 * columns than write markup.
 */
export { DataTable as DataGrid } from './components/data-table';

export * from './components/chart';
export * from './components/scroll-area';
export * from './components/resizable';
export * from './components/collapsible';
