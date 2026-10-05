import { useEffect, useState, type ReactNode } from 'react';
import { Camera, Clock, HelpCircle, Image as ImageIcon, LocateFixed } from 'lucide-react';
import { Button, Sheet, cn } from '@mockups/ui';
import { Field, SelectField, controlClass } from '../components/formbits';
import { IdCardArt, PinMapArt, ShopPhotoArt } from './KycArt';
import { ActionButton, AiAlert, DeleteConfirm, Mark, Verdict } from './kycBits';
import {
  GALLERY_BAD_IDS,
  GALLERY_BAD_PHOTOS,
  GPS_FIX,
  ID_TYPES,
  MAX_ATTEMPTS,
  SHOP_ADDRESS,
  SHOP_PHOTOS,
  type Criterion,
  type IdScene,
  type ShopScene,
} from './kycData';
import type { FieldStatus, KycFlow } from './useKycFlow';

/* Complete KYC · Step 2 (ID Proofs) — the existing step, now with three
   mandatory fields that AI checks the moment they're added:

     Shop Image *     Upload → Camera / Gallery → checking → ✓ or ✕
     Shop Location *  Current Location → checking → ✓ or ✕
     Owner ID *       pick document → Upload → checking → ✓ or ✕

   ✓ shows a one-line reason and [Edit] [Delete]. ✕ shows the problem,
   numbered steps to fix it, "Attempt n of 5" and one retry button. The 5th ✕
   sends the field to manual review (App shows that screen). */

const CHECK_MS = 1600;

export function KycDocsStep({
  flow,
  onManualReview,
}: {
  flow: KycFlow;
  /** The 5th rejection on any field. */
  onManualReview: () => void;
}) {
  const { kyc } = flow;
  const [sheet, setSheet] = useState<Criterion | 'location-help' | null>(null);
  const [deleting, setDeleting] = useState<Criterion | null>(null);
  const [idType, setIdType] = useState(kyc.idType ?? 'aadhaar');
  const [gst, setGst] = useState(false);

  // AI answers a moment after something is added.
  const statuses = `${kyc.fields.photo.status}|${kyc.fields.location.status}|${kyc.fields.ownerId.status}`;
  useEffect(() => {
    const checking = (['photo', 'location', 'ownerId'] as Criterion[]).find((c) => kyc.fields[c].status === 'checking');
    if (!checking) return;
    const t = setTimeout(() => {
      if (flow.resolve(checking) === 'review') onManualReview();
    }, CHECK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);

  const f = kyc.fields;
  const idLabel = ID_TYPES.find((t) => t.id === idType)?.label ?? 'ID';

  return (
    <>
      {/* ---- Shop Image ---- */}
      <Field label="Shop Image" required>
        <FieldBody
          status={f.photo.status}
          empty={
            <EmptyUpload
              art={<ShopPhotoArt scene="good" highlight="board" />}
              hint="Photo of your shop from the front. Name board should be visible."
              button="Upload Shop Photo"
              onClick={() => setSheet('photo')}
            />
          }
          checking={<Checking art={kyc.photo && <ShopPhotoArt scene={kyc.photo} />} text="AI is checking your photo…" />}
          accepted={
            <Accepted
              art={kyc.photo && <ShopPhotoArt scene={kyc.photo} />}
              title="Photo accepted"
              text={SHOP_PHOTOS.good.caption}
              onEdit={() => setSheet('photo')}
              onDelete={() => setDeleting('photo')}
            />
          }
          rejected={
            <AiAlert
              title="Photo not accepted"
              art={kyc.photo && <ShopPhotoArt scene={kyc.photo} />}
              why={f.photo.result?.why ?? ''}
              fix={
                f.photo.attempts >= 2
                  ? 'Your shop photo could not be verified. Please check the example and upload a clear photo.'
                  : undefined
              }
              steps={f.photo.result?.steps}
              attempt={f.photo.attempts}
              action={<RetryButton icon={<Camera className="h-5 w-5" />} label="Take Photo Again" onClick={() => setSheet('photo')} />}
            />
          }
          review={<InReview what="photo" />}
        />
      </Field>

      {/* ---- Shop Location ---- */}
      <Field label="Shop Location" required>
        <FieldBody
          status={f.location.status}
          empty={
            <div className="space-y-3 rounded-lg border-2 border-dashed border-border-strong bg-card p-4">
              <p className="text-sm text-foreground">📍 Stand inside your shop and tap the button.</p>
              <Button
                variant="outlinePrimary"
                fullWidth
                onClick={() => flow.addLocation({ ...GPS_FIX, source: 'gps' })}
              >
                <LocateFixed className="h-5 w-5" /> Current Location
              </Button>
              <HelpLink onClick={() => setSheet('location-help')}>Enter location manually</HelpLink>
            </div>
          }
          checking={<Checking art={<PinMapArt variant="captured" className="aspect-[4/3]" />} text="Finding your shop location…" />}
          accepted={
            <Accepted
              art={<PinMapArt variant="captured" className="aspect-[4/3]" />}
              title="Location Valid"
              text={SHOP_ADDRESS}
              extra={
                <div className="grid grid-cols-2 gap-2">
                  <Coord label="Latitude" value={kyc.location?.lat ?? ''} />
                  <Coord label="Longitude" value={kyc.location?.lng ?? ''} />
                </div>
              }
              editKind="update"
              onEdit={() => flow.addLocation({ ...GPS_FIX, source: 'gps' })}
              onDelete={() => setDeleting('location')}
            />
          }
          rejected={
            <AiAlert
              title="Invalid Shop Location"
              why={f.location.result?.why ?? ''}
              fix="Please check that your location is correctly captured and try again."
              steps={f.location.result?.steps}
              attempt={f.location.attempts}
              action={
                <RetryButton
                  icon={<LocateFixed className="h-5 w-5" />}
                  label="Update Location"
                  onClick={() => flow.addLocation({ ...GPS_FIX, source: 'gps' })}
                />
              }
            />
          }
          review={<InReview what="location" />}
        />
      </Field>

      {/* ---- Owner ID ---- */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Owner ID<span className="text-error"> *</span>
        </label>
        {(f.ownerId.status === 'empty' || f.ownerId.status === 'rejected') && (
          /* No "Document type" label above the picker: the placeholder already
             says Choose document, and the sheet it opens is titled. */
          <SelectField
            hideLabel
            label="Document type"
            placeholder="Choose document"
            value={idLabel}
            options={ID_TYPES.map((t) => t.label)}
            onChange={(label) => setIdType(ID_TYPES.find((t) => t.label === label)?.id ?? 'aadhaar')}
          />
        )}
        <FieldBody
          status={f.ownerId.status}
          empty={
            <EmptyUpload
              art={<IdCardArt scene="clear" type={idType} />}
              hint="All 4 corners visible. Name should be clear."
              button={`Upload ${idLabel}`}
              onClick={() => setSheet('ownerId')}
            />
          }
          checking={<Checking art={kyc.idScene && <IdCardArt scene={kyc.idScene} type={kyc.idType} />} text="AI is checking your document…" />}
          accepted={
            <Accepted
              art={kyc.idScene && <IdCardArt scene={kyc.idScene} type={kyc.idType} />}
              title={`${ID_TYPES.find((t) => t.id === kyc.idType)?.label ?? 'Document'} accepted`}
              text="Name is clear and readable."
              onEdit={() => setSheet('ownerId')}
              onDelete={() => setDeleting('ownerId')}
            />
          }
          rejected={
            <AiAlert
              title="Document not accepted"
              art={kyc.idScene && <IdCardArt scene={kyc.idScene} type={kyc.idType} />}
              why={f.ownerId.result?.why ?? ''}
              steps={f.ownerId.result?.steps}
              attempt={f.ownerId.attempts}
              action={<RetryButton icon={<Camera className="h-5 w-5" />} label="Take Photo Again" onClick={() => setSheet('ownerId')} />}
            />
          }
          review={<InReview what="document" />}
        />
      </div>

      {/* ---- optional, as before ---- */}
      <Field label="GST Certificate">
        <div className={`${controlClass} justify-between`}>
          <span className={gst ? 'text-foreground' : 'text-foreground-secondary'}>{gst ? 'uploaded.jpg' : 'Upload here (optional)'}</span>
          <button onClick={() => setGst((g) => !g)} className={cn('text-sm font-semibold', gst ? 'text-error' : 'text-primary')}>
            {gst ? 'Delete' : 'Upload'}
          </button>
        </div>
      </Field>

      {/* ---- sheets ---- */}
      <UploadSheet
        open={sheet === 'photo'}
        title="Shop Photo"
        good={<ShopPhotoArt scene="good" highlight="board" />}
        goodText="Shop and name board clearly visible"
        bad={(['blurry', 'board-hidden', 'dark'] as ShopScene[]).map((s) => ({
          art: <ShopPhotoArt scene={s} />,
          label: s === 'blurry' ? 'Blurry' : s === 'dark' ? 'Too dark' : 'Board hidden',
        }))}
        onClose={() => setSheet(null)}
        onCamera={() => {
          flow.addPhoto('good');
          setSheet(null);
        }}
        onGallery={() => {
          flow.addPhoto(GALLERY_BAD_PHOTOS[f.photo.attempts % GALLERY_BAD_PHOTOS.length]);
          setSheet(null);
        }}
      />
      <UploadSheet
        open={sheet === 'ownerId'}
        title={idLabel}
        good={<IdCardArt scene="clear" type={idType} />}
        goodText="All 4 corners, name clear"
        bad={(['blurry', 'cut'] as IdScene[]).map((s) => ({
          art: <IdCardArt scene={s} type={idType} />,
          label: s === 'blurry' ? 'Blurry' : 'Cut off',
        }))}
        onClose={() => setSheet(null)}
        onCamera={() => {
          flow.addOwnerId(idType, 'clear');
          setSheet(null);
        }}
        onGallery={() => {
          flow.addOwnerId(idType, GALLERY_BAD_IDS[f.ownerId.attempts % GALLERY_BAD_IDS.length]);
          setSheet(null);
        }}
      />
      <LocationHelpSheet
        open={sheet === 'location-help'}
        onClose={() => setSheet(null)}
        onGps={() => {
          flow.addLocation({ ...GPS_FIX, source: 'gps' });
          setSheet(null);
        }}
        onManual={(lat, lng) => {
          flow.addLocation({ lat, lng, source: 'manual' });
          setSheet(null);
        }}
      />
      <DeleteConfirm
        open={deleting !== null}
        what={deleting === 'photo' ? 'photo' : deleting === 'location' ? 'location' : 'document'}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) flow.clear(deleting);
          setDeleting(null);
        }}
      />
    </>
  );
}

/* ---- field states ---------------------------------------------------- */

function FieldBody({
  status,
  empty,
  checking,
  accepted,
  rejected,
  review,
}: Record<Exclude<FieldStatus, never>, ReactNode> & { status: FieldStatus }) {
  return <>{{ empty, checking, accepted, rejected, review }[status]}</>;
}

function EmptyUpload({ art, hint, button, onClick }: { art: ReactNode; hint: string; button: string; onClick: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-dashed border-border-strong bg-card">
      <div className="flex items-center gap-3 p-3">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-md border border-success-border">
          {art}
          <span className="absolute right-0.5 top-0.5">
            <Mark ok size="sm" />
          </span>
        </div>
        <p className="text-sm leading-snug text-foreground">{hint}</p>
      </div>
      <div className="px-3 pb-3">
        <Button variant="outlinePrimary" fullWidth onClick={onClick}>
          <Camera className="h-4 w-4" /> {button}
        </Button>
      </div>
    </div>
  );
}

function Checking({ art, text }: { art: ReactNode; text: string }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-primary bg-card">
      <div className="relative">
        <div className="opacity-60">{art}</div>
        <div className="absolute inset-0 grid place-items-center">
          <span className="size-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
        </div>
      </div>
      <p className="px-4 py-3 text-center text-sm font-semibold text-primary">{text}</p>
    </div>
  );
}

function Accepted({
  art,
  title,
  text,
  extra,
  editKind = 'edit',
  onEdit,
  onDelete,
}: {
  art: ReactNode;
  title: string;
  text: string;
  extra?: ReactNode;
  editKind?: 'edit' | 'update';
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-success-border bg-card shadow-sm">
      <div className="flex items-center gap-3 bg-success-subtle px-4 py-3">
        <Mark ok />
        <span className="text-sm font-semibold text-success-foreground">{title}</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="w-24 shrink-0 overflow-hidden rounded-md border border-border">{art}</div>
          <p className="text-sm leading-snug text-foreground">{text}</p>
        </div>
        {extra}
        <div className="flex gap-3">
          <ActionButton kind={editKind} label={editKind === 'update' ? 'Update Location' : 'Edit'} onClick={onEdit} />
          <ActionButton kind="delete" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

function InReview({ what }: { what: string }) {
  return (
    <div className="rounded-lg border-2 border-warning-border bg-warning-subtle p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
        <Clock className="h-5 w-5" /> Manual review
      </div>
      <p className="mt-1 text-sm text-foreground">
        AI could not check your {what} after {MAX_ATTEMPTS} attempts. Our team will check it. You can continue.
      </p>
    </div>
  );
}

function RetryButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <Button fullWidth onClick={onClick}>
      {icon} {label}
    </Button>
  );
}

function HelpLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-primary">
      <HelpCircle className="h-4 w-4" /> {children}
    </button>
  );
}

function Coord({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background-subtle px-3 py-2">
      <div className="text-xs font-medium text-foreground-secondary">{label}</div>
      <div className="text-base font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

/* ---- sheets ---------------------------------------------------------- */

function UploadSheet({
  open,
  title,
  good,
  goodText,
  bad,
  onClose,
  onCamera,
  onGallery,
}: {
  open: boolean;
  title: string;
  good: ReactNode;
  goodText: string;
  bad: { art: ReactNode; label: string }[];
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      icon={<Camera className="h-5 w-5" />}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-16 w-full flex-col gap-1" onClick={onCamera}>
            <Camera className="h-6 w-6" /> Take Photo
          </Button>
          <Button variant="secondary" className="h-16 w-full flex-col gap-1" onClick={onGallery}>
            <ImageIcon className="h-6 w-6" /> Gallery
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Verdict ok />
          <span className="text-sm font-semibold">Like this</span>
        </div>
        <figure className="overflow-hidden rounded-lg border-2 border-success-border">
          {good}
          <figcaption className="px-3 py-2 text-sm font-semibold text-success-foreground">✓ {goodText}</figcaption>
        </figure>
        <div className="flex items-center gap-2 pt-1">
          <Verdict ok={false} />
          <span className="text-sm font-semibold">Not like this</span>
        </div>
        <div className={cn('grid gap-2', bad.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {bad.map((b) => (
            <figure key={b.label} className="overflow-hidden rounded-lg border-2 border-error-border">
              <div className="relative">
                {b.art}
                <span className="absolute right-1 top-1">
                  <Mark ok={false} size="sm" />
                </span>
              </div>
              <figcaption className="py-1 text-center text-sm font-bold text-error-foreground">{b.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function LocationHelpSheet({
  open,
  onClose,
  onGps,
  onManual,
}: {
  open: boolean;
  onClose: () => void;
  onGps: () => void;
  onManual: (lat: string, lng: string) => void;
}) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Shop Location" icon={<LocateFixed className="h-5 w-5" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((ok) => (
            <figure key={String(ok)} className={cn('overflow-hidden rounded-lg border-2', ok ? 'border-success-border' : 'border-error-border')}>
              <div className="relative">
                <PinMapArt variant={ok ? 'on-shop' : 'away'} className="aspect-[5/4]" />
                <span className="absolute right-1 top-1">
                  <Mark ok={ok} size="sm" />
                </span>
              </div>
              <figcaption className={cn('py-1.5 text-center text-sm font-bold', ok ? 'text-success-foreground' : 'text-error-foreground')}>
                {ok ? '✓ Pin on your shop' : '✕ Pin away from shop'}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-sm text-foreground-secondary">Please select the location where your shop is located.</p>
        <Button variant="outlinePrimary" fullWidth onClick={onGps}>
          <LocateFixed className="h-5 w-5" /> Current Location
        </Button>

        <div className="space-y-3 rounded-lg border border-border p-3">
          {/* Just the heading. The two fields are labelled and their
              placeholders already show the form a coordinate takes. */}
          <div className="text-sm font-semibold text-foreground">Enter manually</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="17.3850"
                className={`${controlClass} text-sm placeholder:text-foreground-secondary`}
              />
            </Field>
            <Field label="Longitude">
              <input
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="78.4867"
                className={`${controlClass} text-sm placeholder:text-foreground-secondary`}
              />
            </Field>
          </div>
          <Button variant="soft" fullWidth onClick={() => onManual(lat, lng)}>
            Save Location
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
