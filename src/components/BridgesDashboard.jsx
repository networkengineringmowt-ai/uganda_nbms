import { useMemo, useState, useEffect } from 'react';
import DataTable from './DataTable';
import { Search } from 'lucide-react';
import { fetchBridges } from '../services/bmsDataService';

export default function BridgesDashboard() {
  const [bridges, setBridges] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBridges()
      .then(setBridges)
      .catch(console.error);
  }, []);

  const cols = [
    { header: 'Bridge No', accessor: 'BridgeNumber' },
    { header: 'Bridge Name', accessor: 'BridgeName' },
    { header: 'Road / Link ID', cell: (row) => `${row.RoadDescrPrincipal || '-'} (${row.LinkID || '-'})`, sortValue: (row) => row.RoadDescrPrincipal || row.LinkID },
    { header: 'Region / Station', cell: (row) => `${row.Region || '-'} / ${row.Station || '-'}`, sortValue: (row) => `${row.Region || ''} ${row.Station || ''}` },
    { header: 'Chainage km', accessor: 'KmPrincipal', sortValue: (row) => row.KmPrincipal },
    { header: 'Condition', accessor: 'OverallCondition', sortValue: (row) => row.OverallConditionRating },
    { header: 'AADT (2026 est)', cell: (row) => row.Traffic ? <span className="badge purple">{row.Traffic.aadt_2026?.toLocaleString() || '-'}</span> : '-', sortValue: (row) => row.Traffic?.aadt_2026 },
    { header: 'Growth Rate', cell: (row) => row.Traffic ? `${(row.Traffic.growth_rate * 100).toFixed(2)}%` : '-', sortValue: (row) => row.Traffic?.growth_rate },
    { header: 'Date Modified', accessor: 'DateModified' },
  ];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bridges;
    return bridges.filter((bridge) => [
      bridge.BridgeNumber,
      bridge.BridgeName,
      bridge.RoadDescrPrincipal,
      bridge.LinkID,
      bridge.Region,
      bridge.Station,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [bridges, search]);

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
        <div style={{padding:'18px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', gap:'16px', alignItems:'center', flexWrap:'wrap'}}>
          <h3 className="card-title" style={{margin:0}}>Bridges Registry</h3>
          <label style={{position:'relative', display:'block', width:'min(360px, 100%)'}}>
            <Search size={16} style={{position:'absolute', left:12, top:11, color:'var(--text-muted)'}} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bridge name, number, road, station..."
              style={{width:'100%', padding:'10px 12px 10px 36px', background:'rgba(0,0,0,0.3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)'}}
            />
          </label>
        </div>
        <DataTable columns={cols} data={filtered} />
      </div>
    </div>
  );
}
