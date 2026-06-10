import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle, MapPin, Maximize, FileText, Database } from 'lucide-react';
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
      setMessage('Error: CulvertNumber is required.');
      setIsError(true);
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.CulvertNumber === id)) {
        setMessage('Error: Culvert Number already exists.');
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
      setMessage(`Record saved successfully!`);
      if (onCulvertsUpdate) onCulvertsUpdate(updated);
      setSelectedId(formData.CulvertNumber);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setIsError(true);
    }
  };

  // Completeness Calculation
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
          itemStyle: { borderWidth: 1, borderColor: '#00fa9a', color: '#00fa9a' }
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
    return (
      <div className="capture-field-group">
        <label className="capture-label">{label}</label>
        <input 
          type={type}
          name={name}
          className="capture-input"
          value={formData[name]}
          onChange={handleChange}
          disabled={name === 'CulvertNumber' && selectedId !== 'NEW'}
        />
      </div>
    );
  };

  return (
    <div className="capture-workspace">
      {/* Sidebar List */}
      <div className="capture-sidebar">
        <div className="capture-sidebar-header">
          <button className="cap-btn-primary" onClick={handleNewRecord} style={{ width: '100%', marginBottom: '16px', background: 'var(--cap-neon-green)', boxShadow: '0 4px 15px rgba(0, 250, 154, 0.3)' }}>
            <Plus size={16} /> New Culvert Record
          </button>
          <div className="capture-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
            <Search size={16} color="var(--cap-text-muted)" />
            <input 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              placeholder="Search ID or River..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="capture-list">
          {filteredCulverts.map(c => (
            <div 
              key={c.CulvertNumber}
              className={`capture-list-item ${selectedId === c.CulvertNumber ? 'active' : ''}`}
              onClick={() => handleSelectCulvert(c)}
            >
              <div className="capture-item-title">{c.CulvertNumber}</div>
              <div className="capture-item-sub">{c.River || 'Unnamed Stream'} • {c.Road}</div>
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
                <h2 className="capture-title" style={{ background: 'linear-gradient(90deg, var(--cap-neon-green), var(--cap-neon-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {selectedId === 'NEW' ? 'New Culvert Record' : formData.River || formData.CulvertNumber}
                </h2>
                <div style={{ color: 'var(--cap-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  {selectedId === 'NEW' ? 'Fill out the form to create a new culvert registry entry.' : 'Editing existing culvert record.'}
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
                <button className="cap-btn-primary" onClick={handleSave} style={{ background: 'var(--cap-neon-green)', boxShadow: '0 4px 15px rgba(0, 250, 154, 0.3)' }}>
                  <Save size={18} /> Save Record
                </button>
              </div>
            </div>

            <div className="capture-scroll">
              {message && (
                <div style={{
                  padding: '16px 24px', borderRadius: '12px',
                  background: isError ? 'rgba(255, 42, 85, 0.1)' : 'rgba(0, 250, 154, 0.1)',
                  color: isError ? 'var(--cap-neon-pink)' : 'var(--cap-neon-green)',
                  border: `1px solid ${isError ? 'var(--cap-neon-pink)' : 'var(--cap-neon-green)'}`,
                  display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '14px'
                }}>
                  {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                  {message}
                </div>
              )}

              <div className="capture-grid">
                {/* Location Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><MapPin size={20} color="var(--cap-neon-green)" /> Location & Routing</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
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

                {/* Structure Details */}
                <div className="capture-card">
                  <h3 className="capture-card-title"><Database size={20} color="var(--cap-neon-blue)" /> Structure Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    
                    <div className="capture-field-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="capture-label">Cell Type</label>
                      <select name="CellType" className="capture-input capture-select" value={formData.CellType} onChange={handleChange}>
                        <option value="Concrete Box">Concrete Box</option>
                        <option value="Concrete Pipe">Concrete Pipe</option>
                        <option value="Corrugated Metal Pipe">Corrugated Metal Pipe</option>
                        <option value="Masonry Arch">Masonry Arch</option>
                      </select>
                    </div>

                    {renderInputField('Number of Barrels', 'NumBarrels', 'number')}
                    {renderInputField('Span / Opening Width (m)', 'SpanLength', 'number')}

                    <div className="capture-field-group">
                      <label className="capture-label">Inlet Scour Protection</label>
                      <select name="InletScour" className="capture-input capture-select" value={formData.InletScour} onChange={handleChange}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="capture-field-group">
                      <label className="capture-label">Outlet Scour Protection</label>
                      <select name="OutletScour" className="capture-input capture-select" value={formData.OutletScour} onChange={handleChange}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
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
                <Plus size={40} color="var(--cap-neon-green)" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '24px', margin: '0 0 12px 0' }}>Culvert Data Hub</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.6' }}>Select an existing culvert from the sidebar to edit, or create a new registry entry.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
