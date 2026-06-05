import React, { useState } from 'react';
import { Save, Plus } from 'lucide-react';

export default function BridgeInventoryForm({ bridges = [], onBridgesUpdate }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [formData, setFormData] = useState({
    BridgeNumber: '',
    BridgeName: '',
    RoadDescrPrincipal: '',
    LinkID: '',
    LegacyData: {
      region: '',
      station: '',
      overall_rating: null,
      scour_risk: 'N'
    }
  });

  const [message, setMessage] = useState('');

  const handleSelectBridge = (e) => {
    const id = e.target.value;
    setSelectedBridgeId(id);
    if (id === 'NEW') {
      setFormData({ BridgeNumber: '', BridgeName: '', RoadDescrPrincipal: '', LinkID: '', LegacyData: { region: '', station: '', scour_risk: 'N' } });
    } else if (id) {
      const bridge = bridges.find(b => b.BridgeNumber === id);
      if (bridge) {
        setFormData({ ...bridge, LegacyData: bridge.LegacyData || { region: '', station: '', scour_risk: 'N' } });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('LegacyData.')) {
      const legacyField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        LegacyData: {
          ...prev.LegacyData,
          [legacyField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setMessage('Saving...');
    let updatedBridges = [...bridges];
    
    if (selectedBridgeId === 'NEW') {
      // Check if exists
      if (updatedBridges.some(b => b.BridgeNumber === formData.BridgeNumber)) {
        setMessage('Error: Bridge Number already exists.');
        return;
      }
      updatedBridges.push(formData);
    } else {
      const idx = updatedBridges.findIndex(b => b.BridgeNumber === selectedBridgeId);
      if (idx > -1) {
        updatedBridges[idx] = { ...updatedBridges[idx], ...formData };
      }
    }

    try {
      const res = await fetch('http://localhost:3001/api/bridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBridges)
      });
      if (res.ok) {
        setMessage('Saved successfully!');
        if (onBridgesUpdate) onBridgesUpdate(updatedBridges);
      } else {
        setMessage('Failed to save.');
      }
    } catch (err) {
      setMessage('Error connecting to backend.');
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px' }}>
      <h3 className="card-title">Bridge Inventory Data</h3>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select 
          className="slp-search-input" 
          style={{ width: '300px' }}
          value={selectedBridgeId}
          onChange={handleSelectBridge}
        >
          <option value="">-- Select a Bridge to Edit --</option>
          <option value="NEW">+ Add New Bridge</option>
          {bridges.map(b => (
            <option key={b.BridgeNumber} value={b.BridgeNumber}>
              {b.BridgeNumber} - {b.BridgeName}
            </option>
          ))}
        </select>
      </div>

      {(selectedBridgeId || selectedBridgeId === 'NEW') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="bdc-grid">
            <div className="bdc-field">
              <label className="bdc-label">Bridge Number (Unique)</label>
              <input className="slp-search-input" name="BridgeNumber" value={formData.BridgeNumber} onChange={handleChange} disabled={selectedBridgeId !== 'NEW'} />
            </div>
            <div className="bdc-field">
              <label className="bdc-label">Bridge Name</label>
              <input className="slp-search-input" name="BridgeName" value={formData.BridgeName} onChange={handleChange} />
            </div>
            <div className="bdc-field">
              <label className="bdc-label">Road Description</label>
              <input className="slp-search-input" name="RoadDescrPrincipal" value={formData.RoadDescrPrincipal} onChange={handleChange} />
            </div>
            <div className="bdc-field">
              <label className="bdc-label">Link ID</label>
              <input className="slp-search-input" name="LinkID" value={formData.LinkID} onChange={handleChange} />
            </div>
            <div className="bdc-field">
              <label className="bdc-label">Region</label>
              <input className="slp-search-input" name="LegacyData.region" value={formData.LegacyData.region} onChange={handleChange} />
            </div>
            <div className="bdc-field">
              <label className="bdc-label">Station</label>
              <input className="slp-search-input" name="LegacyData.station" value={formData.LegacyData.station} onChange={handleChange} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
            <button className="nav-tab active" onClick={handleSave}>
              <Save size={16} /> Save Data
            </button>
            {message && <span style={{ color: message.includes('Error') || message.includes('Failed') ? '#ff5252' : '#00e676', fontSize: '0.85rem' }}>{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
