import React, { useState } from 'react';
import BridgesDashboard from './components/BridgesDashboard';
import CulvertsDashboard from './components/CulvertsDashboard';
import InvestmentDashboard from './components/InvestmentDashboard';
import { Activity, LayoutDashboard, GitBranch, Briefcase } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('investment');

  return (
    <>
      <header className="header">
        <div className="brand">
          <h1>Uganda BMS</h1>
          <span>Bridge Management System</span>
        </div>
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'investment' ? 'active' : ''}`}
            onClick={() => setActiveTab('investment')}
          >
            <Activity size={16} /> Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'bridges' ? 'active' : ''}`}
            onClick={() => setActiveTab('bridges')}
          >
            <LayoutDashboard size={16} /> Bridges Registry
          </button>
          <button 
            className={`nav-tab ${activeTab === 'culverts' ? 'active' : ''}`}
            onClick={() => setActiveTab('culverts')}
          >
            <GitBranch size={16} /> Major Culverts
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        {activeTab === 'investment' && <InvestmentDashboard />}
        {activeTab === 'bridges' && <BridgesDashboard />}
        {activeTab === 'culverts' && <CulvertsDashboard />}
      </main>
    </>
  );
}

export default App;
