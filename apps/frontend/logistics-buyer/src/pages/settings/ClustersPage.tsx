// Clusters list (/settings/clusters, spec 08 §5): client-side search & paging (fixed 9 per page), delete confirm.
// As-built: the page is NOT adjusted after a delete (blank grid when the last card of the last page is removed).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { authService } from '../../api/services/auth.service';
import { clustersService, type Cluster, type ClusterVehicle } from '../../api/services/clusters.service';
import './ClustersPage.css';

const PAGE_SIZE = 9;
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Angular date:'dd/MM/yy' (local time). */
const fmtShort = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
};
const kgOf = (v: ClusterVehicle) => v.volumetricCapacityKg || v.weightCapacityKg;

export default function ClustersPage() {
  const navigate = useNavigate();
  const [buyerId] = useState(() => authService.getCurrentUser()?.id || '');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [vehicleById, setVehicleById] = useState<Map<string, ClusterVehicle>>(new Map());
  const [isLoading, setIsLoading] = useState(() => !!authService.getCurrentUser()?.id); // ngOnInit sets it before first paint
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    if (!buyerId) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const [list, vehicles] = await Promise.allSettled([clustersService.list(buyerId), clustersService.availableVehicles(buyerId)]);
      setClusters(list.status === 'fulfilled' ? list.value : []);
      setLoadError(list.status === 'rejected'); // only the cluster list failing is an error
      if (list.status === 'rejected') console.error('Error loading clusters', list.reason);
      const vs = vehicles.status === 'fulfilled' ? vehicles.value : []; // vehicles failing → silently []
      setVehicleById(new Map(vs.map((v) => [v.id, v])));
    } finally {
      setIsLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    load();
  }, [load]);

  const vehiclesOf = useCallback(
    (c: Cluster) => (c.vehicleIds || []).map((id) => vehicleById.get(id)).filter((v): v is ClusterVehicle => !!v),
    [vehicleById],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.beats || []).some((b) => (b.beatName || '').toLowerCase().includes(q)) ||
        vehiclesOf(c).some((v) => (v.registrationNumber || '').toLowerCase().includes(q)),
    );
  }, [clusters, search, vehiclesOf]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const onSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const remove = async (c: Cluster) => {
    const res = await Swal.fire({
      title: `Delete cluster "${c.name}"?`,
      text: 'Its beats will become available again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    try {
      await clustersService.remove(c.id, buyerId);
      await load();
      Swal.fire({ icon: 'success', title: `Cluster "${c.name}" deleted`, timer: 1800, showConfirmButton: false, toast: true, position: 'top' });
    } catch (e: any) {
      console.error('Error deleting cluster', e);
      Swal.fire({ icon: 'error', title: 'Error', text: e?.error?.error?.message || 'Failed to delete cluster.' });
    }
  };

  const addButton = (
    <button className="btn-primary" onClick={() => navigate('/settings/clusters/new')}>
      <i className="fas fa-plus" /> Add Cluster
    </button>
  );

  return (
    <div className="clusters-page">
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h2>Clusters</h2>
            <p className="section-desc">Group beats onto vehicles. The Cluster Beat Optimizer loads each vehicle only from the beats in its cluster.</p>
          </div>
          {addButton}
        </div>

        <div className="search-bar">
          <i className="fas fa-search search-icon" />
          <input type="text" className="search-input" placeholder="Search clusters by name, beat or vehicle..." value={search} onChange={(e) => onSearch(e.target.value)} />
          {search && (
            <button className="input-clear-btn" aria-label="Clear search" onClick={() => onSearch('')}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="cluster-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="cluster-card skeleton-card" key={i}>
                <div className="sk-line sk-title" />
                <div className="sk-line" style={{ width: '40%' }} />
                <div className="sk-line" style={{ width: '80%' }} />
                <div className="sk-line" style={{ width: '80%' }} />
                <div className="sk-line" style={{ width: '65%' }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && loadError && (
          <div className="load-error">
            <i className="fas fa-triangle-exclamation" />
            <p>Something went wrong while loading clusters. Please try again after some time.</p>
            <button className="retry-btn" onClick={() => load()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <>
            <div className="cluster-grid">
              {paged.map((c) => {
                const vs = vehiclesOf(c);
                return (
                  <div className="cluster-card" key={c.id}>
                    <div className="card-top">
                      <h3 title={c.name}>{c.name.length > 50 ? c.name.slice(0, 50) + '…' : c.name}</h3>
                      <div className="card-actions">
                        <button className="edit-btn" title="Edit" onClick={() => navigate(`/settings/clusters/${c.id}/edit`)}>
                          <i className="fas fa-pen" />
                        </button>
                        <button className="delete-btn" title="Delete" onClick={() => remove(c)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                    <div className="card-meta">created {fmtShort(c.createdAt)}</div>
                    <div className="vehicle-list">
                      {vs.map((v) => (
                        <div className="vehicle-row" key={v.id}>
                          <div className="vehicle-icon">
                            <i className="fas fa-truck" />
                          </div>
                          <div className="vehicle-info">
                            <div className="vehicle-reg">{v.registrationNumber}</div>
                            <div className="vehicle-sub">
                              {v.name && <span>{v.name}</span>}
                              {kgOf(v) && <span>{` · ${kgOf(v)} kg`}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {vs.length === 0 && <div className="no-vehicles">No vehicles assigned</div>}
                    </div>
                    <div className="beats-block">
                      <div className="beats-label">{(c.beats || []).length} BEATS</div>
                      <div className="beat-chips">
                        {(c.beats || []).map((b) => (
                          <span className="beat-chip" key={b.id}>
                            {b.beatName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > PAGE_SIZE && (
              <div className="pagination-container">
                <span className="page-info">{`${rangeStart} – ${rangeEnd} of ${filtered.length}`}</span>
                <div className="page-nav">
                  <button className="page-btn" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                    <i className="fas fa-chevron-left" />
                  </button>
                  <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">No clusters yet</p>
            <p>Create a cluster to keep a set of beats on one vehicle.</p>
            {addButton}
          </div>
        )}
      </section>
    </div>
  );
}
