import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, ClipboardCheck, TriangleAlert } from 'lucide-react';
import BridgeInspectionForm from './capture/BridgeInspectionForm';

export default function InspectionWorkspace({ bridges, onBridgesUpdate, readOnly = false }) {
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
    const needsAttention = [...critical]
      .sort((a, b) => Number(a.LegacyData?.overall_rating ?? a.OverallConditionRating ?? 99) - Number(b.LegacyData?.overall_rating ?? b.OverallConditionRating ?? 99))
      .slice(0, 7);
    return { rated, review, critical, needsAttention };
  }, [bridges]);

  return (
    <div className="inspection-layout">
      <section className="kpi-grid compact">
        <article className="kpi-card"><div className="kpi-icon blue"><ClipboardCheck size={20} /></div><span className="kpi-eyebrow">Rated structures</span><strong>{metrics.rated.length}</strong><p>Bridge records with element or overall ratings</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><TriangleAlert size={20} /></div><span className="kpi-eyebrow">Poor or worse</span><strong>{metrics.critical.length}</strong><p>Overall condition described as Poor, Very Poor, Critical or Beyond Repair</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><CalendarClock size={20} /></div><span className="kpi-eyebrow">Location review</span><strong>{metrics.review.length}</strong><p>Records flagged for coordinate review</p></article>
      </section>

      <section className="inspection-grid">
        <div className="panel inspection-form-panel">
          <div className="panel-header"><div><span className="panel-kicker">Field inspection</span><h2>Element condition assessment</h2></div></div>
          <BridgeInspectionForm bridges={bridges} onBridgesUpdate={onBridgesUpdate} readOnly={readOnly} />
        </div>
        <aside className="panel recent-inspections">
          <div className="panel-header"><div><span className="panel-kicker">Register activity</span><h2>Needs attention</h2></div></div>
          {metrics.needsAttention.map((row) => (
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
