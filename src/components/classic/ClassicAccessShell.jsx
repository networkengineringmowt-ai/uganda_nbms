import { useState } from 'react';
import { Database, Layers } from 'lucide-react';
import MSWindow from './MSWindow';
import LeftNavigationPane from '../LeftNavigationPane';
import RightUtilityPane from '../RightUtilityPane';
import DocumentGallery from '../DocumentGallery';
import BridgeInventoryForm from '../capture/BridgeInventoryForm';
import BridgeInspectionForm from '../capture/BridgeInspectionForm';
import CulvertInventoryForm from '../capture/CulvertInventoryForm';
import CulvertInspectionForm from '../capture/CulvertInspectionForm';
import BmsReports from '../BmsReports';
import UpgradeBridgesForm from '../UpgradeBridgesForm';
import SystemParametersForm from '../SystemParametersForm';
import MapDashboard from '../MapDashboard';
import AnalyticsDashboard from '../AnalyticsDashboard';
import { saveBridge, fetchBridges } from '../../services/bmsDataService';

export default function ClassicAccessShell({ bridges, culverts, setBridges, setCulverts, setViewMode }) {
  const [openWindows, setOpenWindows] = useState({
    switchboard: true,
    bridgeInventory: false,
    bridgeInspection: false,
    culvertInventory: false,
    culvertInspection: false,
    map: false,
    analytics: false,
    reports: false,
    upgrades: false,
    parameters: false,
    documentGallery: false
  });
  
  const [activeWindow, setActiveWindow] = useState('switchboard');

  const handleOpenWindow = (winId) => {
    if (winId === 'exit') {
      alert('To close the database system, close this browser tab.');
      return;
    }
    setOpenWindows(prev => ({ ...prev, [winId]: true }));
    setActiveWindow(winId);
  };

  const handleCloseWindow = (winId) => {
    setOpenWindows(prev => ({ ...prev, [winId]: false }));
    if (activeWindow === winId) {
      const remaining = Object.keys(openWindows).filter(k => openWindows[k] && k !== winId);
      if (remaining.length > 0) {
        setActiveWindow(remaining[remaining.length - 1]);
      }
    }
  };

  const handleFocusWindow = (winId) => {
    setActiveWindow(winId);
  };

  const handleSaveBridgeLocal = async (bridge) => {
    try {
      await saveBridge(bridge);
      const updated = await fetchBridges();
      setBridges(updated);
    } catch (e) {
      alert(`Error saving bridge: ${e.message}`);
    }
  };

  return (
    <div className="ms-access-shell">
      <header className="ms-main-title">
        <div className="ms-main-title-text">
          <Database size={14} />
          <span>Microsoft Access - [Ministry of Works and Transport - Bridge Management System (UBMS)]</span>
        </div>
        <div className="ms-window-controls">
          <button className="ms-ctrl-btn" onClick={() => setViewMode('modern')}>Web Mode</button>
          <button className="ms-ctrl-btn ms-ctrl-btn-close" onClick={() => handleOpenWindow('exit')}>×</button>
        </div>
      </header>

      <div className="ms-shell-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftNavigationPane onOpenWindow={handleOpenWindow} />
        
        <div className="ms-workspace" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {openWindows.bridgeInventory && (
            <MSWindow
              id="bridgeInventory" title="Bridge Inventory Form" x={40} y={30} width={920} height={550}
              active={activeWindow === 'bridgeInventory'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} />
            </MSWindow>
          )}

          {openWindows.bridgeInspection && (
            <MSWindow
              id="bridgeInspection" title="Bridge Inspection Ratings" x={80} y={50} width={860} height={480}
              active={activeWindow === 'bridgeInspection'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} />
            </MSWindow>
          )}

          {openWindows.culvertInventory && (
            <MSWindow
              id="culvertInventory" title="Culvert Inventory Form" x={120} y={70} width={800} height={460}
              active={activeWindow === 'culvertInventory'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} />
            </MSWindow>
          )}

          {openWindows.culvertInspection && (
            <MSWindow
              id="culvertInspection" title="Culvert Inspection Ratings" x={140} y={90} width={720} height={400}
              active={activeWindow === 'culvertInspection'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} />
            </MSWindow>
          )}

          {openWindows.reports && (
            <MSWindow
              id="reports" title="BMS Reports & Validation Audits" x={160} y={40} width={880} height={530}
              active={activeWindow === 'reports'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <BmsReports bridges={bridges} culverts={culverts} onSaveBridge={handleSaveBridgeLocal} />
            </MSWindow>
          )}

          {openWindows.upgrades && (
            <MSWindow
              id="upgrades" title="Upgrade of Bridges" x={200} y={110} width={850} height={440}
              active={activeWindow === 'upgrades'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <UpgradeBridgesForm bridges={bridges} />
            </MSWindow>
          )}

          {openWindows.parameters && (
            <MSWindow
              id="parameters" title="System Parameters" x={220} y={130} width={620} height={380}
              active={activeWindow === 'parameters'} onClose={handleCloseWindow} onFocus={handleFocusWindow}
            >
              <SystemParametersForm />
            </MSWindow>
          )}

          {openWindows.map && (
            <MSWindow
              id="map" title="BMS GIS Map Viewer" x={60} y={60} width={900} height={520}
              active={activeWindow === 'map'} onClose={handleCloseWindow} onFocus={handleFocusWindow} resizable={true}
            >
              <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#ECE9D8', padding: '6px 12px', borderBottom: '1px solid #808080', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Layers size={12} />
                  <strong>Layers Active:</strong>
                  <span>Bridges (546) | Culverts (452) | National Road Links | Rivers</span>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <MapDashboard selectedBridge={null} onSelectBridge={() => {}} />
                </div>
              </div>
            </MSWindow>
          )}

          {openWindows.analytics && (
            <MSWindow
              id="analytics" title="Traffic counts & predictions" x={100} y={80} width={850} height={500}
              active={activeWindow === 'analytics'} onClose={handleCloseWindow} onFocus={handleFocusWindow} resizable={true}
            >
              <div style={{ height: '100%', width: '100%', overflowY: 'auto', background: '#fff', padding: '12px' }}>
                <AnalyticsDashboard />
              </div>
            </MSWindow>
          )}

          {openWindows.documentGallery && (
            <MSWindow
              id="documentGallery" title="Offline Document & Media Gallery" x={120} y={70} width={880} height={550}
              active={activeWindow === 'documentGallery'} onClose={handleCloseWindow} onFocus={handleFocusWindow} resizable={true}
            >
              <DocumentGallery bridges={bridges} />
            </MSWindow>
          )}
        </div>
        
        <RightUtilityPane 
          openWindows={openWindows} 
          activeWindow={activeWindow} 
          onFocusWindow={handleFocusWindow} 
          onCloseWindow={handleCloseWindow} 
          bridges={bridges}
          culverts={culverts}
        />
      </div>

      <footer className="ms-status-bar ms-bevel-out">
        <div className="ms-status-section" style={{ width: '150px' }}>Ready</div>
        <div className="ms-status-section ms-status-section-fill">
          Dataset: {bridges.length} bridges and {culverts.length} culverts loaded from Supabase.
        </div>
        <div className="ms-status-indicator active" title="Caps Lock Status">CAPS</div>
        <div className="ms-status-indicator active" title="Num Lock Status">NUM</div>
        <div className="ms-status-indicator active" title="Scroll Lock Status">SCRL</div>
      </footer>
    </div>
  );
}
