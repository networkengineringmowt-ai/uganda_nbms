import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const CULVERT_RATING_ELEMENTS = [
  { id: 'alignment', label: '1. Barrel Alignment' },
  { id: 'joints', label: '2. Seams & Joints' },
  { id: 'material', label: '3. Barrel Material' },
  { id: 'footings', label: '4. Footings & Scour' },
  { id: 'approaches', label: '5. Approaches' },
  { id: 'roadway', label: '6. Roadway Deck' }
];

export default function CulvertInspectionForm({ culverts = [], onCulvertsUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [ratings, setRatings] = useState({
    alignment: '', joints: '', material: '', footings: '', approaches: '', roadway: ''
  });

  const filteredCulverts = culverts.filter(c => 
    c.CulvertNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.River?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCulvert = (c) => {
    setMessage('');
    setSelectedId(c.CulvertNumber);
    setRatings({
      alignment: c.LegacyData?.alignment_rating ?? '',
      joints: c.LegacyData?.joints_rating ?? '',
      material: c.LegacyData?.material_rating ?? '',
      footings: c.LegacyData?.footings_rating ?? '',
      approaches: c.LegacyData?.approaches_rating ?? '',
      roadway: c.LegacyData?.roadway_rating ?? ''
    });
  };

  const handleRatingSelect = (elId, num) => {
    setRatings(prev => ({ ...prev, [elId]: num }));
  };

  const results = useMemo(() => {
    if (!selectedId) return null;
    const vals = Object.values(ratings).map(v => v === '' || v === undefined ? null : Number(v)).filter(x => x !== null);
    if (vals.length === 0) return { overallRating: null, category: 'Unrated' };
    
    const avg = Math.round(vals.reduce((sum, v) => sum + v, 0) / vals.length);
    let category = 'Unrated';
    if (avg >= 8) category = 'Excellent';
    else if (avg >= 6) category = 'Good';
    else if (avg >= 4) category = 'Fair';
    else if (avg >= 2) category = 'Poor';
    else if (avg >= 0) category = 'Critical';

    return { overallRating: avg, category };
  }, [ratings, selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setMessage('Saving...');
    setIsError(false);

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
        setIsError(true);
      }
    }
  };

  const radarOption = useMemo(() => {
    const values = CULVERT_RATING_ELEMENTS.map(el => ratings[el.id] !== '' ? Number(ratings[el.id]) : 0);
    return {
      radar: {
        indicator: CULVERT_RATING_ELEMENTS.map(el => ({ name: el.label.split('. ')[1], max: 9 })),
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
          name: 'Condition Profile',
          itemStyle: { color: '#8b5cf6' },
          areaStyle: { color: 'rgba(139, 92, 246, 0.2)' },
          lineStyle: { color: '#8b5cf6', width: 2 }
        }]
      }]
    };
  }, [ratings]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* LEFT PANE: List */}
      <div className="ent-sidebar">
        <div className="ent-sidebar-header">Culvert Inspections</div>
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

      {/* CENTER PANE: Main Form */}
      <div className="ent-main">
        {selectedId ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 className="ent-page-title">{culverts.find(c => c.CulvertNumber === selectedId)?.River || selectedId}</h2>
            <p className="ent-page-subtitle">Evaluate structural elements using the 0-9 NBI scale.</p>

            {message && (
              <div className={`ent-alert ${isError ? 'ent-alert-error' : 'ent-alert-success'}`}>
                {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                {message}
              </div>
            )}

            <div className="ent-card">
              <div className="ent-card-header"><Activity size={18} color="var(--ent-primary)" /> Condition Ratings (0-9)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {CULVERT_RATING_ELEMENTS.map(el => (
                  <div key={el.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--ent-border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>{el.label}</div>
                    <div className="ent-rating-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <div 
                          key={num}
                          className={`ent-rating-box ${ratings[el.id] === num ? 'active' : ''}`}
                          onClick={() => handleRatingSelect(el.id, num)}
                          style={ratings[el.id] === num ? { background: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ent-text-muted)' }}>
            <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--ent-text-main)', margin: '0 0 8px 0' }}>Select a Culvert</h3>
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
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>
                  {results?.overallRating !== null ? `${results.overallRating}/9` : '-'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>Avg Rating</div>
              </div>
            </div>

            <div style={{ height: '240px', marginBottom: '24px', marginLeft: '-20px', marginRight: '-20px' }}>
              <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
            </div>

            <button className="ent-btn-primary" onClick={handleSave} style={{ background: '#8b5cf6' }}>
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
