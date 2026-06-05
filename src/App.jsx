import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Map as MapIcon, BarChart3, AlertTriangle, Layers, Edit3 } from 'lucide-react';
import StructureListPanel from './components/StructureListPanel';
import DataCaptureTabs from './components/capture/DataCaptureTabs';

const CombinedDashboard = lazy(() => import('./components/CombinedDashboard'));
const CombinedInventory = lazy(() => import('./components/CombinedInventory'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const CriticalDashboard = lazy(() => import('./components/CriticalDashboard'));

function TabLoader() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('bms');
  const [selectedBridge, setSelectedBridge] = useState(null);
  
  // Dynamic Data State
  const [bridgesData, setBridgesData] = useState([]);
  
  useEffect(() => {
    // Try to fetch from local backend first, fallback to static if not running
    fetch('http://localhost:3001/api/bridges')
      .then(res => res.json())
      .then(data => setBridgesData(data))
      .catch(() => {
        console.log('Backend not running, falling back to static data.');
        const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
        fetch(`${BASE_URL}data/bridges.json`)
          .then(r => r.json())
          .then(setBridgesData)
          .catch(console.error);
      });
  }, []);

  const handleSelectBridge = useCallback((bridge) => {
    setSelectedBridge(bridge);
    if (bridge && activeTab !== 'bms' && activeTab !== 'capture') {
      setActiveTab('bms');
    }
  }, [activeTab]);

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
          <button className={`nav-tab ${activeTab === 'capture' ? 'active' : ''}`} onClick={() => setActiveTab('capture')}><Edit3 size={16} /> Data Capture</button>
        </nav>
      </header>
      
      <div className="app-layout">
        {/* Left pane structure list */}
        <aside className="left-pane">
          <StructureListPanel
            selectedBridge={selectedBridge}
            onSelectBridge={handleSelectBridge}
            dynamicBridges={bridgesData}
          />
        </aside>

        {/* Right pane dashboard content */}
        <main className="right-pane">
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'bms' && (
              <CombinedDashboard
                selectedBridge={selectedBridge}
                onSelectBridge={setSelectedBridge}
              />
            )}
            {activeTab === 'inventory' && <CombinedInventory />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'critical' && <CriticalDashboard />}
            {activeTab === 'capture' && (
              <DataCaptureTabs 
                bridges={bridgesData} 
                onBridgesUpdate={setBridgesData} 
              />
            )}
          </Suspense>
        </main>
      </div>
    </>
  );
}

export default App;
