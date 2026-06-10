import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle, MapPin, Database, Box } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

export default function CulvertInventoryForm({ culverts = [], onCulvertsUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const filteredCulverts = culverts.filter(c => 
    c.CulvertNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.River?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.Road?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initialFormData = {
    CulvertNumber: '', River: '', Road: '', Link_Name: '', Maintenance_Station: '',
    Latitude: '', Longitude: '', CellType: 'Concrete Box', NumBarrels: 1,
    SpanLength: '', InletScour: 'No', OutletScour: 'No'
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleSelectCulvert = (c) => {
    setMessage('');
    setSelectedId(c.CulvertNumber);
    setFormData({
      CulvertNumber: c.CulvertNumber || '',
      River: c.River || '',
      Road: c.Road || '',
      Link_Name: c.Link_Name || '',
      Maintenance_Station: c.Maintenance_Station || '',
      Latitude: c.Latitude || '',
      Longitude: c.Longitude || '',
      CellType: c.CellType || 'Concrete Box',
      NumBarrels: c.NumBarrels || 1,
      SpanLength: c.SpanLength || '',
      InletScour: c.InletScour || 'No',
      OutletScour: c.OutletScour || 'No'
    });
  };

  const handleNewRecord = () => {
    setMessage('');
    setSelectedId('NEW');
    setFormData(initialFormData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setMessage('Saving...');
    setIsError(false);
    let updated = [...culverts];
    const id = formData.CulvertNumber;

    if (!id) {
      setMessage('CulvertNumber is required.');
      setIsError(true);
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.CulvertNumber === id)) {
        setMessage('Culvert Number already exists.');
        setIsError(true);
        return;
      }
      updated.unshift(formData);
    } else {
      const idx = updated.findIndex(x => x.CulvertNumber === selectedId);
      if (idx > -1) updated[idx] = formData;
    }

    try {
      await saveCulvert(formData);
      setMessage(`Record saved successfully.`);
      if (onCulvertsUpdate) onCulvertsUpdate(updated);
      setSelectedId(formData.CulvertNumber);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setIsError(true);
    }
  };

  const completeness = useMemo(() => {
    if (!selectedId) return 0;
    const fields = [
      formData.CulvertNumber, formData.River, formData.Road, formData.Link_Name, 
      formData.Maintenance_Station, formData.Latitude, formData.Longitude, 
      formData.CellType, formData.NumBarrels, formData.SpanLength
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
        itemStyle: { borderWidth: 1, borderColor: '#10b981', color: '#10b981' }
      },
      axisLine: { lineStyle: { width: 10, color: [[1, '#e2e8f0']] } },
      splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      data: [{ value: completeness, detail: { offsetCenter: ['0%', '0%'] } }],
      detail: { width: 50, height: 14, fontSize: 20, color: '#0f172a', fontWeight: 'bold', formatter: '{value}%' }
    }]
  };

  const renderInputField = (label, name, type = 'text') => {
    return (
      <div className="ent-field">
        <label className="ent-label">{label}</label>
        {type === 'select' ? (
           <select name={name} className="ent-select" value={formData[name]} onChange={handleChange}>
             <option value="">Select...</option>
             <option value="Concrete Box">Concrete Box</option>
             <option value="Concrete Pipe">Concrete Pipe</option>
             <option value="Corrugated Metal Pipe">Corrugated Metal Pipe</option>
             <option value="Masonry Arch">Masonry Arch</option>
           </select>
        ) : (
          <input 
            type={type} name={name} className="ent-input" value={formData[name] || ''} onChange={handleChange}
            disabled={name === 'CulvertNumber' && selectedId !== 'NEW'}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* LEFT PANE: Navigation / List */}
      <div className="ent-sidebar">
        <div className="ent-sidebar-header">Culvert Records</div>
        <div style={{ padding: '0 16px 16px' }}>
          <button className="ent-btn-primary" onClick={handleNewRecord} style={{ marginBottom: '16px', background: '#10b981' }}>
            <Plus size={16} /> New Culvert
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
          {filteredCulverts.map(c => (
            <div 
              key={c.CulvertNumber}
              className={`ent-list-item ${selectedId === c.CulvertNumber ? 'active' : ''}`}
              onClick={() => handleSelectCulvert(c)}
            >
              <div className="ent-list-title">{c.CulvertNumber}</div>
              <div className="ent-list-sub">{c.River || 'Unnamed Stream'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANE: Form Area */}
      <div className="ent-main">
        {selectedId ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 className="ent-page-title">{selectedId === 'NEW' ? 'Create Culvert Record' : formData.River || formData.CulvertNumber}</h2>
            <p className="ent-page-subtitle">{selectedId === 'NEW' ? 'Fill out the initial baseline data.' : 'Update physical and administrative attributes.'}</p>

            {message && (
              <div className={`ent-alert ${isError ? 'ent-alert-error' : 'ent-alert-success'}`}>
                {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                {message}
              </div>
            )}

            <div className="ent-card">
              <div className="ent-card-header"><MapPin size={18} color="var(--ent-primary)" /> Location & Routing</div>
              <div className="ent-grid">
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Culvert Number (Unique ID)', 'CulvertNumber')}</div>
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('River / Stream Name', 'River')}</div>
                {renderInputField('Road / Route Name', 'Road')}
                {renderInputField('Link Name / ID', 'Link_Name')}
                {renderInputField('Maintenance Station', 'Maintenance_Station')}
                <div></div>
                {renderInputField('Latitude', 'Latitude', 'number')}
                {renderInputField('Longitude', 'Longitude', 'number')}
              </div>
            </div>

            <div className="ent-card">
              <div className="ent-card-header"><Database size={18} color="var(--ent-primary)" /> Structure Details</div>
              <div className="ent-grid">
                <div style={{ gridColumn: '1 / -1' }}>{renderInputField('Cell Type', 'CellType', 'select')}</div>
                {renderInputField('Number of Barrels', 'NumBarrels', 'number')}
                {renderInputField('Span / Opening Width (m)', 'SpanLength', 'number')}
                
                <div className="ent-field">
                  <label className="ent-label">Inlet Scour Protection</label>
                  <select name="InletScour" className="ent-select" value={formData.InletScour} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="ent-field">
                  <label className="ent-label">Outlet Scour Protection</label>
                  <select name="OutletScour" className="ent-select" value={formData.OutletScour} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ent-text-muted)' }}>
            <Box size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--ent-text-main)', margin: '0 0 8px 0' }}>Select a Culvert</h3>
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

            <button className="ent-btn-primary" onClick={handleSave} style={{ background: '#10b981' }}>
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
