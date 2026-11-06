// Port of `app-resolution-proposed-dialog` — "Choose Your Resolution" (spec 06 §6.2).
// Opened with width 900px / maxWidth 95vw. Close icon (and Esc/backdrop) → no result.
// Propose → { title: <code>, amount: "<refundAmount>" for REFUND else null }.
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Swal from 'sweetalert2';
import type { IssueDetails } from '../../api/services/issues.service';
import './ResolutionProposedDialog.css';

export interface ResolutionResult { title: string; amount: string | null }

interface Props {
  open: boolean;
  data: { issueId: any; issue: IssueDetails; onRejectResolution?: () => void };
  onClose: (result?: ResolutionResult) => void;
}

interface ResolutionOption { code: string; icon: string; title: string; subtitle: string; features: string[]; amount: string }

/** Internal option details; `amount` is defined but never rendered (the amount slot stays empty). */
export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { code: 'REFUND', icon: 'attach_money', title: 'Refund', subtitle: 'Complete refund of your order amount', amount: '2,450', features: ['Full refund processed within 3-5 business days', 'Amount credited to original payment method', 'No questions asked policy'] },
  { code: 'RETURN', icon: 'assignment_return', title: 'Return', subtitle: 'Return product and get full refund', amount: '2,450', features: ['Free return pickup from your location', 'Refund processed after product verification', 'Estimated 7-10 business days'] },
  { code: 'REPLACEMENT', icon: 'swap_horiz', title: 'Replacement', subtitle: 'Get a new product delivered', amount: 'Free', features: ['New product shipped within 2-3 business days', 'Return old product during delivery', 'No additional charges'] },
  { code: 'CANCEL', icon: 'cancel', title: 'Cancel', subtitle: 'Cancel the order completely', amount: '2,450', features: ['Order cancelled immediately', 'Full refund processed', 'No delivery charges'] },
  { code: 'NO_ACTION', icon: 'block', title: 'No Action', subtitle: 'No action required from our side', amount: 'Free', features: ['Issue resolved without intervention', 'No further action needed', 'Case closed automatically'] },
  { code: 'NOW_VISIBLE', icon: 'visibility', title: 'Now Visible', subtitle: 'Product is now visible/available', amount: 'Free', features: ['Product visibility restored', 'Available for purchase', 'Issue resolved'] },
  { code: 'RECONCILED', icon: 'handshake', title: 'Reconciled', subtitle: 'Issue resolved through discussion', amount: 'Free', features: ['Mutual agreement reached', 'No further action required', 'Issue marked as resolved'] },
  { code: 'NOT_RECONCILED', icon: 'thumb_down', title: 'Not Reconciled', subtitle: 'Issue could not be resolved', amount: 'Free', features: ['No agreement reached', 'Escalation required', 'Further review needed'] },
];

function ResolutionContent({ data, onClose }: Omit<Props, 'open'>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [amountText, setAmountText] = useState('');

  const selectOption = (code: string) => {
    setSelected(code);
    if (code !== 'REFUND') {
      setRefundAmount(0);
      setAmountText('');
    }
  };

  const onAmountInput = (v: string) => {
    setAmountText(v);
    const n = parseFloat(v);
    setRefundAmount(isNaN(n) ? 0 : n);
  };

  const accept = () => {
    if (!selected) {
      void Swal.fire({ icon: 'warning', title: 'Selection Required', text: 'Please select a resolution option', confirmButtonColor: '#3b82f6' });
      return;
    }
    if (selected === 'REFUND' && refundAmount <= 0) {
      void Swal.fire({ icon: 'error', title: 'Amount Required', text: 'Please enter refund amount', confirmButtonColor: '#3b82f6' });
      return;
    }
    onClose({ title: selected, amount: selected === 'REFUND' ? `${refundAmount}` : null });
  };

  // Dead in the original template (no button renders it); kept for parity.
  const rejectResolution = () => {
    data.onRejectResolution?.();
    onClose();
  };
  void rejectResolution;

  return (
    <div className="resolution-dialog">
      <div className="resolution-header">
        <h2>Choose Your Resolution</h2>
        <IconButton aria-label="close" onClick={() => onClose()} size="small">
          <span className="material-icons">close</span>
        </IconButton>
      </div>
      <p className="resolution-subtitle">Select the resolution option that works best for you. Our team has prepared multiple options to resolve your issue.</p>

      <div className="options-grid">
        {RESOLUTION_OPTIONS.map((o) => (
          <div key={o.code} className={`option-card${selected === o.code ? ' selected' : ''}`} onClick={() => selectOption(o.code)}>
            <div className="option-top">
              <div className="option-icon">
                <span className="material-icons">{o.icon}</span>
              </div>
              <div className="option-text">
                <div className="option-title">{o.title}</div>
                <div className="option-subtitle">{o.subtitle}</div>
              </div>
              <div className="option-amount" />
            </div>
            <ul className="option-features">
              {o.features.map((f) => (
                <li key={f}>
                  <span className="material-icons">check</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selected === 'REFUND' && (
        <div className="refund-section">
          <div className="refund-head">
            <div className="refund-icon">
              <span className="material-icons">attach_money</span>
            </div>
            <div>
              <div className="refund-title">Enter Refund Amount</div>
              <div className="refund-subtitle">Specify the amount you'd like to refund to the customer</div>
            </div>
          </div>
          <div className="amount-input">
            <span className="currency">₹</span>
            <input type="number" min={0} step={0.01} placeholder="0.00" value={amountText} onChange={(e) => onAmountInput(e.target.value)} />
          </div>
        </div>
      )}

      {!selected && <p className="select-prompt">Please select a resolution option above to proceed</p>}

      <div className="resolution-footer">
        <button type="button" className="propose-button" disabled={!selected} onClick={accept}>
          <span className="material-icons">check_circle</span>
          Propose Resolution
        </button>
      </div>
    </div>
  );
}

export default function ResolutionProposedDialog({ open, data, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      disableEnforceFocus
      PaperProps={{ className: 'resolution-options-dialog', sx: { width: '900px', maxWidth: '95vw', borderRadius: '12px' } }}
    >
      {open && <ResolutionContent data={data} onClose={onClose} />}
    </Dialog>
  );
}
