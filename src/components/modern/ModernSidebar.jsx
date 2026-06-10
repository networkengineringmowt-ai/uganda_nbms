import {
  MapPin,
  TrendingUp,
  Database,
  Layers,
  ClipboardCheck,
  HardHat
} from 'lucide-react';

export default function ModernSidebar({ modernTab, setModernTab, setSelectedBridge }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">BMS</div>
        <div>
          <strong>UNRA BMS</strong>
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
  );
}
