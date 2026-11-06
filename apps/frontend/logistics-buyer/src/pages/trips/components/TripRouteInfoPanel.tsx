// Port of <app-trip-route-info-panel> (spec 04 §7.4) — left panel of the single-trip map modal.
import { useState } from 'react';
import type { RouteDetails } from '../../../api/services/logisticsOrders.service';
import { ngNumber, parseCoherenceReason } from '../tripUtils';

interface Props {
  routeDetails: RouteDetails | null;
  isLoading: boolean;
}

export default function TripRouteInfoPanel({ routeDetails: rd, isLoading }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="trip-route-info-panel">
        <div className="rip-loading">
          <div className="rip-spinner" />
          <span>Loading route details...</span>
        </div>
      </div>
    );
  }
  if (!rd || rd.customerCount === null || rd.customerCount === undefined) {
    return (
      <div className="trip-route-info-panel">
        <div className="rip-empty">
          <i className="fas fa-info-circle" />
          <span>Route optimization details are not available for this trip.</span>
        </div>
      </div>
    );
  }

  // `!== null` checks only: an *undefined* field renders "null km" / "₹null" / "null kg" (as-built).
  const line1 = `${rd.customerCount} stops · ${rd.distanceKm !== null ? ngNumber(rd.distanceKm, '1.1-1') + ' km' : 'N/A'}`;
  const line2 = `${rd.totalAmount !== null ? '₹' + ngNumber(rd.totalAmount, '1.2-2') : 'N/A'} · ${rd.estimatedTimeFormatted || 'N/A'} · ${rd.registrationNumber || 'N/A'}`;
  const line3 =
    `Wt: ${rd.totalWeightKg !== null ? ngNumber(rd.totalWeightKg, '1.2-2') + ' kg' : 'N/A'} · ` +
    `Vol: ${rd.totalVolWeightKg !== null ? ngNumber(rd.totalVolWeightKg, '1.2-2') + ' kg' : 'N/A'} · ` +
    `Cap: ${rd.vehicleCapacityKg ? ngNumber(rd.vehicleCapacityKg, '1.1-1') + ' kg' : 'N/A'}`;
  const score = rd.beatCoherenceScore;
  const showCoherence = !!rd.beatCoherenceReason && score !== null && score !== undefined && score < 100;
  const parsed = showCoherence ? parseCoherenceReason(rd.beatCoherenceReason as string) : null;

  return (
    <div className="trip-route-info-panel">
      <div className="rip-section">
        <div className="rip-title-row">
          <span className="rip-title">Route</span>
          {rd.routeDirection && <span className="direction-badge">{rd.routeDirection}</span>}
        </div>
        <div className="rip-line">{line1}</div>
        <div className="rip-line">{line2}</div>
        <div className="rip-line">{line3}</div>
      </div>
      <div className="rip-kpi">
        <div className="rip-kpi-row">
          <div>
            <div className="rip-kpi-label">Vehicle Utilized</div>
            {rd.vehicleUtilized !== null && rd.vehicleUtilized !== undefined ? (
              <div className="rip-kpi-value">{ngNumber(rd.vehicleUtilized, '1.0-0')}%</div>
            ) : (
              <div className="rip-kpi-value na">N/A</div>
            )}
          </div>
          <button type="button" className="rip-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲ Hide details' : '▼ Show details'}
          </button>
        </div>
        {expanded && (
          <div className="rip-expanded">
            {rd.routeExplanation && <div className="rip-explanation">{rd.routeExplanation}</div>}
            {showCoherence && parsed ? (
              <div className="coherence-box">
                <div className="coherence-summary">{parsed.summary}</div>
                {parsed.details.length > 0 && (
                  <ul className="coherence-details">
                    {parsed.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
                {parsed.footer && <div className="coherence-footer">{parsed.footer}</div>}
              </div>
            ) : score !== null && score !== undefined && score >= 100 ? (
              <div className="coherence-ok">All beats are fully contained in this route.</div>
            ) : null}
          </div>
        )}
      </div>
      {expanded && (
        <div className="rip-section rip-beats">
          {rd.beats && rd.beats.length ? (
            <>
              <div className="rip-beats-title">{rd.beats.length} beats:</div>
              <div className="rip-beat-tags">
                {rd.beats.map((b, i) => (
                  <span className="rip-beat-tag" key={i}>
                    {`${b.name} (${b.inRoute}/${b.total})`} <strong>{ngNumber(b.coherencePct, '1.1-1')}%</strong>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="rip-beats-title">Beats:</div>
              <div className="rip-no-beats">No beat information available.</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
