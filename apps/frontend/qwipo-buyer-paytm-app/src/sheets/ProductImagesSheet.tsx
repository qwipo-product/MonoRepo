import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Rotate3d } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import type { Product } from '../data/products';

/* Product images sheet — opened by tapping a product card's thumbnail. Shows a
   large preview + an angle strip (Front / Left / Right) and, when the product
   has a spin asset, a 360° view. No real photo assets in this mockup, so the
   angles are simulated from the product emoji (flipped/rotated) — swap in real
   photos by adding `images` (and `spin360`) to the product data. */

interface Angle {
  label: string;
  /** CSS transform applied to the emoji to fake the camera angle. */
  transform?: string;
  spin?: boolean;
}

const ANGLES: Angle[] = [
  { label: 'Front' },
  { label: 'Left', transform: 'scaleX(-1)' },
  { label: 'Right', transform: 'rotateY(24deg)' },
  { label: '3D View', spin: true },
];

function Preview({ emoji, angle }: { emoji: string; angle: Angle }) {
  // 3D view: drag to rotate by hand (no auto-spin). Horizontal drag turns
  // left/right (Y axis), vertical drag tilts to top/bottom (X axis).
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);

  const onDown = (e: ReactPointerEvent) => {
    if (!angle.spin) return;
    drag.current = { x: e.clientX, y: e.clientY, baseX: rot.x, baseY: rot.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    setRot({
      x: drag.current.baseX - (e.clientY - drag.current.y), // drag down → tilt to top
      y: drag.current.baseY + (e.clientX - drag.current.x), // 1px ≈ 1°
    });
  };
  const onUp = () => {
    drag.current = null;
  };

  const transform = angle.spin ? `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` : angle.transform;

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={cn(
        'relative mx-auto grid aspect-square w-52 select-none place-items-center overflow-hidden rounded-xl border border-border bg-muted [perspective:600px]',
        angle.spin && 'cursor-grab touch-none active:cursor-grabbing'
      )}
    >
      <span
        className="text-8xl leading-none"
        style={transform ? { transform } : undefined}
        aria-hidden
      >
        {emoji}
      </span>
      {angle.spin && (
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-1 text-xs font-medium text-background">
          <Rotate3d className="h-3.5 w-3.5" /> Drag to rotate
        </span>
      )}
    </div>
  );
}

export function ProductImagesSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const emoji = product?.image ?? '📦';
  const idx = Math.min(active, ANGLES.length - 1);

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      title={product?.shortName ?? 'Product images'}
      subtitle="Front, left, right and a 3D view"
    >
      <Preview emoji={emoji} angle={ANGLES[idx]} />

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {ANGLES.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View ${a.label}`}
            className={cn(
              'relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted',
              i === idx ? 'border-primary ring-2 ring-primary' : 'border-border'
            )}
          >
            <span
              className="text-3xl leading-none"
              style={a.transform ? { transform: a.transform } : undefined}
              aria-hidden
            >
              {emoji}
            </span>
            {a.spin && (
              <Rotate3d className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 text-foreground-secondary" />
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-foreground-secondary">{ANGLES[idx].label} view</p>
    </Sheet>
  );
}
