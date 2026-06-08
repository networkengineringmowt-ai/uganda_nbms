import { useMemo, useState } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';

const RATING_ELEMENTS = [
  { id: 'approaches', label: '1. Approaches' },
  { id: 'waterway', label: '2. Waterway' },
  { id: 'substructure', label: '3. Substructure' },
  { id: 'superstructure', label: '4. Superstructure' },
  { id: 'roadway', label: '5. Roadway (Deck)' },
  { id: 'expansion_joints', label: '6. Expansion Joints' },
  { id: 'drainage', label: '7. Drainage' },
  { id: 'traffic_barriers', label: '8. Traffic Barriers' },
  { id: 'guardrails', label: '9. Guardrails' },
  { id: 'cell_structures_cmp', label: '10. Cell Structures / CMP' }
];

export default function BridgeInspectionForm({ bridges = [], onBridgesUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [ratings, setRatings] = useState({
    approaches: '', waterway: '', substructure: '', superstructure: '', roadway: '',
    expansion_joints: '', drainage: '', traffic_barriers: '', guardrails: '', cell_structures_cmp: ''
  });

  const [defectsList, setDefectsList] = useState([]);
  const [defectForm, setDefectForm] = useState({
    element: 'approaches',
    stage: 'B', // Beginning
    extent: 'L', // Localized
    activity: 'Erosion repair',
    qty: '',
    unit: 'm²'
  });

  const [message, setMessage] = useState('');

  const [prevIndex, setPrevIndex] = useState(-1);
  const [prevBridges, setPrevBridges] = useState(null);

  const b = bridges[currentIndex];

  if (currentIndex !== prevIndex || bridges !== prevBridges) {
    setPrevIndex(currentIndex);
    setPrevBridges(bridges);
    if (b) {
      setSelectedId(b.BridgeNumber);
      const leg = b.LegacyData || {};
      
      setRatings({
        approaches: leg.approaches_rating ?? '',
        waterway: leg.waterway_rating ?? '',
        substructure: leg.substructure_rating ?? '',
        superstructure: leg.superstructure_rating ?? '',
        roadway: leg.roadway_rating ?? '',
        expansion_joints: leg.expansion_joints_rating ?? '',
        drainage: leg.drainage_rating ?? '',
        traffic_barriers: leg.traffic_barriers_rating ?? '',
        guardrails: leg.guardrails_rating ?? '',
        cell_structures_cmp: leg.cell_structures_cmp_rating ?? ''
      });

      setDefectsList(leg.defects || []);
    }
  }

  const handleNavigate = (dir) => {
    setMessage('');
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

  const handleRatingSelect = (elId, num) => {
    setRatings(prev => ({ ...prev, [elId]: num }));
  };

  const handleAddDefect = () => {
    if (!defectForm.qty || !defectForm.activity) return;
    const newDef = { ...defectForm, qty: Number(defectForm.qty) };
    setDefectsList(prev => [...prev, newDef]);
    setDefectForm(prev => ({ ...prev, qty: '' }));
  };

  const handleRemoveDefect = (idx) => {
    setDefectsList(prev => prev.filter((_, i) => i !== idx));
  };

  const results = useMemo(() => {
    if (!selectedId) return null;
    const parsedRatings = {};
    RATING_ELEMENTS.forEach(el => {
      parsedRatings[el.id] = ratings[el.id] === '' || ratings[el.id] === undefined ? null : Number(ratings[el.id]);
    });

    const overall = calculateOverallRating(parsedRatings);
    const dc = calculateConditionDeficiency(parsedRatings, 15000000); // 15M dummy replacement value
    
    return {
      overallRating: overall,
      deficiencyIndex: dc,
      category: getConditionCategory(overall)
    };
  }, [ratings, selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setMessage('Saving...');
    
    let updated = [...bridges];
    const idx = updated.findIndex(b => b.BridgeNumber === selectedId);
    
    if (idx > -1) {
      const b = { ...updated[idx] };
      b.LegacyData = b.LegacyData || {};
      
      RATING_ELEMENTS.forEach(el => {
        b.LegacyData[`${el.id}_rating`] = ratings[el.id] === '' || ratings[el.id] === undefined ? null : Number(ratings[el.id]);
      });
      
      if (results && results.overallRating != null) {
        b.LegacyData.overall_rating = results.overallRating;
        b.LegacyData.deficiency_index = results.deficiencyIndex;
      }

      b.LegacyData.defects = defectsList;
      
      updated[idx] = b;
      
      try {
        await saveBridge(b);
        setMessage('Inspection saved successfully!');
        if (onBridgesUpdate) onBridgesUpdate(updated);
      } catch (err) {
        setMessage(`Error: ${err.message}`);
      }
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

  return (
    <div className="ms-form-tab-container" style={{ height: '100%' }}>
      {/* Content */}
      <div className="ms-form-body">
        <h3 style={{ margin: '0 0 10px 0', color: '#0a246a' }}>Bridge Condition Inspection Ratings</h3>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Ratings list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontStyle: 'italic', color: '#005a5b', margin: '0 0 10px 0' }}>
              Select a rating from 0 (Beyond Repair) to 9 (Excellent). Hover over numbers to check manual criteria.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RATING_ELEMENTS.map(comp => (
                <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '6px 12px', border: '1px solid var(--ms-border-dark)' }}>
                  <label style={{ fontWeight: 'bold' }}>{comp.label}:</label>
                  
                  <div className="ms-rating-box">
                    {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(num => (
                      <div 
                        key={num} 
                        className={`ms-rating-num ${ratings[comp.id] === num ? 'selected' : ''}`}
                        onClick={() => handleRatingSelect(comp.id, num)}
                        title={`Rating ${num}`}
                      >
                        {num}
                      </div>
                    ))}
                    <button 
                      className="ms-btn" 
                      style={{ padding: '2px 6px', fontSize: '9px', border: '1px solid #808080' }}
                      onClick={() => setRatings(prev => ({ ...prev, [comp.id]: '' }))}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Defect details capturing */}
            <fieldset className="ms-fieldset" style={{ marginTop: '15px' }}>
              <legend>Defect Capturing &amp; Work Recommendations</legend>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div className="ms-select-container" style={{ width: '130px', flex: 'none' }}>
                  <select 
                    className="ms-select"
                    value={defectForm.element}
                    onChange={(e) => setDefectForm({ ...defectForm, element: e.target.value })}
                  >
                    {RATING_ELEMENTS.map(el => (
                      <option key={el.id} value={el.id}>{el.label}</option>
                    ))}
                  </select>
                  <div className="ms-select-arrow">▼</div>
                </div>

                <div className="ms-select-container" style={{ width: '80px', flex: 'none' }}>
                  <select 
                    className="ms-select"
                    value={defectForm.stage}
                    onChange={(e) => setDefectForm({ ...defectForm, stage: e.target.value })}
                    title="Stage of defect (B=Beginning, E=Established, A=Advanced)"
                  >
                    <option value="B">B (Begin)</option>
                    <option value="E">E (Estab)</option>
                    <option value="A">A (Adv)</option>
                  </select>
                  <div className="ms-select-arrow">▼</div>
                </div>

                <div className="ms-select-container" style={{ width: '80px', flex: 'none' }}>
                  <select 
                    className="ms-select"
                    value={defectForm.extent}
                    onChange={(e) => setDefectForm({ ...defectForm, extent: e.target.value })}
                    title="Extent of defect (L=Localised, E=Established, D=Distributed)"
                  >
                    <option value="L">L (Local)</option>
                    <option value="E">E (Estab)</option>
                    <option value="D">D (Dist)</option>
                  </select>
                  <div className="ms-select-arrow">▼</div>
                </div>

                <input 
                  type="text" 
                  placeholder="Activity / Defect Details" 
                  className="ms-input"
                  value={defectForm.activity}
                  onChange={(e) => setDefectForm({ ...defectForm, activity: e.target.value })}
                />

                <input 
                  type="number" 
                  placeholder="Qty" 
                  className="ms-input"
                  style={{ width: '60px', flex: 'none' }}
                  value={defectForm.qty}
                  onChange={(e) => setDefectForm({ ...defectForm, qty: e.target.value })}
                />

                <div className="ms-select-container" style={{ width: '60px', flex: 'none' }}>
                  <select 
                    className="ms-select"
                    value={defectForm.unit}
                    onChange={(e) => setDefectForm({ ...defectForm, unit: e.target.value })}
                  >
                    <option value="m">m</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="No">No</option>
                  </select>
                  <div className="ms-select-arrow">▼</div>
                </div>

                <button className="ms-btn" onClick={handleAddDefect}>Add</button>
              </div>

              <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
                <table className="ms-grid-table">
                  <thead>
                    <tr><th>Component</th><th>Stage</th><th>Extent</th><th>Activity</th><th>Qty</th><th>Unit</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {defectsList.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.element}</td>
                        <td>{row.stage}</td>
                        <td>{row.extent}</td>
                        <td>{row.activity}</td>
                        <td>{row.qty}</td>
                        <td>{row.unit}</td>
                        <td>
                          <button className="ms-btn" style={{ padding: '1px 5px', fontSize: '9px' }} onClick={() => handleRemoveDefect(idx)}>
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px' }}>
              <button className="ms-btn" onClick={handleSave}>
                Save Inspection Record
              </button>
              {message && <span style={{ fontWeight: 'bold', color: '#005a5b' }}>{message}</span>}
            </div>
          </div>

          {/* Results panel */}
          <div className="ms-chart-container" style={{ width: '280px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>Calculated Deficiency Index</h4>
            {results && results.overallRating !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#808080' }}>Overall Condition rating</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '4px 0' }}>{results.overallRating} / 9</div>
                  <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{results.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#808080' }}>Deficiency Index (DC)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0a246a' }}>{results.deficiencyIndex.toFixed(1)}</div>
                  <small style={{ color: '#808080' }}>Calculated according to UNRA Table 3 weights.</small>
                </div>
              </div>
            ) : (
              <span style={{ color: '#808080' }}>No inspection data loaded. Navigate to a rated bridge.</span>
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
        <span className="ms-navigator-text">of {bridges.length}</span>
        <button className="ms-nav-btn" onClick={() => handleNavigate('next')} title="Next Record">&gt;</button>
        <button className="ms-nav-btn" onClick={() => handleNavigate('last')} title="Last Record">&gt;|</button>

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
