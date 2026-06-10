import { useState } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'location', label: '1. Location' },
  { id: 'structural', label: '2. Structural Features' },
  { id: 'dimensions', label: '3. Dimensions' },
  { id: 'admin', label: '4. Administrative / Design' }
];

export default function BridgeInventoryForm({ bridges = [], onBridgesUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('location');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Filter bridges for the sidebar list
  const filteredBridges = bridges.filter(b => 
    b.BridgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.BridgeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initialFormData = {
    BridgeNumber: '', BridgeName: '', RoadDescrPrincipal: '', LinkID: '',
    Latitude: '', Longitude: '', District: '',
    LegacyData: {
      region: '', station: '', county: '', sub_county: '', village: '',
      feature_intersected: '', detour_length: '', superstructure_type: '', 
      substructure_type: '', material_type: '', span_arrangement: '', 
      foundation_type: '', total_length: '', overall_width: '', 
      carriageway_width: '', sidewalks: '', clearances: '',
      year_built: '', contractor: '', consultant: '', maintenance_responsibility: '', 
      scour_risk: 'No', data_checked: false
    }
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleSelectBridge = (bridge) => {
    setMessage('');
    setSelectedId(bridge.BridgeNumber);
    setFormData({
      BridgeNumber: bridge.BridgeNumber || '',
      BridgeName: bridge.BridgeName || '',
      RoadDescrPrincipal: bridge.RoadDescrPrincipal || '',
      LinkID: bridge.LinkID || '',
      Latitude: bridge.Latitude || '',
      Longitude: bridge.Longitude || '',
      District: bridge.District || '',
      LegacyData: {
        region: bridge.LegacyData?.region || '',
        station: bridge.LegacyData?.station || '',
        county: bridge.LegacyData?.county || '',
        sub_county: bridge.LegacyData?.sub_county || '',
        village: bridge.LegacyData?.village || '',
        feature_intersected: bridge.LegacyData?.feature_intersected || '',
        detour_length: bridge.LegacyData?.detour_length || '',
        superstructure_type: bridge.LegacyData?.superstructure_type || '',
        substructure_type: bridge.LegacyData?.substructure_type || '',
        material_type: bridge.LegacyData?.material_type || '',
        span_arrangement: bridge.LegacyData?.span_arrangement || '',
        foundation_type: bridge.LegacyData?.foundation_type || '',
        total_length: bridge.LegacyData?.total_length || '',
        overall_width: bridge.LegacyData?.overall_width || '',
        carriageway_width: bridge.LegacyData?.carriageway_width || '',
        sidewalks: bridge.LegacyData?.sidewalks || '',
        clearances: bridge.LegacyData?.clearances || '',
        year_built: bridge.LegacyData?.year_built || '',
        contractor: bridge.LegacyData?.contractor || '',
        consultant: bridge.LegacyData?.consultant || '',
        maintenance_responsibility: bridge.LegacyData?.maintenance_responsibility || '',
        scour_risk: bridge.LegacyData?.scour_risk || 'No',
        data_checked: bridge.LegacyData?.data_checked || false
      }
    });
  };

  const handleNewRecord = () => {
    setMessage('');
    setSelectedId('NEW');
    setFormData(initialFormData);
    setActiveTab('location');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isChecked = type === 'checkbox';
    
    if (name.startsWith('LegacyData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        LegacyData: { ...prev.LegacyData, [field]: isChecked ? checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: isChecked ? checked : value }));
    }
  };

  const handleSave = async () => {
    setMessage('Saving...');
    setIsError(false);
    let updated = [...bridges];
    const id = formData.BridgeNumber;

    if (!id) {
      setMessage('Error: BridgeNumber is required.');
      setIsError(true);
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.BridgeNumber === id)) {
        setMessage('Error: Bridge Number already exists.');
        setIsError(true);
        return;
      }
      updated.unshift(formData);
    } else {
      const idx = updated.findIndex(x => x.BridgeNumber === selectedId);
      if (idx > -1) updated[idx] = formData;
    }

    try {
      await saveBridge(formData);
      setMessage(`Record saved successfully!`);
      if (onBridgesUpdate) onBridgesUpdate(updated);
      setSelectedId(formData.BridgeNumber);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setIsError(true);
    }
  };

  const renderInputField = (label, name, type = 'text') => (
    <div className="modern-filter-field">
      <label>{label}</label>
      <input 
        type={type}
        name={name}
        className="toolbar-search"
        style={{ width: '100%', background: 'rgba(0,0,0,0.05)', height: '40px', borderRadius: '8px' }}
        value={name.startsWith('LegacyData.') ? formData.LegacyData[name.split('.')[1]] : formData[name]}
        onChange={handleChange}
        disabled={name === 'BridgeNumber' && selectedId !== 'NEW'}
      />
    </div>
  );

  return (
    <div className="map-workspace" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Sidebar List */}
      <div className="structure-list-panel">
        <div className="slp-search-container" style={{ padding: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button className="modern-btn-primary" onClick={handleNewRecord} style={{ height: '40px', fontSize: '12px', gap: '8px' }}>
            <Plus size={14} /> Create New Record
          </button>
          <div className="toolbar-search" style={{ width: '100%' }}>
            <Search size={14} />
            <input 
              placeholder="Search bridges..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredBridges.map(b => (
            <div 
              key={b.BridgeNumber}
              className={`slp-item ${selectedId === b.BridgeNumber ? 'slp-item-active' : ''}`}
              onClick={() => handleSelectBridge(b)}
            >
              <div className="slp-item-number">{b.BridgeNumber}</div>
              <div className="slp-item-name">{b.BridgeName || 'Unnamed Bridge'}</div>
              <div className="slp-item-meta">{b.District} • {b.RoadDescrPrincipal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="panel" style={{ margin: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedId ? (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-kicker">{selectedId === 'NEW' ? 'Create New' : 'Edit Inventory'}</div>
                <h2>{selectedId === 'NEW' ? 'New Bridge Record' : formData.BridgeName || formData.BridgeNumber}</h2>
              </div>
              <button className="modern-btn-primary" onClick={handleSave} style={{ width: '140px', gap: '8px' }}>
                <Save size={16} /> Save Record
              </button>
            </div>

            <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--border-light)', gap: '8px' }}>
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: '0.2s',
                    fontSize: '13px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modern-scroll" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {message && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '24px',
                  borderRadius: '8px',
                  background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isError ? 'var(--accent-red)' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  {message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {activeTab === 'location' && (
                  <>
                    {renderInputField('Bridge Number (Unique ID)', 'BridgeNumber')}
                    {renderInputField('Bridge Name', 'BridgeName')}
                    {renderInputField('Principal Feature', 'RoadDescrPrincipal')}
                    {renderInputField('Link ID', 'LinkID')}
                    {renderInputField('Maintenance Station', 'LegacyData.station')}
                    {renderInputField('Region', 'LegacyData.region')}
                    {renderInputField('Latitude', 'Latitude', 'number')}
                    {renderInputField('Longitude', 'Longitude', 'number')}
                    {renderInputField('District', 'District')}
                    {renderInputField('County', 'LegacyData.county')}
                    {renderInputField('Sub-County', 'LegacyData.sub_county')}
                    {renderInputField('Village', 'LegacyData.village')}
                    {renderInputField('Feature Intersected', 'LegacyData.feature_intersected')}
                    {renderInputField('Detour Length (km)', 'LegacyData.detour_length', 'number')}
                    
                    <div className="modern-filter-field" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <input 
                        type="checkbox" 
                        name="LegacyData.data_checked"
                        checked={formData.LegacyData.data_checked}
                        onChange={handleChange}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <label style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>Mark Data as Verified</label>
                      <span className={`role-badge ${formData.LegacyData.data_checked ? '' : 'disabled'}`} style={{ 
                        background: formData.LegacyData.data_checked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.05)',
                        color: formData.LegacyData.data_checked ? 'var(--accent-primary)' : 'var(--text-muted)',
                        border: 'none', marginLeft: 'auto'
                      }}>
                        {formData.LegacyData.data_checked ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                  </>
                )}

                {activeTab === 'structural' && (
                  <>
                    {renderInputField('Superstructure Type', 'LegacyData.superstructure_type')}
                    {renderInputField('Substructure Type', 'LegacyData.substructure_type')}
                    {renderInputField('Main Material Type', 'LegacyData.material_type')}
                    {renderInputField('Span Arrangement', 'LegacyData.span_arrangement')}
                    {renderInputField('Foundation Type', 'LegacyData.foundation_type')}
                    
                    <div className="modern-filter-field">
                      <label>Scour Risk</label>
                      <div className="modern-select-wrapper">
                        <select 
                          name="LegacyData.scour_risk"
                          value={formData.LegacyData.scour_risk}
                          onChange={handleChange}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', height: '40px' }}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'dimensions' && (
                  <>
                    {renderInputField('Total Length (m)', 'LegacyData.total_length', 'number')}
                    {renderInputField('Overall Width (m)', 'LegacyData.overall_width', 'number')}
                    {renderInputField('Carriageway Width (m)', 'LegacyData.carriageway_width', 'number')}
                    {renderInputField('Sidewalks (m)', 'LegacyData.sidewalks', 'number')}
                    {renderInputField('Clearances (m)', 'LegacyData.clearances', 'number')}
                  </>
                )}

                {activeTab === 'admin' && (
                  <>
                    {renderInputField('Year Built', 'LegacyData.year_built', 'number')}
                    {renderInputField('Contractor', 'LegacyData.contractor')}
                    {renderInputField('Consultant', 'LegacyData.consultant')}
                    {renderInputField('Maintenance Station', 'LegacyData.maintenance_responsibility')}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <FilePlus size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Record Selected</h3>
              <p>Select a bridge from the list to view or edit its inventory data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
