import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Rotate3d } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import { ProductImage } from '@mockups/components';
/** Minimal shape both distributor Products and WholesalerProducts satisfy. */
export interface GalleryProduct {
  image?: string;
  name?: string;
}

/* Product images sheet — opened by tapping a product card's thumbnail. Shows a
   large preview + an angle strip (front / left / right / 3D). Most SKUs are
   still an emoji and the angles are simulated by flipping and rotating it;
   the ones that have been photographed show the photo, turned the same way.
   The 3D tile is drag-to-rotate. */

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

function Preview({ image, angle }: { image: string; angle: Angle }) {
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
        'relative grid aspect-square w-full select-none place-items-center overflow-hidden rounded-xl border border-border bg-muted [perspective:600px]',
        angle.spin && 'cursor-grab touch-none active:cursor-grabbing'
      )}
    >
      {/* The picture, not the string that points at it: a photographed SKU
          carries a path here, and printing it read as literal text. */}
      <span
        className="grid h-full w-full place-items-center p-6 text-9xl leading-none"
        style={transform ? { transform } : undefined}
        aria-hidden
      >
        <ProductImage image={image} />
      </span>
      {angle.spin && (
        /* Out of the bottom corners — those belong to the arrows now. */
        <Rotate3d className="absolute right-3 top-3 h-5 w-5 text-foreground-secondary" />
      )}
    </div>
  );
}

export function ProductImagesSheet({
  product,
  onClose,
}: {
  product: GalleryProduct | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const image = product?.image ?? '📦';
  const len = ANGLES.length;
  const step = (d: number) => setIdx((p) => (p + d + len) % len);

  return (
    /* Tighter than a form sheet: the picture is the content, so it takes the
       width and the padding gets out of its way. */
    <Sheet
      open={!!product}
      onClose={onClose}
      title={product?.name ?? 'Product images'}
      bodyClassName="p-3"
    >
      <div className="relative w-full">
        <Preview image={image} angle={ANGLES[idx]} />

        {/* In the bottom corners rather than across the middle of the picture,
            which is the part worth looking at. */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous image"
          className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next image"
          className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2.5 flex justify-center gap-1.5">
        {ANGLES.map((a, i) => (
          <span
            key={a.id}
            className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-4 bg-primary' : 'w-1.5 bg-foreground-secondary/30')}
          />
        ))}
      </div>
    </Sheet>
  );
}
