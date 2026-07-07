import { useState } from 'react';
import { 
  X, ExternalLink, Activity, Info, 
  Folder, FileText, PieChart, BarChart2, Table, Layers, BookOpen, Calculator
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

export default function RightUtilityPane({ openWindows, activeWindow, onFocusWindow, onCloseWindow, bridges = [], culverts = [] }) {
  const [isWindowsExpanded, setIsWindowsExpanded] = useState(true);

  const windowTitles = {
    bridgeInventory: 'Bridge Inventory',
    bridgeInspection: 'Bridge Inspection',
    culvertInventory: 'Culvert Inventory',
    culvertInspection: 'Culvert Inspection',
    map: 'GIS Network Map',
    analytics: 'Traffic Analytics',
    reports: 'BMS Reports',
    upgrades: 'Bridge Upgrades',
    parameters: 'System Parameters'
  };

  const activeIds = Object.keys(openWindows).filter(k => openWindows[k] && k !== 'switchboard');
  
  // Calculate basic stats for the context view
  const goodBridges = bridges.filter(b => b.condition === 'Good' || b.condition === 'Fair' || b.rating > 70).length;
  const poorBridges = bridges.length > 0 ? (bridges.length - goodBridges) : 0;

  const renderActiveWindows = () => (
    <div className="pane-section">
      <div 
        className="pane-section-header"
        onClick={() => setIsWindowsExpanded(!isWindowsExpanded)}
      >
        <Activity size={14} />
        <span>Active Windows ({activeIds.length})</span>
      </div>
      
      {isWindowsExpanded && (
        <div className="pane-section-body">
          {activeIds.length === 0 ? (
            <div className="empty-state">
              <Info size={16} style={{margin: '0 auto 4px'}} />
              <p>No open forms.</p>
            </div>
          ) : (
            <div className="active-windows-list">
              {activeIds.map(id => (
                <div 
                  key={id} 
                  className={`active-window-card ${activeWindow === id ? 'is-focused' : ''}`}
                  onClick={() => onFocusWindow(id)}
                >
                  <div className="awc-info">
                    <ExternalLink size={12} />
                    <span style={{fontSize: '11px'}}>{windowTitles[id] || id}</span>
                  </div>
                  <button 
                    className="awc-close" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseWindow(id);
                    }}
                    title="Close Window"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderContextContent = () => {
    switch (activeWindow) {
      case 'switchboard':
        return (
          <div className="context-section">
            <h4 className="cs-heading">Network Overview</h4>
            <div className="cs-stats-grid">
               <div className="cs-stat-card">
                 <span className="cs-stat-val">{bridges.length || 0}</span>
                 <span className="cs-stat-lbl">Bridges</span>
               </div>
               <div className="cs-stat-card">
                 <span className="cs-stat-val">{culverts.length || 0}</span>
                 <span className="cs-stat-lbl">Culverts</span>
               </div>
            </div>
            
            <h4 className="cs-heading">Bridge Health</h4>
            {bridges.length > 0 && (
              <div className="mini-chart-container">
                <ReactECharts 
                  option={{
                    tooltip: { trigger: 'item', textStyle: { fontSize: 10 }, padding: 4 },
                    series: [{
                      type: 'pie',
                      radius: ['40%', '70%'],
                      center: ['50%', '50%'],
                      data: [
                        { value: goodBridges, name: 'Good/Fair', itemStyle: { color: '#0ea5e9' } }, // Blue theme compatible
                        { value: poorBridges, name: 'Poor/Crit', itemStyle: { color: '#e2e8f0' } }
                      ],
                      label: { show: false }
                    }]
                  }}
                  style={{ height: '100px', width: '100%' }}
                />
              </div>
            )}
            
            <h4 className="cs-heading">Library</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><Folder size={14}/> <span>Archived Snapshots</span></div>
               <div className="folder-item"><BookOpen size={14}/> <span>User Manuals</span></div>
            </div>
          </div>
        );
      case 'bridgeInventory':
      case 'bridgeInspection':
        return (
          <div className="context-section">
            <h4 className="cs-heading">Bridge Folders</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><Folder size={14}/> <span>National Routes</span></div>
               <div className="folder-item"><Folder size={14}/> <span>District Routes</span></div>
               <div className="folder-item"><Folder size={14}/> <span>Suspended Bridges</span></div>
            </div>
            <h4 className="cs-heading">Quick Actions</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><Table size={14}/> <span>Export to Excel</span></div>
               <div className="folder-item"><FileText size={14}/> <span>Print Current Record</span></div>
               <div className="folder-item"><Calculator size={14}/> <span>Recalculate Ratings</span></div>
            </div>
          </div>
        );
      case 'culvertInventory':
      case 'culvertInspection':
        return (
          <div className="context-section">
             <h4 className="cs-heading">Culvert Stats</h4>
             <div className="cs-stats-grid">
               <div className="cs-stat-card" style={{gridColumn: '1 / -1'}}>
                 <span className="cs-stat-val">{culverts.length || 0}</span>
                 <span className="cs-stat-lbl">Total Culverts</span>
               </div>
            </div>
            <h4 className="cs-heading">Categorization</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><Folder size={14}/> <span>Box Culverts</span></div>
               <div className="folder-item"><Folder size={14}/> <span>Pipe Culverts</span></div>
               <div className="folder-item"><Folder size={14}/> <span>Arch Culverts</span></div>
            </div>
          </div>
        );
      case 'map':
        return (
          <div className="context-section">
            <h4 className="cs-heading">GIS Layers</h4>
            <div className="cs-folder-list">
               <div className="folder-item active"><Layers size={14}/> <span>Primary Network</span></div>
               <div className="folder-item"><Layers size={14}/> <span>Rivers & Waterways</span></div>
               <div className="folder-item"><Layers size={14}/> <span>District Boundaries</span></div>
               <div className="folder-item"><Layers size={14}/> <span>Traffic Stations</span></div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="context-section">
            <h4 className="cs-heading">Traffic Models</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><BarChart2 size={14}/> <span>2024 Base Year</span></div>
               <div className="folder-item"><BarChart2 size={14}/> <span>2030 Projections</span></div>
               <div className="folder-item"><PieChart size={14}/> <span>Vehicle Classes</span></div>
            </div>
          </div>
        );
      case 'reports':
      case 'upgrades':
        return (
          <div className="context-section">
            <h4 className="cs-heading">Report Catalog</h4>
            <div className="cs-folder-list">
               <div className="folder-item"><Folder size={14}/> <span>Financial Year 25/26</span></div>
               <div className="folder-item"><Folder size={14}/> <span>Audit Summaries</span></div>
               <div className="folder-item"><Table size={14}/> <span>Cost Matrices</span></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="context-section">
            <p style={{color: '#666', fontSize: '11px', textAlign: 'center', marginTop: '20px'}}>
              Select an item to view insights.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="docked-pane right-pane">
      <div className="pane-header">
        <Activity size={16} />
        <span>Workspace & Insights</span>
      </div>
      
      <div className="pane-content" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
        {/* Top area: Active Windows */}
        {renderActiveWindows()}

        {/* Bottom area: Contextual Insights */}
        <div className="pane-section" style={{ flex: 1, borderBottom: 'none' }}>
          <div className="pane-section-header">
            <Info size={14} />
            <span>Contextual Data</span>
          </div>
          <div className="pane-section-body" style={{ background: 'var(--ms-bg-dark)', flex: 1 }}>
            {renderContextContent()}
          </div>
        </div>
      </div>
      
      <div className="pane-footer">
        <div className="system-info-card">
          <strong style={{fontSize: '10px', textTransform: 'uppercase'}}>Database Status</strong>
          <div className="status-indicator online">Online (Supabase)</div>
          <small>v2.0 (2026)</small>
        </div>
      </div>
    </div>
  );
}
