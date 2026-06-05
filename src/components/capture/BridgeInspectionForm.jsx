import React, { useState, useEffect, useCallback } from 'react';
import { Save, Calculator } from 'lucide-react';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';

export default function BridgeInspectionForm({ bridges = [], onBridgesUpdate }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [ratings, setRatings] = useState({
    approaches: '',
    waterway: '',
    substructure: '',
    superstructure: '',
    roadway: ''
  });
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('');

  const handleSelectBridge = (e) => {
    const id = e.target.value;
    setSelectedBridgeId(id);
    if (id) {
      const bridge = bridges.find(b => b.BridgeNumber === id);
      if (bridge && bridge.LegacyData) {
        setRatings({
          approaches: bridge.LegacyData.approaches_rating ?? '',
          waterway: bridge.LegacyData.waterway_rating ?? '',
          substructure: bridge.LegacyData.substructure_rating ?? '',
          superstructure: bridge.LegacyData.superstructure_rating ?? '',
          roadway: bridge.LegacyData.roadway_rating ?? ''
        });
        setResults({
          overallRating: bridge.LegacyData.overall_rating,
          deficiencyIndex: bridge.LegacyData.deficiency_index,
          category: getConditionCategory(bridge.LegacyData.overall_rating)
        });
      } else {
        setRatings({ approaches: '', waterway: '', substructure: '', superstructure: '', roadway: '' });
        setResults(null);
      }
    }
  };

  const handleChange = (e) => {
    setRatings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCalculate = useCallback(() => {
    const parsedRatings = {
      approaches: ratings.approaches === '' ? null : Number(ratings.approaches),
      waterway: ratings.waterway === '' ? null : Number(ratings.waterway),
      substructure: ratings.substructure === '' ? null : Number(ratings.substructure),
      superstructure: ratings.superstructure === '' ? null : Number(ratings.superstructure),
      roadway: ratings.roadway === '' ? null : Number(ratings.roadway),
    };

    const overall = calculateOverallRating(parsedRatings);
    const dc = calculateConditionDeficiency(parsedRatings, 1000); 
    
    setResults({
      overallRating: overall,
      deficiencyIndex: dc,
      category: getConditionCategory(overall)
    });
  }, [ratings]);

  useEffect(() => {
    if (selectedBridgeId) {
      handleCalculate();
    }
  }, [ratings, selectedBridgeId, handleCalculate]);

  const handleSave = async () => {
    if (!selectedBridgeId) return;
    setMessage('Saving...');
    
    // Calculate final stats before saving
    handleCalculate();
    
    let updatedBridges = [...bridges];
    const idx = updatedBridges.findIndex(b => b.BridgeNumber === selectedBridgeId);
    
    if (idx > -1) {
      const b = updatedBridges[idx];
      b.LegacyData = b.LegacyData || {};
      b.LegacyData.approaches_rating = ratings.approaches === '' ? null : Number(ratings.approaches);
      b.LegacyData.waterway_rating = ratings.waterway === '' ? null : Number(ratings.waterway);
      b.LegacyData.substructure_rating = ratings.substructure === '' ? null : Number(ratings.substructure);
      b.LegacyData.superstructure_rating = ratings.superstructure === '' ? null : Number(ratings.superstructure);
      b.LegacyData.roadway_rating = ratings.roadway === '' ? null : Number(ratings.roadway);
      
      if (results && results.overallRating != null) {
        b.LegacyData.overall_rating = results.overallRating;
        b.LegacyData.deficiency_index = results.deficiencyIndex;
      }
      
      updatedBridges[idx] = b;
      
      try {
        const res = await fetch('http://localhost:3001/api/bridges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBridges)
        });
        if (res.ok) {
          setMessage('Inspection ratings saved successfully!');
          if (onBridgesUpdate) onBridgesUpdate(updatedBridges);
        } else {
          setMessage('Failed to save.');
        }
      } catch (err) {
        setMessage('Error connecting to backend.');
      }
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px' }}>
      <h3 className="card-title">Bridge Inspection (Condition Ratings)</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <select 
          className="slp-search-input" 
          style={{ width: '300px' }}
          value={selectedBridgeId}
          onChange={handleSelectBridge}
        >
          <option value="">-- Select a Bridge --</option>
          {bridges.map(b => (
            <option key={b.BridgeNumber} value={b.BridgeNumber}>
              {b.BridgeNumber} - {b.BridgeName}
            </option>
          ))}
        </select>
      </div>

      {selectedBridgeId && (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter ratings from 0 (Beyond Repair) to 9 (Excellent). Leave blank if N/A.</p>
            
            {['approaches', 'waterway', 'substructure', 'superstructure', 'roadway'].map(comp => (
              <div key={comp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="bdc-label" style={{ textTransform: 'capitalize' }}>{comp}</label>
                <input 
                  type="number" 
                  min="0" max="9"
                  className="slp-search-input" 
                  style={{ width: '80px', textAlign: 'center' }}
                  name={comp} 
                  value={ratings[comp]} 
                  onChange={handleChange} 
                />
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="nav-tab active" onClick={handleSave}>
                <Save size={16} /> Save Inspection
              </button>
            </div>
            {message && <span style={{ color: message.includes('Error') || message.includes('Failed') ? '#ff5252' : '#00e676', fontSize: '0.85rem' }}>{message}</span>}
          </div>
          
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--accent-cyan)' }}>Calculated Results</h4>
            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div className="bdc-label">Overall Rating</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>{results.overallRating != null ? results.overallRating : 'N/A'} / 9</div>
                  <div style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{results.category}</div>
                </div>
                <div>
                  <div className="bdc-label">Condition Deficiency Index (DC)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{results.deficiencyIndex != null ? results.deficiencyIndex.toFixed(1) : 'N/A'}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a bridge to see results.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
