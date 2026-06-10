import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, AlertCircle, CheckCircle, Activity, Plus } from 'lucide-react';
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
    // 0-9 scale. Reverse it for radar visual weight (0 is worst, 9 is best, so we want a big radar shape for good condition)
    // Wait, the user is used to a standard radar. Let's just plot the 0-9 scale directly.
    const values = CULVERT_RATING_ELEMENTS.map(el => ratings[el.id] !== '' ? Number(ratings[el.id]) : 0);
    return {
      radar: {
        indicator: CULVERT_RATING_ELEMENTS.map(el => ({ name: el.label.split('. ')[1], max: 9 })),
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
          itemStyle: { color: '#b500ff' },
          areaStyle: { color: 'rgba(181, 0, 255, 0.4)' },
          lineStyle: { color: '#b500ff', width: 2 }
        }]
      }]
    };
  }, [ratings]);

  return (
    <div className="capture-workspace">
      {/* Sidebar List */}
      <div className="capture-sidebar">
        <div className="capture-sidebar-header">
          <div style={{ color: 'var(--cap-neon-purple)', fontWeight: 900, fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} /> Culvert Inspections
          </div>
          <div className="capture-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
            <Search size={16} color="var(--cap-text-muted)" />
            <input 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              placeholder="Search Culvert..." 
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
              <div className="capture-item-sub">{c.River || 'Unnamed Stream'}</div>
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
                <h2 className="capture-title" style={{ background: 'linear-gradient(90deg, var(--cap-neon-purple), var(--cap-neon-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {culverts.find(c => c.CulvertNumber === selectedId)?.River || selectedId}
                </h2>
                <div style={{ color: 'var(--cap-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Evaluate culvert structural elements using the 0-9 NBI condition scale.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--cap-border)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--cap-neon-purple)', fontWeight: 900, fontSize: '24px' }}>
                      {results?.overallRating !== null ? `${results.overallRating}/9` : 'N/A'}
                    </div>
                    <div style={{ color: 'var(--cap-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Avg Rating</div>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: 'var(--cap-border)' }}></div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '16px', textTransform: 'uppercase' }}>
                      {results?.category || 'Unrated'}
                    </div>
                    <div style={{ color: 'var(--cap-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Classification</div>
                  </div>
                </div>
                <button className="cap-btn-primary" onClick={handleSave} style={{ background: 'var(--cap-neon-purple)', boxShadow: '0 4px 15px rgba(181, 0, 255, 0.3)' }}>
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

              <div className="capture-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                
                {/* Ratings Form Card */}
                <div className="capture-card" style={{ gridColumn: '1' }}>
                  <h3 className="capture-card-title"><Activity size={20} color="var(--cap-neon-purple)" /> Element Condition Ratings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {CULVERT_RATING_ELEMENTS.map(el => (
                      <div key={el.id}>
                        <div className="capture-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{el.label}</span>
                          <span style={{ color: 'var(--cap-neon-blue)' }}>{ratings[el.id] !== '' ? ratings[el.id] : '-'}</span>
                        </div>
                        <div className="rating-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <div 
                              key={num}
                              className={`rating-box ${ratings[el.id] === num ? 'active' : ''}`}
                              onClick={() => handleRatingSelect(el.id, num)}
                              style={{ 
                                padding: '8px 0', 
                                fontSize: '14px',
                                borderColor: ratings[el.id] === num ? 'var(--cap-neon-purple)' : 'var(--cap-border)',
                                color: ratings[el.id] === num ? '#fff' : 'var(--cap-text-muted)',
                                background: ratings[el.id] === num ? 'var(--cap-neon-purple)' : 'var(--cap-bg-input)',
                                boxShadow: ratings[el.id] === num ? '0 0 10px var(--cap-neon-purple)' : 'none'
                              }}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar Chart Card */}
                <div className="capture-card">
                  <h3 className="capture-card-title">Condition Radar</h3>
                  <div style={{ height: '380px', margin: '-20px' }}>
                    <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--cap-border)' }}>
                    <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '14px' }}>Scale Guide</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--cap-text-muted)' }}>
                      <div><strong style={{ color: 'var(--cap-neon-green)' }}>7-9:</strong> Good to Excellent Condition</div>
                      <div><strong style={{ color: 'var(--cap-neon-orange)' }}>5-6:</strong> Fair Condition (Minor deterioration)</div>
                      <div><strong style={{ color: 'var(--cap-neon-pink)' }}>0-4:</strong> Poor to Critical Condition</div>
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
                <Activity size={40} color="var(--cap-neon-purple)" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '24px', margin: '0 0 12px 0' }}>Culvert Inspection Hub</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.6' }}>Select a culvert to perform an NBI structural condition inspection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
