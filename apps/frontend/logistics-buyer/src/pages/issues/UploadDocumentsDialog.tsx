// Port of `app-upload-documents-dialog` (spec 06 §6.1). Opened by Provide Info with width 550px.
// Close results: X → false; Esc/backdrop → undefined; Send Response → {success:true, files, payload}.
// Images are compressed with a canvas (stand-in for browser-image-compression: maxSizeMB 1,
// maxWidthOrHeight 1920, output keeps the input type) before base64 encoding.
import { useRef, useState, type ChangeEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import Swal from 'sweetalert2';
import './UploadDocumentsDialog.css';

export interface UploadPayloadItem { fileName: string; fileExtension: string; fileData: string }
export type UploadDialogResult = { success: true; files: string[]; payload: UploadPayloadItem[] } | false | undefined;

interface Props {
  open: boolean;
  data: { issueId: any };
  onClose: (result: UploadDialogResult) => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The file given is not an image'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image compression failed'))), type, quality));
}

/** Canvas-based replacement for browser-image-compression ({maxSizeMB:1, maxWidthOrHeight:1920}). */
export async function compressImage(file: File, maxSizeMB = 1, maxWidthOrHeight = 1920): Promise<Blob> {
  const img = await loadImage(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (!srcW || !srcH) throw new Error('Image has no intrinsic size');
  const maxBytes = maxSizeMB * 1024 * 1024;
  const scale = Math.min(1, maxWidthOrHeight / Math.max(srcW, srcH));
  // Already small enough and within bounds → the library returns the original file.
  if (scale === 1 && file.size <= maxBytes) return file;

  let w = Math.max(1, Math.round(srcW * scale));
  let h = Math.max(1, Math.round(srcH * scale));
  const lossy = file.type === 'image/jpeg' || file.type === 'image/webp';
  let quality = 0.92;
  const render = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    if (file.type === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvasToBlob(canvas, file.type, lossy ? quality : undefined);
  };
  let out = await render();
  for (let i = 0; out.size > maxBytes && i < 10; i++) {
    if (lossy && quality > 0.3) quality = Math.max(0.3, quality - 0.12);
    else {
      w = Math.max(1, Math.round(w * 0.85));
      h = Math.max(1, Math.round(h * 0.85));
    }
    out = await render();
  }
  if (scale === 1 && out.size >= file.size) return file;
  return out;
}

function UploadDocumentsContent({ onClose }: { onClose: (r: UploadDialogResult) => void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const uploadedFiles = useRef<Record<string, UploadPayloadItem>>({});

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    const typeOk = files.filter((f) => f.type.includes('image') || f.type === 'application/pdf');
    const accepted = typeOk.filter((f) => f.size <= MAX_FILE_BYTES);
    if (accepted.length < files.length) {
      // not awaited — processing continues with the accepted files
      void Swal.fire({ icon: 'warning', title: 'Warning', text: 'Some files were rejected due to file type or size constraints.', confirmButtonText: 'OK', confirmButtonColor: '#6c8bc1' });
    }
    setProcessingFiles(true);
    try {
      await Promise.all(
        accepted.map(async (file) => {
          const dataUrl = await readAsDataURL(file);
          let fileData: string;
          if (file.type.includes('image')) {
            const compressed = await compressImage(file);
            fileData = (await readAsDataURL(compressed)).split(',')[1] || '';
          } else {
            fileData = dataUrl.split(',')[1] || '';
          }
          const dot = file.name.lastIndexOf('.');
          uploadedFiles.current[`${file.name}_${Date.now()}`] = { fileName: file.name, fileExtension: file.name.substring(dot + 1), fileData };
        }),
      );
      setSelectedFiles((prev) => [...prev, ...accepted]);
    } catch (err) {
      // As-built: the whole batch is not listed, but entries already written to uploadedFiles stay (and will upload).
      console.error('Error processing files:', err);
    } finally {
      setProcessingFiles(false);
      input.value = '';
    }
  };

  const removeFile = (index: number) => {
    const file = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (file) {
      const key = Object.keys(uploadedFiles.current).find((k) => uploadedFiles.current[k].fileName === file.name);
      if (key) delete uploadedFiles.current[key];
    }
  };

  const sendResponse = () => {
    if (!selectedFiles.length) return;
    onClose({ success: true, files: selectedFiles.map((f) => f.name), payload: Object.values(uploadedFiles.current) });
  };

  const hasFiles = selectedFiles.length > 0;
  return (
    <div className="upload-documents-dialog">
      <div className="dialog-header">
        <h2>Upload Supporting Documents</h2>
        <button type="button" className="close-btn" onClick={() => onClose(false)} aria-label="Close">
          <i className="fas fa-times" />
        </button>
      </div>

      <h3 className="section-title">Select Files (Images/PDFs)</h3>
      <label className="drop-zone">
        <input type="file" multiple accept="image/*,.pdf" hidden onChange={onFileSelected} />
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt" />
        </div>
        <span className="choose-text">Choose files</span>
      </label>
      <p className="hint">Maximum 10MB per file. Supported: Images, PDF</p>

      {processingFiles && (
        <div className="processing">
          <div className="mini-spinner" />
          <span>Processing files...</span>
        </div>
      )}

      {hasFiles && (
        <div className="selected-files">
          {selectedFiles.map((f, i) => (
            <div className="file-row" key={`${f.name}-${i}`}>
              <span className="file-name" title={f.name}>{f.name}</span>
              <span className="file-size">{formatFileSize(f.size)}</span>
              <button type="button" className="remove-btn" onClick={() => removeFile(i)} aria-label="Remove file">
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dialog-footer">
        <button type="button" className={`send-btn${hasFiles ? ' has-files' : ''}`} disabled={!hasFiles} onClick={sendResponse}>
          <i className="fas fa-paper-plane" /> Send Response
        </button>
      </div>
    </div>
  );
}

export default function UploadDocumentsDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose(undefined)}
      maxWidth={false}
      disableEnforceFocus
      PaperProps={{ className: 'upload-documents-dialog-panel', sx: { width: '550px', maxWidth: '80vw', borderRadius: '8px' } }}
    >
      {open && <UploadDocumentsContent onClose={onClose} />}
    </Dialog>
  );
}
