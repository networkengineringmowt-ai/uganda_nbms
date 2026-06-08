import { useState, useEffect } from 'react';
import { Construction, CheckCircle2, DollarSign } from 'lucide-react';

export default function WorksDashboard() {
  const [works, setWorks] = useState([]);

  useEffect(() => {
    fetch('/uganda_bms/data/bridge_works.json')
      .then(r => r.json())
      .then(setWorks)
      .catch(console.error);
  }, []);

  if (!works.length) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Bridge Works...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(244, 63, 94, 0.1))', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem' }}><Construction style={{display:'inline', marginRight:12}}/> Ongoing Bridge Works</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Tracking {works.length} structural intervention contracts and rehabilitation projects.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
        {works.map((work, i) => (
          <div key={i} className="glass-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>{work.bridge || work.Bridge_Name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Intervention:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>{work.Intervention || work.intervention || 'N/A'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contractor:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{work.contractor || work.Contractor || 'Unknown'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status:</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 700 }}>
                  <CheckCircle2 size={14} style={{display:'inline', marginRight:4, verticalAlign:'middle'}}/>
                  {work.status || work.Status || 'Ongoing'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Funder:</span>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: 700 }}>
                  <DollarSign size={14} style={{display:'inline', marginRight:2, verticalAlign:'middle'}}/>
                  {work.funder || work.Funder || 'GOU'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
