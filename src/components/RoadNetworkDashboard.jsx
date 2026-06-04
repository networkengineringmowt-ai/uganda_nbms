import React, { useState, useEffect } from 'react';
import { Network, Search } from 'lucide-react';

export default function RoadNetworkDashboard() {
  const [network, setNetwork] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/uganda_bms/data/road_network.json')
      .then(r => r.json())
      .then(setNetwork)
      .catch(console.error);
  }, []);

  if (!network.length) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading National Road Network Database...</p>
    </div>
  );

  const filtered = network.filter(n => 
    String(n.Link_Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(n.Road_No || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(84, 116, 255, 0.1), rgba(166, 77, 255, 0.1))', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem' }}><Network style={{display:'inline', marginRight:12}}/> National Road Network</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>NDP IV Strategic Network Links & Pavement Conditions.</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search link name or road number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 10px 10px 38px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#fff',
              width: '300px'
            }}
          />
        </div>
      </div>

      <div className="bridge-inventory-scroll">
        <table id="bridgeTable">
          <thead>
            <tr>
              <th>Road No</th>
              <th>Link Name</th>
              <th>Class</th>
              <th>Length (km)</th>
              <th>Surface Type</th>
              <th>Pavement Age</th>
              <th>Intervention Rec.</th>
              <th>OPRC</th>
              <th>Funder</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 1000).map((row, i) => (
              <tr key={i}>
                <td className="highlight-cell">{row.Road_No || '-'}</td>
                <td>{row.Link_Name || '-'}</td>
                <td>{row.Road_Class || '-'}</td>
                <td>{row['Length(km)'] || '-'}</td>
                <td>{row.Surface_Type || '-'}</td>
                <td>{row['Pavement Age'] || '-'}</td>
                <td>{row['Immediate Pavement recommendations'] || '-'}</td>
                <td>{row.OPRC || '-'}</td>
                <td>{row.FUNDER || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
