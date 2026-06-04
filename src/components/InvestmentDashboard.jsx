import React, { useState, useEffect } from 'react';
import { FileText, Map, Settings, TrendingUp } from 'lucide-react';

export default function InvestmentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/investment.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Critical Structures...</p>
    </div>
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 className="card-title"><TrendingUp size={14} style={{display:'inline', marginRight:6}}/> SQLBot Engine Status</h3>
          <div className="kpi-value">{data.sqlbot_kpis?.bridge_prediction_count || 0}</div>
          <div className="kpi-label">Active Bridge Predictions via SQLBot Matrix</div>
        </div>
        <div className="glass-card">
          <h3 className="card-title"><Map size={14} style={{display:'inline', marginRight:6}}/> Critical Structures</h3>
          <div className="kpi-value">53</div>
          <div className="kpi-label">Prioritized for 2026 (49 Bridges, 4 Culverts)</div>
        </div>
        <div className="glass-card">
          <h3 className="card-title"><FileText size={14} style={{display:'inline', marginRight:6}}/> Investment Plan</h3>
          <div className="kpi-value">2026</div>
          <div className="kpi-label">Bridge & Major Culvert Division</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title" style={{marginBottom:'24px', color:'var(--text-primary)', fontSize:'1.2rem'}}>Network Investment Strategy Overview</h3>
        {data.investment_plan.slice(0, 10).map((p, i) => (
          <p key={i} className="document-text">{p}</p>
        ))}
      </div>
      
      <div className="glass-card" style={{marginTop:'24px'}}>
        <h3 className="card-title" style={{marginBottom:'24px', color:'var(--text-primary)', fontSize:'1.2rem'}}>Critical Structures List (CS 2026)</h3>
        {data.critical_structures.slice(0, 15).map((p, i) => (
          <p key={i} className="document-text">{p}</p>
        ))}
        <p className="document-text" style={{color:'var(--accent-blue)', fontStyle:'italic'}}>...and 38 more prioritized structures.</p>
      </div>
    </div>
  );
}
