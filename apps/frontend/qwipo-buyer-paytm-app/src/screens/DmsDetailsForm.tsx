import { useState, type ReactNode } from 'react';
import { Check, FileText } from 'lucide-react';
import { SegmentedControl, cn } from '@mockups/ui';
import { Field, SelectField, controlClass } from '../components/formbits';
import { IdCardArt, ShopInsideArt, ShopPhotoArt } from '../kyc/KycArt';
import { EmptyUpload, UploadSheet } from '../kyc/KycDocsStep';
import { ActionButton, DeleteConfirm, Mark } from '../kyc/kycBits';
import type { IdType } from '../kyc/kycData';
import { emailOk, type CollectedDetails } from '../data/dmsPartners';

/* The details a company needs that Qwipo's KYC doesn't hold (HUL). The shop
   profile is pre-filled above this; the buyer adds the rest here, in three
   cards:

     Contact             Email ID *, WhatsApp OTP * (Yes / No, no default)
     Shop photos         Board *, Inside *            Take Photo / Gallery
     Business document   Type *, ID *, Image *        Take Photo / Gallery / PDF

   Request Registration waits for all seven and the consent tick. */

/** The business documents HUL accepts. `placeholder` shows the number's
    format where it has a well-known one; `art` and `title` pick the drawing
    that stands in for the uploaded page. */
const DOCUMENTS: { label: string; placeholder: string; art: IdType; title?: string }[] = [
  { label: 'Udyam Aadhaar', placeholder: 'e.g. UDYAM-TS-02-0012345', art: 'udyam' },
  { label: 'GST', placeholder: 'e.g. 36ABCDE1234F1Z5', art: 'shopReg', title: 'GST CERTIFICATE' },
  { label: 'Udyog Aadhaar', placeholder: 'e.g. TS02E0012345', art: 'udyam', title: 'UDYOG AADHAAR' },
  { label: 'FSSAI License', placeholder: 'e.g. 13624010000123', art: 'fssai' },
  { label: 'Shop & Establishment Registration', placeholder: 'Registration number', art: 'shopReg' },
  { label: 'Company PAN Card', placeholder: 'e.g. AABCL1234D', art: 'pan' },
  { label: 'Trade License', placeholder: 'License number', art: 'shopReg', title: 'TRADE LICENSE' },
  { label: 'Gram Panchayat Certificate', placeholder: 'Certificate number', art: 'shopReg', title: 'GRAM PANCHAYAT' },
  { label: 'Permission from Local / Municipal Body', placeholder: 'Permission number', art: 'shopReg', title: 'MUNICIPAL PERMIT' },
  { label: 'Health & Trade License', placeholder: 'License number', art: 'shopReg', title: 'HEALTH LICENSE' },
  { label: 'Small Scale Industry License', placeholder: 'Registration number', art: 'shopReg', title: 'SSI LICENSE' },
  { label: 'Aadhaar Card', placeholder: 'e.g. 1234 5678 9012', art: 'aadhaar' },
];

type Upload = 'board' | 'inside' | 'doc';

export function DmsDetailsForm({
  company,
  mobile,
  value,
  onChange,
}: {
  /** Short name used in sentences — "Can HUL send OTPs…". */
  company: string;
  /** The pre-filled mobile, shown in the WhatsApp question. */
  mobile: string;
  value: CollectedDetails;
  onChange: (d: CollectedDetails) => void;
}) {
  const [sheet, setSheet] = useState<Upload | null>(null);
  const [removing, setRemoving] = useState<Upload | null>(null);
  // Flag a bad email once the buyer has left the field, not while they type.
  const [emailTouched, setEmailTouched] = useState(false);

  const set = (patch: Partial<CollectedDetails>) => onChange({ ...value, ...patch });
  const doc = DOCUMENTS.find((d) => d.label === value.docType);
  const emailError = emailTouched && value.email.trim() !== '' && !emailOk(value.email);
  const docArt = doc && <IdCardArt type={doc.art} title={doc.title} />;
  const add = (patch: Partial<CollectedDetails>) => {
    set(patch);
    setSheet(null);
  };

  return (
    <>
      <Section title="Contact" done={emailOk(value.email) && value.whatsappOtp !== ''}>
        {/* The error sits beside the label, not under the field: shown under
            it, it appeared on blur — the moment the buyer pressed Yes / No —
            pushed that control down mid-press, and the tap was lost. */}
        <div id="dms-email" className="scroll-mt-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="dms-email-input" className="text-sm font-medium text-foreground">
              Email ID<span className="text-error"> *</span>
            </label>
            {emailError && <span className="text-xs text-error-foreground">Check the email format</span>}
          </div>
          <input
            id="dms-email-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            placeholder="e.g. rajesh.litbox@gmail.com"
            className={cn(controlClass, 'placeholder:text-foreground-secondary', emailError && 'border-error')}
          />
        </div>
        <div id="dms-whatsapp" className="scroll-mt-4"><Field label="WhatsApp OTP" required>
          <p className="-mt-1 text-xs leading-snug text-foreground-secondary">
            Can {company} send OTPs to {mobile} on WhatsApp?
          </p>
          {/* No default — the buyer has to answer, so neither side starts selected. */}
          <SegmentedControl<CollectedDetails['whatsappOtp']>
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={value.whatsappOtp}
            onChange={(v) => set({ whatsappOtp: v })}
          />
        </Field></div>
      </Section>

      <Section title="Shop photos" done={value.boardPhoto && value.insidePhoto}>
        <div id="dms-board" className="scroll-mt-4"><Field label="Shop Image – Board" required>
          {value.boardPhoto ? (
            <Added
              art={<ShopPhotoArt scene="good" />}
              title="Board photo added"
              onReplace={() => setSheet('board')}
              onRemove={() => setRemoving('board')}
            />
          ) : (
            <EmptyUpload
              art={<ShopPhotoArt scene="good" highlight="board" />}
              hint="Front of your shop. The name board should be readable."
              button="Add Board Photo"
              onClick={() => setSheet('board')}
            />
          )}
        </Field></div>
        <div id="dms-inside" className="scroll-mt-4"><Field label="Shop Image – Inside" required>
          {value.insidePhoto ? (
            <Added
              art={<ShopInsideArt />}
              title="Inside photo added"
              onReplace={() => setSheet('inside')}
              onRemove={() => setRemoving('inside')}
            />
          ) : (
            <EmptyUpload
              art={<ShopInsideArt highlight />}
              hint="Inside your shop, showing the racks and the stock on them."
              button="Add Inside Photo"
              onClick={() => setSheet('inside')}
            />
          )}
        </Field></div>
      </Section>

      <Section title="Business document" done={!!doc && value.docId.trim() !== '' && value.docFile !== ''}>
        <div id="dms-doc-type" className="scroll-mt-4"><SelectField
          label="Document Type"
          required
          placeholder="Choose document"
          value={value.docType}
          options={DOCUMENTS.map((d) => d.label)}
          // Keeps the ID and image already added — clearing them on a change
          // of type made uploads vanish without a word. The buyer edits them.
          onChange={(t) => set({ docType: t })}
        /></div>
        <div id="dms-doc-id" className="scroll-mt-4"><Field label="Document ID" required>
          <input
            value={value.docId}
            onChange={(e) => set({ docId: e.target.value })}
            disabled={!doc}
            autoCapitalize="characters"
            placeholder={doc?.placeholder ?? 'Choose the document first'}
            className={cn(controlClass, 'placeholder:text-foreground-secondary disabled:bg-muted')}
          />
        </Field></div>
        <div id="dms-doc-file" className="scroll-mt-4"><Field label="Document Image" required>
          {!doc ? (
            <p className="rounded-lg border-2 border-dashed border-border-strong bg-card p-3 text-sm text-foreground-secondary">
              Choose the document type, then add a photo or PDF of it.
            </p>
          ) : value.docFile === 'pdf' ? (
            <Added
              art={
                <div className="grid aspect-[4/3] place-items-center bg-muted text-foreground-secondary">
                  <FileText className="h-7 w-7" />
                </div>
              }
              title={`${doc.label.replace(/[^A-Za-z0-9]+/g, '_').replace(/_$/, '')}.pdf`}
              text="PDF · 412 KB"
              onReplace={() => setSheet('doc')}
              onRemove={() => setRemoving('doc')}
            />
          ) : value.docFile === 'photo' ? (
            <Added
              art={docArt}
              title="Document photo added"
              onReplace={() => setSheet('doc')}
              onRemove={() => setRemoving('doc')}
            />
          ) : (
            <EmptyUpload
              art={docArt}
              hint="The full page, with the number and your shop's name readable."
              button="Upload Document"
              onClick={() => setSheet('doc')}
            />
          )}
        </Field></div>
      </Section>

      {/* ---- sheets ---- */}
      <UploadSheet
        open={sheet === 'board'}
        title="Shop Image – Board"
        good={<ShopPhotoArt scene="good" highlight="board" />}
        goodText="Name board clearly readable"
        bad={[
          { art: <ShopPhotoArt scene="blurry" />, label: 'Blurry' },
          { art: <ShopPhotoArt scene="board-hidden" />, label: 'Board hidden' },
          { art: <ShopPhotoArt scene="dark" />, label: 'Too dark' },
        ]}
        onClose={() => setSheet(null)}
        onCamera={() => add({ boardPhoto: true })}
        onGallery={() => add({ boardPhoto: true })}
      />
      <UploadSheet
        open={sheet === 'inside'}
        title="Shop Image – Inside"
        good={<ShopInsideArt highlight />}
        goodText="Racks and stock clearly visible"
        bad={[
          { art: <ShopInsideArt scene="blurry" />, label: 'Blurry' },
          { art: <ShopInsideArt scene="dark" />, label: 'Too dark' },
        ]}
        onClose={() => setSheet(null)}
        onCamera={() => add({ insidePhoto: true })}
        onGallery={() => add({ insidePhoto: true })}
      />
      {doc && (
        <UploadSheet
          open={sheet === 'doc'}
          title={doc.label}
          good={docArt}
          goodText="Full page, number readable"
          bad={[
            { art: <IdCardArt scene="blurry" type={doc.art} title={doc.title} />, label: 'Blurry' },
            { art: <IdCardArt scene="cut" type={doc.art} title={doc.title} />, label: 'Cut off' },
          ]}
          onClose={() => setSheet(null)}
          onCamera={() => add({ docFile: 'photo' })}
          onGallery={() => add({ docFile: 'photo' })}
          onPdf={() => add({ docFile: 'pdf' })}
        />
      )}
      <DeleteConfirm
        open={removing !== null}
        what={removing === 'doc' ? 'document' : 'photo'}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          set(removing === 'board' ? { boardPhoto: false } : removing === 'inside' ? { insidePhoto: false } : { docFile: '' });
          setRemoving(null);
        }}
      />
    </>
  );
}

/** One card of fields, headed like the pre-filled box above it. */
function Section({ title, done, children }: { title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {done ? (
          <span className="flex items-center gap-1 text-xs font-medium text-success-foreground">
            <Check className="h-3.5 w-3.5" /> Done
          </span>
        ) : (
          <span className="text-xs text-foreground-secondary">Required</span>
        )}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

/** A photo or file that has been added — what it is, Replace and Remove. */
function Added({
  art,
  title,
  text,
  onReplace,
  onRemove,
}: {
  art: ReactNode;
  title: string;
  text?: string;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-success-border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="relative w-20 shrink-0 overflow-hidden rounded-md border border-border">
          {art}
          <span className="absolute right-0.5 top-0.5">
            <Mark ok size="sm" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {text && <p className="mt-0.5 text-xs text-foreground-secondary">{text}</p>}
        </div>
      </div>
      <div className="flex gap-3">
        <ActionButton kind="update" label="Replace" onClick={onReplace} />
        <ActionButton kind="delete" label="Remove" onClick={onRemove} />
      </div>
    </div>
  );
}
