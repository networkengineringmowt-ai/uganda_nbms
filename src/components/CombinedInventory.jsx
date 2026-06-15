import { useState } from 'react';
import BridgesDashboard from './BridgesDashboard';
import CulvertsDashboard from './CulvertsDashboard';

export default function CombinedInventory({ bridges = [], culverts = [] }) {
  const [innerTab, setInnerTab] = useState('bridges');

  return (
    <div className="inventory-layout">
      <nav className="subnav" style={{ display: 'flex', gap: '8px', padding: '0 0 16px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <button 
            style={{ background: innerTab === 'bridges' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: innerTab === 'bridges' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setInnerTab('bridges')}
          >
            Bridges Registry
          </button>
          <button 
            style={{ background: innerTab === 'culverts' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: innerTab === 'culverts' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setInnerTab('culverts')}
          >
            Major Culverts
          </button>
      </nav>

      <div className="inner-content">
        {innerTab === 'bridges' && <BridgesDashboard initialBridges={bridges} />}
        {innerTab === 'culverts' && <CulvertsDashboard initialCulverts={culverts} />}
      </div>
    </div>
  );
}
