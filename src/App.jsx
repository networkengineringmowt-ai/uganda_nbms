import React, { useState } from 'react';
import BridgesDashboard from './components/BridgesDashboard';
import CulvertsDashboard from './components/CulvertsDashboard';
import InvestmentDashboard from './components/InvestmentDashboard';
import MapDashboard from './components/MapDashboard';
import GalleryDashboard from './components/GalleryDashboard';
import DocumentsDashboard from './components/DocumentsDashboard';
import { Activity, LayoutDashboard, GitBranch, Map as MapIcon, Camera, FileText } from 'lucide-react';

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
          <button className={`nav-tab ${activeTab === 'investment' ? 'active' : ''}`} onClick={() => setActiveTab('investment')}><Activity size={16} /> Dashboard</button>
          <button className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}><MapIcon size={16} /> Interactive Map</button>
          <button className={`nav-tab ${activeTab === 'bridges' ? 'active' : ''}`} onClick={() => setActiveTab('bridges')}><LayoutDashboard size={16} /> Bridges Registry</button>
          <button className={`nav-tab ${activeTab === 'culverts' ? 'active' : ''}`} onClick={() => setActiveTab('culverts')}><GitBranch size={16} /> Major Culverts</button>
          <button className={`nav-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}><Camera size={16} /> Photo Gallery</button>
          <button className={`nav-tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}><FileText size={16} /> Document Library</button>
        </nav>
      </header>
      
      <main className="main-content">
        {activeTab === 'investment' && <InvestmentDashboard />}
        {activeTab === 'map' && <MapDashboard />}
        {activeTab === 'bridges' && <BridgesDashboard />}
        {activeTab === 'culverts' && <CulvertsDashboard />}
        {activeTab === 'gallery' && <GalleryDashboard />}
        {activeTab === 'docs' && <DocumentsDashboard />}
      </main>
    </>
  );
}

export default App;
