// Port of IssuesComponent (`app-issues`, chunk-FDHXV3JO) — route /issues. Spec 06 §4.
// The original extends the permission base (page id buyer_issues) but overrides ngOnInit WITHOUT calling
// super.ngOnInit(), so permissions/buyerId are never filled: nothing is gated and buyerId is always "" (§1).
import { useState, useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';
import Paginator from '../../components/Paginator';
import { issueService, type IssueListItem, type IssuePagination, type IssueStats } from '../../api/services/issues.service';
import './IssuesPage.css';

// ---------------------------------------------------------------- pure helpers (exported for reuse/tests)

/** List-style timeAgo (spec 06 §2.4): "N sec(s) ago", "N minute(s) ago", "N hour(s) ago", "N day(s) ago"; invalid → "N/A". */
export function listTimeAgo(value: any): string {
  if (!value) return 'N/A';
  const t = new Date(value).getTime();
  if (isNaN(t)) return 'N/A';
  const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
  const unit = (n: number, u: string) => `${n} ${u}${n === 1 ? '' : 's'} ago`;
  if (secs < 60) return unit(secs, 'sec');
  const mins = Math.floor(secs / 60);
  if (mins < 60) return unit(mins, 'minute');
  const hours = Math.floor(mins / 60);
  if (hours < 24) return unit(hours, 'hour');
  return unit(Math.floor(hours / 24), 'day');
}

/** Pill text comes from issue.status; anything but the 4 filterable statuses → empty text (§4.1). */
export function listStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'OPEN': return 'Open';
    case 'PROCESSING': return 'Processing';
    case 'RESOLVED': return 'Resolved';
    case 'CLOSED': return 'Closed';
    default: return '';
  }
}

/** Pill colour class comes from the LATEST action code, falling back to status (§4.1). */
export function listStatusClass(issue: IssueListItem): string {
  const code = issue.issueactions?.[0]?.descriptor_code || issue.status;
  switch (code) {
    case 'OPEN': return 'open';
    case 'PROCESSING':
    case 'INFO_REQUESTED': return 'processing';
    case 'RESOLVED':
    case 'RESOLUTION_ACCEPTED': return 'resolved';
    case 'CLOSED': return 'closed';
    default: return 'processing';
  }
}

export function directionLabel(direction: string | undefined): string {
  const d = (direction || '').toUpperCase();
  if (d === 'OUT') return 'Created by us';
  if (d === 'IN') return 'Received';
  return d || 'N/A';
}
function directionClass(direction: string | undefined): string {
  const d = (direction || '').toUpperCase();
  return d === 'OUT' ? 'dir-out' : d === 'IN' ? 'dir-in' : 'dir-unknown';
}
function counterpartyName(issue: IssueListItem): string {
  const a = (issue.issueactors || []).find((x) => x.actor_type === 'COUNTERPARTY_NP');
  return a?.person_name || a?.org_name || 'N/A';
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];
const LEVEL_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'DISPUTE', label: 'Dispute' },
  { value: 'GRIEVANCE', label: 'Grievance' },
];

interface PageState {
  issues: IssueListItem[];
  displayIssues: IssueListItem[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
  pagination: IssuePagination;
  stats: IssueStats;
  selectedStatus: string;
  selectedLevel: string;
  searchQuery: string;
  loading: boolean;
}

export default function IssuesPage() {
  const navigate = useNavigate();
  // Mutable component state (mirrors the Angular component fields); `rerender` flushes it to the view.
  const [s] = useState<PageState>(() => ({
    issues: [],
    displayIssues: [],
    totalItems: 0,
    pageSize: 10,
    currentPage: 1,
    pagination: { pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
    stats: { totalIssues: 0, open: 0, processing: 0, resolved: 0, closed: 0 },
    selectedStatus: '',
    selectedLevel: '',
    searchQuery: '',
    loading: true, // ngOnInit → loadIssues() sets loading before the first render
  }));
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  const loadIssues = useCallback(async (): Promise<void> => {
    s.loading = true;
    rerender();
    try {
      const result = await issueService.getByFilters({
        pageNumber: s.currentPage,
        pageSize: s.pagination.pageSize,
        issueId: '',
        buyerId: '', // as-built: base-class buyerId is never initialised (spec 06 §1)
        logisticsOrderId: '',
        createdDate: '',
        searchText: s.searchQuery,
        status: s.selectedStatus,
        level: s.selectedLevel,
      });
      if (result) {
        s.issues = result.issues;
        s.stats = result.stats || s.stats;
        s.pagination = result.pagination || s.pagination;
        s.totalItems = s.pagination.totalCount;
        s.pageSize = s.pagination.pageSize;
        if (s.issues.length === 0 && s.pagination.totalCount > 0) {
          // [deviation] the original resets to page 1 and reloads unconditionally, which loops forever if the
          // backend keeps returning empty rows with a non-zero count; we only jump when not already on page 1.
          if (s.currentPage !== 1) {
            s.currentPage = 1;
            s.pagination = { ...s.pagination, pageNumber: 1 };
            void loadIssues(); // returned, not awaited (loading flips to false while it is in flight — as-built)
            return;
          }
        }
        s.displayIssues = [...s.issues];
      } else {
        // null result: keep previous rows, stats and pagination on screen (as-built)
        s.issues = [];
        s.totalItems = 0;
      }
    } catch {
      s.issues = [];
      s.totalItems = 0;
    } finally {
      s.loading = false;
      rerender();
    }
  }, [s]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  const resetToFirstPage = () => {
    s.currentPage = 1;
    s.pagination = { ...s.pagination, pageNumber: 1 };
  };

  const setStatusFilter = (code: string) => {
    s.selectedStatus = s.selectedStatus === code ? '' : code;
    resetToFirstPage();
    rerender();
    void loadIssues();
  };

  const onLevelChange = (value: string) => {
    s.selectedLevel = value || '';
    resetToFirstPage();
    rerender();
    void loadIssues();
  };

  // Every keystroke, no debounce. Reload only when empty, or ≥3 letters [a-zA-Z] and not whitespace-only.
  const onSearchChange = (value: string) => {
    s.searchQuery = value;
    rerender();
    const letters = (value.match(/[a-zA-Z]/g) || []).length;
    if (value.length === 0 || (letters >= 3 && value.trim().length > 0)) {
      resetToFirstPage();
      void loadIssues();
    }
  };

  const clearFilters = () => {
    s.selectedStatus = '';
    s.selectedLevel = '';
    s.searchQuery = '';
    resetToFirstPage();
    rerender();
    void loadIssues();
  };

  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    let pageIndex = e.pageIndex;
    if (e.pageSize !== s.pagination.pageSize) {
      // mat-paginator keeps the first visible row on screen when the page size changes (no reset to page 1).
      const firstRow = (s.currentPage - 1) * s.pagination.pageSize;
      pageIndex = Math.floor(firstRow / e.pageSize);
    }
    s.pageSize = e.pageSize;
    s.currentPage = pageIndex + 1;
    s.pagination = { ...s.pagination, pageNumber: s.currentPage, pageSize: e.pageSize };
    void loadIssues();
  };

  const hasFilters = !!(s.selectedStatus || s.selectedLevel || s.searchQuery);
  const cards = [
    { code: 'OPEN', cls: 'open', label: 'Open', count: s.stats.open },
    { code: 'PROCESSING', cls: 'in-progress', label: 'Processing', count: s.stats.processing },
    { code: 'RESOLVED', cls: 'resolved', label: 'Resolved', count: s.stats.resolved },
    { code: 'CLOSED', cls: 'closed', label: 'Closed', count: s.stats.closed },
  ];

  return (
    <div className="issues-page">
      <div className="issues-container">
        <div className="issues-header">
          <h1>Issues</h1>
          <p className="subtitle">Manage and track all issues across the ONDC network</p>
        </div>

        <div className="status-cards">
          {cards.map((c) => (
            <div key={c.code} className={`status-card ${c.cls}${s.selectedStatus === c.code ? ' active' : ''}`} onClick={() => setStatusFilter(c.code)}>
              <div className="status-count">{c.count}</div>
              <div className="status-label">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="filters-panel">
          <h3 className="filters-title">
            <i className="fas fa-filter" /> Filters &amp; Search
          </h3>
          <div className="filters-row">
            <div className="search-box">
              <i className="fas fa-search" />
              <input type="text" placeholder="Search issues..." value={s.searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
            </div>
            <select className="filter-select" value={s.selectedStatus} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select className="filter-select" value={s.selectedLevel} onChange={(e) => onLevelChange(e.target.value)}>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="total-count">Total: {s.pagination.totalCount || 0} issues</span>
            {hasFilters && (
              <button type="button" className="clear-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {s.loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading issues...</p>
          </div>
        )}

        {!s.loading && s.displayIssues.length > 0 && (
          <div className="issues-table">
            <div className="table-row table-header">
              <div>Issue Details</div>
              <div>Status</div>
              <div>Level</div>
              <div>Direction</div>
              <div>Counterparty NP</div>
              <div>Created</div>
              <div>Last Updated</div>
              <div className="actions-col">Actions</div>
            </div>
            {s.displayIssues.map((issue) => (
              <div className="table-row" key={String(issue.id)}>
                <div className="issue-details-cell">
                  <div className="issue-title-line">
                    <span className="issue-title">{issue.descriptorShortDesc}</span>
                    {(issue.issueactions?.length ?? 0) <= 2 && <span className="new-tag">New</span>}
                  </div>
                  <div className="issue-id">{issue.issueId}</div>
                </div>
                <div>
                  <span className={`status-pill ${listStatusClass(issue)}`}>{listStatusLabel(issue.status)}</span>
                </div>
                <div>
                  <span className="level-chip">{issue.level}</span>
                </div>
                <div>
                  <span className={`direction-chip ${directionClass(issue.direction)}`}>{directionLabel(issue.direction)}</span>
                </div>
                <div className="counterparty">{counterpartyName(issue)}</div>
                <div className="date-cell">
                  <i className="far fa-calendar" />
                  <strong>{listTimeAgo(issue.createdAt)}</strong>
                </div>
                <div className="date-cell">
                  <i className="far fa-calendar" />
                  <span>{listTimeAgo(issue.updatedAt)}</span>
                </div>
                <div className="actions-col">
                  <button type="button" className="view-details-btn" onClick={() => navigate(`/issues/details/${issue.id}`)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!s.loading && s.displayIssues.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-inbox" />
            <p>No issues found</p>
          </div>
        )}

        {!s.loading && s.displayIssues.length > 0 && (
          <div className="d-flex justify-content-between align-items-center bg-white mt-2 issues-paginator">
            <div className="text-muted small" />
            <div aria-label="Select page of issues">
              <Paginator
                length={s.pagination.totalCount}
                pageSize={s.pagination.pageSize}
                pageSizeOptions={[5, 10, 25, 50]}
                pageIndex={s.currentPage - 1}
                onPage={onPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
