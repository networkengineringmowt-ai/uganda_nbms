import React, { useState } from 'react';
import BridgeInventoryForm from './BridgeInventoryForm';
import BridgeInspectionForm from './BridgeInspectionForm';
import { Layers, FileText } from 'lucide-react';

export default function DataCaptureTabs({ bridges, onBridgesUpdate }) {
  const [activeTab, setActiveTab] = useState('inventory');
  
  return (
    <div className="capture-tabs-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Data Capture Module</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Layers size={16} /> Bridge Inventory
          </button>
          <button 
            className={`nav-tab ${activeTab === 'inspection' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            <FileText size={16} /> Add Bridge Inspection
          </button>
        </div>
      </div>
      
      <div className="capture-content">
        {activeTab === 'inventory' && (
          <BridgeInventoryForm bridges={bridges} onBridgesUpdate={onBridgesUpdate} />
        )}
        {activeTab === 'inspection' && (
          <BridgeInspectionForm bridges={bridges} onBridgesUpdate={onBridgesUpdate} />
        )}
      </div>
    </div>
  );
}
