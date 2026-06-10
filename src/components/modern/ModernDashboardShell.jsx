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

export default function ModernDashboardShell({ bridges, culverts, setBridges, setViewMode }) {
  const [modernTab, setModernTab] = useState('overview');
  const [selectedBridge, setSelectedBridge] = useState(null);

  const pageTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Network Overview';
      case 'map': return 'Interactive GIS Map';
      case 'inventory': return 'Asset Registers';
      case 'inspection': return 'Inspections Workspace';
      case 'maintenance': return 'Maintenance Planning';
      case 'analytics': return 'Traffic Analytics';
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
      default: return 'Uganda National Roads Authority BMS';
    }
  };

  return (
    <div className="bms-shell modern-theme-root">
      {/* Animated Background Canvas */}
      <div className="ambient-background"></div>
      
      <ModernSidebar 
        modernTab={modernTab} 
        setModernTab={setModernTab} 
        setSelectedBridge={setSelectedBridge} 
      />
      
      <main className="shell-main">
        <ModernHeader 
          modernTab={modernTab} 
          pageTitle={pageTitle} 
          pageSubtitle={pageSubtitle} 
          setViewMode={setViewMode} 
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
        </div>
      </main>
    </div>
  );
}
