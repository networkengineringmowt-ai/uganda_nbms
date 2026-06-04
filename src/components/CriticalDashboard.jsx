import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, FileText, Image as ImageIcon } from 'lucide-react';

export default function CriticalDashboard() {
  const [data, setData] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [bridges, setBridges] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/uganda_bms/data/critical_structures.json').then(r => r.json()),
      fetch('/uganda_bms/gallery/index.json').then(r => r.json()).catch(() => []),
      fetch('/uganda_bms/data/bridges.json').then(r => r.json()).catch(() => [])
    ]).then(([crit, gal, bri]) => {
      setData(crit);
      setGallery(gal);
      setBridges(bri);
    }).catch(console.error);
  }, []);

  if (!data) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Critical Priorities...</p>
    </div>
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card" style={{ borderColor: 'var(--accent-purple)' }}>
          <h3 className="card-title"><AlertTriangle size={14} color="var(--accent-purple)" style={{display:'inline', marginRight:6}}/> Immediate Priorities</h3>
          <div className="kpi-value">{data.length}</div>
          <div className="kpi-label">Structures requiring urgent intervention</div>
        </div>
      </div>
      
      <div className="glass-card" style={{marginTop:'24px', padding:'24px'}}>
        <h3 className="card-title" style={{marginBottom:'24px', fontSize:'1.4rem', borderBottom:'1px solid var(--border)', paddingBottom:'16px'}}>
          <FileText size={20} style={{display:'inline', marginRight:8, verticalAlign:'middle'}}/>
          Critical Structures Condition Evidence
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {data.map((structure, i) => {
            const id = structure.BridgeNumber;
            const img = gallery.find(g => g.structure_id === id || g.filename.includes(id));
            const bridge = bridges.find(b => b.BridgeNumber === id);

            return (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{id} - {structure.BridgeName}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Engineer Comment:</strong> {structure.Comment || 'No comment provided'}
                    </p>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Link:</strong> {structure.LinkName || 'Unknown'} | <strong>Station:</strong> {structure.MaintenanceStation || 'N/A'} <br/>
                  <strong>Dimensions:</strong> {structure.BridgeLength}m x {structure.BridgeWidth}m | <strong>Rating:</strong> {structure.OverallRating}
                </div>
                
                {img ? (
                  <div style={{ marginTop: 'auto', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', height: '220px' }}>
                    <img src={img.url} alt={id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                    <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.8rem' }}>No evidence photo available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
