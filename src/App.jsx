import React, { useState } from 'react';
import BridgesDashboard from './components/BridgesDashboard';
import CulvertsDashboard from './components/CulvertsDashboard';
import InvestmentDashboard from './components/InvestmentDashboard';
import MapDashboard from './components/MapDashboard';
import DocumentsDashboard from './components/DocumentsDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CriticalDashboard from './components/CriticalDashboard';
import CombinedDashboard from './components/CombinedDashboard';
import CombinedInventory from './components/CombinedInventory';
import { Activity, LayoutDashboard, Map as MapIcon, BarChart3, AlertTriangle, Layers } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('bms');

  return (
    <>
      <header className="header">
        <div className="brand">
          <h1>Uganda BMS</h1>
          <span>Bridge Management System</span>
        </div>
        <nav className="nav-tabs" style={{overflowX: 'auto'}}>
          <button className={`nav-tab ${activeTab === 'bms' ? 'active' : ''}`} onClick={() => setActiveTab('bms')}><MapIcon size={16} /> BMS Dashboard & Map</button>
          <button className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><Layers size={16} /> Inventory & Condition</button>
          <button className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart3 size={16} /> Analytics</button>
          <button className={`nav-tab ${activeTab === 'critical' ? 'active' : ''}`} onClick={() => setActiveTab('critical')}><AlertTriangle size={16} /> Critical Structures</button>
        </nav>
      </header>
      
      <main className="dashboard-content">
        {activeTab === 'bms' && <CombinedDashboard />}
        {activeTab === 'inventory' && <CombinedInventory />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'critical' && <CriticalDashboard />}
      </main>
    </>
  );
}

export default App;
