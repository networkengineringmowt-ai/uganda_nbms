import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, FileText, Image as ImageIcon } from 'lucide-react';

export default function CriticalDashboard() {
  const [data, setData] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [bridges, setBridges] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/uganda_bms/data/investment.json').then(r => r.json()),
      fetch('/uganda_bms/gallery/index.json').then(r => r.json()).catch(() => []),
      fetch('/uganda_bms/data/bridges.json').then(r => r.json()).catch(() => [])
    ]).then(([inv, gal, bri]) => {
      setData(inv);
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

  const getBridgeInfo = (text) => {
    const match = text.match(/([BC]\d{3})/);
    if (!match) return { image: null, bridge: null };
    const id = match[1];
    
    // Find image
    const img = gallery.find(g => g.filename.includes(id));
    // Find bridge metadata
    const bridge = bridges.find(b => b.BridgeNumber === id);
    
    return { image: img ? img.url : null, bridge, id };
  };

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card" style={{ borderColor: 'var(--accent-purple)' }}>
          <h3 className="card-title"><AlertTriangle size={14} color="var(--accent-purple)" style={{display:'inline', marginRight:6}}/> Immediate Priorities</h3>
          <div className="kpi-value">{data.critical_structures.length}</div>
          <div className="kpi-label">Structures requiring urgent intervention</div>
        </div>
      </div>
      
      <div className="glass-card" style={{marginTop:'24px', padding:'24px'}}>
        <h3 className="card-title" style={{marginBottom:'24px', fontSize:'1.4rem', borderBottom:'1px solid var(--border)', paddingBottom:'16px'}}>
          <FileText size={20} style={{display:'inline', marginRight:8, verticalAlign:'middle'}}/>
          Critical Structures Condition Evidence
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {data.critical_structures.map((structure, i) => {
            const info = getBridgeInfo(structure);
            return (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{info.id || 'Critical Structure'}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {structure}
                    </p>
                  </div>
                </div>
                
                {info.bridge && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>River/Feature:</strong> {info.bridge.River || 'Unknown'} | <strong>Station:</strong> {info.bridge.Maintenance_Station || 'N/A'}
                  </div>
                )}
                
                {info.image ? (
                  <div style={{ marginTop: 'auto', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', height: '180px' }}>
                    <img src={info.image} alt={structure} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
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
