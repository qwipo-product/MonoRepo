// Port of IssueDetailsComponent (`app-issue-details`, chunk-JM2OTSZ2) — route /issues/details/:id. Spec 06 §5.
// Like the list, it never calls super.ngOnInit(): nothing is permission-gated.
// Faithful quirks kept on purpose (spec 06 §11): `issue` starts as {} (header renders with empty values);
// `logisticsOrderId` is read with an "s" (always undefined → "" / omitted); updateIssue never checks the
// response (success toast even on failure); Propose Resolution runs two concurrent reloads; Accept/Reject
// have no confirmation/toast; every non-PDF URL is an image; the modal locks body scroll; Esc does nothing.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Swal from 'sweetalert2';
import { getIssueStatusLabel } from '../../types/enums';
import { issueService, type IssueAction, type IssueDetails, type IssueImage, type IssueResolution } from '../../api/services/issues.service';
import {
  attachmentTitle, computeNextActionCode, dateOnly, formatDateTime, formatTime, getActorTypeByName, getAllAttachments, getAllowedNextCodes,
  getConsecutiveProposals, getImageUrl, getLatestAction, getResolutionFromAction, headerStatusText, isImage, isPdf, mapCodeToActionLabel,
  roleClass, roleLabel, statusChipLabel, timeAgo,
} from './issueDetailsHelpers';
import UploadDocumentsDialog, { type UploadDialogResult } from './UploadDocumentsDialog';
import ResolutionProposedDialog, { type ResolutionResult } from './ResolutionProposedDialog';
import './IssueDetailsPage.css';

const CLOSURE_TAGS = [{ descriptor: { code: 'CLOSURE_DETAILS' }, list: [{ descriptor: { code: 'RATING' }, value: 'THUMBS_UP' }] }];

// ---------------------------------------------------------------- attachment thumbnail

function AttachmentThumb({ img, onClick }: { img: IssueImage | string; onClick: () => void }) {
  const url = getImageUrl(img);
  const [broken, setBroken] = useState(false);
  let inner;
  if (isImage(url)) {
    // On load error the original replaces the parent's innerHTML with an (unstyled) icon + "IMAGE".
    inner = broken ? (
      <>
        <i className="fas fa-file-image" />
        <span>IMAGE</span>
      </>
    ) : (
      <img src={url} alt="attachment" onError={() => setBroken(true)} />
    );
  } else if (isPdf(url)) {
    inner = (
      <div className="file-thumb pdf">
        <i className="fas fa-file-pdf" />
        <span>PDF</span>
      </div>
    );
  } else {
    inner = (
      <div className="file-thumb">
        <i className="fas fa-file" />
        <span>FILE</span>
      </div>
    );
  }
  return (
    <div className="attachment-thumb" onClick={onClick}>
      {inner}
    </div>
  );
}

function AttachmentsBlock({ images, onOpen }: { images: (IssueImage | string)[]; onOpen: (images: (IssueImage | string)[], index: number) => void }) {
  return (
    <div className="attachments">
      <div className="attachments-title">
        <i className="fas fa-paperclip" /> Attachments ({images.length})
      </div>
      <div className="attachments-grid">
        {images.map((img, i) => (
          <AttachmentThumb key={`${getImageUrl(img)}-${i}`} img={img} onClick={() => onOpen(images, i)} />
        ))}
      </div>
    </div>
  );
}

interface ModalState { url: string; title: string }

// ---------------------------------------------------------------- page

export default function IssueDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [issue, setIssueState] = useState<IssueDetails>({}); // starts as {} (truthy) — as-built
  const issueRef = useRef<IssueDetails>({});
  const selectedStatusRef = useRef<string | undefined>(undefined);
  const [loading, setLoading] = useState(true); // the paramMap subscription starts loading before the first render
  const [statusRequestLoading, setStatusRequestLoading] = useState(false);
  const statusLoadingRef = useRef(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);

  const setIssue = (v: IssueDetails) => {
    issueRef.current = v;
    setIssueState(v);
  };

  const loadIssueDetails = useCallback(
    async (issueId: string | number) => {
      setLoading(true);
      try {
        const res = (await issueService.getIssueDetailsById(issueId)) as any;
        // A null result (2xx with success:false / no data) throws here → catch → silent redirect to /issues.
        selectedStatusRef.current = res.status;
        res.issueactions = res.actions || [];
        res.issueactors = res.actors || [];
        res.issuerefs = res.refs || [];
        res.resolutions = res.resolutions || [];
        setIssue(res);
      } catch {
        navigate('/issues');
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!id) {
      navigate('/issues');
      return;
    }
    void loadIssueDetails(id);
  }, [id, loadIssueDetails, navigate]);

  const reload = () => (id ? loadIssueDetails(id) : Promise.resolve());

  // ---------------------------------------------------------------- derived (next-action cache = per load)

  const actions: IssueAction[] = issue.issueactions || [];
  const latest = useMemo(() => getLatestAction(issue.issueactions), [issue]);
  const proposals = useMemo(() => getConsecutiveProposals(issue.issueactions), [issue]);
  const multiProposal = proposals.length > 1;
  const allAttachments = useMemo(() => getAllAttachments(issue.issueactions), [issue]);

  const nextAction = useMemo(() => {
    const code = latest?.descriptorCode;
    const allowed = getAllowedNextCodes(issue, issue.direction, code);
    const outResolutionProposed = issue.direction === 'OUT' && code === 'RESOLUTION_PROPOSED'; // case-sensitive (as-built)
    const labels = Array.from(new Set(allowed.map((c) => mapCodeToActionLabel(c, issue.direction))));
    return {
      allowed,
      perCode: allowed.length > 1 && !outResolutionProposed,
      single: allowed.length <= 1 && labels.length > 0 && !!labels.join(' or ') && !outResolutionProposed,
      label: labels.join(' or '),
      code: computeNextActionCode(allowed, code),
    };
  }, [issue, latest]);

  // ---------------------------------------------------------------- toasts

  const actionToast = (code: string) =>
    Swal.fire({
      toast: true, position: 'top-end', icon: 'success', title: `Action submitted: ${getIssueStatusLabel(code)}`,
      showConfirmButton: false, timer: 2000, background: '#f0f9ff', iconColor: '#4CAF50',
    });

  const envelope = (actionsPayload: Record<string, any>[]) => {
    const cur = issueRef.current;
    return {
      issueId: cur.id,
      level: cur.level,
      transactionId: cur.transactionId || '',
      // as-built field-name mismatch: the mapped object has `logisticOrderId`, so this is always "" (spec 06 §11)
      logisticsOrderId: (cur as any).logisticsOrderId || '',
      actions: actionsPayload,
    };
  };

  // ---------------------------------------------------------------- generic update (§5.6.1)

  const updateIssue = async (code: string, note: string, resolution?: ResolutionResult) => {
    const cur = issueRef.current;
    if (!cur) return;
    selectedStatusRef.current = code;
    const action: Record<string, any> = { code, shortDesc: note };
    if (code === 'CLOSED') action.tags = CLOSURE_TAGS;
    if (code === 'RESOLUTION_PROPOSED' && resolution) {
      action.refType = 'RESOLUTIONS';
      action.resolution = {
        code: resolution.title,
        shortDesc: note,
        tags: [
          {
            descriptor: { code: 'RESOLUTION_DETAILS' },
            list: [{ descriptor: { code: 'ITEM' } }, ...(resolution.title === 'REFUND' ? [{ descriptor: { code: 'REFUND_AMOUNT' }, value: resolution.amount }] : [])],
          },
        ],
      };
    }
    await issueService.updateIssue(envelope([action])); // response intentionally not checked (as-built)
    await reload();
    void actionToast(code);
  };

  const promptNoteAndUpdate = async (code: string) => {
    const r = await Swal.fire({
      title: 'Add note',
      text: 'Provide a short description for this action.',
      input: 'text',
      inputPlaceholder: 'Enter a short description',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (v) => (!v ? 'Please enter a short description' : null),
    });
    if (r.isConfirmed && r.value) await updateIssue(code, r.value);
  };

  const handleActionCode = (code: string | undefined) => {
    if (!code) return;
    if (code === 'INFO_PROVIDED') setUploadOpen(true);
    else if (code === 'RESOLUTION_PROPOSED') setResolutionOpen(true);
    else void promptNoteAndUpdate(code);
  };

  // ---------------------------------------------------------------- Provide Info (§5.6.2)

  const onUploadClosed = async (result: UploadDialogResult) => {
    setUploadOpen(false);
    if (!result || !result.success) return; // X → false, Esc/backdrop → undefined: no-op
    try {
      const urls: string[] = [];
      for (const file of result.payload) {
        const res: any = await issueService.fileUpload(file); // sequential, one file per call
        // a null response (no error body) throws here → catch
        if (res.data?.url) urls.push(res.data.url);
        else if (Array.isArray(res.data?.uploadedFiles)) res.data.uploadedFiles.forEach((u: any) => urls.push(u?.url));
      }
      const infoRequest = [...(issueRef.current.issueactions || [])]
        .filter((a) => a.descriptorCode === 'INFO_REQUESTED')
        .sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0))[0];
      const response: any = await issueService.updateIssue(
        envelope([{ code: 'INFO_PROVIDED', name: infoRequest?.action, refId: infoRequest?.action, images: urls, shortDesc: 'Supporting documents added to the issue' }]),
      );
      if (response.success !== false) {
        void Swal.fire({
          toast: true, position: 'top-end', icon: 'success', title: 'Supporting documents added to the issue',
          showConfirmButton: false, timer: 2000, background: '#f0f9ff', iconColor: '#6c8bc1',
        });
        await reload();
      }
    } catch (e) {
      console.error('Error uploading documents:', e);
      void Swal.fire({
        toast: true, position: 'top-end', icon: 'error', title: 'Failed to upload documents',
        showConfirmButton: false, timer: 3000, background: '#fef2f2', iconColor: '#ef4444',
      });
    }
  };

  // ---------------------------------------------------------------- Propose Resolution (§5.6.3)

  const onResolutionClosed = (result?: ResolutionResult) => {
    setResolutionOpen(false);
    if (!result) return;
    const msg = `We are proposing the ${result.title} as a resolution for this issue`;
    void updateIssue('RESOLUTION_PROPOSED', msg, result); // not awaited (as-built) …
    void reload(); // … and an immediate parallel reload
  };

  // ---------------------------------------------------------------- Accept / Reject (§5.6.4)

  const resolveTargetResolution = (arg?: IssueResolution): IssueResolution | undefined => {
    if (arg?.resolutionId) return arg;
    const cur = issueRef.current;
    const last = getLatestAction(cur.issueactions);
    if (!last?.refId) return undefined;
    return getResolutionFromAction(cur, last);
  };

  const answerResolution = async (accept: boolean, arg?: IssueResolution) => {
    const res = resolveTargetResolution(arg);
    if (!res) {
      console.error(accept ? 'No resolution found to accept' : 'No resolution found to reject');
      return;
    }
    await issueService.updateIssue(
      envelope([
        {
          code: accept ? 'RESOLUTION_ACCEPTED' : 'RESOLUTION_REJECTED',
          refId: res.resolutionId,
          refType: 'RESOLUTIONS',
          shortDesc: `We are ${accept ? 'accepting' : 'rejecting'} the resolution: ${res.descriptorCode}`,
        },
      ]),
    );
    await reload();
  };

  // ---------------------------------------------------------------- Issue Status (§5.6.6)

  const requestIssueStatus = async () => {
    const cur = issueRef.current;
    if (!cur || statusLoadingRef.current) return;
    statusLoadingRef.current = true;
    setStatusRequestLoading(true);
    try {
      const response = await issueService.requestIssueStatus({
        issueId: cur.issueId, // the ONDC issue id, not the DB id
        logisticsOrderId: (cur as any).logisticsOrderId, // always undefined → dropped from JSON (as-built)
        transactionId: cur.transactionId,
      });
      if (response && response.success !== false) {
        void Swal.fire({ toast: true, icon: 'success', title: 'Status request sent successfully', showConfirmButton: false, timer: 2000, background: '#f0f9ff', iconColor: '#4CAF50' });
        await reload();
      } else {
        void Swal.fire({
          toast: true, icon: 'error', title: response?.error?.message || 'Failed to request issue status. Please try again.',
          showConfirmButton: false, timer: 3000, background: '#fef2f2', iconColor: '#ef4444',
        });
      }
    } catch {
      void Swal.fire({ toast: true, icon: 'error', title: 'Failed to request issue status', showConfirmButton: false, timer: 3000, background: '#fef2f2', iconColor: '#ef4444' });
    } finally {
      statusLoadingRef.current = false;
      setStatusRequestLoading(false);
    }
  };

  // ---------------------------------------------------------------- attachment modal (§5.4.4)

  const openAttachmentModal = (images: (IssueImage | string)[], index: number) => {
    const url = getImageUrl(images[index]);
    setModal({ url, title: attachmentTitle(url, index + 1) });
    document.body.style.overflow = 'hidden';
  };
  const selectFromStrip = (index: number) => {
    const url = getImageUrl(allAttachments[index]);
    setModal({ url, title: attachmentTitle(url, index + 1) });
  };
  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = 'auto';
  };
  // (as-built: no Escape handler, and leaving the page with the modal open keeps body overflow hidden)

  // ---------------------------------------------------------------- render helpers

  const roleChip = (name: string | undefined, extraClass = '') => {
    const type = getActorTypeByName(issue, name);
    return <Chip size="small" className={`role-chip-pill ${roleClass(type)} ${extraClass}`.trim()} label={roleLabel(type)} />;
  };

  const renderNextButtons = () => {
    if (nextAction.perCode) {
      return nextAction.allowed.map((c) => (
        <button key={c} type="button" className="next-action-btn" onClick={() => handleActionCode(c)}>
          {mapCodeToActionLabel(c, issue.direction)}
        </button>
      ));
    }
    if (nextAction.single) {
      return (
        <button type="button" className="next-action-btn" onClick={() => handleActionCode(nextAction.code)}>
          {nextAction.label}
        </button>
      );
    }
    return null;
  };

  const renderLatestCard = (a: IssueAction, multi: boolean) => {
    const code = a.descriptorCode || '';
    const images = a.descriptorImages || [];
    return (
      <div className="latest-action-card" key={a.id || `${code}-${a.createdAt}`}>
        <div className="la-header">
          <div className="la-who">
            <span className="la-actor">{a.descriptorName || 'N/A'}</span>
            <Stack direction="row" spacing={1} aria-label="actor and status" className="la-chips">
              {roleChip(a.descriptorName)}
              <Chip size="small" className={`mat-mdc-chip status-badge ${code}`} label={statusChipLabel(code)} />
            </Stack>
          </div>
          {!multi && <div className="la-next-actions">{renderNextButtons()}</div>}
        </div>
        <div className="la-body">
          <p className="la-desc">{a.descriptorLongDesc || a.descriptorShortDesc || statusChipLabel(code)}</p>
          {a.createdAt && (
            <div className="la-time">
              <span className="material-icons">schedule</span>
              <strong>{formatTime(a.createdAt)}</strong>
              <span className="dot">•</span>
              <span>{timeAgo(a.createdAt)}</span>
            </div>
          )}
        </div>
        {images.length > 0 && <AttachmentsBlock images={images} onOpen={openAttachmentModal} />}
        {code === 'RESOLUTION_PROPOSED' && issue.direction === 'OUT' && (
          <div className="la-actions">
            <button type="button" className="la-accept" onClick={() => void answerResolution(true, multi ? getResolutionFromAction(issue, a) : undefined)}>
              <span className="material-icons">check_circle</span> Accept
            </button>
            <button type="button" className="la-reject" onClick={() => void answerResolution(false, multi ? getResolutionFromAction(issue, a) : undefined)}>
              <span className="material-icons">cancel</span> Reject
            </button>
          </div>
        )}
        {!multi && code === 'INFO_REQUESTED' && (
          <div className="info-callout">
            <span className="material-icons">warning</span>
            <span>{a.descriptorShortDesc || 'Additional information requested'}</span>
          </div>
        )}
      </div>
    );
  };

  const orderRef = (issue.issuerefs || []).find((r) => String(r.refType || '').toLowerCase() === 'order');
  // [deviation] the original renders "Provider - undefined/null" when providerName is missing (spec says guard it).
  const providerText = `Provider - ${issue.providerName ?? 'N/A'}`;

  let prevDate: string | null = null;

  return (
    <div className="issue-details-page">
      <div className="issue-header">
        <div className="header-left">
          <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <i className="fas fa-arrow-left" />
          </button>
          <div className="header-text">
            <h1>{issue.issueTitle || 'Issue Details'}</h1>
            {issue && (
              <div className="issue-meta">
                <span>Issue ID: {issue.issueId}</span>
                <span className="sep">•</span>
                <span>Created {issue.createdAt}</span>
                <span className="sep">•</span>
                <span>Updated {issue.updatedAt}</span>
              </div>
            )}
          </div>
        </div>
        {issue && (
          <div className="header-actions">
            <span className={`status-badge ${issue.status ?? ''}`}>{headerStatusText(issue.status)}</span>
            <span className="level-pill">{issue.level}</span>
            <button type="button" className="status-request-btn" title="Request current issue status" disabled={statusRequestLoading} onClick={() => void requestIssueStatus()}>
              <i className={`fas fa-sync-alt${statusRequestLoading ? ' fa-spin' : ''}`} />
              <span>{statusRequestLoading ? 'Requesting...' : 'Issue Status'}</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading issue details...</p>
        </div>
      )}

      {!loading && issue && (
        <div className="issue-grid">
          <div className="issue-content">
            {actions.length > 0 && latest && (
              <div className="latest-action-section">
                <h4 className="timeline-title">{multiProposal ? 'Latest Actions - Multiple Resolution Proposals' : 'Latest Action'}</h4>
                {multiProposal ? proposals.map((p) => renderLatestCard(p, true)) : renderLatestCard(latest, false)}
              </div>
            )}

            <div className="timeline-section">
              <h4 className="timeline-title">Timeline</h4>
              {actions.length > 0 ? (
                <List role="log" className="timeline-list" disablePadding>
                  {actions.map((a, i) => {
                    const d = dateOnly(a.createdAt);
                    const showDate = i === 0 || d !== prevDate;
                    prevDate = d;
                    const code = a.descriptorCode || '';
                    const imgs = a.descriptorImages || [];
                    return (
                      <Fragment key={a.id || `${code}-${i}`}>
                        {showDate && (
                          <div className="date-subheader">
                            <span>{d}</span>
                          </div>
                        )}
                        <ListItem className="timeline-item" disableGutters>
                          <div className="tl-line" />
                          <div className="tl-dot" />
                          <div className="tl-card">
                            <div className="tl-header">
                              <div className="tl-who">
                                <span className="tl-actor">{a.descriptorName || 'N/A'}</span>
                                {roleChip(a.descriptorName)}
                                <Chip size="small" className={`mat-mdc-chip ${code}`} label={statusChipLabel(code)} />
                              </div>
                              <div className="tl-time">
                                <span className="material-icons">schedule</span>
                                <strong>{formatTime(a.createdAt)}</strong>
                                <span className="dot">•</span>
                                <span className="ago">{timeAgo(a.createdAt)}</span>
                              </div>
                            </div>
                            <div className="tl-body">{a.descriptorLongDesc || a.descriptorShortDesc || a.descriptorCode}</div>
                            {code === 'INFO_PROVIDED' && imgs.length > 0 && <AttachmentsBlock images={imgs} onOpen={openAttachmentModal} />}
                          </div>
                        </ListItem>
                      </Fragment>
                    );
                  })}
                </List>
              ) : (
                <div className="timeline-empty">
                  <span className="material-icons">info</span>
                  <span>Issue created and awaiting actions.</span>
                </div>
              )}
            </div>
          </div>

          <div className="issue-sidebar">
            <div className="info-card">
              <h3 className="card-title">
                <span className="title-badge hash">#</span> Issue Information
              </h3>
              <div className="info-row">
                <label>Level</label>
                <span className="pill level">{issue.level}</span>
              </div>
              <div className="info-row">
                <label>Current Status</label>
                <span className={`pill status status-badge ${issue.status ?? ''}`}>{headerStatusText(issue.status)}</span>
              </div>
              <hr className="divider" />
              <div className="sub-title">Timeline</div>
              <div className="mini-timeline">
                <div className="mt-item">
                  <span className="mt-circle created" />
                  <div>
                    <label>Created</label>
                    <div className="value">{issue.createdAt}</div>
                  </div>
                </div>
                <div className="mt-item">
                  <span className="mt-circle updated" />
                  <div>
                    <label>Last Updated</label>
                    <div className="value">{issue.updatedAt}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3 className="card-title">
                <span className="title-badge">
                  <i className="fas fa-cube" />
                </span>{' '}
                Related Information
              </h3>
              <div className="related-item">
                <div className="small-caps">ORDER</div>
                <span className="related-pill">{orderRef ? `Order - ${orderRef.refId}` : 'Order - N/A'}</span>
              </div>
              <div className="related-item">
                <div className="small-caps">FULFILLMENT</div>
                <span className="related-pill">{issue.fulfillmentName || 'N/A'}</span>
              </div>
              <div className="related-item">
                <div className="small-caps">PROVIDER</div>
                <span className="related-pill">{providerText}</span>
              </div>
            </div>

            {(issue.issueactors || []).length > 0 && (
              <div className="info-card">
                <h3 className="card-title">
                  <i className="far fa-user" /> Actors
                </h3>
                {(issue.issueactors || []).map((actor, i) => (
                  <div className="actor-row" key={actor.actorId || i}>
                    <div className="actor-info">
                      <div className="actor-name">{actor.personName || actor.orgName || 'N/A'}</div>
                      {actor.createdAt && (
                        <div className="actor-created">
                          <i className="far fa-clock" /> Created at {formatDateTime(actor.createdAt)}
                        </div>
                      )}
                    </div>
                    <Chip size="small" className={`role-chip-pill actor-role ${roleClass(actor.actorType)}`} label={roleLabel(actor.actorType)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="attachment-modal-overlay" onClick={closeModal}>
          <div className="attachment-modal" onClick={(e: MouseEvent) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">
              <i className="fas fa-times" />
            </button>
            <div className="modal-main">
              {isImage(modal.url) ? (
                <img src={modal.url} alt={modal.title} />
              ) : (
                <div className="modal-file">
                  <i className={isPdf(modal.url) ? 'fas fa-file-pdf pdf' : 'fas fa-file'} />
                  <div className="modal-file-title">{modal.title}</div>
                </div>
              )}
            </div>
            <div className="modal-footer-row">
              <span className="modal-title">{modal.title}</span>
              <a className="download-link" href={modal.url} download={modal.title}>
                <i className="fas fa-download" /> Download
              </a>
            </div>
            {allAttachments.length > 1 && (
              <div className="modal-strip">
                {allAttachments.map((img, i) => {
                  const u = getImageUrl(img);
                  return (
                    <div key={`${u}-${i}`} className={`strip-thumb${u === modal.url ? ' active' : ''}`} onClick={() => selectFromStrip(i)}>
                      {isImage(u) ? <img src={u} alt={`Attachment ${i + 1}`} /> : <i className={isPdf(u) ? 'fas fa-file-pdf pdf' : 'fas fa-file'} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <UploadDocumentsDialog open={uploadOpen} data={{ issueId: issue.id }} onClose={(r) => void onUploadClosed(r)} />
      <ResolutionProposedDialog open={resolutionOpen} data={{ issueId: issue.id, issue, onRejectResolution: () => void answerResolution(false) }} onClose={onResolutionClosed} />
    </div>
  );
}
