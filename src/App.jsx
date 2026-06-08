import { useEffect, useState } from 'react';
import {
  MapPin,
  TrendingUp,
  Printer,
  FileSpreadsheet,
  HelpCircle,
  Database,
  Activity,
  Layers,
  Settings,
  Plus,
  ClipboardCheck,
  HardHat
} from 'lucide-react';
import MainSwitchboard from './components/MainSwitchboard';
import BridgeInventoryForm from './components/capture/BridgeInventoryForm';
import BridgeInspectionForm from './components/capture/BridgeInspectionForm';
import CulvertInventoryForm from './components/capture/CulvertInventoryForm';
import CulvertInspectionForm from './components/capture/CulvertInspectionForm';
import BmsReports from './components/BmsReports';
import UpgradeBridgesForm from './components/UpgradeBridgesForm';
import SystemParametersForm from './components/SystemParametersForm';
import MapDashboard from './components/MapDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import BmsOverview from './components/BmsOverview';
import CombinedInventory from './components/CombinedInventory';
import InspectionWorkspace from './components/InspectionWorkspace';
import MaintenanceWorkspace from './components/MaintenanceWorkspace';
import BridgeDetailCard from './components/BridgeDetailCard';
import StructureListPanel from './components/StructureListPanel';
import { fetchBridges, fetchCulverts, saveBridge } from './services/bmsDataService';

// Draggable Window Component
function MSWindow({ id, title, x, y, width, height, active, onClose, onFocus, children, resizable = false }) {
  const [pos, setPos] = useState({ x, y });

  const handleMouseDown = (e) => {
    if (e.target.closest('.ms-ctrl-btn')) return;
    onFocus(id);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = pos.x;
    const initialY = pos.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPos({
        x: Math.max(0, initialX + dx),
        y: Math.max(0, initialY + dy)
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`ms-window ms-bevel-out ${active ? 'active' : 'inactive'} ${resizable ? 'ms-window-resizable' : ''}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        zIndex: active ? 1000 : 100,
        position: 'absolute'
      }}
      onClick={() => onFocus(id)}
    >
      <div className="ms-window-header" onMouseDown={handleMouseDown}>
        <div className="ms-window-title">
          <span>{title}</span>
        </div>
        <div className="ms-window-controls">
          <button className="ms-ctrl-btn ms-ctrl-btn-close" onClick={() => onClose(id)}>×</button>
        </div>
      </div>
      <div className="ms-window-body">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('classic'); // 'classic' or 'modern'
  const [modernTab, setModernTab] = useState('overview');
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  
  // MDI Windows state
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
    parameters: false
  });
  
  const [activeWindow, setActiveWindow] = useState('switchboard');

  // Load datasets on startup
  useEffect(() => {
    Promise.all([fetchBridges(), fetchCulverts()])
      .then(([bridgeRows, culvertRows]) => {
        setBridges(bridgeRows);
        setCulverts(culvertRows);
      })
      .catch(console.error);
  }, []);

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
      // Focus another open window
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

  const pageTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Network Overview';
      case 'map': return 'Interactive GIS Map';
      case 'inventory': return 'Asset Registers';
      case 'inspection': return 'Inspections Workspace';
      case 'maintenance': return 'Maintenance Planning';
      case 'analytics': return 'Traffic Analytics';
      default: return 'BMS Dashboard';
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

  if (viewMode === 'modern') {
    return (
      <div className="bms-shell" style={{ display: 'flex', minHeight: '100vh', background: '#f2f5f3' }}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">BMS</div>
            <div>
              <strong>UNRA UBMS</strong>
              <span>Bridge Management</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <span className="nav-label">Main Register</span>
            <button className={`sidebar-link ${modernTab === 'overview' ? 'active' : ''}`} onClick={() => setModernTab('overview')}>
              <Database size={16} /> <span>Network Overview</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'map' ? 'active' : ''}`} onClick={() => { setModernTab('map'); setSelectedBridge(null); }}>
              <MapPin size={16} /> <span>Interactive GIS Map</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'inventory' ? 'active' : ''}`} onClick={() => setModernTab('inventory')}>
              <Layers size={16} /> <span>Asset Registers</span>
            </button>
            <span className="nav-label">Operations</span>
            <button className={`sidebar-link ${modernTab === 'inspection' ? 'active' : ''}`} onClick={() => setModernTab('inspection')}>
              <ClipboardCheck size={16} /> <span>Inspections</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'maintenance' ? 'active' : ''}`} onClick={() => setModernTab('maintenance')}>
              <HardHat size={16} /> <span>Maintenance Planning</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'analytics' ? 'active' : ''}`} onClick={() => setModernTab('analytics')}>
              <TrendingUp size={16} /> <span>Traffic Analytics</span>
            </button>
          </nav>
          <div className="sidebar-status">
            <div className="status-line">
              <div className="status-dot"></div>
              <span>Supabase Connected</span>
            </div>
            <span>API: v1 REST Active</span>
          </div>
        </aside>
        
        {/* Main Container */}
        <main className="shell-main" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <header className="topbar">
            <div className="page-heading">
              <h1>{pageTitle(modernTab)}</h1>
              <p>{pageSubtitle(modernTab)}</p>
            </div>
            
            <div className="topbar-actions">
              <div className="role-badge">National Inspector</div>
              <button 
                className="icon-button" 
                onClick={() => setViewMode('classic')}
                title="Switch to Access Shell"
                style={{ width: 'auto', padding: '0 12px', fontSize: '11px', fontWeight: 'bold' }}
              >
                Access Shell
              </button>
            </div>
          </header>
          
          <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
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

  return (
    <div className="ms-access-shell">
      {/* 1. Main System Title Bar */}
      <header className="ms-main-title">
        <div className="ms-main-title-text">
          <Database size={14} />
          <span>Microsoft Access - [Uganda National Roads Authority - Bridge Management System (UBMS)]</span>
        </div>
        <div className="ms-window-controls">
          <button className="ms-ctrl-btn" onClick={() => setViewMode(v => v === 'classic' ? 'modern' : 'classic')}>
            {viewMode === 'classic' ? 'Web Mode' : 'Access Mode'}
          </button>
          <button className="ms-ctrl-btn ms-ctrl-btn-close" onClick={() => handleOpenWindow('exit')}>×</button>
        </div>
      </header>

      {/* 2. Dropdown Menu Bar */}
      <nav className="ms-menu-bar" aria-label="Access Main Menu">
        <div className="ms-menu-item">
          File
          <div className="ms-menu-dropdown">
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('reports')}>Set Paths...</div>
            <div className="ms-dropdown-divider" />
            <div className="ms-dropdown-item" onClick={() => setViewMode('modern')}>Switch to Web Dashboard</div>
            <div className="ms-dropdown-divider" />
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('exit')}>Exit Database</div>
          </div>
        </div>
        
        <div className="ms-menu-item">
          Capture Screens
          <div className="ms-menu-dropdown">
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('bridgeInventory')}>Bridge Inventory</div>
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('bridgeInspection')}>Bridge Inspection</div>
            <div className="ms-dropdown-divider" />
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('culvertInventory')}>Culvert Inventory</div>
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('culvertInspection')}>Culvert Inspection</div>
            <div className="ms-dropdown-divider" />
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('upgrades')}>Upgrade of Bridges</div>
          </div>
        </div>

        <div className="ms-menu-item">
          Reporting
          <div className="ms-menu-dropdown">
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('reports')}>Data Validation Audits</div>
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('reports')}>CRC Replacement Costing</div>
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('reports')}>Generate Summary Sheets</div>
          </div>
        </div>

        <div className="ms-menu-item">
          Add-ins
          <div className="ms-menu-dropdown">
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('map')}>Open GIS Network Map</div>
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('analytics')}>Traffic predictions (SQLBot)</div>
            <div className="ms-dropdown-divider" />
            <div className="ms-dropdown-item" onClick={() => handleOpenWindow('parameters')}>System Parameters</div>
          </div>
        </div>

        <div className="ms-menu-item" onClick={() => alert('Uganda National Roads Authority BMS\nDeveloped by Aurecon (Copyright 2017).\nMigrated to Supabase Web platform (2026).')}>
          Help
        </div>
      </nav>

      {/* 3. Standard Shortcut Toolbar */}
      <div className="ms-toolbar">
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('bridgeInventory')} title="New Bridge Record">
          <Plus size={14} /> New
        </button>
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('reports')} title="Generate PDF Sheets">
          <Printer size={14} /> Print
        </button>
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('reports')} title="Export Cost Metrics">
          <FileSpreadsheet size={14} /> Excel
        </button>
        <div className="ms-tool-divider" />
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('map')} title="Open Network Map">
          <MapPin size={14} /> GIS Map
        </button>
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('analytics')} title="Traffic counts & predictions">
          <TrendingUp size={14} /> Traffic
        </button>
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('reports')} title="Run database audits">
          <Activity size={14} /> Audits
        </button>
        <div className="ms-tool-divider" />
        <button className="ms-tool-btn" onClick={() => handleOpenWindow('parameters')} title="Formula weights">
          <Settings size={14} /> Parameters
        </button>
        <div className="ms-tool-divider" />
        <button className="ms-tool-btn" onClick={() => alert('Access Help Desk: unra_support@aurecongroup.com')} title="Get support">
          <HelpCircle size={14} /> Help
        </button>
      </div>

      {/* 4. Desktop area (MDI container or Modern shell) */}
      <div className="ms-workspace" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {viewMode === 'classic' ? (
          <>
            {/* Draggable MDI Windows */}
            {openWindows.switchboard && (
              <MSWindow
                id="switchboard"
                title="Main Switchboard"
                x={120}
                y={50}
                width={520}
                height={412}
                active={activeWindow === 'switchboard'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <MainSwitchboard onOpenWindow={handleOpenWindow} />
              </MSWindow>
            )}

            {openWindows.bridgeInventory && (
              <MSWindow
                id="bridgeInventory"
                title="Bridge Inventory Form"
                x={40}
                y={30}
                width={920}
                height={550}
                active={activeWindow === 'bridgeInventory'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <BridgeInventoryForm bridges={bridges} onBridgesUpdate={setBridges} />
              </MSWindow>
            )}

            {openWindows.bridgeInspection && (
              <MSWindow
                id="bridgeInspection"
                title="Bridge Inspection Ratings"
                x={80}
                y={50}
                width={860}
                height={480}
                active={activeWindow === 'bridgeInspection'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <BridgeInspectionForm bridges={bridges} onBridgesUpdate={setBridges} />
              </MSWindow>
            )}

            {openWindows.culvertInventory && (
              <MSWindow
                id="culvertInventory"
                title="Culvert Inventory Form"
                x={120}
                y={70}
                width={800}
                height={460}
                active={activeWindow === 'culvertInventory'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <CulvertInventoryForm culverts={culverts} onCulvertsUpdate={setCulverts} />
              </MSWindow>
            )}

            {openWindows.culvertInspection && (
              <MSWindow
                id="culvertInspection"
                title="Culvert Inspection Ratings"
                x={140}
                y={90}
                width={720}
                height={400}
                active={activeWindow === 'culvertInspection'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <CulvertInspectionForm culverts={culverts} onCulvertsUpdate={setCulverts} />
              </MSWindow>
            )}

            {openWindows.reports && (
              <MSWindow
                id="reports"
                title="BMS Reports & Validation Audits"
                x={160}
                y={40}
                width={880}
                height={530}
                active={activeWindow === 'reports'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <BmsReports bridges={bridges} culverts={culverts} onSaveBridge={handleSaveBridgeLocal} />
              </MSWindow>
            )}

            {openWindows.upgrades && (
              <MSWindow
                id="upgrades"
                title="Upgrade of Bridges"
                x={200}
                y={110}
                width={850}
                height={440}
                active={activeWindow === 'upgrades'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <UpgradeBridgesForm bridges={bridges} />
              </MSWindow>
            )}

            {openWindows.parameters && (
              <MSWindow
                id="parameters"
                title="System Parameters"
                x={220}
                y={130}
                width={620}
                height={380}
                active={activeWindow === 'parameters'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
              >
                <SystemParametersForm />
              </MSWindow>
            )}

            {openWindows.map && (
              <MSWindow
                id="map"
                title="BMS GIS Map Viewer"
                x={60}
                y={60}
                width={900}
                height={520}
                active={activeWindow === 'map'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
                resizable={true}
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
                id="analytics"
                title="Traffic counts & predictions"
                x={100}
                y={80}
                width={850}
                height={500}
                active={activeWindow === 'analytics'}
                onClose={handleCloseWindow}
                onFocus={handleFocusWindow}
                resizable={true}
              >
                <div style={{ height: '100%', width: '100%', overflowY: 'auto', background: '#fff', padding: '12px' }}>
                  <AnalyticsDashboard />
                </div>
              </MSWindow>
            )}
          </>
        ) : (
          /* Modern Web Dashboard Fallback */
          <div style={{
            position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>National Roads Analytics Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Live bridge structure status and traffic data visualization</p>
              </div>
              <button 
                style={{
                  background: 'var(--gradient-primary)', border: 'none', borderRadius: '8px',
                  color: '#fff', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer'
                }}
                onClick={() => setViewMode('classic')}
              >
                Return to Access Shell
              </button>
            </div>
            <AnalyticsDashboard />
          </div>
        )}
      </div>

      {/* 5. System Status Bar */}
      <footer className="ms-status-bar ms-bevel-out">
        <div className="ms-status-section" style={{ width: '150px' }}>
          Ready
        </div>
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
