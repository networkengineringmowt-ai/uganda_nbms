import { useState, useMemo } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';
import { Search, Save, AlertCircle, CheckCircle, Activity, Plus, Trash2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

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
      updated[idx] = {
        ...updated[idx],
        LegacyData: {
          ...(updated[idx].LegacyData || {}),
          approaches_rating: ratings.approaches,
          waterway_rating: ratings.waterway,
          substructure_rating: ratings.substructure,
          superstructure_rating: ratings.superstructure,
          roadway_rating: ratings.roadway,
          expansion_joints_rating: ratings.expansion_joints,
          drainage_rating: ratings.drainage,
          traffic_barriers_rating: ratings.traffic_barriers,
          guardrails_rating: ratings.guardrails,
          cell_structures_cmp_rating: ratings.cell_structures_cmp,
          defects: defectsList
        }
      };
      try {
        await saveBridge(updated[idx]);
        setMessage('Inspection ratings and defects saved successfully.');
        if (onBridgesUpdate) onBridgesUpdate(updated);
      } catch (err) {
        setMessage(`Error saving inspection: ${err.message}`);
        setIsError(true);
      }
    }
  };

  const radarOption = useMemo(() => {
    // Map ratings to a 4-point scale where 1 is best and 4 is worst (in UI), 
    // but for the chart, a larger area usually implies worse condition, so we map directly.
    const values = RATING_ELEMENTS.map(el => ratings[el.id] ? Number(ratings[el.id]) : 0);
    return {
      radar: {
        indicator: RATING_ELEMENTS.map(el => ({ name: el.label.split('. ')[1], max: 4 })),
        splitNumber: 4,
        axisName: { color: '#8b8b9e', fontSize: 10, fontWeight: 600 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: 'Condition Profile',
          itemStyle: { color: '#ff2a55' },
          areaStyle: { color: 'rgba(255, 42, 85, 0.4)' },
          lineStyle: { color: '#ff2a55', width: 2 }
        }]
      }]
    };
  }, [ratings]);

  return (
    <div className="capture-workspace">
      {/* Sidebar List */}
      <div className="capture-sidebar">
        <div className="capture-sidebar-header">
          <div style={{ color: 'var(--cap-neon-pink)', fontWeight: 900, fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} /> Inspections
          </div>
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
                <h2 className="capture-title">{bridges.find(b => b.BridgeNumber === selectedId)?.BridgeName || selectedId}</h2>
                <div style={{ color: 'var(--cap-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Evaluate structural elements. 1 = Excellent, 2 = Fair, 3 = Poor, 4 = Critical.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--cap-border)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--cap-neon-blue)', fontWeight: 900, fontSize: '24px' }}>
                      {results?.overallRating !== null ? results.overallRating.toFixed(1) : 'N/A'}
                    </div>
                    <div style={{ color: 'var(--cap-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Condition Index</div>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: 'var(--cap-border)' }}></div>
                  <div>
                    <div style={{ color: 'var(--cap-neon-orange)', fontWeight: 900, fontSize: '24px' }}>
                      {results?.deficiencyIndex !== null ? results.deficiencyIndex.toFixed(0) : 'N/A'}
                    </div>
                    <div style={{ color: 'var(--cap-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Deficiency Points</div>
                  </div>
                </div>
                <button className="cap-btn-primary" onClick={handleSave}>
                  <Save size={18} /> Save Inspection
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

              <div className="capture-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                
                {/* Ratings Form Card */}
                <div className="capture-card" style={{ gridColumn: '1' }}>
                  <h3 className="capture-card-title"><Activity size={20} color="var(--cap-neon-blue)" /> Element Ratings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {RATING_ELEMENTS.map(el => (
                      <div key={el.id}>
                        <div className="capture-label">{el.label}</div>
                        <div className="rating-grid">
                          {[1, 2, 3, 4].map(num => (
                            <div 
                              key={num}
                              className={`rating-box r-${num} ${ratings[el.id] == num ? 'active' : ''}`}
                              onClick={() => handleRatingSelect(el.id, num)}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Chart + Defects */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Radar Chart Card */}
                  <div className="capture-card">
                    <h3 className="capture-card-title">Condition Radar</h3>
                    <div style={{ height: '320px', margin: '-20px' }}>
                      <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                  </div>

                  {/* Defects Card */}
                  <div className="capture-card">
                    <h3 className="capture-card-title">Defects & Activities</h3>
                    
                    {/* Defect Form */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--cap-border)', marginBottom: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label className="capture-label">Element</label>
                          <select className="capture-input capture-select" style={{ padding: '10px', fontSize: '13px' }} value={defectForm.element} onChange={e => setDefectForm({...defectForm, element: e.target.value})}>
                            {RATING_ELEMENTS.map(el => <option key={el.id} value={el.id}>{el.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="capture-label">Activity Code</label>
                          <input className="capture-input" style={{ padding: '10px', fontSize: '13px' }} placeholder="e.g. B-01" value={defectForm.activity} onChange={e => setDefectForm({...defectForm, activity: e.target.value})} />
                        </div>
                        <div>
                          <label className="capture-label">Qty</label>
                          <input type="number" className="capture-input" style={{ padding: '10px', fontSize: '13px' }} value={defectForm.qty} onChange={e => setDefectForm({...defectForm, qty: e.target.value})} />
                        </div>
                        <div>
                          <label className="capture-label">Unit</label>
                          <select className="capture-input capture-select" style={{ padding: '10px', fontSize: '13px' }} value={defectForm.unit} onChange={e => setDefectForm({...defectForm, unit: e.target.value})}>
                            <option value="m²">m²</option>
                            <option value="m³">m³</option>
                            <option value="l.m">l.m</option>
                            <option value="No">No</option>
                            <option value="LS">LS</option>
                          </select>
                        </div>
                      </div>
                      <button className="cap-btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '13px' }} onClick={handleAddDefect}>
                        <Plus size={14} /> Add Defect Record
                      </button>
                    </div>

                    {/* Defect List */}
                    {defectsList.length === 0 ? (
                      <div style={{ color: 'var(--cap-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        No defects recorded yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {defectsList.map((d, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cap-bg-input)', borderRadius: '8px', border: '1px solid var(--cap-border)' }}>
                            <div>
                              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{d.element} <span style={{ color: 'var(--cap-neon-orange)' }}>({d.activity})</span></div>
                              <div style={{ color: 'var(--cap-text-muted)', fontSize: '12px' }}>Qty: {d.qty} {d.unit}</div>
                            </div>
                            <button onClick={() => handleRemoveDefect(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--cap-neon-pink)', cursor: 'pointer', padding: '8px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--cap-text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Activity size={40} color="var(--cap-neon-pink)" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '24px', margin: '0 0 12px 0' }}>Inspection Hub</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.6' }}>Select a bridge to perform a structural condition inspection and record defects.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
