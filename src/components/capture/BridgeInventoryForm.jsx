import { useState, useMemo } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle, MapPin, Maximize, FileText, Database } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

export default function BridgeInventoryForm({ bridges = [], onBridgesUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

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

  // Completeness Calculation
  const completeness = useMemo(() => {
    if (!selectedId) return 0;
    const fields = [
      formData.BridgeNumber, formData.BridgeName, formData.RoadDescrPrincipal, formData.Latitude, formData.District,
      formData.LegacyData.feature_intersected, formData.LegacyData.superstructure_type, formData.LegacyData.material_type,
      formData.LegacyData.total_length, formData.LegacyData.year_built, formData.LegacyData.maintenance_responsibility
    ];
    const filled = fields.filter(f => f && String(f).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }, [formData, selectedId]);

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: { borderWidth: 1, borderColor: '#00d4ff', color: '#00d4ff' }
        },
        axisLine: { lineStyle: { width: 12, color: [[1, '#1b1b2e']] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: completeness, name: 'Completeness', title: { offsetCenter: ['0%', '10%'] }, detail: { offsetCenter: ['0%', '-10%'] } }],
        title: { fontSize: 10, color: '#8b8b9e' },
        detail: { width: 50, height: 14, fontSize: 24, color: '#fff', fontWeight: 'bold', formatter: '{value}%' }
      }
    ]
  };

  const renderInputField = (label, name, type = 'text') => {
    const val = name.startsWith('LegacyData.') ? formData.LegacyData[name.split('.')[1]] : formData[name];
    return (
      <div className="capture-field-group">
        <label className="capture-label">{label}</label>
        <input 
          type={type}
          name={name}
          className="capture-input"
          value={val}
          onChange={handleChange}
          disabled={name === 'BridgeNumber' && selectedId !== 'NEW'}
        />
      </div>
    );
  };

  return (
    <div className="capture-workspace">
      {/* Sidebar List */}
      <div className="capture-sidebar">
        <div className="capture-sidebar-header">
          <button className="cap-btn-primary" onClick={handleNewRecord} style={{ width: '100%', marginBottom: '16px' }}>
            <Plus size={16} /> New Bridge Record
          </button>
          <div className="capture-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
            <Search size={16} color="var(--cap-text-muted)" />
            <input 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              placeholder="Search ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="capture-list">
          {filteredBridges.map(b => (
            <div 
              key={b.BridgeNumber}
              className={`capture-list-item ${selectedId === b.BridgeNumber ? 'active' : ''}`}
              onClick={() => handleSelectBridge(b)}
            >
              <div className="capture-item-title">{b.BridgeNumber}</div>
              <div className="capture-item-sub">{b.BridgeName || 'Unnamed'} • {b.District}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="capture-main">
        {selectedId ? (
          <>
            <div className="capture-header">
              <div>
                <h2 className="capture-title">{selectedId === 'NEW' ? 'New Bridge Record' : formData.BridgeName || formData.BridgeNumber}</h2>
                <div style={{ color: 'var(--cap-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  {selectedId === 'NEW' ? 'Fill out the form to create a new inventory record.' : 'Editing existing inventory record.'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: 800 }}>{completeness}%</div>
                    <div style={{ color: 'var(--cap-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Data Filled</div>
                  </div>
                  <div style={{ width: '60px', height: '60px' }}>
                    <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
                <button className="cap-btn-primary" onClick={handleSave}>
                  <Save size={18} /> Save Record
                </button>
              </div>
            </div>

            <div className="capture-scroll">
              {message && (
                <div style={{
                  padding: '16px 24px',
                  borderRadius: '12px',
                  background: isError ? 'rgba(255, 42, 85, 0.1)' : 'rgba(0, 250, 154, 0.1)',
                  color: isError ? 'var(--cap-neon-pink)' : 'var(--cap-neon-green)',
                  border: `1px solid ${isError ? 'var(--cap-neon-pink)' : 'var(--cap-neon-green)'}`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                  fontWeight: 700, fontSize: '14px'
                }}>
                  {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                  {message}
                </div>
              )}

              <div className="capture-grid">
                {/* Location & Routing Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><MapPin size={20} color="var(--cap-neon-blue)" /> Location & Routing</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Bridge Number (Unique ID)', 'BridgeNumber')}</div>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Bridge Name', 'BridgeName')}</div>
                    {renderInputField('Principal Feature', 'RoadDescrPrincipal')}
                    {renderInputField('Link ID', 'LinkID')}
                    {renderInputField('District', 'District')}
                    {renderInputField('Feature Intersected', 'LegacyData.feature_intersected')}
                    {renderInputField('Latitude', 'Latitude', 'number')}
                    {renderInputField('Longitude', 'Longitude', 'number')}
                  </div>
                </div>

                {/* Structural Components Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><Database size={20} color="var(--cap-neon-purple)" /> Structural Design</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Superstructure Type', 'LegacyData.superstructure_type')}</div>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Substructure Type', 'LegacyData.substructure_type')}</div>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Main Material Type', 'LegacyData.material_type')}</div>
                    {renderInputField('Span Arrangement', 'LegacyData.span_arrangement')}
                    {renderInputField('Foundation Type', 'LegacyData.foundation_type')}
                    
                    <div className="capture-field-group">
                      <label className="capture-label">Scour Risk</label>
                      <select name="LegacyData.scour_risk" className="capture-input capture-select" value={formData.LegacyData.scour_risk} onChange={handleChange}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dimensions Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><Maximize size={20} color="var(--cap-neon-green)" /> Dimensions (m)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Total Length (m)', 'LegacyData.total_length', 'number')}</div>
                    {renderInputField('Overall Width', 'LegacyData.overall_width', 'number')}
                    {renderInputField('Carriageway Width', 'LegacyData.carriageway_width', 'number')}
                    {renderInputField('Sidewalks', 'LegacyData.sidewalks', 'number')}
                    {renderInputField('Clearances', 'LegacyData.clearances', 'number')}
                    {renderInputField('Detour Length (km)', 'LegacyData.detour_length', 'number')}
                  </div>
                </div>

                {/* Admin Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><FileText size={20} color="var(--cap-neon-orange)" /> Administrative</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0 16px' }}>
                    {renderInputField('Year Built', 'LegacyData.year_built', 'number')}
                    {renderInputField('Maintenance Station', 'LegacyData.maintenance_responsibility')}
                    {renderInputField('Contractor', 'LegacyData.contractor')}
                    {renderInputField('Consultant', 'LegacyData.consultant')}
                    
                    <div className="capture-field-group" style={{ marginTop: '20px', padding: '20px', background: 'rgba(0, 250, 154, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 250, 154, 0.2)' }}>
                      <div className="cap-switch-wrapper" onClick={() => setFormData(prev => ({...prev, LegacyData: {...prev.LegacyData, data_checked: !prev.LegacyData.data_checked}}))}>
                        <div className={`cap-switch ${formData.LegacyData.data_checked ? 'active' : ''}`}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: formData.LegacyData.data_checked ? 'var(--cap-neon-green)' : '#fff' }}>
                            {formData.LegacyData.data_checked ? 'Data Verified' : 'Data Unverified'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--cap-text-muted)' }}>Toggle to officially certify this record.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--cap-text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Plus size={40} color="var(--cap-border-focus)" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '24px', margin: '0 0 12px 0' }}>Data Capture Hub</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.6' }}>Select an existing record from the sidebar to edit, or create a new bridge registry entry.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
