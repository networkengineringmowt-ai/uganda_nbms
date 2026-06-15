import { useState } from 'react';
import DashboardNav from './DashboardNav';
import BmsOverview from '../BmsOverview';
import MapDashboard from '../MapDashboard';
import StructureListPanel from '../StructureListPanel';
import BridgeDetailCard from '../BridgeDetailCard';
import CombinedInventory from '../CombinedInventory';
import InspectionWorkspace from '../InspectionWorkspace';
import MaintenanceWorkspace from '../MaintenanceWorkspace';
import AnalyticsDashboard from '../AnalyticsDashboard';
import BmsReports from '../BmsReports';
import PhotoLibrary from '../PhotoLibrary';

export default function SuperDashboardShell({ bridges, culverts }) {
  const [modernTab, setModernTab] = useState('overview');
  const [selectedBridge, setSelectedBridge] = useState(null);

  // Note: We deliberately do NOT pass setBridges/setCulverts so it's strictly read-only
  // Note: We deliberately do NOT import any Capture forms

  return (
    <div className="bms-shell modern-theme-root">
      <div className="ambient-background"></div>
      
      <DashboardNav 
        modernTab={modernTab} 
        setModernTab={setModernTab} 
        setSelectedBridge={setSelectedBridge} 
        role="super"
      />
      
      <main className="shell-main-horiz" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="page-content modern-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: modernTab === 'map' ? '0' : '12px 16px 0' }}>
          
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
            <div className="modern-fullscreen-map">
              <div className="map-surface-layer">
                <MapDashboard 
                  selectedBridge={selectedBridge} 
                  onSelectBridge={setSelectedBridge} 
                />
              </div>
              
              <div className="map-list-pane">
                <StructureListPanel 
                  selectedBridge={selectedBridge} 
                  onSelectBridge={setSelectedBridge} 
                  dynamicBridges={bridges}
                  dynamicCulverts={culverts}
                />
              </div>

              {selectedBridge && (
                <div className="map-detail-pane">
                  <BridgeDetailCard 
                    bridge={selectedBridge} 
                    onClose={() => setSelectedBridge(null)} 
                  />
                </div>
              )}
            </div>
          )}
          {modernTab === 'inventory' && <CombinedInventory bridges={bridges} culverts={culverts} readOnly={true} />}
          {modernTab === 'inspection' && <InspectionWorkspace bridges={bridges} onBridgesUpdate={() => {}} readOnly={true} />}
          {modernTab === 'maintenance' && (
            <MaintenanceWorkspace 
              bridges={bridges} 
              onSelectAsset={(asset) => {
                setSelectedBridge(asset);
                setModernTab('map');
              }}
              readOnly={true}
            />
          )}
          {modernTab === 'analytics' && <AnalyticsDashboard />}
          {modernTab === 'reports' && <BmsReports bridges={bridges} culverts={culverts} />}
          {modernTab === 'photos' && <PhotoLibrary bridges={bridges} culverts={culverts} />}
        </div>
      </main>
    </div>
  );
}
