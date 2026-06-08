import { useState } from 'react';
import { saveCulvert } from '../../services/bmsDataService';

export default function CulvertInventoryForm({ culverts = [], onCulvertsUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [formData, setFormData] = useState({
    CulvertNumber: '',
    River: '',
    Road: '',
    Link_Name: '',
    Maintenance_Station: '',
    Latitude: '',
    Longitude: '',
    CellType: 'Concrete Box',
    NumBarrels: 1,
    SpanLength: '',
    InletScour: 'No',
    OutletScour: 'No'
  });

  const [message, setMessage] = useState('');

  const [prevIndex, setPrevIndex] = useState(-1);
  const [prevCulverts, setPrevCulverts] = useState(null);

  const c = culverts[currentIndex];

  if ((currentIndex !== prevIndex || culverts !== prevCulverts) && selectedId !== 'NEW') {
    setPrevIndex(currentIndex);
    setPrevCulverts(culverts);
    if (c) {
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
      setSelectedId(c.CulvertNumber);
    }
  }

  const handleNavigate = (dir) => {
    setMessage('');
    setSelectedId('');
    if (dir === 'first') setCurrentIndex(0);
    else if (dir === 'prev') setCurrentIndex(prev => Math.max(0, prev - 1));
    else if (dir === 'next') setCurrentIndex(prev => Math.min(culverts.length - 1, prev + 1));
    else if (dir === 'last') setCurrentIndex(culverts.length - 1);
  };

  const handleRecordInput = (e) => {
    const val = Number(e.target.value);
    if (val > 0 && val <= culverts.length) {
      setCurrentIndex(val - 1);
    }
  };

  const handleNewRecord = () => {
    setSelectedId('NEW');
    setFormData({
      CulvertNumber: '',
      River: '',
      Road: '',
      Link_Name: '',
      Maintenance_Station: '',
      Latitude: '',
      Longitude: '',
      CellType: 'Concrete Box',
      NumBarrels: 1,
      SpanLength: '',
      InletScour: 'No',
      OutletScour: 'No'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setMessage('Saving...');
    let updated = [...culverts];
    const id = formData.CulvertNumber;

    if (!id) {
      setMessage('Error: CulvertNumber is required.');
      return;
    }

    if (selectedId === 'NEW') {
      if (updated.some(x => x.CulvertNumber === id)) {
        setMessage('Error: Culvert Number already exists.');
        return;
      }
      updated.push(formData);
      setCurrentIndex(updated.length - 1);
    } else {
      const idx = updated.findIndex(x => x.CulvertNumber === selectedId);
      if (idx > -1) updated[idx] = formData;
    }

    try {
      await saveCulvert(formData);
      setMessage(`Saved successfully!`);
      if (onCulvertsUpdate) onCulvertsUpdate(updated);
      setSelectedId(formData.CulvertNumber);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) return;
    const idx = culverts.findIndex(x => 
      x.CulvertNumber?.toLowerCase().includes(q) || 
      x.River?.toLowerCase().includes(q)
    );
    if (idx > -1) {
      setCurrentIndex(idx);
    }
  };

  return (
    <div className="ms-form-tab-container" style={{ height: '100%' }}>
      {/* Form Content */}
      <div className="ms-form-body">
        <h3 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>Culvert Inventory Form</h3>
        
        <div className="ms-form-grid">
          <div className="ms-form-row">
            <label>Culvert # (Unique):</label>
            <input 
              type="text" 
              name="CulvertNumber"
              className="ms-input"
              value={formData.CulvertNumber}
              onChange={handleChange}
              disabled={selectedId !== 'NEW'}
            />
          </div>

          <div className="ms-form-row">
            <label>River Name:</label>
            <input 
              type="text" 
              name="River"
              className="ms-input"
              value={formData.River}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Road / Route Name:</label>
            <input 
              type="text" 
              name="Road"
              className="ms-input"
              value={formData.Road}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Link Name / ID:</label>
            <input 
              type="text" 
              name="Link_Name"
              className="ms-input"
              value={formData.Link_Name}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Maintenance Station:</label>
            <input 
              type="text" 
              name="Maintenance_Station"
              className="ms-input"
              value={formData.Maintenance_Station}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Latitude:</label>
            <input 
              type="number" 
              name="Latitude"
              className="ms-input"
              value={formData.Latitude}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Longitude:</label>
            <input 
              type="number" 
              name="Longitude"
              className="ms-input"
              value={formData.Longitude}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Cell Type:</label>
            <div className="ms-select-container">
              <select 
                className="ms-select"
                name="CellType"
                value={formData.CellType}
                onChange={handleChange}
              >
                <option value="Concrete Box">Concrete Box</option>
                <option value="Concrete Pipe">Concrete Pipe</option>
                <option value="Corrugated Metal Pipe">Corrugated Metal Pipe</option>
                <option value="Masonry Arch">Masonry Arch</option>
              </select>
              <div className="ms-select-arrow">▼</div>
            </div>
          </div>

          <div className="ms-form-row">
            <label>Number of Barrels:</label>
            <input 
              type="number" 
              name="NumBarrels"
              className="ms-input"
              value={formData.NumBarrels}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Span / Opening Width (m):</label>
            <input 
              type="number" 
              name="SpanLength"
              className="ms-input"
              value={formData.SpanLength}
              onChange={handleChange}
            />
          </div>

          <div className="ms-form-row">
            <label>Inlet Scour Protection:</label>
            <div className="ms-select-container">
              <select 
                className="ms-select"
                name="InletScour"
                value={formData.InletScour}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <div className="ms-select-arrow">▼</div>
            </div>
          </div>

          <div className="ms-form-row">
            <label>Outlet Scour Protection:</label>
            <div className="ms-select-container">
              <select 
                className="ms-select"
                name="OutletScour"
                value={formData.OutletScour}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <div className="ms-select-arrow">▼</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '30px' }}>
          <button className="ms-btn" onClick={handleSave}>
            Save Record
          </button>
          {message && <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{message}</span>}
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
        <span className="ms-navigator-text">of {culverts.length}</span>
        <button className="ms-nav-btn" onClick={() => handleNavigate('next')} title="Next Record">&gt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('last')} title="Last Record">&gt;|</button>
        <button className="ms-nav-btn" onClick={handleNewRecord} title="New Record" style={{ width: '25px', marginLeft: '6px' }}>*</button>

        <div className="ms-nav-search">
          <label style={{ fontWeight: 'bold' }}>Find Culvert:</label>
          <input 
            type="text" 
            placeholder="Search #..." 
            className="ms-input"
            style={{ width: '100px', height: '18px' }}
            onChange={handleSearch}
          />
        </div>
      </div>
    </div>
  );
}
