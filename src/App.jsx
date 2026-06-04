import React, { useState } from 'react';
import BridgesDashboard from './components/BridgesDashboard';
import CulvertsDashboard from './components/CulvertsDashboard';
import InvestmentDashboard from './components/InvestmentDashboard';
import MapDashboard from './components/MapDashboard';
import DocumentsDashboard from './components/DocumentsDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CriticalDashboard from './components/CriticalDashboard';
import WorksDashboard from './components/WorksDashboard';
import { Activity, LayoutDashboard, GitBranch, Map as MapIcon, FileText, BarChart3, AlertTriangle, Construction } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('investment');

  return (
    <>
      <header className="header">
        <div className="brand">
          <h1>Uganda BMS</h1>
          <span>Bridge Management System</span>
        </div>
        <nav className="nav-tabs" style={{overflowX: 'auto'}}>
          <button className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart3 size={16} /> Advanced Analytics</button>
          <button className={`nav-tab ${activeTab === 'critical' ? 'active' : ''}`} onClick={() => setActiveTab('critical')}><AlertTriangle size={16} /> Critical Structures</button>
          <button className={`nav-tab ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}><Construction size={16} /> Bridge Works</button>
          <button className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}><MapIcon size={16} /> Interactive Map</button>
          <button className={`nav-tab ${activeTab === 'bridges' ? 'active' : ''}`} onClick={() => setActiveTab('bridges')}><LayoutDashboard size={16} /> Bridges Registry</button>
          <button className={`nav-tab ${activeTab === 'culverts' ? 'active' : ''}`} onClick={() => setActiveTab('culverts')}><GitBranch size={16} /> Major Culverts</button>
          <button className={`nav-tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}><FileText size={16} /> Document Library</button>
        </nav>
      </header>
      
      <main className="main-content">
        {activeTab === 'investment' && <InvestmentDashboard />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'critical' && <CriticalDashboard />}
        {activeTab === 'works' && <WorksDashboard />}
        {activeTab === 'map' && <MapDashboard />}
        {activeTab === 'bridges' && <BridgesDashboard />}
        {activeTab === 'culverts' && <CulvertsDashboard />}
        {activeTab === 'docs' && <DocumentsDashboard />}
      </main>
    </>
  );
}

export default App;
