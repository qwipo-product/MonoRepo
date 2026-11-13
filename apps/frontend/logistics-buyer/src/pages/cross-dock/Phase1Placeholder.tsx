import { PROFILES } from '../../profiles';
import type { Phase1Page } from './phase1Pages';
import './Phase1Placeholder.css';

/** A cross-dock page that is planned but not built yet: what it is for, what it will do, which statuses it sets. */
export default function Phase1Placeholder({ page }: { page: Phase1Page }) {
  const profile = PROFILES[page.profile];
  const icon = profile.menu.find((m) => m.to === page.path)?.icon ?? 'fa-file';

  return (
    <div className="px-3 phase1-page">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="d-flex align-items-center">
            <i className={`fas ${icon} text-primary me-2 fs-5`} />
            <h1 className="fs-3 mb-0 fw-bold">{page.title}</h1>
          </div>
          <p className="text-muted small mb-0">{page.purpose}</p>
        </div>
        <span className="phase1-badge">
          <i className="fas fa-hammer me-1" />
          Coming in a later phase
        </span>
      </div>

      <section className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h2 className="phase1-heading">What this page will do</h2>
          <ul className="mb-0 phase1-list">
            {page.willDo.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      {page.statuses && (
        <section className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h2 className="phase1-heading">Order statuses set here</h2>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {page.statuses.map((s, i) => (
                <span key={s} className="d-inline-flex align-items-center gap-2">
                  {i > 0 && <i className="fas fa-arrow-right text-muted small" aria-hidden="true" />}
                  <span className="phase1-status">{s}</span>
                </span>
              ))}
            </div>
            <p className="text-muted small mb-0 mt-2">Indicative names. The final names come with the user stories.</p>
          </div>
        </section>
      )}

      <p className="text-muted small">
        Signed in as the {profile.label}. Phase 1 sets up this user, their sign-in and their menu; this page is built in a later phase.
      </p>
    </div>
  );
}
