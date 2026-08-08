import { ChevronLeft } from 'lucide-react';

/* Back control — grey square container, consistent size/style across every
   screen. */
export default function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition-colors hover:bg-muted/70 active:scale-95"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
