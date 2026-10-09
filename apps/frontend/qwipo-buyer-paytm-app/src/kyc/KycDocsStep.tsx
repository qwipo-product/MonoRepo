import { useEffect, useState, type ReactNode } from 'react';
import { Camera, Clock, Image as ImageIcon } from 'lucide-react';
import { Button, Sheet, cn } from '@mockups/ui';
import { Field, controlClass } from '../components/formbits';
import { IdCardArt, ShopPhotoArt } from './KycArt';
import { ActionButton, AiAlert, DeleteConfirm, Mark, Verdict } from './kycBits';
import {
  GALLERY_BAD_IDS,
  GALLERY_BAD_PHOTOS,
  MAX_ATTEMPTS,
  SHOP_PHOTOS,
  type Criterion,
  type IdScene,
  type ShopScene,
} from './kycData';
import type { FieldStatus, KycFlow } from './useKycFlow';

/* The checked fields of Complete KYC. They no longer sit together on one
   step — each belongs to the step that asks the question:

     customer   Customer Photo ID *   Upload → checking → ✓ or ✕
     documents  Shop Photo outside *  Upload → checking → ✓ or ✕
                Shop Photo inside  *  Upload → checking → ✓ or ✕
                GST and Shop Registration certificates (optional)

   The behaviour of a field is the same wherever it is rendered: ✓ shows a
   one-line reason and [Edit] [Delete]; ✕ shows the problem, numbered steps to
   fix it, "Attempt n of 5" and one retry; the 5th ✕ sends it to manual review
   (App shows that screen). */

/** Which step is being drawn. Step 2's location is picked on a map, so it
 *  has no AI-checked field here. */
export type KycSection = 'customer' | 'documents';

const CHECK_MS = 1600;

export function KycDocsStep({
  flow,
  section,
  onManualReview,
}: {
  flow: KycFlow;
  section: KycSection;
  /** The 5th rejection on any field. */
  onManualReview: () => void;
}) {
  const { kyc } = flow;
  const [sheet, setSheet] = useState<Criterion | 'location-help' | null>(null);
  const [deleting, setDeleting] = useState<Criterion | null>(null);
  /* The buyer no longer says which ID it is — the back end works that out —
     but the demo art still needs something to draw, so it stays an Aadhaar. */
  const idType = kyc.idType ?? 'aadhaar';
  const [gst, setGst] = useState(false);
  const [shopReg, setShopReg] = useState(false);

  // AI answers a moment after something is added.
  const WATCHED: Criterion[] = ['photo', 'photoInside', 'location', 'ownerId'];
  const statuses = WATCHED.map((c) => kyc.fields[c].status).join('|');
  useEffect(() => {
    const checking = WATCHED.find((c) => kyc.fields[c].status === 'checking');
    if (!checking) return;
    const t = setTimeout(() => {
      if (flow.resolve(checking) === 'review') onManualReview();
    }, CHECK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);

  const f = kyc.fields;

  return (
    <>
      {/* ---- Shop Photo · outside (step 3) ---- */}
      {section === 'documents' && (
      <Field label="Shop Photo · Outside" required>
        <FieldBody
          status={f.photo.status}
          empty={
            <EmptyUpload
              art={<ShopPhotoArt scene="good" highlight="board" />}
              hint="Photo of your shop from the front. Name board should be visible."
              button="Upload"
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
      )}

      {/* ---- Shop Photo · inside (step 3) ---- */}
      {section === 'documents' && (
      <Field label="Shop Photo · Inside" required>
        <FieldBody
          status={f.photoInside.status}
          empty={
            <EmptyUpload
              art={<ShopPhotoArt scene="good" highlight="whole" />}
              hint="Photo from inside your shop. Shelves and stock should be visible."
              button="Upload"
              onClick={() => setSheet('photoInside')}
            />
          }
          checking={<Checking art={kyc.photoInside && <ShopPhotoArt scene={kyc.photoInside} />} text="AI is checking your photo…" />}
          accepted={
            <Accepted
              art={kyc.photoInside && <ShopPhotoArt scene={kyc.photoInside} />}
              title="Photo accepted"
              text="Inside of the shop is clearly visible."
              onEdit={() => setSheet('photoInside')}
              onDelete={() => setDeleting('photoInside')}
            />
          }
          rejected={
            <AiAlert
              title="Photo not accepted"
              art={kyc.photoInside && <ShopPhotoArt scene={kyc.photoInside} />}
              why={f.photoInside.result?.why ?? ''}
              steps={f.photoInside.result?.steps}
              attempt={f.photoInside.attempts}
              action={<RetryButton icon={<Camera className="h-5 w-5" />} label="Take Photo Again" onClick={() => setSheet('photoInside')} />}
            />
          }
          review={<InReview what="photo" />}
        />
      </Field>
      )}

      {/* ---- Customer Photo ID (step 1) ---- */}
      {section === 'customer' && (
      <div className="space-y-2">
        {/* No document-type picker: the buyer uploads whichever photo ID they
            have and the back end works out what it is. Asking them to classify
            it first was a question only the system needed answered. */}
        <label className="block text-sm font-medium text-foreground">
          Customer Photo ID<span className="text-error"> *</span>
        </label>
        <FieldBody
          status={f.ownerId.status}
          empty={
            <EmptyUpload
              art={<IdCardArt scene="clear" type={idType} />}
              hint="Aadhaar, PAN, Voter ID or Driving Licence. All 4 corners visible, name clear."
              button="Upload"
              onClick={() => setSheet('ownerId')}
            />
          }
          checking={<Checking art={kyc.idScene && <IdCardArt scene={kyc.idScene} type={kyc.idType} />} text="AI is checking your document…" />}
          accepted={
            <Accepted
              art={kyc.idScene && <IdCardArt scene={kyc.idScene} type={kyc.idType} />}
              title="Photo ID accepted"
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
      )}

      {/* ---- the two certificates: wanted, not required (step 3) ---- */}
      {section === 'documents' && (
        <>
          <OptionalDoc label="GST Certificate" on={gst} onToggle={() => setGst((g) => !g)} />
          <OptionalDoc label="Shop Registration Certificate" on={shopReg} onToggle={() => setShopReg((g) => !g)} />
        </>
      )}

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
        open={sheet === 'photoInside'}
        title="Shop Photo · Inside"
        good={<ShopPhotoArt scene="good" highlight="whole" />}
        goodText="Shelves and stock clearly visible"
        bad={(['blurry', 'dark'] as ShopScene[]).map((sc) => ({
          art: <ShopPhotoArt scene={sc} />,
          label: sc === 'blurry' ? 'Blurry' : 'Too dark',
        }))}
        onClose={() => setSheet(null)}
        onCamera={() => {
          flow.addPhotoInside('good');
          setSheet(null);
        }}
        onGallery={() => {
          flow.addPhotoInside(GALLERY_BAD_PHOTOS[f.photoInside.attempts % GALLERY_BAD_PHOTOS.length]);
          setSheet(null);
        }}
      />
      <UploadSheet
        open={sheet === 'ownerId'}
        title="Photo ID"
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
      <DeleteConfirm
        open={deleting !== null}
        what={deleting === 'photo' || deleting === 'photoInside' ? 'photo' : deleting === 'location' ? 'location' : 'document'}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) flow.clear(deleting);
          setDeleting(null);
        }}
      />
    </>
  );
}

/** A certificate KYC would like but doesn't insist on. */
function OptionalDoc({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <Field label={label}>
      <div className={`${controlClass} justify-between`}>
        <span className={on ? 'text-foreground' : 'text-foreground-secondary'}>
          {on ? 'uploaded.jpg' : 'Upload here (optional)'}
        </span>
        <button onClick={onToggle} className={cn('text-sm font-semibold', on ? 'text-error' : 'text-primary')}>
          {on ? 'Delete' : 'Upload'}
        </button>
      </div>
    </Field>
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
