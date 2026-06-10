import { useState } from 'react';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';
import BmsOverview from '../BmsOverview';
import MapDashboard from '../MapDashboard';
import StructureListPanel from '../StructureListPanel';
import BridgeDetailCard from '../BridgeDetailCard';
import CombinedInventory from '../CombinedInventory';
import InspectionWorkspace from '../InspectionWorkspace';
import MaintenanceWorkspace from '../MaintenanceWorkspace';
import AnalyticsDashboard from '../AnalyticsDashboard';
import BridgeInventoryForm from '../capture/BridgeInventoryForm';
import BridgeInspectionForm from '../capture/BridgeInspectionForm';
import CulvertInventoryForm from '../capture/CulvertInventoryForm';
import CulvertInspectionForm from '../capture/CulvertInspectionForm';
import BmsReports from '../BmsReports';
import UpgradeBridgesForm from '../UpgradeBridgesForm';
import SystemParametersForm from '../SystemParametersForm';

export default function ModernDashboardShell({ bridges, culverts, setBridges, setCulverts }) {
  const [modernTab, setModernTab] = useState('overview');
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.toLowerCase() === 'super') {
      setIsAuthenticated(true);
      setShowLoginWall(false);
      setPassword('');
    } else {
      alert("Invalid password");
    }
  };

  const pageTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Network Overview';
      case 'map': return 'Interactive GIS Map';
      case 'inventory': return 'Asset Registers';
      case 'inspection': return 'Inspections Workspace';
      case 'maintenance': return 'Maintenance Planning';
      case 'analytics': return 'Traffic Analytics';
      case 'capture_bridge': return 'Bridge Inventory Capture';
      case 'capture_culvert': return 'Culvert Inventory Capture';
      case 'inspect_bridge': return 'Bridge Inspection Ratings';
      case 'inspect_culvert': return 'Culvert Inspection Ratings';
      case 'reports': return 'Reports & Audits';
      case 'upgrades': return 'Bridge Upgrades';
      case 'parameters': return 'System Parameters';
      default: return 'UNRA BMS Dashboard';
    }
  };

  const pageSubtitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Live network status and operational overview';
      case 'map': return 'Locate structures and review inventory profiles';
      case 'inventory': return 'Review bridge and culvert registries';
      case 'inspection': return 'Record field inspection and overall rating statistics';
      case 'maintenance': return 'Review critical interventions and priority queues';
      case 'analytics': return 'Traffic predictions and vehicle class analysis';
      case 'capture_bridge': return 'Add or update bridge base inventory data';
      case 'capture_culvert': return 'Add or update major culvert base inventory data';
      case 'inspect_bridge': return 'Submit condition ratings for bridges';
      case 'inspect_culvert': return 'Submit condition ratings for culverts';
      case 'reports': return 'Generate PDF and Excel reports';
      case 'upgrades': return 'Plan and cost bridge upgrades';
      case 'parameters': return 'Configure global BMS variables';
      default: return 'Uganda National Roads Authority BMS';
    }
  };

  const isCaptureMode = isAuthenticated && (
    modernTab === 'capture_bridge' || 
    modernTab === 'capture_culvert' || 
    modernTab === 'inspect_bridge' || 
    modernTab === 'inspect_culvert'
  );

  return (
    <>
      {isCaptureMode ? (
        <div className="ent-shell">
          <header className="ent-header">
            <div className="ent-header-left">
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '18px', letterSpacing: '1px' }}>
                MoWT <span style={{ color: '#94a3b8', fontWeight: 400 }}>| BMS Registry</span>
              </div>
            </div>
            
            <div className="ent-header-nav">
              <span className={`ent-header-link ${modernTab.startsWith('capture_') ? 'active' : ''}`} onClick={() => setModernTab('capture_bridge')}>Inventory Engine</span>
              <span className={`ent-header-link ${modernTab.startsWith('inspect_') ? 'active' : ''}`} onClick={() => setModernTab('inspect_bridge')}>Inspection Engine</span>
            </div>

            <div className="ent-header-right">
              <button className="ent-btn-outline" onClick={() => setModernTab('overview')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Exit to Dashboard
              </button>
            </div>
          </header>

          <div className="ent-workspace">
            {modernTab === 'capture_bridge' && <BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} />}
            {modernTab === 'capture_culvert' && <CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} />}
            {modernTab === 'inspect_bridge' && <BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} />}
            {modernTab === 'inspect_culvert' && <CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} />}
          </div>
        </div>
      ) : (
        <div className="bms-shell modern-theme-root">
          <div className="ambient-background"></div>
          
          <ModernSidebar 
            modernTab={modernTab} 
            setModernTab={setModernTab} 
            setSelectedBridge={setSelectedBridge} 
            onSecretClick={() => setShowLoginWall(true)}
            isAuthenticated={isAuthenticated}
          />
          
          <main className="shell-main">
            <ModernHeader 
              modernTab={modernTab} 
              pageTitle={pageTitle} 
              pageSubtitle={pageSubtitle} 
            />
            
            <div className="page-content modern-scroll">
              {modernTab === 'overview' && (
                <BmsOverview 
                  onNavigate={(tab) => setModernTab(tab)} 
                  onSelectAsset={(asset) => {
                    setSelectedBridge(asset);
                    setModernTab('map');
                  }} 
                />
              )}
              {modernTab === 'map' && (
                <div className="map-workspace has-drawer" style={{ height: '100%' }}>
                  <div className="map-asset-list">
                    <StructureListPanel 
                      selectedBridge={selectedBridge} 
                      onSelectBridge={setSelectedBridge} 
                      dynamicBridges={bridges}
                      dynamicCulverts={culverts}
                    />
                  </div>
                  <div className="map-surface">
                    <MapDashboard 
                      selectedBridge={selectedBridge} 
                      onSelectBridge={setSelectedBridge} 
                    />
                  </div>
                  {selectedBridge && (
                    <div className="map-detail-drawer">
                      <BridgeDetailCard 
                        bridge={selectedBridge} 
                        onClose={() => setSelectedBridge(null)} 
                      />
                    </div>
                  )}
                </div>
              )}
              {modernTab === 'inventory' && <CombinedInventory />}
              {modernTab === 'inspection' && <InspectionWorkspace bridges={bridges} onBridgesUpdate={setBridges} />}
              {modernTab === 'maintenance' && (
                <MaintenanceWorkspace 
                  bridges={bridges} 
                  onSelectAsset={(asset) => {
                    setSelectedBridge(asset);
                    setModernTab('map');
                  }}
                />
              )}
              {modernTab === 'analytics' && <AnalyticsDashboard />}
              {modernTab === 'reports' && <BmsReports bridges={bridges} culverts={culverts} />}
              {isAuthenticated && modernTab === 'upgrades' && <UpgradeBridgesForm bridges={bridges} />}
              {isAuthenticated && modernTab === 'parameters' && <SystemParametersForm />}
            </div>
          </main>
        </div>
      )}

      {showLoginWall && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleLogin} className="glass-card" style={{ width: '400px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid var(--border-glow)' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>Restricted Access</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Please enter the administrative password to unlock data input sections.</p>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Admin Password" 
              style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none' }} 
              autoFocus 
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowLoginWall(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent-blue)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}>Unlock System</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
