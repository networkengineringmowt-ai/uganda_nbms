import { useEffect, useMemo, useState } from 'react';
import { Camera, FolderCheck, Image, Images, Search } from 'lucide-react';
import EvidenceTimeline from './EvidenceTimeline';
import { structureType } from '../utils/photoEvidence';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';

const assetId = (row) => row.BridgeNumber || row.CulvertNumber || row.bridge_no || row.culvert_no;
const assetName = (row) => row.BridgeName || row.River || row.bridge_nam || row.river || row.Road || 'Unnamed structure';

export default function PhotoLibrary({ bridges = [], culverts = [] }) {
  const [photos, setPhotos] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}gallery/index.json`).then((response) => response.json()).then(setPhotos).catch(console.error);
  }, []);

  const names = useMemo(() => {
    const result = new Map();
    [...bridges, ...culverts].forEach((row) => {
      const id = assetId(row);
      if (id) result.set(id, assetName(row));
    });
    return result;
  }, [bridges, culverts]);

  const structures = useMemo(() => {
    const grouped = new Map();
    photos.forEach((photo) => {
      if (!photo.structure_id || photo.duplicate_of) return;
      const entry = grouped.get(photo.structure_id) || { id: photo.structure_id, photos: [], years: new Set() };
      entry.photos.push(photo);
      if (photo.capture_year) entry.years.add(photo.capture_year);
      grouped.set(photo.structure_id, entry);
    });
    return [...grouped.values()].sort((a, b) => b.photos.length - a.photos.length || a.id.localeCompare(b.id));
  }, [photos]);

  const filteredStructures = useMemo(() => {
    const term = query.trim().toLowerCase();
    return structures.filter((structure) => {
      const type = structureType(structure.id);
      return (typeFilter === 'All' || type === typeFilter)
        && (!term || `${structure.id} ${names.get(structure.id) || ''}`.toLowerCase().includes(term));
    });
  }, [names, query, structures, typeFilter]);

  const activeStructure = filteredStructures.find((structure) => structure.id === activeId) || filteredStructures[0] || structures[0];
  const assigned = photos.filter((photo) => photo.structure_id).length;
  const sourceConfirmed = photos.filter((photo) => photo.match_method?.includes('source-folder')).length;

  return (
    <div className="photo-library evidence-library">
      <header className="photo-library-header">
        <div>
          <span className="panel-kicker">Chronological inspection evidence</span>
          <h1>Structure evidence timeline</h1>
          <p>Move through each structure&apos;s inspection history without losing its engineering context.</p>
        </div>
      </header>

      <section className="photo-kpi-grid">
        <article><Camera size={20} /><span>Publishable evidence</span><strong>{photos.length.toLocaleString()}</strong></article>
        <article><Images size={20} /><span>Structures covered</span><strong>{structures.length.toLocaleString()}</strong></article>
        <article><FolderCheck size={20} /><span>Source-folder confirmed</span><strong>{sourceConfirmed.toLocaleString()}</strong></article>
        <article><Image size={20} /><span>Assigned evidence</span><strong>{assigned.toLocaleString()}</strong></article>
      </section>

      <section className="evidence-library-workspace">
        <aside className="evidence-structure-pane">
          <label className="photo-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find structure or name" />
          </label>
          <div className="photo-filter" aria-label="Structure type">
            {['All', 'Bridge', 'Culvert'].map((type) => (
              <button key={type} className={typeFilter === type ? 'active' : ''} onClick={() => setTypeFilter(type)}>{type}</button>
            ))}
          </div>
          <div className="evidence-structure-list">
            {filteredStructures.map((structure) => (
              <button key={structure.id} className={activeStructure?.id === structure.id ? 'active' : ''} onClick={() => setActiveId(structure.id)}>
                <span className={`photo-type ${structureType(structure.id).toLowerCase()}`}>{structureType(structure.id)}</span>
                <strong>{structure.id}</strong>
                <small>{names.get(structure.id) || 'Structure evidence'}</small>
                <em>{structure.photos.length} photos / {structure.years.size || 1} records</em>
              </button>
            ))}
          </div>
        </aside>
        <div className="evidence-timeline-pane">
          <div className="evidence-asset-heading">
            <div>
              <span className="panel-kicker">{structureType(activeStructure?.id)} evidence record</span>
              <h2>{activeStructure?.id} - {names.get(activeStructure?.id) || 'Structure evidence'}</h2>
            </div>
            <span>{activeStructure?.photos.length || 0} indexed photos</span>
          </div>
          <EvidenceTimeline photos={activeStructure?.photos || []} structureId={activeStructure?.id} />
        </div>
      </section>
    </div>
  );
}
