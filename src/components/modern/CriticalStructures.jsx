import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, MapPin, Camera } from 'lucide-react';
import { getCriticalBridges, conditionSeverity } from '../../utils/bmsAlgorithms';
import { onPhotoError } from '../../utils/photoUrlResolver';

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

  // Critical Structures = bridges/culverts in the DNR "Critical" or "Poor"
  // condition categories (overall rating <= 3 on the app scale), ranked by
  // deficiency. The bridge side of this is shared with the Overview and
  // Maintenance Workspace panels (bmsAlgorithms.js getCriticalBridges) so
  // there is exactly one live-computed definition of "critical" everywhere,
  // instead of a separately-maintained snapshot that can drift stale.
  const criticalBridges = useMemo(() => getCriticalBridges(bridges), [bridges]);

  const criticalCulverts = useMemo(() => {
    return culverts
      .map(c => ({ c, severity: conditionSeverity(c.ConditionCategory, c['Overall Rating']) }))
      .filter(({ severity }) => severity !== null);
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
          {/* Page never stated the network size these counts are drawn from --
              scope each critical count against the real register length
              (never hardcoded), bridges and culverts always reported
              separately. */}
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            {criticalBridges.length} of {bridges.length} bridges &middot; {criticalCulverts.length} of {culverts.length} culverts
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {criticalBridges.map(({ bridge: b, severity }) => {
          const photoUrl = photoMap.get(b.BridgeNumber);
          // Badge reflects this bridge's actual severity rather than a
          // fixed "CRITICAL" label -- a Poor bridge in this list must read
          // as Poor, not be overstated as Critical.
          const badgeColor = severity === 'Critical' ? '#ef4444' : '#f59e0b';
          return (
            <div key={b.BridgeNumber} onClick={() => onSelectBridge && onSelectBridge(b)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: '#111827', position: 'relative' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={onPhotoError} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}><Camera size={32} /></div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, background: badgeColor, color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  {severity.toUpperCase()} BRIDGE
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

        {criticalCulverts.map(({ c, severity }) => {
          const photoUrl = photoMap.get(c.CulvertNumber);
          const badgeColor = severity === 'Critical' ? '#ef4444' : '#f59e0b';
          return (
            <div key={c.CulvertNumber} onClick={() => onSelectBridge && onSelectBridge({ ...c, _structureType: 'culvert' })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: '#111827', position: 'relative' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={onPhotoError} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}><Camera size={32} /></div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8, background: badgeColor, color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  {severity.toUpperCase()} CULVERT
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
