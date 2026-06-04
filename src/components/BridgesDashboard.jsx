import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import { Activity, Hash, AlertTriangle } from 'lucide-react';

export default function BridgesDashboard() {
  const [bridges, setBridges] = useState([]);

  useEffect(() => {
    fetch('/uganda_bms/data/bridges.json')
      .then(r => r.json())
      .then(setBridges)
      .catch(console.error);
  }, []);

  const cols = [
    { header: 'Bridge No', accessor: 'BridgeNumber' },
    { header: 'Bridge Name', accessor: 'BridgeName' },
    { header: 'Road / Link ID', cell: (row) => `${row.RoadDescrPrincipal || '-'} (${row.LinkID || '-'})` },
    { header: 'AADT (2026 est)', cell: (row) => row.Traffic ? <span className="badge purple">{row.Traffic.aadt_2026?.toLocaleString() || '-'}</span> : '-' },
    { header: 'Growth Rate', cell: (row) => row.Traffic ? `${(row.Traffic.growth_rate * 100).toFixed(2)}%` : '-' },
    { header: 'Legacy ID', accessor: 'LegacyData' && 'bridge_no', cell: (row) => row.LegacyData ? row.LegacyData._id : '-' },
    { header: 'Date Modified', accessor: 'DateModified' },
  ];

  if (bridges.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Bridges Registry...</p>
    </div>
  );

  const totalWithTraffic = bridges.filter(b => b.Traffic).length;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 className="card-title">Total Registry</h3>
          <div className="kpi-value">{bridges.length}</div>
          <div className="kpi-label">Bridges in combined dataset</div>
        </div>
        <div className="glass-card">
          <h3 className="card-title">SQLBot Traffic Engine</h3>
          <div className="kpi-value">{totalWithTraffic}</div>
          <div className="kpi-label">Bridges with ADT predictions</div>
        </div>
      </div>
      
      <div className="glass-card" style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'24px', borderBottom:'1px solid var(--border)'}}>
          <h3 className="card-title" style={{margin:0}}>Bridges Registry</h3>
        </div>
        <DataTable columns={cols} data={bridges} />
      </div>
    </div>
  );
}
