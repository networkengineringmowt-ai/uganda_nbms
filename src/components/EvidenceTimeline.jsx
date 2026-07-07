import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, FolderCheck, Image } from 'lucide-react';
import { getPhotoUrl } from '../utils/photoUrlResolver';
import { groupEvidenceByYear } from '../utils/photoEvidence';

export default function EvidenceTimeline({ photos = [], structureId, compact = false }) {
  const groups = useMemo(() => groupEvidenceByYear(photos), [photos]);
  const [activeYear, setActiveYear] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeGroup = groups.find((group) => group.year === activeYear) || groups[0];
  const safeIndex = Math.min(activeIndex, Math.max(0, (activeGroup?.photos.length || 1) - 1));
  const activePhoto = activeGroup?.photos[safeIndex] || activeGroup?.photos[0];
  const move = (direction) => {
    if (!activeGroup?.photos.length) return;
    setActiveIndex((current) => (current + direction + activeGroup.photos.length) % activeGroup.photos.length);
  };

  if (!groups.length) {
    return <div className="evidence-empty"><Image size={24} /><strong>No indexed evidence for {structureId}</strong></div>;
  }

  return (
    <div className={`evidence-timeline ${compact ? 'compact' : ''}`}>
      <div className="evidence-year-rail" aria-label="Inspection evidence years">
        {groups.map((group) => (
          <button
            key={group.year}
            className={activeGroup?.year === group.year ? 'active' : ''}
            onClick={() => { setActiveYear(group.year); setActiveIndex(0); }}
          >
            <CalendarDays size={14} />
            <strong>{group.year}</strong>
            <span>{group.photos.length}</span>
          </button>
        ))}
      </div>

      <div className="evidence-stage" key={`${activeGroup?.year}-${safeIndex}`}>
        <div className="evidence-stage-image">
          {activePhoto && <img src={getPhotoUrl(activePhoto)} alt={`${structureId} evidence ${activeIndex + 1}`} />}
          <button className="evidence-step previous" onClick={() => move(-1)} title="Previous photo"><ArrowLeft size={18} /></button>
          <button className="evidence-step next" onClick={() => move(1)} title="Next photo"><ArrowRight size={18} /></button>
          <div className="evidence-counter">{safeIndex + 1} / {activeGroup?.photos.length}</div>
        </div>

        <div className="evidence-stage-meta">
          <div>
            <span className="panel-kicker">Inspection sequence</span>
            <strong>{activeGroup?.year === 'Undated' ? 'Undated evidence' : `${activeGroup?.year} inspection record`}</strong>
          </div>
          <div className="evidence-source-status">
            <FolderCheck size={15} />
            <span>{activePhoto?.match_method?.includes('source-folder') ? 'Confirmed by source folder' : 'Assigned from filename'}</span>
          </div>
          <a href={getPhotoUrl(activePhoto)} target="_blank" rel="noreferrer" title="Open full-size photo">
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="evidence-filmstrip">
          {activeGroup?.photos.map((photo, index) => (
            <button
              key={`${photo.filename}-${index}`}
              className={index === safeIndex ? 'active' : ''}
              onClick={() => setActiveIndex(index)}
              title={photo.filename}
            >
              <img src={getPhotoUrl(photo)} alt="" loading="lazy" />
              <span>{photo.sequence || index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
