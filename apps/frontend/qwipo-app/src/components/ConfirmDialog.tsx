/* Centered confirmation dialog (destructive actions). DS §6.7: AlertDialog,
   90% width on mobile. */
export default function ConfirmDialog({
  title,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onClose,
}: {
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/50 p-6" onClick={onClose} role="presentation">
      <div className="w-full rounded-xl bg-card p-5 text-center shadow-xl" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold">{title}</div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium">{cancelLabel}</button>
          <button onClick={onConfirm} className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
