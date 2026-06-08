import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';

export default function CulvertInspectionForm({ culverts = [], onCulvertsUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [ratings, setRatings] = useState({
    alignment: '',
    joints: '',
    material: '',
    footings: '',
    approaches: '',
    roadway: ''
  });

  const [message, setMessage] = useState('');

  const [prevIndex, setPrevIndex] = useState(-1);
  const [prevCulverts, setPrevCulverts] = useState(null);

  const c = culverts[currentIndex];

  if (currentIndex !== prevIndex || culverts !== prevCulverts) {
    setPrevIndex(currentIndex);
    setPrevCulverts(culverts);
    if (c) {
      setSelectedId(c.CulvertNumber);
      setRatings({
        alignment: c.LegacyData?.alignment_rating ?? '',
        joints: c.LegacyData?.joints_rating ?? '',
        material: c.LegacyData?.material_rating ?? '',
        footings: c.LegacyData?.footings_rating ?? '',
        approaches: c.LegacyData?.approaches_rating ?? '',
        roadway: c.LegacyData?.roadway_rating ?? ''
      });
    }
  }

  const handleNavigate = (dir) => {
    setMessage('');
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRatings(prev => ({ ...prev, [name]: value }));
  };

  const results = useMemo(() => {
    if (!selectedId) return null;
    const vals = Object.values(ratings).map(v => v === '' ? null : Number(v)).filter(x => x !== null);
    if (vals.length === 0) return { overallRating: null, category: 'Unrated' };
    
    // Average rating
    const avg = Math.round(vals.reduce((sum, v) => sum + v, 0) / vals.length);
    let category = 'Unrated';
    if (avg >= 8) category = 'Excellent / Very Good';
    else if (avg >= 6) category = 'Good / Satisfactory';
    else if (avg >= 4) category = 'Fair / Marginal';
    else if (avg >= 2) category = 'Poor / Very Poor';
    else if (avg >= 0) category = 'Critical / Beyond Repair';

    return { overallRating: avg, category };
  }, [ratings, selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setMessage('Saving...');

    const updated = [...culverts];
    const idx = updated.findIndex(x => x.CulvertNumber === selectedId);

    if (idx > -1) {
      const c = { ...updated[idx] };
      c.LegacyData = c.LegacyData || {};
      
      Object.keys(ratings).forEach(key => {
        c.LegacyData[`${key}_rating`] = ratings[key] === '' ? null : Number(ratings[key]);
      });
      
      if (results && results.overallRating != null) {
        c.LegacyData.overall_rating = results.overallRating;
      }
      
      updated[idx] = c;

      try {
        await saveCulvert(c);
        setMessage('Inspection saved successfully!');
        if (onCulvertsUpdate) onCulvertsUpdate(updated);
      } catch (err) {
        setMessage(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="ms-form-tab-container" style={{ height: '100%' }}>
      {/* Content */}
      <div className="ms-form-body">
        <h3 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>Culvert Inspection (ratings 0-9)</h3>
        
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          
          <div className="ms-form-grid" style={{ flex: 1, gridTemplateColumns: '1fr' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>1. Barrel Alignment:</label>
              <input 
                type="number" min="0" max="9"
                name="alignment"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.alignment}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>2. Seams & Joints:</label>
              <input 
                type="number" min="0" max="9"
                name="joints"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.joints}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>3. Barrel Material (Concrete/Metal):</label>
              <input 
                type="number" min="0" max="9"
                name="material"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.material}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>4. Footings & Invert Scour:</label>
              <input 
                type="number" min="0" max="9"
                name="footings"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.footings}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>5. Approaches Alignment:</label>
              <input 
                type="number" min="0" max="9"
                name="approaches"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.approaches}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', border: '1px solid #c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>6. Roadway Surface / Deck:</label>
              <input 
                type="number" min="0" max="9"
                name="roadway"
                className="ms-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={ratings.roadway}
                onChange={handleChange}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px' }}>
              <button className="ms-btn" onClick={handleSave}>
                Save Inspection ratings
              </button>
              {message && <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{message}</span>}
            </div>
          </div>

          <div className="ms-chart-container" style={{ width: '250px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0a246a' }}>Live Rating Calculation</h4>
            {results && results.overallRating !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#808080' }}>Overall rating</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{results.overallRating} / 9</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{results.category}</div>
                </div>
              </div>
            ) : (
              <span style={{ color: '#808080' }}>Input ratings to see overall score.</span>
            )}
          </div>
        </div>
      </div>

      {/* Record Selector */}
      <div className="ms-record-navigator">
        <button className="ms-nav-btn" onClick={() => handleNavigate('first')} title="First Record">|&lt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('prev')} title="Previous Record">&lt;</button>
        <span className="ms-navigator-text">Record:</span>
        <input 
          type="text" 
          className="ms-record-num-input" 
          value={currentIndex + 1}
          onChange={handleRecordInput}
        />
        <span className="ms-navigator-text">of {culverts.length}</span>
        <button className="ms-nav-btn" onClick={() => handleNavigate('next')} title="Next Record">&gt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('last')} title="Last Record">&gt;|</button>
      </div>
    </div>
  );
}
