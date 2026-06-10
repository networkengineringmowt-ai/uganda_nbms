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
        setMessage('Inspection saved successfully.');
        if (onBridgesUpdate) onBridgesUpdate(updated);
      } catch (err) {
        setMessage(`Error: ${err.message}`);
        setIsError(true);
      }
    }
  };

  const radarOption = useMemo(() => {
    const values = RATING_ELEMENTS.map(el => ratings[el.id] ? Number(ratings[el.id]) : 0);
    return {
      radar: {
        indicator: RATING_ELEMENTS.map(el => ({ name: el.label.split('. ')[1], max: 4 })),
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 10, fontWeight: 600 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#ffffff'] } },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: 'Condition',
          itemStyle: { color: '#2563eb' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.2)' },
          lineStyle: { color: '#2563eb', width: 2 }
        }]
      }]
    };
  }, [ratings]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* LEFT PANE: List */}
      <div className="ent-sidebar">
        <div className="ent-sidebar-header">Bridge Inspections</div>
        <div style={{ padding: '0 16px 16px' }}>
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

      {/* CENTER PANE: Main Form */}
      <div className="ent-main">
        {selectedId ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 className="ent-page-title">{bridges.find(b => b.BridgeNumber === selectedId)?.BridgeName || selectedId}</h2>
            <p className="ent-page-subtitle">Submit physical condition ratings for this structure.</p>

            {message && (
              <div className={`ent-alert ${isError ? 'ent-alert-error' : 'ent-alert-success'}`}>
                {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                {message}
              </div>
            )}

            <div className="ent-card">
              <div className="ent-card-header"><Activity size={18} color="var(--ent-primary)" /> Condition Ratings (1-4)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {RATING_ELEMENTS.map(el => (
                  <div key={el.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--ent-border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{el.label}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4].map(num => (
                        <div 
                          key={num}
                          className={`ent-rating-box ${ratings[el.id] == num ? 'active' : ''}`}
                          style={{ width: '40px' }}
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

            <div className="ent-card">
              <div className="ent-card-header">Defects & Interventions</div>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--ent-border)', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="ent-field">
                    <label className="ent-label">Element</label>
                    <select className="ent-select" value={defectForm.element} onChange={e => setDefectForm({...defectForm, element: e.target.value})}>
                      {RATING_ELEMENTS.map(el => <option key={el.id} value={el.id}>{el.label}</option>)}
                    </select>
                  </div>
                  <div className="ent-field">
                    <label className="ent-label">Activity Code</label>
                    <input className="ent-input" placeholder="e.g. B-01" value={defectForm.activity} onChange={e => setDefectForm({...defectForm, activity: e.target.value})} />
                  </div>
                  <div className="ent-field">
                    <label className="ent-label">Quantity</label>
                    <input type="number" className="ent-input" value={defectForm.qty} onChange={e => setDefectForm({...defectForm, qty: e.target.value})} />
                  </div>
                  <div className="ent-field">
                    <label className="ent-label">Unit</label>
                    <select className="ent-select" value={defectForm.unit} onChange={e => setDefectForm({...defectForm, unit: e.target.value})}>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="l.m">l.m</option>
                      <option value="No">No</option>
                      <option value="LS">LS</option>
                    </select>
                  </div>
                </div>
                <button className="ent-btn-outline" style={{ width: '100%', borderColor: 'var(--ent-primary)', color: 'var(--ent-primary)', justifyContent: 'center' }} onClick={handleAddDefect}>
                  <Plus size={14} /> Add Defect
                </button>
              </div>

              {defectsList.length === 0 ? (
                <div style={{ color: 'var(--ent-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '6px' }}>
                  No defects logged.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {defectsList.map((d, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: '6px', border: '1px solid var(--ent-border)' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{d.element} <span style={{ color: 'var(--ent-primary)', marginLeft: '8px' }}>{d.activity}</span></div>
                        <div style={{ color: 'var(--ent-text-muted)', fontSize: '12px' }}>Qty: {d.qty} {d.unit}</div>
                      </div>
                      <button onClick={() => handleRemoveDefect(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--ent-danger)', cursor: 'pointer', padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ent-text-muted)' }}>
            <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--ent-text-main)', margin: '0 0 8px 0' }}>Select a Bridge</h3>
            <p>Choose a record from the left panel to log an inspection.</p>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Summary */}
      <div className="ent-summary">
        <div className="ent-summary-title">Inspection Results</div>
        
        {selectedId ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--ent-border)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ent-primary)' }}>
                  {results?.overallRating !== null ? results.overallRating.toFixed(1) : '-'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>Cond Index</div>
              </div>
              <div style={{ width: '1px', background: 'var(--ent-border)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ent-danger)' }}>
                  {results?.deficiencyIndex !== null ? results.deficiencyIndex.toFixed(0) : '-'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>Def Points</div>
              </div>
            </div>

            <div style={{ height: '240px', marginBottom: '24px', marginLeft: '-20px', marginRight: '-20px' }}>
              <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
            </div>

            <button className="ent-btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Inspection
            </button>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--ent-text-muted)' }}>No record active.</div>
        )}
      </div>
    </div>
  );
}
