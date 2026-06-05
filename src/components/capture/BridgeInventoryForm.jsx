import React, { useState } from 'react';
import { Save, Plus, MapPin, Ruler, Navigation, Shield, Info } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const TABS = [
  { id: 'identification', label: 'Identification', icon: Info },
  { id: 'location', label: 'Location Details', icon: MapPin },
  { id: 'structural', label: 'Structural Info', icon: Shield },
  { id: 'dimensions', label: 'Dimensions', icon: Ruler },
  { id: 'admin', label: 'Administrative', icon: Navigation }
];

export default function BridgeInventoryForm({ bridges = [], onBridgesUpdate }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [activeTab, setActiveTab] = useState('identification');
  const [formData, setFormData] = useState({
    BridgeNumber: '',
    BridgeName: '',
    RoadDescrPrincipal: '',
    LinkID: '',
    Latitude: '',
    Longitude: '',
    District: '',
    LegacyData: {
      region: '', station: '', county: '', sub_county: '', village: '',
      feature_intersected: '', detour_length: '',
      superstructure_type: '', substructure_type: '', material_type: '', span_arrangement: '', foundation_type: '',
      total_length: '', overall_width: '', carriageway_width: '', sidewalks: '', clearances: '',
      year_built: '', contractor: '', consultant: '', maintenance_responsibility: '',
      overall_rating: null, scour_risk: 'N'
    }
  });

  const [message, setMessage] = useState('');

  const handleSelectBridge = (e) => {
    const id = e.target.value;
    setSelectedBridgeId(id);
    if (id === 'NEW') {
      setFormData({ 
        BridgeNumber: '', BridgeName: '', RoadDescrPrincipal: '', LinkID: '', Latitude: '', Longitude: '', District: '', 
        LegacyData: {
          region: '', station: '', county: '', sub_county: '', village: '', feature_intersected: '', detour_length: '',
          superstructure_type: '', substructure_type: '', material_type: '', span_arrangement: '', foundation_type: '',
          total_length: '', overall_width: '', carriageway_width: '', sidewalks: '', clearances: '',
          year_built: '', contractor: '', consultant: '', maintenance_responsibility: '', scour_risk: 'N'
        } 
      });
    } else if (id) {
      const bridge = bridges.find(b => b.BridgeNumber === id);
      if (bridge) {
        setFormData({ 
          BridgeNumber: bridge.BridgeNumber || '', 
          BridgeName: bridge.BridgeName || '', 
          RoadDescrPrincipal: bridge.RoadDescrPrincipal || '', 
          LinkID: bridge.LinkID || '', 
          Latitude: bridge.Latitude || '', 
          Longitude: bridge.Longitude || '', 
          District: bridge.District || '', 
          LegacyData: { ...formData.LegacyData, ...(bridge.LegacyData || {}) } 
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('LegacyData.')) {
      const legacyField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        LegacyData: { ...prev.LegacyData, [legacyField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setMessage('Saving...');
    let updatedBridges = [...bridges];
    let b = { ...formData };
    
    if (selectedBridgeId === 'NEW') {
      if (updatedBridges.some(existing => existing.BridgeNumber === formData.BridgeNumber)) {
        setMessage('Error: Bridge Number already exists.');
        return;
      }
      updatedBridges.push(b);
    } else {
      const idx = updatedBridges.findIndex(existing => existing.BridgeNumber === selectedBridgeId);
      if (idx > -1) updatedBridges[idx] = b;
    }

    try {
      const { error } = await supabase
        .from('bridges')
        .upsert({ id: b.BridgeNumber, data: b });

      if (error) throw error;
      
      setMessage('Saved to Database successfully!');
      if (onBridgesUpdate) onBridgesUpdate(updatedBridges);
    } catch (err) {
      setMessage(`Sync Error: ${err.message}`);
    }
  };

  const renderField = (label, name, type = 'text') => (
    <div className="bdc-field">
      <label className="bdc-label">{label}</label>
      <input 
        type={type}
        className="slp-search-input" 
        name={name} 
        value={name.startsWith('LegacyData.') ? formData.LegacyData[name.split('.')[1]] : formData[name]} 
        onChange={handleChange} 
        disabled={name === 'BridgeNumber' && selectedBridgeId !== 'NEW'} 
      />
    </div>
  );

  return (
    <div className="glass-card" style={{ maxWidth: '1000px' }}>
      <h3 className="card-title">Comprehensive Bridge Inventory</h3>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select 
          className="slp-search-input" 
          style={{ width: '400px' }}
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
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Vertical Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    background: activeTab === tab.id ? 'rgba(0, 150, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${activeTab === tab.id ? 'var(--accent-blue)' : 'transparent'}`,
                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="bdc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {activeTab === 'identification' && (
                <>
                  {renderField('Bridge Number (Unique)', 'BridgeNumber')}
                  {renderField('Bridge Name', 'BridgeName')}
                  {renderField('Road Description', 'RoadDescrPrincipal')}
                  {renderField('Link ID', 'LinkID')}
                  {renderField('Region', 'LegacyData.region')}
                  {renderField('UNRA Station', 'LegacyData.station')}
                </>
              )}
              {activeTab === 'location' && (
                <>
                  {renderField('Latitude', 'Latitude', 'number')}
                  {renderField('Longitude', 'Longitude', 'number')}
                  {renderField('District', 'District')}
                  {renderField('County', 'LegacyData.county')}
                  {renderField('Sub-County', 'LegacyData.sub_county')}
                  {renderField('Village', 'LegacyData.village')}
                  {renderField('Feature Intersected', 'LegacyData.feature_intersected')}
                  {renderField('Detour Length (km)', 'LegacyData.detour_length', 'number')}
                </>
              )}
              {activeTab === 'structural' && (
                <>
                  {renderField('Superstructure Type', 'LegacyData.superstructure_type')}
                  {renderField('Substructure Type', 'LegacyData.substructure_type')}
                  {renderField('Main Material Type', 'LegacyData.material_type')}
                  {renderField('Span Arrangement', 'LegacyData.span_arrangement')}
                  {renderField('Foundation Type', 'LegacyData.foundation_type')}
                  {renderField('Scour Risk (Y/N)', 'LegacyData.scour_risk')}
                </>
              )}
              {activeTab === 'dimensions' && (
                <>
                  {renderField('Total Length (m)', 'LegacyData.total_length', 'number')}
                  {renderField('Overall Width (m)', 'LegacyData.overall_width', 'number')}
                  {renderField('Carriageway Width (m)', 'LegacyData.carriageway_width', 'number')}
                  {renderField('Sidewalks (m)', 'LegacyData.sidewalks', 'number')}
                  {renderField('Clearances (m)', 'LegacyData.clearances', 'number')}
                </>
              )}
              {activeTab === 'admin' && (
                <>
                  {renderField('Year Built', 'LegacyData.year_built', 'number')}
                  {renderField('Contractor', 'LegacyData.contractor')}
                  {renderField('Consultant', 'LegacyData.consultant')}
                  {renderField('Maintenance Responsibility', 'LegacyData.maintenance_responsibility')}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <button className="nav-tab active" onClick={handleSave} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Save size={16} /> Save Bridge Data
              </button>
              {message && <span style={{ color: message.includes('Error') || message.includes('Failed') ? '#ff5252' : '#00e676', fontSize: '0.85rem' }}>{message}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
