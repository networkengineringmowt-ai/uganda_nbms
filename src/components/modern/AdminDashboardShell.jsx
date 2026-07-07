import { useState } from 'react';
import DashboardNav from './DashboardNav';
import BmsOverview from '../BmsOverview';
import MapDashboard from '../MapDashboard';
import StructureListPanel from '../StructureListPanel';
import BridgeDetailCard from '../BridgeDetailCard';
import CombinedInventory from '../CombinedInventory';
import InspectionWorkspace from '../InspectionWorkspace';
import MaintenanceWorkspace from '../MaintenanceWorkspace';
import WorksDashboard from '../WorksDashboard';
import AnalyticsDashboard from '../AnalyticsDashboard';
import BmsReports from '../BmsReports';
import PhotoLibrary from '../PhotoLibrary';

// Admin & Input
import BridgeInventoryForm from '../capture/BridgeInventoryForm';
import BridgeInspectionForm from '../capture/BridgeInspectionForm';
import CulvertInventoryForm from '../capture/CulvertInventoryForm';
import CulvertInspectionForm from '../capture/CulvertInspectionForm';

import UpgradeBridgesForm from '../UpgradeBridgesForm';
import SystemParametersForm from '../SystemParametersForm';
import ArchitectureSchematic from './ArchitectureSchematic';
import AdminAlgorithms from '../admin/AdminAlgorithms';
import CriticalStructures from './CriticalStructures';

import BridgeMemberInfo from '../BridgeMemberInfo';
import InspectionPlanManager from '../InspectionPlanManager';
import UserManagement from '../admin/UserManagement';
import SourcesEvidenceAdmin from '../admin/SourcesEvidenceAdmin';
import LoginTracking from '../admin/LoginTracking';

export default function AdminDashboardShell({ bridges, culverts, setBridges, setCulverts }) {
  const [modernTab, setModernTab] = useState('overview');
  const [selectedBridge, setSelectedBridge] = useState(null);

  const isCaptureMode = modernTab.startsWith('capture_') || modernTab.startsWith('inspect_');

  return (
    <div className="bms-shell modern-theme-root">
      <div className="ambient-background"></div>
      
      <DashboardNav 
        modernTab={modernTab} 
        setModernTab={setModernTab} 
        setSelectedBridge={setSelectedBridge} 
        role="admin"
      />
      
      <main className="shell-main-horiz" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="page-content modern-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: (isCaptureMode || modernTab === 'map') ? '0' : '12px 16px 0' }}>
          
          {/* Capture Modes (Full height workspace) */}
          {modernTab === 'capture_bridge' && (
            <div className="ent-workspace"><BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} /></div>
          )}
          {modernTab === 'capture_culvert' && (
            <div className="ent-workspace"><CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} /></div>
          )}
          {modernTab === 'inspect_bridge' && (
            <div className="ent-workspace"><BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} /></div>
          )}
          {modernTab === 'inspect_culvert' && (
            <div className="ent-workspace"><CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} /></div>
          )}

          {/* Dashboards */}
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
                <MapDashboard selectedBridge={selectedBridge} onSelectBridge={setSelectedBridge} />
              </div>
              <div className="map-list-pane">
                <StructureListPanel selectedBridge={selectedBridge} onSelectBridge={setSelectedBridge} dynamicBridges={bridges} dynamicCulverts={culverts} />
              </div>
              {selectedBridge && (
                <div className="map-detail-pane">
                  <BridgeDetailCard bridge={selectedBridge} onClose={() => setSelectedBridge(null)} />
                </div>
              )}
            </div>
          )}
          {modernTab === 'inventory' && <CombinedInventory bridges={bridges} culverts={culverts} />}
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
          {modernTab === 'works' && <WorksDashboard />}
          {modernTab === 'analytics' && <AnalyticsDashboard />}
          {modernTab === 'reports' && <BmsReports bridges={bridges} culverts={culverts} />}
          {modernTab === 'photos' && <PhotoLibrary bridges={bridges} culverts={culverts} />}
          {/* Admin Tools */}
          {modernTab === 'upgrades' && <UpgradeBridgesForm bridges={bridges} />}
          {modernTab === 'parameters' && <SystemParametersForm />}
          {modernTab === 'architecture' && <ArchitectureSchematic />}
          {modernTab === 'algorithms' && <AdminAlgorithms />}
          {modernTab === 'sources_evidence' && <SourcesEvidenceAdmin />}

          {/* BMS Training Features */}
          {modernTab === 'bms_3d' && <BridgeMemberInfo bridges={bridges} culverts={culverts} />}
          {modernTab === 'critical_structures' && <CriticalStructures bridges={bridges} culverts={culverts} onSelectBridge={(asset) => { setSelectedBridge(asset); setModernTab('map'); }} />}
          {modernTab === 'bms_plans' && <InspectionPlanManager bridges={bridges} />}
          {modernTab === 'bms_users' && <UserManagement />}
          {modernTab === 'login_tracking' && <LoginTracking />}
        </div>
      </main>
    </div>
  );
}
