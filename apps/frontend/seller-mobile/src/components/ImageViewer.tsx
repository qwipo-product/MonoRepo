import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, X } from 'lucide-react';
import { Badge, Button, Sheet, cn } from '@mockups/ui';
import { ProductImage } from '@mockups/components';
import { useI18n } from '@mockups/i18n';

/* Full-screen picture preview inside the phone frame. Prev / Next (and ← / →,
   Esc on a keyboard), a counter and dots. With handlers it also offers
   "Set as primary" and "Remove" — remove asks first. Two overlay layers stack
   to a near-black backdrop without a colour of its own. */
export function ImageViewer({
  images,
  start,
  onClose,
  onMakePrimary,
  onRemove,
}: {
  images: string[];
  start: number | null;
  onClose: () => void;
  onMakePrimary?: (index: number) => void;
  onRemove?: (index: number) => void;
}) {
  if (start === null || images.length === 0) return <></>;
  // Keyed so the viewer opens on `start` each time.
  return <Viewer key={start} images={images} start={start} onClose={onClose} onMakePrimary={onMakePrimary} onRemove={onRemove} />;
}

function Viewer({
  images,
  start,
  onClose,
  onMakePrimary,
  onRemove,
}: {
  images: string[];
  start: number;
  onClose: () => void;
  onMakePrimary?: (index: number) => void;
  onRemove?: (index: number) => void;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(start);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const i = Math.min(index, images.length - 1);
  const go = (step: number) => setIndex((n) => Math.max(0, Math.min(images.length - 1, n + step)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setIndex((n) => Math.max(0, n - 1));
      else if (e.key === 'ArrowRight') setIndex((n) => Math.min(images.length - 1, n + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div className="absolute inset-0 z-50 bg-overlay" role="dialog" aria-modal="true" aria-label={t('seller.images.preview')}>
      <div className="flex h-full flex-col bg-overlay text-white">
        <div className="flex items-center justify-between px-3 pt-10">
          <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
            {i + 1} / {images.length}
            {i === 0 && <Badge variant="info">{t('seller.images.primary')}</Badge>}
          </span>
          <button onClick={onClose} aria-label={t('seller.images.close')} className="grid h-11 w-11 place-items-center rounded-full active:bg-overlay">
            <X size={22} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center">
          <button
            onClick={() => go(-1)}
            disabled={i === 0}
            aria-label={t('seller.images.prev')}
            className="z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full disabled:opacity-30 active:bg-overlay"
          >
            <ChevronLeft size={26} />
          </button>
          <div className="grid h-full min-w-0 flex-1 place-items-center p-2 text-8xl">
            <ProductImage image={images[i]} alt={t('seller.images.picture_n').replace('{n}', String(i + 1))} />
          </div>
          <button
            onClick={() => go(1)}
            disabled={i === images.length - 1}
            aria-label={t('seller.images.next')}
            className="z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full disabled:opacity-30 active:bg-overlay"
          >
            <ChevronRight size={26} />
          </button>
        </div>

        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {images.map((_, n) => (
              <button
                key={n}
                onClick={() => setIndex(n)}
                aria-label={t('seller.images.picture_n').replace('{n}', String(n + 1))}
                className={cn('h-2 rounded-full transition-all', n === i ? 'w-5 bg-white' : 'w-2 bg-white/40')}
              />
            ))}
          </div>
        )}

        {(onMakePrimary || onRemove) && (
          <div className="flex gap-3 p-3 pb-6">
            {onMakePrimary && (
              <Button variant="secondary" fullWidth disabled={i === 0} onClick={() => onMakePrimary(i)}>
                <Star size={16} />
                {t('seller.images.make_primary')}
              </Button>
            )}
            {onRemove && (
              <Button variant="destructive" fullWidth onClick={() => setConfirmRemove(true)}>
                <Trash2 size={16} />
                {t('seller.images.remove')}
              </Button>
            )}
          </div>
        )}
      </div>

      <Sheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={t('seller.images.remove_title')}
        subtitle={t('seller.images.remove_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmRemove(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              variant="destructive"
              fullWidth
              onClick={() => {
                setConfirmRemove(false);
                onRemove?.(i);
                if (images.length <= 1) onClose();
                else setIndex(Math.max(0, i - (i === images.length - 1 ? 1 : 0)));
              }}
            >
              {t('seller.images.remove_cta')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
