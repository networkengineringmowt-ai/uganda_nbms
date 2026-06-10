import { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  Database,
  Layers,
  ClipboardCheck,
  HardHat,
  FileText,
  Settings,
  ArrowUpCircle,
  FilePlus,
  Activity
} from 'lucide-react';

export default function ModernSidebar({ modernTab, setModernTab, setSelectedBridge, onSecretClick, isAuthenticated }) {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 1000);
      if (clickCount >= 5) {
        if (onSecretClick) onSecretClick();
        setClickCount(0);
      }
      return () => clearTimeout(timer);
    }
  }, [clickCount, onSecretClick]);

  return (
    <aside className="sidebar">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setClickCount(c => c + 1)}
          title="MoWT BMS National Roads Registry"
        >
          <img src="mowt.jpg" alt="MoWT Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', background: '#fff', padding: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>MoWT BMS</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>National Roads Registry</span>
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
        
        
        {isAuthenticated && (
          <>
            <span className="nav-label">Data Capture</span>
            <button className={`sidebar-link ${modernTab === 'capture_bridge' ? 'active' : ''}`} onClick={() => setModernTab('capture_bridge')}>
              <FilePlus size={16} /> <span>Bridge Inventory</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'capture_culvert' ? 'active' : ''}`} onClick={() => setModernTab('capture_culvert')}>
              <FilePlus size={16} /> <span>Culvert Inventory</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'inspect_bridge' ? 'active' : ''}`} onClick={() => setModernTab('inspect_bridge')}>
              <Activity size={16} /> <span>Bridge Inspections</span>
            </button>
            <button className={`sidebar-link ${modernTab === 'inspect_culvert' ? 'active' : ''}`} onClick={() => setModernTab('inspect_culvert')}>
              <Activity size={16} /> <span>Culvert Inspections</span>
            </button>
          </>
        )}
        
        <span className="nav-label">Operations</span>
        <button className={`sidebar-link ${modernTab === 'maintenance' ? 'active' : ''}`} onClick={() => setModernTab('maintenance')}>
          <HardHat size={16} /> <span>Maintenance Planning</span>
        </button>
        {isAuthenticated && (
          <button className={`sidebar-link ${modernTab === 'upgrades' ? 'active' : ''}`} onClick={() => setModernTab('upgrades')}>
            <ArrowUpCircle size={16} /> <span>Bridge Upgrades</span>
          </button>
        )}
        <button className={`sidebar-link ${modernTab === 'analytics' ? 'active' : ''}`} onClick={() => setModernTab('analytics')}>
          <TrendingUp size={16} /> <span>Traffic Analytics</span>
        </button>
        
        <span className="nav-label">System</span>
        <button className={`sidebar-link ${modernTab === 'reports' ? 'active' : ''}`} onClick={() => setModernTab('reports')}>
          <FileText size={16} /> <span>Reports & Audits</span>
        </button>
        {isAuthenticated && (
          <button className={`sidebar-link ${modernTab === 'parameters' ? 'active' : ''}`} onClick={() => setModernTab('parameters')}>
            <Settings size={16} /> <span>System Parameters</span>
          </button>
        )}
      </nav>
      <div className="sidebar-status">
        <div className="status-line">
          <div className="status-dot"></div>
          <span>Supabase Connected</span>
        </div>
        <span>API: v1 REST Active</span>
      </div>
    </aside>
  );
}
