import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, ClipboardCheck, TriangleAlert } from 'lucide-react';
import BridgeInspectionForm from './capture/BridgeInspectionForm';

export default function InspectionWorkspace({ bridges, onBridgesUpdate, readOnly = false }) {
  const [showAllAttention, setShowAllAttention] = useState(false);
  const metrics = useMemo(() => {
    const rated = bridges.filter((row) => row.LegacyData?.overall_rating != null || row.OverallConditionRating != null);
    const review = bridges.filter((row) => row.LegacyData?.location_requires_review);
    const critical = bridges.filter((row) => {
      const rating = row.LegacyData?.overall_rating ?? row.OverallConditionRating;
      return rating != null && Number(rating) <= 3;
    });
    // Structure counts only -- this platform does not report on individual
    // record activity/edit history, so this list is ranked by condition
    // severity (worst first), never by when a record was last modified.
    const sortedCritical = [...critical]
      .sort((a, b) => Number(a.LegacyData?.overall_rating ?? a.OverallConditionRating ?? 99) - Number(b.LegacyData?.overall_rating ?? b.OverallConditionRating ?? 99));
    const needsAttention = sortedCritical.slice(0, 7);
    return { rated, review, critical, needsAttention, sortedCritical };
  }, [bridges]);

  const attentionRows = showAllAttention ? metrics.sortedCritical : metrics.needsAttention;

  return (
    <div className="inspection-layout">
      <section className="kpi-grid compact">
        {/* Bare counts read as complete on their own -- scope each against
            the real bridge register length (never a hardcoded total). */}
        <article className="kpi-card"><div className="kpi-icon blue"><ClipboardCheck size={20} /></div><span className="kpi-eyebrow">Rated structures</span><strong>{metrics.rated.length} of {bridges.length}</strong><p>Bridge records with element or overall ratings</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><TriangleAlert size={20} /></div><span className="kpi-eyebrow">Poor or worse</span><strong>{metrics.critical.length} of {bridges.length}</strong><p>Overall condition described as Poor, Very Poor, Critical or Beyond Repair</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><CalendarClock size={20} /></div><span className="kpi-eyebrow">Location review</span><strong>{metrics.review.length} of {bridges.length}</strong><p>Records flagged for coordinate review</p></article>
      </section>

      <section className="inspection-grid">
        <div className="panel inspection-form-panel">
          <div className="panel-header"><div><span className="panel-kicker">Field inspection</span><h2>Element condition assessment</h2></div></div>
          <BridgeInspectionForm bridges={bridges} onBridgesUpdate={onBridgesUpdate} readOnly={readOnly} />
        </div>
        <aside className="panel recent-inspections">
          <div className="panel-header"><div><span className="panel-kicker">Register activity</span><h2>Needs attention</h2></div></div>
          {/* This list silently truncated to 7 with no indication more existed
              -- disclose the total and offer a way to see the rest. */}
          {metrics.sortedCritical.length > 7 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
              Showing {attentionRows.length} of {metrics.sortedCritical.length}.{' '}
              <button
                type="button"
                onClick={() => setShowAllAttention((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
              >
                {showAllAttention ? 'Show fewer' : 'View all'}
              </button>
            </p>
          )}
          {attentionRows.map((row) => (
            <div className="recent-row" key={row.BridgeNumber}>
              <CheckCircle2 size={16} />
              <span><strong>{row.BridgeNumber} - {row.BridgeName || 'Unnamed bridge'}</strong><small>{row.Station || 'Station unassigned'}</small></span>
            </div>
          ))}
        </aside>
      </section>
    </div>
  );
}
