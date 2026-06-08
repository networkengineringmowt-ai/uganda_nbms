import { useState, useEffect } from 'react';
import DataTable from './DataTable';
import { fetchCulverts } from '../services/bmsDataService';

export default function CulvertsDashboard() {
  const [culverts, setCulverts] = useState([]);

  useEffect(() => {
    fetchCulverts()
      .then(setCulverts)
      .catch(console.error);
  }, []);

  const cols = [
    { header: 'Culvert No', accessor: 'CulvertNumber' },
    { header: 'River', accessor: 'River' },
    { header: 'Road / Section', cell: (row) => `${row.Road || '-'} (${row.SectionOrLinkNo || '-'})` },
    { header: 'Km', accessor: 'Km' },
    { header: 'Firm', accessor: 'Firm' },
    { header: 'Checked By', accessor: 'CheckedBy' },
    { header: 'Date Modified', accessor: 'DateModified' },
  ];

  if (culverts.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Culverts Registry...</p>
    </div>
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 className="card-title">Total Registry</h3>
          <div className="kpi-value">{culverts.length}</div>
          <div className="kpi-label">Major culverts mapped</div>
        </div>
      </div>
      
      <div className="glass-card" style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'24px', borderBottom:'1px solid var(--border)'}}>
          <h3 className="card-title" style={{margin:0}}>Major Culverts Registry</h3>
        </div>
        <DataTable columns={cols} data={culverts} />
      </div>
    </div>
  );
}
