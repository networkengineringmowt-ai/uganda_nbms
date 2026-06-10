import { useState, useMemo } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle, MapPin, Maximize, FileText, Database, Box } from 'lucide-react';
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
        ...initialFormData.LegacyData,
        ...bridge.LegacyData
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
      setMessage('BridgeNumber is required.');
      setIsError(true);
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.BridgeNumber === id)) {
        setMessage('Bridge Number already exists.');
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
      setMessage(`Record saved successfully.`);
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
    series: [{
      type: 'gauge',
      startAngle: 90, endAngle: -270,
      pointer: { show: false },
      progress: {
        show: true, overlap: false, roundCap: true, clip: false,
        itemStyle: { borderWidth: 1, borderColor: '#2563eb', color: '#2563eb' }
      },
      axisLine: { lineStyle: { width: 10, color: [[1, '#e2e8f0']] } },
      splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      data: [{ value: completeness, detail: { offsetCenter: ['0%', '0%'] } }],
      detail: { width: 50, height: 14, fontSize: 20, color: '#0f172a', fontWeight: 'bold', formatter: '{value}%' }
    }]
  };

  const renderInputField = (label, name, type = 'text') => {
    const val = name.startsWith('LegacyData.') ? formData.LegacyData[name.split('.')[1]] : formData[name];
    return (
      <div className="ent-field">
        <label className="ent-label">{label}</label>
        {type === 'select' ? (
           <select name={name} className="ent-select" value={val} onChange={handleChange}>
             <option value="">Select...</option>
             <option value="Yes">Yes</option>
             <option value="No">No</option>
           </select>
        ) : (
          <input 
            type={type} name={name} className="ent-input" value={val || ''} onChange={handleChange}
            disabled={name === 'BridgeNumber' && selectedId !== 'NEW'}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* LEFT PANE: Navigation / List */}
      <div className="ent-sidebar">
        <div className="ent-sidebar-header">Bridge Records</div>
        <div style={{ padding: '0 16px 16px' }}>
          <button className="ent-btn-primary" onClick={handleNewRecord} style={{ marginBottom: '16px' }}>
            <Plus size={16} /> New Bridge
          </button>
          <div className="ent-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fff' }}>
            <Search size={14} color="#64748b" />
            <input 
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="ent-list" style={{ padding: '0 16px 16px' }}>
          {filteredBridges.map(b => (
            <div 
              key={b.BridgeNumber}
              className={`ent-list-item ${selectedId === b.BridgeNumber ? 'active' : ''}`}
              onClick={() => handleSelectBridge(b)}
            >
              <div className="ent-list-title">{b.BridgeNumber}</div>
              <div className="ent-list-sub">{b.BridgeName || 'Unnamed'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANE: Form Area */}
      <div className="ent-main">
        {selectedId ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 className="ent-page-title">{selectedId === 'NEW' ? 'Create Bridge Record' : formData.BridgeName || formData.BridgeNumber}</h2>
            <p className="ent-page-subtitle">{selectedId === 'NEW' ? 'Fill out the initial baseline data.' : 'Update physical and administrative attributes.'}</p>

            {message && (
              <div className={`ent-alert ${isError ? 'ent-alert-error' : 'ent-alert-success'}`}>
                {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                {message}
              </div>
            )}

            <div className="ent-card">
              <div className="ent-card-header"><MapPin size={18} color="var(--ent-primary)" /> Identification & Routing</div>
              <div className="ent-grid">
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

            <div className="ent-card">
              <div className="ent-card-header"><Database size={18} color="var(--ent-primary)" /> Structural Characteristics</div>
              <div className="ent-grid">
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Superstructure Type', 'LegacyData.superstructure_type')}</div>
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Substructure Type', 'LegacyData.substructure_type')}</div>
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Main Material Type', 'LegacyData.material_type')}</div>
                {renderInputField('Span Arrangement', 'LegacyData.span_arrangement')}
                {renderInputField('Foundation Type', 'LegacyData.foundation_type')}
                {renderInputField('Scour Risk', 'LegacyData.scour_risk', 'select')}
              </div>
            </div>

            <div className="ent-card">
              <div className="ent-card-header"><Maximize size={18} color="var(--ent-primary)" /> Dimensions & Measurements</div>
              <div className="ent-grid">
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Total Length (m)', 'LegacyData.total_length', 'number')}</div>
                {renderInputField('Overall Width (m)', 'LegacyData.overall_width', 'number')}
                {renderInputField('Carriageway Width (m)', 'LegacyData.carriageway_width', 'number')}
                {renderInputField('Sidewalks (m)', 'LegacyData.sidewalks', 'number')}
                {renderInputField('Clearances (m)', 'LegacyData.clearances', 'number')}
                {renderInputField('Detour Length (km)', 'LegacyData.detour_length', 'number')}
              </div>
            </div>

            <div className="ent-card">
              <div className="ent-card-header"><FileText size={18} color="var(--ent-primary)" /> Administrative</div>
              <div className="ent-grid" style={{ gridTemplateColumns: '1fr' }}>
                {renderInputField('Year Built', 'LegacyData.year_built', 'number')}
                {renderInputField('Maintenance Station', 'LegacyData.maintenance_responsibility')}
                {renderInputField('Contractor', 'LegacyData.contractor')}
                {renderInputField('Consultant', 'LegacyData.consultant')}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ent-text-muted)' }}>
            <Box size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--ent-text-main)', margin: '0 0 8px 0' }}>Select a Bridge</h3>
            <p>Choose a record from the left panel to view or edit inventory data.</p>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Summary & Actions */}
      <div className="ent-summary">
        <div className="ent-summary-title">Data Quality</div>
        
        {selectedId ? (
          <>
            <div style={{ height: '160px', width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
               <ReactECharts option={gaugeOption} style={{ height: '160px', width: '160px' }} />
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ent-text-main)' }}>Profile Completeness</div>
              <div style={{ fontSize: '12px', color: 'var(--ent-text-muted)' }}>Required fields populated</div>
            </div>

            <button className="ent-btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Changes
            </button>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--ent-text-muted)' }}>No record active.</div>
        )}
      </div>

    </div>
  );
}
