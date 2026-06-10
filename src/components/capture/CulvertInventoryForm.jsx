import { useState } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, Plus, AlertCircle, CheckCircle, FilePlus } from 'lucide-react';

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

  const renderInputField = (label, name, type = 'text') => (
    <div className="modern-filter-field">
      <label>{label}</label>
      <input 
        type={type}
        name={name}
        className="toolbar-search"
        style={{ width: '100%', background: 'rgba(0,0,0,0.05)', height: '40px', borderRadius: '8px' }}
        value={formData[name]}
        onChange={handleChange}
        disabled={name === 'CulvertNumber' && selectedId !== 'NEW'}
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
              placeholder="Search culverts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredCulverts.map(c => (
            <div 
              key={c.CulvertNumber}
              className={`slp-item ${selectedId === c.CulvertNumber ? 'slp-item-active' : ''}`}
              onClick={() => handleSelectCulvert(c)}
            >
              <div className="slp-item-number">{c.CulvertNumber}</div>
              <div className="slp-item-name">{c.River || 'Unnamed Stream'}</div>
              <div className="slp-item-meta">{c.Road} • {c.CellType}</div>
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
                <h2>{selectedId === 'NEW' ? 'New Culvert Record' : formData.CulvertNumber}</h2>
              </div>
              <button className="modern-btn-primary" onClick={handleSave} style={{ width: '140px', gap: '8px' }}>
                <Save size={16} /> Save Record
              </button>
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
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Identification & Location</h3>
                </div>
                
                {renderInputField('Culvert Number (Unique ID)', 'CulvertNumber')}
                {renderInputField('River / Stream Name', 'River')}
                {renderInputField('Road / Route Name', 'Road')}
                {renderInputField('Link Name / ID', 'Link_Name')}
                {renderInputField('Maintenance Station', 'Maintenance_Station')}
                {renderInputField('Latitude', 'Latitude', 'number')}
                {renderInputField('Longitude', 'Longitude', 'number')}
                
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginTop: '16px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Structure Characteristics</h3>
                </div>

                <div className="modern-filter-field">
                  <label>Cell Type</label>
                  <div className="modern-select-wrapper">
                    <select 
                      name="CellType"
                      value={formData.CellType}
                      onChange={handleChange}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', height: '40px' }}
                    >
                      <option value="Concrete Box">Concrete Box</option>
                      <option value="Concrete Pipe">Concrete Pipe</option>
                      <option value="Corrugated Metal Pipe">Corrugated Metal Pipe</option>
                      <option value="Masonry Arch">Masonry Arch</option>
                    </select>
                  </div>
                </div>

                {renderInputField('Number of Barrels', 'NumBarrels', 'number')}
                {renderInputField('Span / Opening Width (m)', 'SpanLength', 'number')}

                <div className="modern-filter-field">
                  <label>Inlet Scour Protection</label>
                  <div className="modern-select-wrapper">
                    <select 
                      name="InletScour"
                      value={formData.InletScour}
                      onChange={handleChange}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', height: '40px' }}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="modern-filter-field">
                  <label>Outlet Scour Protection</label>
                  <div className="modern-select-wrapper">
                    <select 
                      name="OutletScour"
                      value={formData.OutletScour}
                      onChange={handleChange}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', height: '40px' }}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <FilePlus size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Record Selected</h3>
              <p>Select a major culvert from the list to view or edit its inventory data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
