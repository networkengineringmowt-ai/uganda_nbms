import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, MapPin, Camera } from 'lucide-react';
import { calculateBridgeDeficiencyIndex } from '../../utils/bmsAlgorithms';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';

export default function CriticalStructures({ bridges = [], culverts = [], onSelectBridge }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}gallery/index.json`)
      .then((res) => res.json())
      .then(setPhotos)
      .catch(console.error);
  }, []);

  const photoMap = useMemo(() => {
    const map = new Map();
    photos.forEach(p => {
      const filename = p.file_name || p.filename;
      if (p.structure_id && filename && !map.has(p.structure_id) && !p.duplicate_of) {
        map.set(p.structure_id, `${BASE_URL}gallery/thumbnails/${filename.replace(/\.[^/.]+$/, ".jpg")}`);
      }
    });
    return map;
  }, [photos]);

  const criticalBridges = useMemo(() => {
    return bridges.filter(b => {
      const def = calculateBridgeDeficiencyIndex({
        approaches: b.LegacyData?.approaches_rating,
        roadway: b.LegacyData?.roadway_rating,
        substructure: b.LegacyData?.substructure_rating,
        superstructure: b.LegacyData?.superstructure_rating,
        waterway: b.LegacyData?.waterway_rating
      }) || 0;
      return def > 40 || b.OverallConditionRating <= 4; 
    }).sort((a, b) => {
      const defA = calculateBridgeDeficiencyIndex(a.LegacyData || {}) || 0;
      const defB = calculateBridgeDeficiencyIndex(b.LegacyData || {}) || 0;
      return defB - defA;
    });
  }, [bridges]);

  const criticalCulverts = useMemo(() => {
    return culverts.filter(c => {
      const rating = c['Overall Rating'] != null ? Number(c['Overall Rating']) : null;
      return rating !== null && rating <= 4;
    });
  }, [culverts]);

  return (
    <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', color: '#ef4444' }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#ef4444' }}>Critical Structures Network</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>High-priority bridges and major culverts requiring immediate intervention. Includes most recent photo evidence.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {criticalBridges.map(b => {
          const photoUrl = photoMap.get(b.BridgeNumber);
          return (
            <div key={b.BridgeNumber} onClick={() => onSelectBridge && onSelectBridge(b)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: '#111827', position: 'relative' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}><Camera size={32} /></div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  CRITICAL BRIDGE
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>{b.BridgeNumber} - {b.BridgeName || 'Unknown'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <MapPin size={12} /> {b.RoadDescrPrincipal || b.Region || '-'}
                </div>
              </div>
            </div>
          );
        })}

        {criticalCulverts.map(c => {
          const photoUrl = photoMap.get(c.CulvertNumber);
          return (
            <div key={c.CulvertNumber} onClick={() => onSelectBridge && onSelectBridge(c)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: '#111827', position: 'relative' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}><Camera size={32} /></div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  POOR CULVERT
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>{c.CulvertNumber} - {c.CulvertName || c.River || 'Unknown'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <MapPin size={12} /> {c.Road || c.Region || '-'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
