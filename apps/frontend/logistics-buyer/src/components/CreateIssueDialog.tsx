// Port of `app-create-issue-dialog` (chunk-7V5YUPGV) — "Create New Issue". Spec 00 §14.4 / spec 06 §7.
// Reachability (as-built): nothing in production opens this dialog (Order/Trip Details define createIssue()
// but no template button calls it). It is kept importable so a screen can wire a "Raise Issue" button:
//   <CreateIssueDialog open={open} onClose={(r) => setOpen(false)} data={{ orderId, logisticsOrderId, providerId, transactionId, fulfillmentId, contextType: 'order' }} />
// Extends the permission base with page id buyer_orders and DOES call super.ngOnInit() → buyerInfo = current user.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Dialog from '@mui/material/Dialog';
import Swal from 'sweetalert2';
import { IssueCategories, type IssueCategoryDef } from '../types/enums';
import { issueService } from '../api/services/issues.service';
import { usePagePermissions } from '../hooks/usePagePermissions';
import './CreateIssueDialog.css';

export interface CreateIssueDialogData {
  orderId?: string | null;
  logisticsOrderId?: string | null;
  providerId?: string | null;
  transactionId?: string | null;
  fulfillmentId?: string | null;
  /** Always "order" from the callers; unused. */
  contextType?: string;
  /** Optional; unused by the dialog. */
  reference?: any;
}

export interface CreateIssueDialogResult {
  issueData: Record<string, any>;
  navigate: true;
}

interface Props {
  open: boolean;
  /** Called with no result on X / Cancel / Esc / backdrop; with the result after the success alert's OK. */
  onClose: (result?: CreateIssueDialogResult) => void;
  data: CreateIssueDialogData;
}

/** Unique categories sorted alphabetically: AGENT, BUSINESS, FULFILLMENT, ITEM, ORDER, PAYMENT, POLICY BREACH, TECHNICAL. */
const CATEGORIES = Array.from(new Set(IssueCategories.map((c) => c.category))).sort();

function CreateIssueForm({ data, onClose }: Omit<Props, 'open'>) {
  const navigate = useNavigate();
  const { buyerInfo } = usePagePermissions('buyer_orders');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [selected, setSelected] = useState<IssueCategoryDef | null>(null);

  const subcategories = useMemo(() => (category ? IssueCategories.filter((c) => c.category === category).map((c) => c.subcategory) : []), [category]);

  const onCategoryChange = (v: string) => {
    setCategory(v);
    setSubcategory('');
    setSelected(null);
  };
  const onSubcategoryChange = (v: string) => {
    setSubcategory(v);
    setSelected(IssueCategories.find((c) => c.category === category && c.subcategory === v) || null);
  };

  // Non-empty without trimming (whitespace-only passes) + a matching ONDC entry.
  const isFormValid = !!(category && subcategory && shortDescription && longDescription && selected);

  const createIssue = async () => {
    if (!isFormValid || !selected) return;
    try {
      const user: any = buyerInfo || {};
      const issueData = {
        logisticsOrderId: data.logisticsOrderId || '',
        orderId: data.orderId || '',
        category,
        subcategory,
        descriptorCode: selected.enumCode,
        descriptorLongDesc: longDescription,
        descriptorShortDesc: subcategory || shortDescription, // as-built: the typed short description is never sent
        providerId: data.providerId || '',
        transactionId: data.transactionId || '',
        fulfillmentId: data.fulfillmentId || '',
        buyerInfo: { id: user.id, phone: user.mobile, email: user.email, name: user.name },
      };
      // No loading state and no double-submit guard (as-built).
      const result = await issueService.createIssue(issueData);
      if (result && result.success !== false) {
        const r = await Swal.fire({
          title: 'Success', text: 'Issue created successfully!', icon: 'success', showConfirmButton: true, confirmButtonColor: '#28a745',
          allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: true,
        });
        if (r.isConfirmed) {
          onClose({ issueData: { ...issueData, enumCode: selected.enumCode }, navigate: true });
          navigate('/issues');
        }
      } else {
        await Swal.fire({
          title: 'Error', text: result?.error?.message || 'Failed to create issue. Please try again.', icon: 'error', confirmButtonColor: '#dc3545',
          allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: true,
        });
      }
    } catch (e) {
      console.error('Error creating issue:', e);
    }
  };

  return (
    <div className="dialog-wrapper">
      <div className="dialog-header">
        <h2 className="dialog-title">Create New Issue</h2>
        <button type="button" className="close-btn" onClick={() => onClose()} aria-label="Close">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label htmlFor="category">
            Issue Category <span className="required">*</span>
          </label>
          <select id="category" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="" disabled>
              Select issue category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subcategory">
            Issue Subcategory <span className="required">*</span>
          </label>
          <select id="subcategory" value={subcategory} onChange={(e) => onSubcategoryChange(e.target.value)} disabled={!category || subcategories.length === 0}>
            <option value="" disabled>
              Select issue subcategory
            </option>
            {subcategories.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {selected && (
            <div className="selection-confirmation">
              <i className="fas fa-check-circle" /> Selected: {selected.category} → {selected.subcategory} ({selected.enumCode})
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="shortDescription">
            Short Description <span className="required">*</span>
          </label>
          <input
            id="shortDescription"
            type="text"
            maxLength={100}
            placeholder="Brief summary of the issue (max 100 characters)"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
          <div className="char-counter">{shortDescription.length}/100 characters</div>
        </div>

        <div className="form-group">
          <label htmlFor="longDescription">
            Detailed Description <span className="required">*</span>
          </label>
          <textarea
            id="longDescription"
            rows={4}
            maxLength={500}
            placeholder="Provide detailed information about the issue, including steps to reproduce, expected vs actual behavior, etc. (max 500 characters)"
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
          />
          <div className="char-counter">{longDescription.length}/500 characters</div>
        </div>
      </div>

      <div className="dialog-actions">
        <button type="button" className="cancel-btn" onClick={() => onClose()}>
          Cancel
        </button>
        <button type="button" className="create-btn" disabled={!isFormValid} onClick={() => void createIssue()}>
          <i className="fas fa-file-alt" /> Create Issue
        </button>
      </div>
    </div>
  );
}

export default function CreateIssueDialog({ open, onClose, data }: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      disableAutoFocus
      disableEnforceFocus
      PaperProps={{ className: 'issue-dialog-container', sx: { width: '600px', maxWidth: '95vw', borderRadius: '8px', overflow: 'hidden', m: 2 } }}
    >
      {open && <CreateIssueForm data={data || {}} onClose={onClose} />}
    </Dialog>
  );
}
