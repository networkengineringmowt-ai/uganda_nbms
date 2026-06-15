import { useState, useMemo } from 'react';
import { saveBridge } from '../../services/bmsDataService';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';
import { Search, Save, AlertCircle, CheckCircle, Activity, Plus, Trash2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const RATING_GROUPS = [
  {
    title: 'Superstructure',
    elements: [
      { id: 'main_girders', label: 'Main Girders' },
      { id: 'cross_girders', label: 'Cross Girders' },
      { id: 'deck_slab', label: 'Deck Slab' },
      { id: 'bearings', label: 'Bearings' },
    ]
  },
  {
    title: 'Substructure',
    elements: [
      { id: 'abutments', label: 'Abutments' },
      { id: 'piers', label: 'Piers' },
      { id: 'foundations', label: 'Foundations' },
      { id: 'wingwalls', label: 'Wingwalls' },
    ]
  },
  {
    title: 'Roadway & Ancillary',
    elements: [
      { id: 'surfacing', label: 'Surfacing' },
      { id: 'expansion_joints', label: 'Expansion Joints' },
      { id: 'footways', label: 'Footways / Kerbs' },
      { id: 'parapets', label: 'Parapets / Handrails' },
    ]
  },
  {
    title: 'Channel & Approaches',
    elements: [
      { id: 'approaches', label: 'Approaches' },
      { id: 'embankment', label: 'Embankment / Pitching' },
      { id: 'waterway', label: 'Waterway / Channel' },
    ]
  }
];

const RATING_ELEMENTS = RATING_GROUPS.flatMap(g => g.elements);

export default function BridgeInspectionForm({ bridges = [], onBridgesUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [ratings, setRatings] = useState(
    RATING_ELEMENTS.reduce((acc, el) => ({ ...acc, [el.id]: '' }), {})
  );

  const [defectsList, setDefectsList] = useState([]);
  const [defectForm, setDefectForm] = useState({
    element: 'approaches', stage: 'B', extent: 'L', activity: '', qty: '', unit: 'm²'
  });

  const filteredBridges = bridges.filter(b => 
    b.BridgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.BridgeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisibleGroups = (bridge) => {
    if (!bridge) return RATING_GROUPS;
    const leg = bridge.LegacyData || {};
    const spans = Number(bridge.Spans || leg.spans || 1);
    
    return RATING_GROUPS.map(group => {
      let elements = group.elements.filter(el => {
        if (el.id === 'piers' && (spans <= 1 || leg.pier_type === '97' || leg.pier_type === 'None')) return false;
        if (el.id === 'bearings' && (leg.bearing_type === '97' || leg.bearing_type === 'None')) return false;
        if (el.id === 'expansion_joints' && (leg.expansion_joint_type === '97' || leg.expansion_joint_type === 'None')) return false;
        if (el.id === 'surfacing' && (leg.surfacing_type === '97' || leg.surfacing_type === 'None')) return false;
        if (el.id === 'footways' && (leg.footway_type === '97' || leg.footway_type === 'None')) return false;
        if (el.id === 'parapets' && (leg.parapet_type === '97' || leg.parapet_type === 'None' || leg.parapet_railing === '97')) return false;
        if (el.id === 'wingwalls' && (leg.wingwall_type === '97' || leg.wingwall_type === 'None')) return false;
        return true;
      });
      return { ...group, elements };
    }).filter(group => group.elements.length > 0);
  };

  const visibleGroups = useMemo(() => {
    const bridge = bridges.find(b => b.BridgeNumber === selectedId);
    return getVisibleGroups(bridge);
  }, [selectedId, bridges]);

  const handleSelectBridge = (bridge) => {
    setMessage('');
    setSelectedId(bridge.BridgeNumber);
    
    const leg = bridge.LegacyData || {};
    const initialRatings = {};
    RATING_ELEMENTS.forEach(el => {
      initialRatings[el.id] = leg[`${el.id}_rating`] ?? '';
    });
    setRatings(initialRatings);
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

    const engineRatings = {
      superstructure: Math.max(parsedRatings.main_girders || 0, parsedRatings.cross_girders || 0, parsedRatings.deck_slab || 0, parsedRatings.bearings || 0) || null,
      substructure: Math.max(parsedRatings.abutments || 0, parsedRatings.piers || 0, parsedRatings.foundations || 0, parsedRatings.wingwalls || 0) || null,
      roadway: Math.max(parsedRatings.surfacing || 0, parsedRatings.expansion_joints || 0, parsedRatings.footways || 0, parsedRatings.parapets || 0) || null,
      approaches: Math.max(parsedRatings.approaches || 0, parsedRatings.embankment || 0) || null,
      waterway: parsedRatings.waterway || null
    };

    const overall = calculateOverallRating(engineRatings);
    const dc = calculateConditionDeficiency(engineRatings, 15000000); 
    
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
      let c = updated[idx];
      if (!c.LegacyData) c.LegacyData = {};
      RATING_ELEMENTS.forEach(el => {
        c.LegacyData[`${el.id}_rating`] = ratings[el.id];
      });
      c.LegacyData.defects = defectsList;
      
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
        splitArea: { show: true, areaStyle: { color: ['rgba(30, 41, 59, 0.5)', 'rgba(15, 23, 42, 0.5)'] } },
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
          <div className="ent-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.4)' }}>
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
              <div className="ent-card-header"><Activity size={18} color="var(--ent-primary)" /> Condition Categories</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {visibleGroups.map(group => (
                  <div key={group.title} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ent-primary)', marginBottom: '12px', borderBottom: '1px solid var(--ent-border)', paddingBottom: '4px' }}>
                      {group.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {group.elements.map(el => (
                        <div key={el.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px', border: '1px solid var(--ent-border)' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, minWidth: '150px' }}>{el.label}</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              { num: 1, label: 'Good', color: '#22c55e' },
                              { num: 2, label: 'Fair', color: '#eab308' },
                              { num: 3, label: 'Poor', color: '#f97316' },
                              { num: 4, label: 'Severe', color: '#ef4444' }
                            ].map(({ num, label, color }) => (
                              <div 
                                key={num}
                                className={`ent-rating-box ${ratings[el.id] == num ? 'active' : ''}`}
                                style={{ 
                                  padding: '4px 12px', 
                                  background: ratings[el.id] == num ? color : 'transparent',
                                  borderColor: ratings[el.id] == num ? color : 'var(--ent-border)',
                                  color: ratings[el.id] == num ? '#fff' : '#64748b'
                                }}
                                onClick={() => handleRatingSelect(el.id, num)}
                              >
                                {label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ent-card">
              <div className="ent-card-header">Defects & Interventions</div>
              
              <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ent-border)', marginBottom: '24px' }}>
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
                <div style={{ color: 'var(--ent-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '6px' }}>
                  No defects logged.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {defectsList.map((d, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(8, 18, 40, 0.86)', borderRadius: '6px', border: '1px solid var(--ent-border)' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ent-border)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ent-primary)' }}>
                  {results?.category || '-'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>Overall condition</div>
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
