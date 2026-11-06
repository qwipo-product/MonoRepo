// Cluster editor (/settings/clusters/new and /settings/clusters/:id/edit, spec 08 §6).
// Beats in other clusters are disabled; inactive vehicles are always disabled — so an inactive vehicle already in this
// cluster stays checked but cannot be unselected (as-built). Retry reloads everything and, in edit mode, re-applies the
// server name/selections (discarding unsaved edits).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import { authService } from '../../api/services/auth.service';
import { beatsService, type Beat } from '../../api/services/beats.service';
import { clustersService, type ClusterVehicle } from '../../api/services/clusters.service';
import { validateNameLength } from '../../utils/helpers';
import './ClusterEditorPage.css';

const kgOf = (v: ClusterVehicle) => v.volumetricCapacityKg || v.weightCapacityKg;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="pick-item skeleton" key={i}>
          <div className="sk-check" />
          <div className="sk-lines">
            <div className="sk-line" style={{ width: '70%' }} />
            <div className="sk-line" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function ClusterEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ?? null;
  const [buyerId] = useState(() => authService.getCurrentUser()?.id || '');

  const [name, setName] = useState('');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [vehicles, setVehicles] = useState<ClusterVehicle[]>([]);
  const [beatSearch, setBeatSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(new Set());
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(() => !!authService.getCurrentUser()?.id); // ngOnInit sets it before first paint
  const [isSaving, setIsSaving] = useState(false);
  const [beatsError, setBeatsError] = useState(false);
  const [vehiclesError, setVehiclesError] = useState(false);

  const load = useCallback(async () => {
    if (!buyerId) return;
    setIsLoading(true);
    setBeatsError(false);
    setVehiclesError(false);
    try {
      const [b, v] = await Promise.allSettled([beatsService.list(buyerId, { pageNumber: 1, pageSize: 1000 }), clustersService.availableVehicles(buyerId)]);
      if (b.status === 'fulfilled') setBeats(b.value?.beats ?? []);
      else {
        setBeatsError(true);
        console.error('Error loading beats', b.reason);
      }
      if (v.status === 'fulfilled') setVehicles(v.value);
      else {
        setVehiclesError(true);
        console.error('Error loading vehicles', v.reason);
      }
      if (editingId) {
        const cluster = await clustersService.getById(editingId, buyerId);
        if (cluster) {
          setName(cluster.name);
          setSelectedBeatIds(new Set((cluster.beats || []).map((x) => x.id)));
          setSelectedVehicleIds(new Set(cluster.vehicleIds || []));
        }
      }
    } catch (e) {
      console.error('Error loading cluster editor', e); // form stays empty, no message
    } finally {
      setIsLoading(false);
    }
  }, [buyerId, editingId]);

  useEffect(() => {
    load();
  }, [load]);

  // ------------------------------------------------------------ selection rules (§6.4)
  const isBeatDisabled = (b: Beat) => !!b.clusterId && b.clusterId !== editingId;
  const filteredBeats = useMemo(() => {
    const q = beatSearch.trim().toLowerCase();
    if (!q) return beats;
    return beats.filter((b) => (b.beatName || '').toLowerCase().includes(q) || String(b.area || '').toLowerCase().includes(q));
  }, [beats, beatSearch]);
  const selectableBeats = filteredBeats.filter((b) => !isBeatDisabled(b));
  const allBeatsSelected = selectableBeats.length > 0 && selectableBeats.every((b) => selectedBeatIds.has(b.id));

  const toggleBeat = (b: Beat) => {
    if (isBeatDisabled(b)) return;
    setSelectedBeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(b.id)) next.delete(b.id);
      else next.add(b.id);
      return next;
    });
  };
  const toggleSelectAllBeats = () => {
    setSelectedBeatIds((prev) => {
      const next = new Set(prev);
      if (allBeatsSelected) selectableBeats.forEach((b) => next.delete(b.id));
      else selectableBeats.forEach((b) => next.add(b.id));
      return next;
    });
  };

  const isVehicleDisabled = (v: ClusterVehicle) => v.state === 'inactive' || (v.state === 'assigned' && v.assignedClusterId !== editingId);
  const vehicleBadge = (v: ClusterVehicle): { kind: string; text: string } => {
    if (v.state === 'inactive') return { kind: 'inactive', text: 'Inactive' };
    if (v.state === 'assigned' && v.assignedClusterId !== editingId) return { kind: 'assigned', text: `In ${v.assignedClusterName}` };
    return { kind: 'available', text: 'Available' };
  };
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => (v.registrationNumber || '').toLowerCase().includes(q));
  }, [vehicles, vehicleSearch]);
  const toggleVehicle = (v: ClusterVehicle) => {
    if (isVehicleDisabled(v)) return;
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(v.id)) next.delete(v.id);
      else next.add(v.id);
      return next;
    });
  };

  // ------------------------------------------------------------ validation & save (§6.5)
  const nameError = validateNameLength(name, 'Cluster name');
  const isNameValid = !!name.trim() && !nameError;
  const missing: string[] = [];
  if (!isNameValid) missing.push('a valid cluster name');
  if (selectedBeatIds.size === 0) missing.push('at least one beat');
  if (selectedVehicleIds.size === 0) missing.push('a vehicle');
  const saveHint = missing.length ? `Add ${missing.join(', ')} to continue.` : '';
  const saveDisabled = isSaving || !isNameValid || selectedBeatIds.size === 0 || selectedVehicleIds.size === 0;

  const save = async () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Cluster name is required.');
    else if (nameError) errors.push(nameError);
    if (selectedBeatIds.size === 0) errors.push('Select at least one beat.');
    if (selectedVehicleIds.size === 0) errors.push('Select a vehicle.');
    if (errors.length) {
      let html = errors.map((m) => `<div>${m}</div>`).join('');
      if (errors.length > 1) html += '<div style="margin-top:10px">Add a cluster name, at least one beat, and a vehicle.</div>';
      Swal.fire({ icon: 'warning', title: 'Missing details', html });
      return;
    }
    setIsSaving(true);
    const trimmed = name.trim();
    const body = { buyerId, name: trimmed, beatIds: [...selectedBeatIds], vehicleIds: [...selectedVehicleIds] };
    const toast = (title: string) => Swal.fire({ icon: 'success', title, timer: 1800, showConfirmButton: false, toast: true, position: 'top' });
    try {
      if (editingId) {
        await clustersService.update(editingId, body);
        navigate('/settings/clusters');
        toast(`"${trimmed}" updated`);
      } else {
        await clustersService.create(body);
        navigate('/settings/clusters');
        const n = body.beatIds.length;
        toast(`"${trimmed}" created with ${n} ${n === 1 ? 'beat' : 'beats'}`);
      }
    } catch (e: any) {
      console.error('Error saving cluster', e);
      Swal.fire({ icon: 'error', title: 'Error', text: e?.error?.error?.message || 'Failed to save cluster.' }); // stays on the editor
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cluster-editor-page">
      <div className="editor-wrap">
        <button className="back-link" onClick={() => navigate('/settings/clusters')}>
          <i className="fas fa-arrow-left" /> Back to Clusters
        </button>

        <div className="title-block">
          <h1>
            <i className="fas fa-layer-group title-icon" />
            {editingId ? ' Edit Cluster' : ' Add Cluster'}
          </h1>
          <p>Group beats together and tag vehicles to them. The Cluster Beat Optimizer loads these vehicles only from the beats in this cluster.</p>
        </div>

        <div className="name-row">
          <div className="form-group">
            <label>
              Cluster Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input${nameError ? ' invalid' : ''}`}
              placeholder="e.g. West Hyderabad Cluster"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <div className="field-error">{nameError}</div>}
          </div>
        </div>

        <div className="panels">
          {/* ---------------------------------------------------------- beats */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-map-marker-alt" />
                <span>
                  Select Beats <span className="required">*</span>
                </span>
                <span className="count-pill">{selectedBeatIds.size} selected</span>
              </div>
              <button className="link-btn" onClick={toggleSelectAllBeats}>
                {allBeatsSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="panel-search">
              <i className="fas fa-search search-icon" />
              <input type="text" placeholder="Search beats by name or area..." value={beatSearch} onChange={(e) => setBeatSearch(e.target.value)} />
              {beatSearch && (
                <button className="input-clear-btn" aria-label="Clear search" onClick={() => setBeatSearch('')}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <div className="pick-list">
              {isLoading ? (
                <SkeletonRows />
              ) : beatsError ? (
                <div className="pick-error">
                  <i className="fas fa-triangle-exclamation" />
                  <p>Something went wrong while loading beats. Please try again after some time.</p>
                  <button className="retry-btn" onClick={() => load()}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {filteredBeats.map((b) => {
                    const disabled = isBeatDisabled(b);
                    return (
                      <label className={`pick-item${disabled ? ' disabled' : ''}`} key={b.id}>
                        <input type="checkbox" checked={selectedBeatIds.has(b.id)} disabled={disabled} onChange={() => toggleBeat(b)} />
                        <div className="pick-text">
                          <div className="pick-name">{b.beatName}</div>
                          {b.area && <div className="pick-sub">{b.area as string}</div>}
                        </div>
                        {disabled && <span className="pick-badge assigned">In {b.clusterName}</span>}
                      </label>
                    );
                  })}
                  {filteredBeats.length === 0 && <div className="pick-empty">No beats found.</div>}
                </>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- vehicles */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-truck" />
                <span>
                  Select Vehicles <span className="required">*</span>
                </span>
                <span className="count-pill">{selectedVehicleIds.size} selected</span>
              </div>
            </div>
            <div className="panel-search">
              <i className="fas fa-search search-icon" />
              <input type="text" placeholder="Search vehicles by number..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} />
              {vehicleSearch && (
                <button className="input-clear-btn" aria-label="Clear search" onClick={() => setVehicleSearch('')}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <div className="pick-list">
              {isLoading ? (
                <SkeletonRows />
              ) : vehiclesError ? (
                <div className="pick-error">
                  <i className="fas fa-triangle-exclamation" />
                  <p>Something went wrong while loading vehicles. Please try again after some time.</p>
                  <button className="retry-btn" onClick={() => load()}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {filteredVehicles.map((v) => {
                    const disabled = isVehicleDisabled(v);
                    const badge = vehicleBadge(v);
                    return (
                      <label className={`pick-item${disabled ? ' disabled' : ''}`} key={v.id}>
                        <input type="checkbox" checked={selectedVehicleIds.has(v.id)} disabled={disabled} onChange={() => toggleVehicle(v)} />
                        <div className="pick-text">
                          <div className="pick-name">
                            {v.registrationNumber}
                            {kgOf(v) && <span className="pick-kg">{`${kgOf(v)} kg`}</span>}
                          </div>
                          {v.name && <div className="pick-sub">{v.name}</div>}
                        </div>
                        <span className={`pick-badge ${badge.kind}`}>{badge.text}</span>
                      </label>
                    );
                  })}
                  {filteredVehicles.length === 0 && <div className="pick-empty">No vehicles found.</div>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <div className="footer-summary">{`${selectedBeatIds.size} beats · ${selectedVehicleIds.size} vehicles selected`}</div>
          <div className="footer-actions">
            <button className="cancel-btn" onClick={() => navigate('/settings/clusters')}>
              Cancel
            </button>
            <span className="save-hint-wrap" title={saveHint}>
              <button className="save-btn" disabled={saveDisabled} onClick={save}>
                {editingId ? 'Save Changes' : 'Create Cluster'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
