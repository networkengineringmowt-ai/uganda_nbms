import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, FileText } from 'lucide-react';

export default function CriticalDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/uganda_bms/data/investment.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
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
          <div className="kpi-value">53</div>
          <div className="kpi-label">Structures requiring urgent intervention</div>
        </div>
      </div>
      
      <div className="glass-card" style={{marginTop:'24px', padding:'24px'}}>
        <h3 className="card-title" style={{marginBottom:'24px', fontSize:'1.4rem', borderBottom:'1px solid var(--border)', paddingBottom:'16px'}}>
          <FileText size={20} style={{display:'inline', marginRight:8, verticalAlign:'middle'}}/>
          Critical Structures Report (CS 2026)
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {data.critical_structures.map((structure, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {structure}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
