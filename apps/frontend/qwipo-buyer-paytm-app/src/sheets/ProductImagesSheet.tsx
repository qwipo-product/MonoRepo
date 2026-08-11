import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Rotate3d } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import type { Product } from '../data/products';

/* Product images sheet — opened by tapping a product card's thumbnail. Shows a
   large preview + an angle strip (front / left / right / 3D). No real photo
   assets in this mockup, so the angles are simulated from the product emoji
   (flipped/rotated); the 3D tile is drag-to-rotate. Swap in real photos later. */

interface Angle {
  id: string;
  transform?: string;
  spin?: boolean;
}

const ANGLES: Angle[] = [
  { id: 'front' },
  { id: 'left', transform: 'scaleX(-1)' },
  { id: 'right', transform: 'rotateY(24deg)' },
  { id: '3d', spin: true },
];

function Preview({ emoji, angle }: { emoji: string; angle: Angle }) {
  // 3D tile: drag to rotate — horizontal turns (Y axis), vertical tilts (X axis).
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
      x: drag.current.baseX - (e.clientY - drag.current.y),
      y: drag.current.baseY + (e.clientX - drag.current.x),
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
        'relative mx-auto grid aspect-square w-56 select-none place-items-center overflow-hidden rounded-xl border border-border bg-muted [perspective:600px]',
        angle.spin && 'cursor-grab touch-none active:cursor-grabbing'
      )}
    >
      <span className="text-8xl leading-none" style={transform ? { transform } : undefined} aria-hidden>
        {emoji}
      </span>
      {angle.spin && (
        <Rotate3d className="absolute bottom-2 right-2 h-5 w-5 text-foreground-secondary" />
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
    <Sheet open={!!product} onClose={onClose} title={product?.shortName ?? 'Product images'}>
      <Preview emoji={emoji} angle={ANGLES[idx]} />

      <div className="no-scrollbar mt-3 flex justify-center gap-2 overflow-x-auto">
        {ANGLES.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View ${a.id}`}
            className={cn(
              'relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted',
              i === idx ? 'border-primary ring-2 ring-primary' : 'border-border'
            )}
          >
            <span className="text-3xl leading-none" style={a.transform ? { transform: a.transform } : undefined} aria-hidden>
              {emoji}
            </span>
            {a.spin && <Rotate3d className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 text-foreground-secondary" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
