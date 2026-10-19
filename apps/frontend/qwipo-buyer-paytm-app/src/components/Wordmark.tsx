import { cn } from '@mockups/ui';

/* A placeholder logo: the name drawn as a wordmark that always fits its
   square. SVG so the type scales with the box — "MTR" stays big, "Mysore
   Sandal" breaks onto two lines and shrinks instead of being clipped. Each
   name gets a stable token colour (fill = currentColor). */

// Token colours, so a row of placeholders isn't a wall of one colour.
const INK = [
  'text-error',
  'text-success-foreground',
  'text-info-foreground',
  'text-primary',
  'text-warning-foreground',
  'text-accent-foreground',
];

/** A stable colour for a name, so the same brand is the same colour everywhere. */
const inkFor = (name: string) =>
  INK[[...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % INK.length];

export function Wordmark({ text, className }: { text: string; className?: string }) {
  const lines = text.includes(' ') && text.length > 7 ? text.split(/\s+/).slice(0, 2) : [text];
  const longest = Math.max(...lines.map((l) => l.length));
  // Glyphs run ~0.6em wide: keep the longest line inside 88 of the 100 units.
  const size = Math.min(38, 150 / longest, 80 / lines.length);
  const lead = size * 1.05;
  const top = 50 - ((lines.length - 1) * lead) / 2;
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={text} className={cn('h-full w-full', inkFor(text), className)}>
      {lines.map((l, i) => (
        <text
          key={i}
          x="50"
          y={top + i * lead}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size}
          fontWeight={800}
          letterSpacing={-0.5}
          fill="currentColor"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}
