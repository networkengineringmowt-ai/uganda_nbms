import { useState } from 'react';
import { FilePlus, Activity, LogOut } from 'lucide-react';
import BridgeInventoryForm from '../capture/BridgeInventoryForm';
import BridgeInspectionForm from '../capture/BridgeInspectionForm';
import CulvertInventoryForm from '../capture/CulvertInventoryForm';
import CulvertInspectionForm from '../capture/CulvertInspectionForm';

export default function BmsMobileShell({ bridges, culverts, setBridges, setCulverts }) {
  const [activeTab, setActiveTab] = useState('capture_bridge');

  return (
    <div className="bms-mobile-shell">
      {/* Mobile Header */}
      <header className="bms-mobile-header">
        <div className="horiz-nav-brand" style={{ gap: '8px' }}>
          <img src="mowt.jpg" alt="MoWT Logo" className="horiz-nav-logo" style={{ height: '32px' }} />
          <div className="horiz-nav-brand-text">
            <strong>MoWT BMS</strong>
            <span style={{ fontSize: '0.65rem' }}>Data Collection</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Content Area */}
      <main className="bms-mobile-content modern-scroll">
        {activeTab === 'capture_bridge' && (
          <BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} />
        )}
        {activeTab === 'capture_culvert' && (
          <CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} />
        )}
        {activeTab === 'inspect_bridge' && (
          <BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} />
        )}
        {activeTab === 'inspect_culvert' && (
          <CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bms-mobile-nav">
        <button 
          className={`bms-mobile-tab ${activeTab === 'capture_bridge' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture_bridge')}
        >
          <FilePlus size={22} />
          <span>New Bridge</span>
        </button>
        <button 
          className={`bms-mobile-tab ${activeTab === 'capture_culvert' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture_culvert')}
        >
          <FilePlus size={22} />
          <span>New Culvert</span>
        </button>
        <button 
          className={`bms-mobile-tab ${activeTab === 'inspect_bridge' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspect_bridge')}
        >
          <Activity size={22} />
          <span>Insp Bridge</span>
        </button>
        <button 
          className={`bms-mobile-tab ${activeTab === 'inspect_culvert' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspect_culvert')}
        >
          <Activity size={22} />
          <span>Insp Culvert</span>
        </button>
      </nav>
    </div>
  );
}
