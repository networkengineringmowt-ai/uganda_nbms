import { useState } from 'react';
import { saveBridge } from '../../services/bmsDataService';

const TABS = [
  { id: 'location', label: '1. Location' },
  { id: 'structural', label: '2. Structural Features' },
  { id: 'dimensions', label: '3. Dimensions' },
  { id: 'admin', label: '4. Administrative / Design' }
];

export default function BridgeInventoryForm({ bridges = [], onBridgesUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState('location');
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
      year_built: '', contractor: '', consultant: '', maintenance_responsibility: '', scour_risk: 'No',
      data_checked: false
    }
  });

  const [message, setMessage] = useState('');

  const [prevIndex, setPrevIndex] = useState(-1);
  const [prevBridges, setPrevBridges] = useState(null);

  const b = bridges[currentIndex];

  if ((currentIndex !== prevIndex || bridges !== prevBridges) && selectedId !== 'NEW') {
    setPrevIndex(currentIndex);
    setPrevBridges(bridges);
    if (b) {
      setFormData({
        BridgeNumber: b.BridgeNumber || '',
        BridgeName: b.BridgeName || '',
        RoadDescrPrincipal: b.RoadDescrPrincipal || '',
        LinkID: b.LinkID || '',
        Latitude: b.Latitude || '',
        Longitude: b.Longitude || '',
        District: b.District || '',
        LegacyData: {
          region: b.LegacyData?.region || '',
          station: b.LegacyData?.station || '',
          county: b.LegacyData?.county || '',
          sub_county: b.LegacyData?.sub_county || '',
          village: b.LegacyData?.village || '',
          feature_intersected: b.LegacyData?.feature_intersected || '',
          detour_length: b.LegacyData?.detour_length || '',
          superstructure_type: b.LegacyData?.superstructure_type || '',
          substructure_type: b.LegacyData?.substructure_type || '',
          material_type: b.LegacyData?.material_type || '',
          span_arrangement: b.LegacyData?.span_arrangement || '',
          foundation_type: b.LegacyData?.foundation_type || '',
          total_length: b.LegacyData?.total_length || '',
          overall_width: b.LegacyData?.overall_width || '',
          carriageway_width: b.LegacyData?.carriageway_width || '',
          sidewalks: b.LegacyData?.sidewalks || '',
          clearances: b.LegacyData?.clearances || '',
          year_built: b.LegacyData?.year_built || '',
          contractor: b.LegacyData?.contractor || '',
          consultant: b.LegacyData?.consultant || '',
          maintenance_responsibility: b.LegacyData?.maintenance_responsibility || '',
          scour_risk: b.LegacyData?.scour_risk || 'No',
          data_checked: b.LegacyData?.data_checked || false
        }
      });
      setSelectedId(b.BridgeNumber);
    }
  }

  const handleNavigate = (dir) => {
    setMessage('');
    setSelectedId('');
    if (dir === 'first') setCurrentIndex(0);
    else if (dir === 'prev') setCurrentIndex(prev => Math.max(0, prev - 1));
    else if (dir === 'next') setCurrentIndex(prev => Math.min(bridges.length - 1, prev + 1));
    else if (dir === 'last') setCurrentIndex(bridges.length - 1);
  };

  const handleRecordInput = (e) => {
    const val = Number(e.target.value);
    if (val > 0 && val <= bridges.length) {
      setCurrentIndex(val - 1);
    }
  };

  const handleNewRecord = () => {
    setSelectedId('NEW');
    setFormData({
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
        year_built: '', contractor: '', consultant: '', maintenance_responsibility: '', scour_risk: 'No',
        data_checked: false
      }
    });
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
    let updated = [...bridges];
    const id = formData.BridgeNumber;

    if (!id) {
      setMessage('Error: BridgeNumber is required.');
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.BridgeNumber === id)) {
        setMessage('Error: Bridge Number already exists.');
        return;
      }
      updated.push(formData);
      setCurrentIndex(updated.length - 1);
    } else {
      const idx = updated.findIndex(x => x.BridgeNumber === selectedId);
      if (idx > -1) updated[idx] = formData;
    }

    try {
      await saveBridge(formData);
      setMessage(`Saved successfully!`);
      if (onBridgesUpdate) onBridgesUpdate(updated);
      setSelectedId(formData.BridgeNumber);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) return;
    const idx = bridges.findIndex(x => 
      x.BridgeNumber?.toLowerCase().includes(q) || 
      x.BridgeName?.toLowerCase().includes(q)
    );
    if (idx > -1) {
      setCurrentIndex(idx);
    }
  };

  const renderInputField = (label, name, type = 'text') => (
    <div className="ms-form-row">
      <label>{label}:</label>
      <input 
        type={type}
        name={name}
        className="ms-input"
        value={name.startsWith('LegacyData.') ? formData.LegacyData[name.split('.')[1]] : formData[name]}
        onChange={handleChange}
        disabled={name === 'BridgeNumber' && selectedId !== 'NEW'}
      />
    </div>
  );

  return (
    <div className="ms-form-tab-container" style={{ height: '100%' }}>
      {/* Tabs */}
      <div className="ms-form-tabs">
        {TABS.map(tab => (
          <button 
            key={tab.id}
            className={`ms-form-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content Area */}
      <div className="ms-form-body">
        <div className="ms-form-grid">
          
          {activeTab === 'location' && (
            <>
              {renderInputField('Bridge # (Unique)', 'BridgeNumber')}
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
              
              <div className="ms-form-row" style={{ marginTop: '10px' }}>
                <label>Data checked:</label>
                <input 
                  type="checkbox" 
                  name="LegacyData.data_checked"
                  className="ms-checkbox"
                  checked={formData.LegacyData.data_checked}
                  onChange={handleChange}
                />
                <span className={formData.LegacyData.data_checked ? "ms-checked-badge" : "ms-unchecked-badge"}>
                  {formData.LegacyData.data_checked ? "CHECKED" : "UNCHECKED"}
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
              
              <div className="ms-form-row">
                <label>Scour Risk:</label>
                <div className="ms-select-container">
                  <select 
                    className="ms-select"
                    name="LegacyData.scour_risk"
                    value={formData.LegacyData.scour_risk}
                    onChange={handleChange}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                  <div className="ms-select-arrow">▼</div>
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

        {/* Form Commands */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '30px' }}>
          <button className="ms-btn" onClick={handleSave}>
            Save Record
          </button>
          {message && <span style={{ fontWeight: 'bold', color: '#005a5b' }}>{message}</span>}
        </div>
      </div>

      {/* Record Selector Navigation */}
      <div className="ms-record-navigator">
        <button className="ms-nav-btn" onClick={() => handleNavigate('first')} title="First Record">|&lt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('prev')} title="Previous Record">&lt;</button>
        <span className="ms-navigator-text">Record:</span>
        <input 
          type="text" 
          className="ms-record-num-input" 
          value={selectedId === 'NEW' ? '' : currentIndex + 1}
          onChange={handleRecordInput}
        />
        <span className="ms-navigator-text">of {bridges.length}</span>
        <button className="ms-nav-btn" onClick={() => handleNavigate('next')} title="Next Record">&gt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('last')} title="Last Record">&gt;|</button>
        <button className="ms-nav-btn" onClick={handleNewRecord} title="New Record" style={{ width: '25px', marginLeft: '6px' }}>*</button>

        <div className="ms-nav-search">
          <label style={{ fontWeight: 'bold' }}>Find Bridge:</label>
          <input 
            type="text" 
            placeholder="Search name/No..." 
            className="ms-input"
            style={{ width: '120px', height: '18px' }}
            onChange={handleSearch}
          />
        </div>
      </div>
    </div>
  );
}
