// Beats (/settings/beats, spec 08 §4): server-paged list with debounced search, Add/Edit modal, delete confirm,
// Excel/CSV bulk import (template download, header checks, per-row classification). No permission checks (as-built).
import { useState, useEffect, useReducer, useRef, type DragEvent } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { authService } from '../../api/services/auth.service';
import { beatsService, type Beat } from '../../api/services/beats.service';
import { validateNameLength } from '../../utils/helpers';
import './BeatsPage.css';

type PreviewStatus = 'ready' | 'duplicate' | 'invalid';
interface BeatPreviewRow {
  rowNumber: number;
  beatName: string;
  area: string;
  status: PreviewStatus;
  reason: string;
}

const AREA_MAX_LENGTH = 255;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Case-insensitive, trailing dots/whitespace ignored ("Beat 10." === "beat 10"). */
const normalize = (s: string) => (s || '').trim().toLowerCase().replace(/[.\s]+$/, '');
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const errMsg = (e: any, fallback: string) => e?.error?.error?.message || fallback;

function toast(title: string) {
  Swal.fire({ icon: 'success', title, timer: 1800, showConfirmButton: false, toast: true, position: 'top' });
}
function errorAlert(text: string) {
  Swal.fire({ icon: 'error', title: 'Error', text });
}

class BeatsController {
  update: () => void = () => {};
  buyerId = '';
  beats: Beat[] = [];
  totalCount = 0;
  search = '';
  isLoading = false;
  loadError = false;
  skeletonRows = Array.from({ length: 6 });
  currentPage = 1;
  pageSize = 25;
  private searchTimer: number | undefined;

  showAddModal = false;
  showEditModal = false;
  isSaving = false;
  editingId: string | null = null;
  editingName = '';
  form = { beatName: '', area: '' };

  showUploadModal = false;
  isDragOver = false;
  isImporting = false;
  selectedFile: File | null = null;
  previewRows: BeatPreviewRow[] = [];
  fileError = '';
  existingNormalized = new Set<string>();
  existingLoad: Promise<void> | null = null;

  // ------------------------------------------------------------ list
  get totalPages() {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }
  get rangeStart() {
    return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  get rangeEnd() {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  async loadBeats() {
    if (!this.buyerId) return;
    this.isLoading = true;
    this.loadError = false;
    this.update();
    try {
      const data = (await beatsService.list(this.buyerId, { search: this.search.trim() || undefined, pageNumber: this.currentPage, pageSize: this.pageSize })) ?? {
        beats: [],
        totalCount: 0,
      };
      this.beats = data.beats ?? [];
      this.totalCount = data.totalCount ?? 0;
    } catch (e) {
      console.error('Error loading beats', e);
      this.loadError = true;
      this.beats = [];
      this.totalCount = 0;
    } finally {
      this.isLoading = false;
      this.update();
    }
  }

  onSearchChange(value: string) {
    this.search = value;
    window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => {
      this.currentPage = 1;
      this.loadBeats();
    }, 300);
    this.update();
  }

  clearSearch() {
    window.clearTimeout(this.searchTimer);
    this.search = '';
    this.currentPage = 1;
    this.loadBeats();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadBeats();
  }

  goToPage(n: number) {
    if (n < 1 || n > this.totalPages) return;
    this.currentPage = n;
    this.loadBeats();
  }

  destroy() {
    window.clearTimeout(this.searchTimer);
    this.update = () => {};
  }

  // ------------------------------------------------------------ add / edit
  get beatNameError() {
    return validateNameLength(this.form.beatName, 'Beat name');
  }
  get isBeatNameValid() {
    return !!this.form.beatName.trim() && !this.beatNameError;
  }
  get saveHint() {
    if (!this.form.beatName.trim()) return 'Enter a beat name to continue.';
    return this.beatNameError || '';
  }

  openAdd() {
    this.editingId = null;
    this.form = { beatName: '', area: '' };
    this.showAddModal = true;
    this.update();
  }

  openEdit(beat: Beat) {
    this.editingId = beat.id;
    this.editingName = beat.beatName;
    this.form = { beatName: beat.beatName, area: (beat.area as string) || '' };
    this.showEditModal = true;
    this.update();
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false; // form is not reset until the next open
    this.update();
  }

  async save() {
    const t = this.form.beatName.trim();
    if (!t) {
      Swal.fire({ icon: 'warning', title: 'Beat name is required.' });
      return;
    }
    const err = validateNameLength(t, 'Beat name');
    if (err) {
      Swal.fire({ icon: 'warning', title: err });
      return;
    }
    this.isSaving = true;
    this.update();
    const body = { buyerId: this.buyerId, beatName: t, area: this.form.area.trim() };
    try {
      if (this.editingId) {
        await beatsService.update(this.editingId, body);
        this.closeModals();
        await this.loadBeats(); // same page
        toast(`Beat "${t}" updated`);
      } else {
        await beatsService.create(body);
        this.closeModals();
        this.currentPage = 1;
        await this.loadBeats();
        toast(`Beat "${t}" added`);
      }
    } catch (e) {
      console.error('Error saving beat', e);
      errorAlert(errMsg(e, 'Failed to save beat.')); // modal stays open
    } finally {
      this.isSaving = false;
      this.update();
    }
  }

  async remove(beat: Beat) {
    const res = await Swal.fire({
      title: `Delete beat "${beat.beatName}"?`,
      text: beat.clusterName ? `It will be removed from the "${beat.clusterName}" cluster.` : undefined,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    try {
      await beatsService.remove(beat.id, this.buyerId);
      if (this.beats.length === 1 && this.currentPage > 1) this.currentPage--;
      await this.loadBeats();
      toast(`Beat "${beat.beatName}" deleted`);
    } catch (e) {
      console.error('Error deleting beat', e);
      errorAlert(errMsg(e, 'Failed to delete beat.'));
    }
  }

  // ------------------------------------------------------------ upload
  get readyCount() {
    return this.previewRows.filter((r) => r.status === 'ready').length;
  }
  get skippedCount() {
    return this.previewRows.filter((r) => r.status === 'duplicate' || r.status === 'invalid').length;
  }
  get importLabel() {
    const n = this.readyCount;
    return n === 0 ? 'Import beats' : n === 1 ? 'Import 1 beat' : `Import ${n} beats`;
  }

  resetUpload() {
    this.selectedFile = null;
    this.previewRows = [];
    this.fileError = '';
    this.isDragOver = false;
  }

  openUpload() {
    this.resetUpload();
    this.showUploadModal = true;
    this.existingLoad = this.loadExistingNormalized();
    this.update();
  }

  closeUpload() {
    this.showUploadModal = false;
    this.update();
  }

  async loadExistingNormalized() {
    try {
      const data = await beatsService.list(this.buyerId, { pageNumber: 1, pageSize: 10000 });
      this.existingNormalized = new Set((data?.beats ?? []).map((b) => normalize(b.beatName)));
    } catch {
      this.existingNormalized = new Set(); // silently: existing duplicates are then not flagged
    }
  }

  downloadTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Beat Name', 'Area']]), 'Beats');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: XLSX_MIME });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beats-upload-template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!this.isDragOver) {
      this.isDragOver = true;
      this.update();
    }
  }
  onDragLeave() {
    this.isDragOver = false;
    this.update();
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
    else this.update();
  }
  removeFile() {
    this.resetUpload();
    this.update();
  }

  /** Returns the first header problem (spec 08 §4.7 step 5) or null. */
  validateHeaders(sheet: XLSX.WorkSheet): string | null {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const headers = Array.from((rows[0] as unknown[]) || [], (h) => (h == null ? '' : String(h).trim())).filter((h) => h !== '');
    const invalid = headers.filter((h) => !['beatname', 'area'].includes(normalizeHeader(h)));
    if (invalid.length) {
      return `Invalid column${invalid.length > 1 ? 's' : ''} ${invalid.map((h) => `"${h}"`).join(', ')} — only 'Beat Name' and 'Area' are allowed.`;
    }
    const beatCols = headers.filter((h) => normalizeHeader(h) === 'beatname');
    const areaCols = headers.filter((h) => normalizeHeader(h) === 'area');
    if (beatCols.length > 1 || areaCols.length > 1) {
      const first = headers.find((h) => {
        const n = normalizeHeader(h);
        return (n === 'beatname' && beatCols.length > 1) || (n === 'area' && areaCols.length > 1);
      });
      return `Duplicate column "${first}" — the file must have exactly one 'Beat Name' and one 'Area' column.`;
    }
    if (!beatCols.length) return "This file has no 'Beat Name' column. Download the template and try again.";
    if (!areaCols.length) return "This file has no 'Area' column. Download the template and try again.";
    return null;
  }

  classify(rows: Record<string, unknown>[]): BeatPreviewRow[] {
    const seen = new Set<string>();
    return rows.map((row, i) => {
      const norm: Record<string, unknown> = {};
      Object.keys(row).forEach((k) => (norm[normalizeHeader(k)] = row[k]));
      const beatName = String(norm.beatname ?? '').trim();
      const area = String(norm.area ?? '').trim();
      const rowNumber = i + 2;
      const n = normalize(beatName);
      const mk = (status: PreviewStatus, reason: string): BeatPreviewRow => ({ rowNumber, beatName, area, status, reason });
      if (!n) return mk('invalid', 'Beat name is empty');
      const err = validateNameLength(beatName, 'Beat name');
      if (err) return mk('invalid', err);
      if (area.length > AREA_MAX_LENGTH) return mk('invalid', 'Area cannot exceed 255 characters');
      if (seen.has(n)) return mk('duplicate', 'Repeated in this file');
      seen.add(n);
      if (this.existingNormalized.has(n)) return mk('duplicate', 'Already in this LBNP');
      return mk('ready', '');
    });
  }

  handleFile(file: File) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      this.resetUpload();
      this.fileError = 'Invalid file format. Upload a .xlsx, .xls or .csv file.';
      this.update();
      return;
    }
    this.selectedFile = file;
    this.previewRows = [];
    this.fileError = '';
    this.update();
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const wb = ext === 'csv' ? XLSX.read(reader.result as string, { type: 'string' }) : XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]]; // first sheet only
        const headerError = this.validateHeaders(sheet);
        if (headerError) {
          this.fileError = headerError; // file stays shown, no preview
          return;
        }
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (!rows.length) {
          this.fileError = 'No rows found. Make sure the first row contains column headers.';
          return;
        }
        await this.existingLoad;
        this.previewRows = this.classify(rows);
      } catch (e) {
        console.error('Error parsing beats file', e);
        this.fileError = 'That file could not be parsed. Upload a .xlsx, .xls or .csv file.';
      } finally {
        this.update();
      }
    };
    if (ext === 'csv') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }

  async importBeats() {
    const ready = this.previewRows.filter((r) => r.status === 'ready');
    if (!ready.length) return;
    if (!this.buyerId) return;
    this.isImporting = true;
    this.update();
    try {
      await beatsService.bulkCreate({ buyerId: this.buyerId, beats: ready.map((r) => ({ beatName: r.beatName, area: r.area || undefined })) });
      this.showUploadModal = false;
      this.currentPage = 1;
      await this.loadBeats();
      toast(`${ready.length} ${ready.length === 1 ? 'beat' : 'beats'} imported`); // client-side count; response ignored
    } catch (e) {
      console.error('Error importing beats', e);
      errorAlert(errMsg(e, 'Failed to import beats.')); // modal stays open with its preview
    } finally {
      this.isImporting = false;
      this.update();
    }
  }
}

export default function BeatsPage() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [c] = useState(() => {
    const controller = new BeatsController();
    controller.buyerId = authService.getCurrentUser()?.id || '';
    controller.isLoading = !!controller.buyerId; // ngOnInit starts loading before the first paint
    return controller;
  });
  c.update = force;
  useEffect(() => {
    c.loadBeats();
    return () => c.destroy();
  }, [c]);

  const showModal = c.showAddModal || c.showEditModal;
  const isEdit = c.showEditModal;

  return (
    <div className="beats-page">
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h2>Beats</h2>
            <p className="section-desc">The beats available in this LBNP. Add them one at a time or import a list from Excel.</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => c.openUpload()}>
              <i className="fas fa-arrow-up-from-bracket" /> Upload Excel
            </button>
            <button className="btn-primary" onClick={() => c.openAdd()}>
              <i className="fas fa-plus" /> Add Beat
            </button>
          </div>
        </div>

        <div className="search-bar">
          <i className="fas fa-search search-icon" />
          <input type="text" className="search-input" placeholder="Search beats by name or area..." value={c.search} onChange={(e) => c.onSearchChange(e.target.value)} />
          {c.search && (
            <button className="input-clear-btn" aria-label="Clear search" onClick={() => c.clearSearch()}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Beat Name</th>
                <th>Area</th>
                <th>Cluster</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {c.isLoading &&
                c.skeletonRows.map((_, i) => (
                  <tr key={`sk-${i}`} className="skeleton-row">
                    {['70%', '50%', '40%', '40%'].map((w, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))}
              {!c.isLoading &&
                !c.loadError &&
                c.beats.map((b) => (
                  <tr key={b.id}>
                    <td className="beat-name-cell">{b.beatName}</td>
                    <td>{(b.area as string) || '—'}</td>
                    <td>{b.clusterName ? <span className="cluster-tag">{b.clusterName}</span> : <span className="unassigned-text">Unassigned</span>}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" title="Edit" onClick={() => c.openEdit(b)}>
                          <i className="fas fa-pen" />
                        </button>
                        <button className="delete-btn" title="Delete" onClick={() => c.remove(b)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!c.isLoading && c.loadError && (
          <div className="load-error">
            <i className="fas fa-triangle-exclamation" />
            <p>Something went wrong while loading beats. Please try again after some time.</p>
            <button className="retry-btn" onClick={() => c.loadBeats()}>
              Retry
            </button>
          </div>
        )}

        {!c.isLoading && !c.loadError && c.beats.length === 0 && (
          <div className="empty-state">
            {c.search.trim() ? 'No beats found. Add one manually or upload an Excel file.' : 'No beats yet. Add a beat or import from Excel to get started.'}
          </div>
        )}

        {!c.isLoading && !c.loadError && c.totalCount > 0 && (
          <div className="pagination-container">
            <div className="rows-per-page">
              <span>Items per page:</span>
              <select value={c.pageSize} onChange={(e) => c.onPageSizeChange(Number(e.target.value))}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <span className="page-info">{`${c.rangeStart} – ${c.rangeEnd} of ${c.totalCount}`}</span>
            <div className="page-nav">
              <button className="page-btn" disabled={c.currentPage <= 1} onClick={() => c.goToPage(c.currentPage - 1)}>
                <i className="fas fa-chevron-left" />
              </button>
              <button className="page-btn" disabled={c.currentPage >= c.totalPages} onClick={() => c.goToPage(c.currentPage + 1)}>
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- Add / Edit beat modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => c.closeModals()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>
                  <i className="fas fa-map-marker-alt title-icon" />
                  {isEdit ? ' Edit Beat' : ' Add Beat'}
                </h3>
                <p className="modal-subtitle">{isEdit ? `Editing "${c.editingName}".` : 'Add a single beat to this LBNP.'}</p>
              </div>
              <button className="close-btn" onClick={() => c.closeModals()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  Beat Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input${c.beatNameError ? ' invalid' : ''}`}
                  placeholder="e.g. Beat 10"
                  value={c.form.beatName}
                  onChange={(e) => ((c.form.beatName = e.target.value), c.update())}
                />
                {c.beatNameError && <div className="field-error">{c.beatNameError}</div>}
              </div>
              <div className="form-group">
                <label>Area</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kukatpally"
                  maxLength={AREA_MAX_LENGTH}
                  value={c.form.area}
                  onChange={(e) => ((c.form.area = e.target.value), c.update())}
                />
                {c.form.area.length >= AREA_MAX_LENGTH && <div className="field-error"> Maximum 255 characters allowed. </div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => c.closeModals()}>
                Cancel
              </button>
              <span className="save-hint-wrap" title={c.saveHint}>
                <button className="save-btn" disabled={c.isSaving || !c.isBeatNameValid} onClick={() => c.save()}>
                  {isEdit ? 'Save Changes' : 'Create Beat'}
                </button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Upload modal */}
      {c.showUploadModal && (
        <div className="modal-overlay" onClick={() => c.closeUpload()}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header with-border">
              <div>
                <h3>
                  <i className="fas fa-file-lines title-icon" /> Upload Beats
                </h3>
                <p className="modal-subtitle">Import beat names in bulk from an Excel or CSV file.</p>
              </div>
              <button className="close-btn" onClick={() => c.closeUpload()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <div className="format-strip">
                <div>
                  <strong>Not sure about the format?</strong>
                  <p>
                    Columns: <strong>Beat Name</strong> (required), Area.
                  </p>
                </div>
                <button className="download-tpl-btn" onClick={() => c.downloadTemplate()}>
                  <i className="fas fa-download" /> Download template{' '}
                </button>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) c.handleFile(f); // input value is not reset (as-built: re-picking the same file may not fire)
                }}
              />
              <div
                className={`upload-area${c.isDragOver ? ' drag-over' : ''}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => c.onDragOver(e)}
                onDragLeave={() => c.onDragLeave()}
                onDrop={(e) => c.onDrop(e)}
              >
                <i className="fas fa-arrow-up-from-bracket upload-icon" />
                <p className="upload-text">
                  <span className="browse-link">Click to upload</span> or drag and drop
                </p>
                <p className="upload-hint">.xlsx, .xls or .csv</p>
              </div>

              {c.selectedFile && (
                <div className="file-row">
                  <i className="fas fa-file-alt" />
                  <span className="file-name">{c.selectedFile.name}</span>
                  <button className="remove-file-btn" title="Delete" onClick={() => c.removeFile()}>
                    <i className="fas fa-trash" />
                  </button>
                </div>
              )}

              {c.fileError && (
                <div className="upload-banner error">
                  <i className="fas fa-triangle-exclamation" /> {c.fileError}
                </div>
              )}
              {c.previewRows.length > 0 && c.readyCount === 0 && (
                <div className="upload-banner error">
                  <i className="fas fa-triangle-exclamation" /> No new beats to import — every row is a duplicate or invalid.{' '}
                </div>
              )}

              {c.previewRows.length > 0 && (
                <div className="preview">
                  <div className="preview-head">
                    <span className="preview-title">Preview</span>
                    <span className="preview-stat ready">
                      <i className="fas fa-circle-check" /> {c.readyCount} ready
                    </span>
                    <span className="preview-stat skipped">
                      <i className="fas fa-triangle-exclamation" /> {c.skippedCount} skipped
                    </span>
                  </div>
                  <div className="preview-table-wrap">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Beat Name</th>
                          <th>Area</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.previewRows.map((r) => (
                          <tr key={r.rowNumber}>
                            <td className="row-num">{r.rowNumber}</td>
                            <td>{r.beatName || '—'}</td>
                            <td>{r.area || '—'}</td>
                            <td>
                              <span className={`preview-badge ${r.status}`}>{titleCase(r.status)}</span>
                              {r.reason && <span className="preview-reason">{r.reason}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer with-border">
              <button className="cancel-btn" onClick={() => c.closeUpload()}>
                Cancel
              </button>
              <button className="save-btn" disabled={c.isImporting || c.readyCount === 0} onClick={() => c.importBeats()}>
                {c.importLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
