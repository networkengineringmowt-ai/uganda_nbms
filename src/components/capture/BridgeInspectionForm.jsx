import { useMemo, useState } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';
import { Search, Save, AlertCircle, CheckCircle, Activity, Plus, Trash2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [ratings, setRatings] = useState({
    approaches: '', waterway: '', substructure: '', superstructure: '', roadway: '',
    expansion_joints: '', drainage: '', traffic_barriers: '', guardrails: '', cell_structures_cmp: ''
  });

  const [defectsList, setDefectsList] = useState([]);
  const [defectForm, setDefectForm] = useState({
    element: 'approaches', stage: 'B', extent: 'L', activity: '', qty: '', unit: 'm²'
  });

  const filteredBridges = bridges.filter(b => 
    b.BridgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.BridgeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBridge = (bridge) => {
    setMessage('');
    setSelectedId(bridge.BridgeNumber);
    
    const leg = bridge.LegacyData || {};
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
  };

  const handleRatingSelect = (elId, num) => {
    setRatings(prev => ({ ...prev, [elId]: num }));
  };

  const handleAddDefect = () => {
    if (!defectForm.qty || !defectForm.activity) return;
    const newDef = { ...defectForm, qty: Number(defectForm.qty) };
    setDefectsList(prev => [...prev, newDef]);
    setDefectForm(prev => ({ ...prev, qty: '', activity: '' }));
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
    const dc = calculateConditionDeficiency(parsedRatings, 15000000); 
    
    return {
      overallRating: overall,
      deficiencyIndex: dc,
      category: getConditionCategory(overall)
    };
  }, [ratings, selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setMessage('Saving...');
    setIsError(false);
    
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
        setIsError(true);
      }
    }
  };

  const getRatingColor = (num) => {
    if (num >= 7) return 'var(--accent-primary)';
    if (num >= 5) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="map-workspace" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Sidebar List */}
      <div className="structure-list-panel">
        <div className="slp-search-container" style={{ padding: '20px' }}>
          <div className="toolbar-search" style={{ width: '100%' }}>
            <Search size={14} />
            <input 
              placeholder="Search bridges to inspect..." 
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
              <div className="slp-item-meta">{b.District}</div>
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
                <div className="panel-kicker">Condition Inspection</div>
                <h2>{bridges.find(b => b.BridgeNumber === selectedId)?.BridgeName || selectedId}</h2>
              </div>
              <button className="modern-btn-primary" onClick={handleSave} style={{ width: '160px', gap: '8px' }}>
                <Save size={16} /> Save Inspection
              </button>
            </div>

            <div className="modern-scroll" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', gap: '32px' }}>
              <div style={{ flex: 1 }}>
                {message && (
                  <div style={{
                    padding: '12px 16px', marginBottom: '24px', borderRadius: '8px',
                    background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: isError ? 'var(--accent-red)' : 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
                  }}>
                    {isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {message}
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-primary)' }}>Component Ratings (0-9)</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {RATING_ELEMENTS.map(comp => (
                      <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{comp.label}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(num => {
                            const isSelected = ratings[comp.id] === num;
                            return (
                              <button
                                key={num}
                                onClick={() => handleRatingSelect(comp.id, num)}
                                style={{
                                  width: '28px', height: '28px', borderRadius: '4px',
                                  border: isSelected ? `2px solid ${getRatingColor(num)}` : '1px solid var(--border-strong)',
                                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                                  color: isSelected ? getRatingColor(num) : 'var(--text-secondary)',
                                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                                }}
                              >
                                {num}
                              </button>
                            );
                          })}
                          <button 
                            onClick={() => setRatings(prev => ({ ...prev, [comp.id]: '' }))}
                            style={{ marginLeft: '8px', padding: '0 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'transparent', cursor: 'pointer' }}
                          >
                            CLR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-primary)' }}>Defect Capturing & Recommendations</h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div className="modern-select-wrapper" style={{ width: '160px' }}>
                      <select value={defectForm.element} onChange={(e) => setDefectForm({ ...defectForm, element: e.target.value })} style={{ height: '36px', fontSize: '12px' }}>
                        {RATING_ELEMENTS.map(el => <option key={el.id} value={el.id}>{el.label}</option>)}
                      </select>
                    </div>
                    <div className="modern-select-wrapper" style={{ width: '110px' }}>
                      <select value={defectForm.stage} onChange={(e) => setDefectForm({ ...defectForm, stage: e.target.value })} style={{ height: '36px', fontSize: '12px' }}>
                        <option value="B">B (Begin)</option><option value="E">E (Estab)</option><option value="A">A (Adv)</option>
                      </select>
                    </div>
                    <div className="modern-select-wrapper" style={{ width: '110px' }}>
                      <select value={defectForm.extent} onChange={(e) => setDefectForm({ ...defectForm, extent: e.target.value })} style={{ height: '36px', fontSize: '12px' }}>
                        <option value="L">L (Local)</option><option value="E">E (Estab)</option><option value="D">D (Dist)</option>
                      </select>
                    </div>
                    <input 
                      type="text" placeholder="Activity details..." 
                      className="toolbar-search" style={{ height: '36px', borderRadius: '8px', width: '200px' }}
                      value={defectForm.activity} onChange={(e) => setDefectForm({ ...defectForm, activity: e.target.value })}
                    />
                    <input 
                      type="number" placeholder="Qty" 
                      className="toolbar-search" style={{ height: '36px', borderRadius: '8px', width: '80px' }}
                      value={defectForm.qty} onChange={(e) => setDefectForm({ ...defectForm, qty: e.target.value })}
                    />
                    <div className="modern-select-wrapper" style={{ width: '80px' }}>
                      <select value={defectForm.unit} onChange={(e) => setDefectForm({ ...defectForm, unit: e.target.value })} style={{ height: '36px', fontSize: '12px' }}>
                        <option value="m">m</option><option value="m²">m²</option><option value="m³">m³</option><option value="No">No</option>
                      </select>
                    </div>
                    <button className="modern-btn-primary" onClick={handleAddDefect} style={{ height: '36px', width: '36px', padding: 0 }}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Element</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>S</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>E</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Activity</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Qty</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {defectsList.map((row, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px' }}>{row.element}</td>
                            <td style={{ padding: '12px' }}>{row.stage}</td>
                            <td style={{ padding: '12px' }}>{row.extent}</td>
                            <td style={{ padding: '12px' }}>{row.activity}</td>
                            <td style={{ padding: '12px' }}>{row.qty} {row.unit}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => handleRemoveDefect(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {defectsList.length === 0 && (
                          <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No defects recorded.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Results */}
              <div style={{ width: '280px', borderLeft: '1px solid var(--border-light)', paddingLeft: '32px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Real-time Analysis</h4>
                
                {results && results.overallRating !== null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>OVERALL CONDITION RATING</div>
                      <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{results.overallRating}<span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>/9</span></div>
                      <div className={`condition-pill condition-${results.category.toLowerCase()}`} style={{ marginTop: '12px' }}>
                        {results.category}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>DEFICIENCY INDEX (DC)</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-primary)' }}>{results.deficiencyIndex.toFixed(1)}</div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                        Calculated according to Department Table 3 condition weights and economic replacement value.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Incomplete ratings. Fill all components to calculate overall index.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Bridge Selected</h3>
              <p>Select a bridge from the list to record inspection data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
