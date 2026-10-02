import { useRef, useState, type ReactNode } from 'react';
import { Camera, ImagePlus, Images, Loader2 } from 'lucide-react';
import { Badge, FieldError, Sheet } from '@mockups/ui';
import { ProductImage } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import { ImageViewer } from './ImageViewer';

const MAX = 5;

/* The Product Images field: up to five pictures, the first is the primary.
   Tap a picture to preview it (and set it as primary or remove it). "Add
   photo" asks camera or gallery; the chosen files show as pictures after a
   short upload. Same rules as the portal: at least one, at most five. */
export function ProductImagesEditor({ images, onChange, alt }: { images: string[]; onChange: (images: string[]) => void; alt: string }) {
  const { t } = useI18n();
  const [viewing, setViewing] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const room = MAX - images.length - uploading;

  const add = (files: FileList | null) => {
    setPicking(false);
    if (!files?.length) return;
    const list = Array.from(files);
    const take = list.slice(0, Math.max(0, room));
    setSkipped(list.length - take.length);
    if (take.length === 0) return;
    const urls = take.map((f) => URL.createObjectURL(f));
    // A short pretend upload so it feels like the real thing.
    setUploading((n) => n + urls.length);
    window.setTimeout(() => {
      setUploading((n) => n - urls.length);
      onChange([...images, ...urls].slice(0, MAX));
    }, 600);
  };

  const makePrimary = (i: number) => {
    onChange([images[i], ...images.filter((_, j) => j !== i)]);
    setViewing(0);
  };
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-foreground tabular-nums">{images.length} / {MAX}</span>
        {room > 0 && <span className="text-foreground-secondary">{t('seller.images.more_allowed').replace('{n}', String(room))}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={`${img}-${i}`}
            onClick={() => setViewing(i)}
            aria-label={t('seller.images.picture_n').replace('{n}', String(i + 1))}
            className="relative grid aspect-square place-items-center overflow-hidden rounded-md border border-border bg-card text-4xl active:scale-[0.98]"
          >
            <ProductImage image={img} alt={alt} />
            {i === 0 && (
              <Badge variant="info" className="absolute left-1 top-1">
                {t('seller.images.primary')}
              </Badge>
            )}
          </button>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="grid aspect-square place-items-center rounded-md border border-border bg-muted text-xs text-foreground-secondary">
            <span className="flex flex-col items-center gap-1">
              <Loader2 size={18} className="animate-spin" />
              {t('seller.images.uploading')}
            </span>
          </div>
        ))}
        {room > 0 && (
          <button
            onClick={() => setPicking(true)}
            className="grid aspect-square place-items-center rounded-md border-2 border-dashed border-primary bg-primary-soft text-primary active:scale-[0.98]"
          >
            <span className="flex flex-col items-center gap-1 text-xs font-semibold">
              <ImagePlus size={22} />
              {t('seller.images.add')}
            </span>
          </button>
        )}
      </div>

      {images.length === 0 && uploading === 0 && <FieldError>{t('seller.images.required')}</FieldError>}
      {skipped > 0 && <p className="text-xs font-medium text-warning-foreground">{t('seller.images.skipped').replace('{n}', String(skipped))}</p>}
      <p className="text-xs text-foreground-secondary">{t('seller.images.hint')}</p>

      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      <input ref={gallery} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />

      <Sheet open={picking} onClose={() => setPicking(false)} title={t('seller.images.add_title')} subtitle={t('seller.images.more_allowed').replace('{n}', String(room))}>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <SourceButton icon={<Camera size={26} />} label={t('seller.images.take_photo')} onClick={() => camera.current?.click()} />
          <SourceButton icon={<Images size={26} />} label={t('seller.images.gallery')} onClick={() => gallery.current?.click()} />
        </div>
      </Sheet>

      <ImageViewer images={images} start={viewing} onClose={() => setViewing(null)} onMakePrimary={makePrimary} onRemove={remove} />
    </div>
  );
}

function SourceButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground active:bg-muted"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}
