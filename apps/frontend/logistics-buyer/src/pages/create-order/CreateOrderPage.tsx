// Port of CreateOrderComponent (chunk OASXY6NU) — /create-order, bulk Excel/CSV import.
// Spec: docs/specs/02-create-order-customer-master.md §1.
// The dormant parts of the chunk (Review Orders modal, confirmation/success modals, per-row validateExcelData,
// checkCustomerIdValidation) are never reached by the live flow and are intentionally not ported (§1.9).
import { useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import DataLoading from '../../components/DataLoading';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ORDER_IMPORT_HEADERS, orderCreateService, type UploadedFilePayload } from '../../api/services/orderCreate.service';
import { normalizeExcelDate } from '../../utils/helpers';
import './CreateOrderPage.css';

type FileType = 'excel' | 'pdf' | 'manual';
interface ValidationIssue { code: string; message: string }

const UPLOAD_FOLDER = 'logistics-buyer-orders';

/** validateOrderExcelData(wb, rows) — file-level checks; all errors are collected (only the empty check returns early). */
function validateOrderExcelData(wb: XLSX.WorkBook, rows: Record<string, any>[]): { isValid: boolean; errors: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  if (!rows || rows.length === 0) {
    errors.push({ code: 'ERR_FILE_002', message: 'Uploaded file is empty. Please upload a valid file.' });
    return { isValid: false, errors };
  }

  // headers: sheet row 0 across the !ref range; only cells with a truthy .v count
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell && cell.v) headers.push(String(cell.v).trim());
  }

  const dupes = Array.from(new Set(headers.filter((h, i) => headers.indexOf(h) !== i)));
  if (dupes.length) errors.push({ code: 'ERR_FILE_004', message: `Duplicate columns found: "${dupes.join(', ')}".` });

  const missing = ORDER_IMPORT_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) errors.push({ code: 'ERR_FILE_003', message: `Missing mandatory columns "${missing.join(', ')}".` });

  const extra = headers.filter((h) => h !== '' && !ORDER_IMPORT_HEADERS.includes(h));
  if (extra.length) errors.push({ code: 'ERR_FILE_005', message: `Extra columns names found: "${extra.join(', ')}".` });

  // consistency checks on raw values (Map/Set → "123" and 123 are different ids); rows with a falsy key are skipped
  const orderCustomers = new Map<any, Set<any>>();
  const orderInvoiceCustomers = new Map<string, { o: any; i: any; ids: Set<any> }>();
  const invoiceCustomers = new Map<any, Set<any>>();
  const invoiceDates = new Map<any, Set<string>>();
  rows.forEach((row) => {
    const o = row['Order ID'];
    const i = row['Invoice ID'];
    const c = row['Customer ID'];
    const bd = row['Billing Date'];
    if (o && c) {
      if (!orderCustomers.has(o)) orderCustomers.set(o, new Set());
      orderCustomers.get(o)!.add(c);
    }
    if (o && i && c) {
      const key = JSON.stringify([o, i]);
      if (!orderInvoiceCustomers.has(key)) orderInvoiceCustomers.set(key, { o, i, ids: new Set() });
      orderInvoiceCustomers.get(key)!.ids.add(c);
    }
    if (i && c) {
      if (!invoiceCustomers.has(i)) invoiceCustomers.set(i, new Set());
      invoiceCustomers.get(i)!.add(c);
    }
    if (i && bd) {
      if (!invoiceDates.has(i)) invoiceDates.set(i, new Set());
      invoiceDates.get(i)!.add(String(bd).trim());
    }
  });
  orderCustomers.forEach((ids, orderId) => {
    if (ids.size > 1) errors.push({ code: 'ERR_DUP_001', message: `Order ID '${orderId}' found with different Customer IDs: '${Array.from(ids).join("', '")}'.` });
  });
  orderInvoiceCustomers.forEach(({ o, i, ids }) => {
    if (ids.size > 1) errors.push({ code: 'ERR_DUP_002', message: `Order ID '${o}' + Invoice ID '${i}' combination found with different Customer IDs: '${Array.from(ids).join("', '")}'.` });
  });
  invoiceCustomers.forEach((ids, inv) => {
    if (ids.size > 1) errors.push({ code: 'ERR_DUP_001', message: `Invoice ID '${inv}' found with different Customer IDs: '${Array.from(ids).join("', '")}'.` });
  });
  invoiceDates.forEach((dates, inv) => {
    if (dates.size > 1) errors.push({ code: 'ERR_CONS_002', message: `Invoice ID '${inv}' cannot have multiple billing dates: '${Array.from(dates).join("', '")}'.` });
  });

  if (rows.some((row) => !row['OrderType'] || String(row['OrderType']).trim() === '')) {
    errors.push({ code: 'ERR_ORDER_TYPE_001', message: 'Order Type is mandatory.' });
  }
  return { isValid: errors.length === 0, errors };
}

/** Binary string (XLSX type:"binary") → base64. */
const binaryToBase64 = (bin: string) => btoa(bin);
const base64ToBytes = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { buyerId } = usePagePermissions('buyer_orders');

  const [selectedFileType, setSelectedFileType] = useState<FileType>('excel');
  const [acceptedFileTypes, setAcceptedFileTypes] = useState('.xlsx,.xls,.csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasValidationError, setHasValidationError] = useState(false);
  const uploadedFiles = useRef<Partial<UploadedFilePayload>>({});

  const selectFileType = (t: FileType) => {
    setSelectedFileType(t);
    setAcceptedFileTypes(t === 'pdf' ? '.pdf' : '.xlsx,.xls,.csv');
    setSelectedFile(null); // does not clear the validation errors
  };

  const clearErrors = () => {
    setValidationErrors([]);
    setHasValidationError(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    clearErrors();
  };

  const handleFile = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    let valid: boolean;
    let msg: string;
    if (selectedFileType === 'pdf') {
      valid = type === 'application/pdf';
      msg = 'ERR_FILE_001: Invalid file format. Please upload a valid PDF file.';
    } else {
      const isXlsx = name.endsWith('.xlsx') && (type.includes('excel') || type.includes('spreadsheet') || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const isCsv = name.endsWith('.csv') && (type === 'text/csv' || type === 'application/csv' || type === 'application/vnd.ms-excel' || type.includes('csv'));
      valid = isXlsx || isCsv;
      msg = 'ERR_FILE_001: Invalid file format. Please upload a valid .xlsx or .csv file.';
    }
    if (valid) {
      setSelectedFile(file);
      clearErrors();
    } else {
      setSelectedFile(null);
      setValidationErrors([msg]);
      setHasValidationError(true);
    }
  };

  // ---------------------------------------------------------------- drag & drop
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const onDrop = (e: DragEvent) => {
    // preventDefault keeps the browser from opening the dropped file in the tab
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleFile(files[0]);
  };

  // ---------------------------------------------------------------- save pipeline
  const uploadAndSetUrl = async (file: UploadedFilePayload, folder: string) => {
    setIsLoading(true);
    try {
      const res = await orderCreateService.billsUpload(file, folder);
      const url: string = res.data.url;
      if (!url) throw new Error('Upload did not return a file URL');
      const result = await orderCreateService.orderImport({ buyerId, fileUrl: url });
      setIsLoading(false);
      if (result.success) {
        Swal.fire({ icon: 'success', title: 'Success', text: 'Orders created successfully!' });
        navigate('/orders'); // immediately — the alert is not awaited
      } else {
        Swal.fire({ icon: 'error', title: 'Order Import Failed', text: result.error?.message || 'Order import failed! Please try again.' });
        removeFile();
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setIsLoading(false);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Order creation failed! Please try again.' });
      removeFile();
    }
  };

  const uploadFiles = async () => {
    const current = uploadedFiles.current;
    if (!current.fileData) {
      console.log('No file data to upload');
      return;
    }
    try {
      const wb = XLSX.read(base64ToBytes(current.fileData), { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[sheetName]);

      const { isValid, errors } = validateOrderExcelData(wb, rows);
      if (!isValid) {
        setValidationErrors(errors.map((e) => e.message));
        setHasValidationError(true);
        return;
      }

      rows.forEach((row) => {
        if (row['Billing Date']) row['Billing Date'] = normalizeExcelDate(String(row['Billing Date']).trim());
        const t = String(row['OrderType']).trim();
        if (t === 'Sales') row['OrderType'] = 'Others';
        else if (t === 'Digital') row['OrderType'] = 'Unnati';
      });
      wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(rows);
      const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      current.fileData = binaryToBase64(bin);

      await uploadAndSetUrl(current as UploadedFilePayload, UPLOAD_FOLDER);
    } catch (err) {
      console.error('Error processing file:', err);
      Swal.fire({ icon: 'error', title: 'Error Processing File', text: 'Could not process the Excel file. Please ensure it has the correct format.' });
    }
  };

  const uploadFile = () => {
    const file = selectedFile;
    if (!file) return;
    const name = file.name;
    const ext = name.split('.').pop() || '';
    const baseName = name.replace(new RegExp('.' + ext + '$'), ''); // unescaped "." as in the original (harmless)
    const isCsv = ext.toLowerCase() === 'csv';
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        const wb = isCsv ? XLSX.read(result as string, { type: 'string' }) : XLSX.read(new Uint8Array(result as ArrayBuffer), { type: 'array' });
        const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        uploadedFiles.current = { fileName: baseName, fileExtension: 'xlsx', fileData: binaryToBase64(bin) };
        uploadFiles();
      } catch (err) {
        // corrupt / unreadable workbook: console only, the page stays as it is
        console.error('Error reading file:', err);
      }
    };
    if (isCsv) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  // sample links live inside card 1 and do not stop propagation → the card click also runs selectFileType('excel')
  const sampleClick = (fn: () => void) => (e: MouseEvent) => {
    e.preventDefault(); // stands in for href="javascript:void(0)"
    fn();
  };

  return (
    <div className="create-order-container">
      <header className="upload-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/orders')}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1>Create Order</h1>
        </div>
      </header>

      {isLoading ? (
        <DataLoading overlay={false} message="Uploading file..." />
      ) : (
        <div className="upload-content">
          <div className="file-type-selector">
            <h2>Select File Type</h2>
            <div className="file-types">
              <div className={`file-type active${selectedFileType === 'excel' ? ' selected' : ''}`} onClick={() => selectFileType('excel')}>
                <i className="fas fa-file-excel" />
                <div className="type-info">
                  <h3>Excel Sheet / CSV</h3>
                  <p>Upload orders in .xlsx or .csv format</p>
                  <div className="sample-links-vertical">
                    <a href="#" className="sample-link" onClick={sampleClick(() => orderCreateService.downloadSampleExcel())}>
                      <i className="fas fa-file-excel" /> Download Excel Sample
                    </a>
                    <a href="#" className="sample-link" onClick={sampleClick(() => orderCreateService.downloadSampleCsv())}>
                      <i className="fas fa-file-csv" /> Download CSV Sample
                    </a>
                  </div>
                </div>
                {selectedFileType === 'excel' && <i className="fas fa-check-circle check-icon" />}
              </div>

              <div className={`file-type disabled${selectedFileType === 'pdf' ? ' selected' : ''}`} onClick={() => selectFileType('pdf')}>
                <i className="fas fa-file-pdf" />
                <div className="type-info">
                  <h3>PDF Document</h3>
                  <p>Upload orders in PDF format</p>
                  <a href="#" className="sample-link" onClick={sampleClick(() => orderCreateService.downloadSamplePdf())}>
                    <i className="fas fa-download" /> Download Sample
                  </a>
                </div>
                {selectedFileType === 'pdf' && <i className="fas fa-check-circle check-icon" />}
              </div>

              <div className={`file-type disabled${selectedFileType === 'manual' ? ' selected' : ''}`}>
                <i className="fas fa-keyboard" />
                <div className="type-info">
                  <h3>Manual Entry</h3>
                  <p>Contact support team to enable this option</p>
                  <a href="#" className="sample-link" onClick={sampleClick(() => orderCreateService.downloadSamplePdf())}>
                    <i className="fas fa-download" /> Add order manually
                  </a>
                </div>
                {selectedFileType === 'manual' && <i className="fas fa-check-circle check-icon" />}
              </div>
            </div>
          </div>

          <div className="upload-section">
            <h2>Upload File</h2>

            {hasValidationError && (
              <div className="validation-error">
                <div className="error-content">
                  <i className="fas fa-exclamation-circle" />
                  <div className="error-text">
                    <strong>Validation Error</strong>
                    <ul className="error-list">
                      {validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`upload-area${isDragOver ? ' drag-over' : ''}${hasValidationError ? ' has-error' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {!selectedFile ? (
                <div className="upload-placeholder">
                  <i className="fas fa-cloud-upload-alt" />
                  <h3>Drag &amp; Drop</h3>
                  <p>or</p>
                  <label className="browse-btn">
                    Browse Files
                    <input
                      type="file"
                      accept={acceptedFileTypes}
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="selected-file-info">
                  <i className={selectedFile.name.endsWith('.pdf') ? 'fas fa-file-pdf' : 'fas fa-file-excel'} />
                  <div className="file-details">
                    <h4>{selectedFile.name}</h4>
                    <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button className="remove-btn" onClick={removeFile}>
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" disabled={!selectedFile} onClick={removeFile}>
              Cancel
            </button>
            {/* not disabled while processing: a double-click can start two imports (as built) */}
            <button className="save-btn" disabled={!selectedFile} onClick={uploadFile}>
              <i className="fas fa-save" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
