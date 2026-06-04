import React, { useState } from 'react';
import BridgesDashboard from './BridgesDashboard';
import CulvertsDashboard from './CulvertsDashboard';
import RoadNetworkDashboard from './RoadNetworkDashboard';
import WorksDashboard from './WorksDashboard';

export default function CombinedInventory() {
  const [innerTab, setInnerTab] = useState('bridges');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '16px', background: 'rgba(13,20,38,0.6)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <nav style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: innerTab === 'bridges' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setInnerTab('bridges')}>
            Bridges Registry
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: innerTab === 'culverts' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setInnerTab('culverts')}>
            Major Culverts
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: innerTab === 'network' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setInnerTab('network')}>
            Road Network & NDPIV
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: innerTab === 'works' ? 'var(--accent-amber)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setInnerTab('works')}>
            Ongoing Interventions
          </button>
        </nav>
      </div>

      <div className="inner-content">
        {innerTab === 'bridges' && <BridgesDashboard />}
        {innerTab === 'culverts' && <CulvertsDashboard />}
        {innerTab === 'network' && <RoadNetworkDashboard />}
        {innerTab === 'works' && <WorksDashboard />}
      </div>
    </div>
  );
}
