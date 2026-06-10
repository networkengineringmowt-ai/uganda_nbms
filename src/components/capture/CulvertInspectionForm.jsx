import { useState, useMemo } from 'react';
import { saveCulvert } from '../../services/bmsDataService';
import { Search, Save, AlertCircle, CheckCircle, Activity } from 'lucide-react';

const CULVERT_RATING_ELEMENTS = [
  { id: 'alignment', label: '1. Barrel Alignment' },
  { id: 'joints', label: '2. Seams & Joints' },
  { id: 'material', label: '3. Barrel Material (Concrete/Metal)' },
  { id: 'footings', label: '4. Footings & Invert Scour' },
  { id: 'approaches', label: '5. Approaches Alignment' },
  { id: 'roadway', label: '6. Roadway Surface / Deck' }
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
    
    // Average rating for culverts
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
              <div className="slp-item-meta">{c.Road}</div>
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
                <h2>Culvert {selectedId}</h2>
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

                <div>
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-primary)' }}>Component Ratings (0-9)</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {CULVERT_RATING_ELEMENTS.map(comp => (
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
              </div>

              {/* Sidebar Results */}
              <div style={{ width: '280px', borderLeft: '1px solid var(--border-light)', paddingLeft: '32px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Real-time Analysis</h4>
                
                {results && results.overallRating !== null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>AVERAGE CONDITION RATING</div>
                      <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{results.overallRating}<span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>/9</span></div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-primary)', marginTop: '12px' }}>
                        {results.category}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Incomplete ratings. Fill all components to calculate overall score.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Culvert Selected</h3>
              <p>Select a culvert from the list to record inspection data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
