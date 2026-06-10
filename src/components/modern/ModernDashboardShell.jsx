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

  return (
    <div className="bms-shell modern-theme-root">
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
          
          {/* New Modern Forms */}
          {modernTab === 'capture_bridge' && <BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} />}
          {modernTab === 'capture_culvert' && <CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} />}
          {modernTab === 'inspect_bridge' && <BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} />}
          {modernTab === 'inspect_culvert' && <CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} />}
          {modernTab === 'reports' && <BmsReports bridges={bridges} culverts={culverts} />}
          {modernTab === 'upgrades' && <UpgradeBridgesForm bridges={bridges} />}
          {modernTab === 'parameters' && <SystemParametersForm />}
        </div>
      </main>
    </div>
  );
}
