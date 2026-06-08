import { useState } from 'react';
import BridgesDashboard from './BridgesDashboard';
import CulvertsDashboard from './CulvertsDashboard';
import RoadNetworkDashboard from './RoadNetworkDashboard';
import WorksDashboard from './WorksDashboard';

export default function CombinedInventory() {
  const [innerTab, setInnerTab] = useState('bridges');

  return (
    <div className="inventory-layout">
      <nav className="subnav">
          <button className={innerTab === 'bridges' ? 'active' : ''} onClick={() => setInnerTab('bridges')}>
            Bridges Registry
          </button>
          <button className={innerTab === 'culverts' ? 'active' : ''} onClick={() => setInnerTab('culverts')}>
            Major Culverts
          </button>
          <button className={innerTab === 'network' ? 'active' : ''} onClick={() => setInnerTab('network')}>
            Road Network & NDPIV
          </button>
          <button className={innerTab === 'works' ? 'active' : ''} onClick={() => setInnerTab('works')}>
            Ongoing Interventions
          </button>
      </nav>

      <div className="inner-content">
        {innerTab === 'bridges' && <BridgesDashboard />}
        {innerTab === 'culverts' && <CulvertsDashboard />}
        {innerTab === 'network' && <RoadNetworkDashboard />}
        {innerTab === 'works' && <WorksDashboard />}
      </div>
    </div>
  );
}
