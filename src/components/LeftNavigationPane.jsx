import { useState } from 'react';
import {
  Plus,
  ClipboardCheck,
  Layers,
  MapPin,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  HardHat,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-react';

export default function LeftNavigationPane({ onOpenWindow }) {
  const [openSections, setOpenSections] = useState({
    capture: true,
    reporting: true,
    addins: true
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="docked-pane left-pane">
      <div className="pane-header">
        <Database size={18} />
        <span>System Navigation</span>
      </div>
      <div className="pane-content">
        
        {/* Capture Screens */}
        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('capture')}>
            {openSections.capture ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Capture Screens</span>
          </div>
          {openSections.capture && (
            <div className="nav-section-body">
              <button className="nav-btn" onClick={() => onOpenWindow('bridgeInventory')}>
                <Plus size={14} /> Bridge Inventory
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('bridgeInspection')}>
                <ClipboardCheck size={14} /> Bridge Inspection
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('culvertInventory')}>
                <Layers size={14} /> Culvert Inventory
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('culvertInspection')}>
                <ClipboardCheck size={14} /> Culvert Inspection
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('upgrades')}>
                <HardHat size={14} /> Upgrade of Bridges
              </button>
            </div>
          )}
        </div>

        {/* Reporting */}
        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('reporting')}>
            {openSections.reporting ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Reporting</span>
          </div>
          {openSections.reporting && (
            <div className="nav-section-body">
              <button className="nav-btn" onClick={() => onOpenWindow('reports')}>
                <Activity size={14} /> Data Validation Audits
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('reports')}>
                <FileSpreadsheet size={14} /> CRC Replacement Costing
              </button>
            </div>
          )}
        </div>

        {/* Add-ins */}
        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('addins')}>
            {openSections.addins ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Add-ins</span>
          </div>
          {openSections.addins && (
            <div className="nav-section-body">
              <button className="nav-btn" onClick={() => onOpenWindow('map')}>
                <MapPin size={14} /> GIS Network Map
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('analytics')}>
                <TrendingUp size={14} /> Traffic Predictions
              </button>
              <button className="nav-btn" onClick={() => onOpenWindow('parameters')}>
                <Database size={14} /> System Parameters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
