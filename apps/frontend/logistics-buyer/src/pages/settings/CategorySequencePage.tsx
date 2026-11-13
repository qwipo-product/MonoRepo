// Category Sequence (/settings/category-sequence, spec 08 §7). Order is a TYPED numeric sequence (no drag & drop);
// the table is always sorted by categoryName. Every save re-fetches buyer settings first (GET then POST) — if that GET
// fails, the POST replaces buyer_config with the default skeleton + categories (as-built).
import { useState, useEffect, useReducer, type KeyboardEvent } from 'react';
import Swal from 'sweetalert2';
import { authService } from '../../api/services/auth.service';
import { buyerSettingsService } from '../../api/services/buyerSettings.service';
import './CategorySequencePage.css';

interface CategorySeq {
  categoryId: string;
  categoryName: string;
  sequence: number;
}

const defaultSkeleton = (): any => ({
  storeConfig: { openingTime: '', closingTime: '', isTemporarilyClosed: false, weeklyHolidays: [], specificClosureDates: [] },
  deliveryConfig: {
    otpVerificationEnabled: true,
    deliveryOtpEnabled: true,
    pickupOtpEnabled: true,
    returnOtpEnabled: true,
    supportedVehicleTypes: [],
    geoFenceContactNumber: 0,
  },
});
const numOrNull = (v: string): number | null => (v === '' ? null : parseFloat(v));
const blockKeys = (e: KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); // decimals are NOT blocked
};

class CategorySequenceController {
  update: () => void = () => {};
  buyerId = '';
  categories: CategorySeq[] = [];
  isLoading = false;
  isSaving = false;
  searchQuery = '';
  currentPage = 1;
  pageSize = 25;

  showAddForm = false;
  addCategoryId = '';
  addCategoryName = '';
  addSequence: number | null = null;

  showEditForm = false;
  editCategoryId = '';
  editCategoryName = '';
  editSequence: number | null = null;
  originalSequence: number | null = null;
  editIndex = -1;

  async load() {
    if (!this.buyerId) return;
    this.isLoading = true;
    this.update();
    try {
      const res = await buyerSettingsService.getBuyerSettings(this.buyerId);
      if (res?.buyer_config) this.categories = (res.buyer_config.categorySequenceConfig?.categories ?? []).map((c: CategorySeq) => ({ ...c }));
    } catch (e) {
      console.error('Error loading category sequence:', e);
    } finally {
      this.isLoading = false;
      this.update();
    }
  }

  get sorted() {
    return [...this.categories].sort((a, b) => String(a.categoryName).localeCompare(String(b.categoryName)));
  }
  get filtered() {
    const q = this.searchQuery.trim().toLowerCase();
    const list = this.sorted;
    if (!q) return list;
    return list.filter((c) => String(c.categoryId).toLowerCase().includes(q) || String(c.categoryName).toLowerCase().includes(q));
  }
  get totalPages() {
    return Math.ceil(this.filtered.length / this.pageSize) || 1;
  }
  get paged() {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }
  onSearch(v: string) {
    this.searchQuery = v;
    this.currentPage = 1;
    this.update();
  }
  onPageSizeChange(n: number) {
    this.pageSize = n;
    this.currentPage = 1;
    this.update();
  }
  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.update();
  }

  /** §7.7 — fresh GET, then full-document POST. Returns !!result; failures are silent. */
  async saveCategories(list: CategorySeq[]): Promise<boolean> {
    if (!this.buyerId) return false;
    this.isSaving = true;
    this.update();
    try {
      const categories = list.map((c) => ({ categoryId: c.categoryId, categoryName: c.categoryName, sequence: c.sequence }));
      const fresh = await buyerSettingsService.getBuyerSettings(this.buyerId);
      const buyerConfig = fresh?.buyer_config || defaultSkeleton();
      buyerConfig.categorySequenceConfig = { categories };
      const result = await buyerSettingsService.saveBuyerSettings({
        buyerId: this.buyerId,
        adminConfig: fresh?.admin_config || { warehouseLocation: [], isPermissionsEnabled: false },
        buyerConfig,
      });
      if (result) Swal.fire({ icon: 'success', title: 'Saved', text: 'Category sequence updated successfully.', timer: 2000, showConfirmButton: false });
      return !!result;
    } catch (e) {
      console.error('Error saving category sequence:', e);
      return false;
    } finally {
      this.isSaving = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ add
  openAddForm() {
    this.addCategoryId = '';
    this.addCategoryName = '';
    this.addSequence = null;
    this.showAddForm = true;
    this.update();
  }
  cancelAdd() {
    this.showAddForm = false;
    this.addCategoryId = '';
    this.addCategoryName = '';
    this.addSequence = null;
    this.update();
  }
  get addDisabled() {
    return !this.addCategoryId.trim() || !this.addCategoryName.trim() || this.addSequence === null || this.addSequence < 0 || this.isSaving;
  }
  async addCategory() {
    if (this.addDisabled) return;
    const categoryId = this.addCategoryId.trim();
    const categoryName = this.addCategoryName.trim();
    if (this.categories.some((c) => c.categoryId === categoryId && c.categoryName === categoryName)) {
      Swal.fire({ icon: 'warning', title: 'Duplicate', text: 'This Category ID and Name combination already exists.' });
      return;
    }
    const list = [...this.categories, { categoryId, categoryName, sequence: this.addSequence as number }];
    const ok = await this.saveCategories(list);
    if (ok) {
      this.categories = list;
      this.cancelAdd();
    }
  }

  // ------------------------------------------------------------ edit
  openEditForm(row: CategorySeq) {
    this.editIndex = this.categories.findIndex((c) => c.categoryId === row.categoryId && c.categoryName === row.categoryName);
    this.editCategoryId = row.categoryId;
    this.editCategoryName = row.categoryName;
    this.editSequence = row.sequence;
    this.originalSequence = row.sequence;
    this.showEditForm = true;
    this.update();
  }
  cancelEdit() {
    this.showEditForm = false;
    this.editIndex = -1;
    this.editCategoryId = '';
    this.editCategoryName = '';
    this.editSequence = null;
    this.originalSequence = null;
    this.update();
  }
  get editDisabled() {
    return this.editSequence === null || this.editSequence < 0 || this.editSequence === this.originalSequence || this.isSaving;
  }
  async saveEdit() {
    if (this.editDisabled || this.editIndex < 0) return;
    const list = [...this.categories];
    list[this.editIndex] = { categoryId: this.editCategoryId, categoryName: this.editCategoryName, sequence: this.editSequence as number };
    const ok = await this.saveCategories(list);
    if (ok) {
      this.categories = list;
      this.cancelEdit();
    }
  }

  // ------------------------------------------------------------ delete
  async remove(row: CategorySeq) {
    const res = await Swal.fire({
      title: 'Delete this category sequence?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    const list = this.categories.filter((c) => !(c.categoryId === row.categoryId && c.categoryName === row.categoryName));
    const ok = await this.saveCategories(list);
    if (ok) {
      this.categories = list;
      if (this.paged.length === 0 && this.currentPage > 1) this.currentPage--;
      this.update();
    }
  }
}

export default function CategorySequencePage() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => {
    const controller = new CategorySequenceController();
    controller.buyerId = authService.getCurrentUser()?.id || '';
    controller.isLoading = !!controller.buyerId;
    return controller;
  });
  c.update = force;
  useEffect(() => {
    c.load();
    return () => {
      c.update = () => {};
    };
  }, [c]);

  const filtered = c.filtered;
  const total = filtered.length;

  return (
    <div className="category-sequence-page">
      <section className="settings-section">
        <div className="section-header">
          <h2>Category Sequence</h2>
          <div className="header-actions">
            {!c.isLoading && c.categories.length > 0 && (
              <div className="search-box">
                <i className="fas fa-search search-icon" />
                <input type="text" className="search-input" placeholder="Search by ID or Name..." value={c.searchQuery} onChange={(e) => c.onSearch(e.target.value)} />
              </div>
            )}
            <button className="add-category-btn" onClick={() => c.openAddForm()}>
              <i className="fas fa-plus" />
              {' Add Category '}
            </button>
          </div>
        </div>

        {c.isLoading && (
          <div className="empty-state">
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: '#ccc' }} />
            <p>Loading...</p>
          </div>
        )}

        {!c.isLoading && c.categories.length > 0 && (
          <>
            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Category CODE</th>
                    <th>Category Name</th>
                    <th>Sequence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {c.paged.map((row, i) => (
                    <tr key={`${row.categoryId}-${row.categoryName}-${i}`}>
                      <td>{row.categoryId}</td>
                      <td>{row.categoryName}</td>
                      <td>{row.sequence}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" title="Edit" onClick={() => c.openEditForm(row)}>
                            <i className="fas fa-pen" />
                          </button>
                          <button className="delete-btn" title="Delete" onClick={() => c.remove(row)}>
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {total === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                        No results found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <div className="rows-per-page">
                <span>Rows per page:</span>
                <select value={c.pageSize} onChange={(e) => c.onPageSizeChange(Number(e.target.value))}>
                  {[25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {/* as-built: reads "1–0 of 0" when the search has no matches */}
              <span className="page-info">{`${(c.currentPage - 1) * c.pageSize + 1}–${Math.min(c.currentPage * c.pageSize, total)} of ${total}`}</span>
              <div className="page-nav">
                <button className="page-btn" disabled={c.currentPage === 1} onClick={() => c.goToPage(c.currentPage - 1)}>
                  <i className="fas fa-chevron-left" />
                </button>
                <button className="page-btn" disabled={c.currentPage >= c.totalPages} onClick={() => c.goToPage(c.currentPage + 1)}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}

        {!c.isLoading && c.categories.length === 0 && (
          <div className="empty-state">No category sequences configured yet. Click "Add Category" to get started.</div>
        )}
      </section>

      {c.showAddForm && (
        <div className="modal-overlay" onClick={() => c.cancelAdd()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Category</h3>
              <button className="close-btn" onClick={() => c.cancelAdd()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  Category Code <span className="required">*</span>
                </label>
                <input type="text" className="form-input" placeholder="Enter Category Code" value={c.addCategoryId} onChange={(e) => ((c.addCategoryId = e.target.value), c.update())} />
              </div>
              <div className="form-group">
                <label>
                  Category Name <span className="required">*</span>
                </label>
                <input type="text" className="form-input" placeholder="Enter category name" value={c.addCategoryName} onChange={(e) => ((c.addCategoryName = e.target.value), c.update())} />
              </div>
              <div className="form-group">
                <label>
                  Sequence <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  placeholder="e.g. 1"
                  value={c.addSequence ?? ''}
                  onKeyDown={blockKeys}
                  onChange={(e) => ((c.addSequence = numOrNull(e.target.value)), c.update())}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => c.cancelAdd()}>
                Cancel
              </button>
              <button className="save-btn" disabled={c.addDisabled} onClick={() => c.addCategory()}>
                {c.isSaving ? ' Saving... ' : ' Save '}
              </button>
            </div>
          </div>
        </div>
      )}

      {c.showEditForm && (
        <div className="modal-overlay" onClick={() => c.cancelEdit()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Category</h3>
              <button className="close-btn" onClick={() => c.cancelEdit()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Code</label>
                <input type="text" className="form-input form-input--readonly" readOnly value={c.editCategoryId} />
              </div>
              <div className="form-group">
                <label>Category Name</label>
                <input type="text" className="form-input form-input--readonly" readOnly value={c.editCategoryName} />
              </div>
              <div className="form-group">
                <label>
                  Sequence <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  placeholder="e.g. 1"
                  value={c.editSequence ?? ''}
                  onKeyDown={blockKeys}
                  onChange={(e) => ((c.editSequence = numOrNull(e.target.value)), c.update())}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => c.cancelEdit()}>
                Cancel
              </button>
              <button className="save-btn" disabled={c.editDisabled} onClick={() => c.saveEdit()}>
                {c.isSaving ? ' Saving... ' : ' Save '}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
