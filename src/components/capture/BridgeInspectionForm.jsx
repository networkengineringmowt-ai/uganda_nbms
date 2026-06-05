import React, { useState, useEffect, useCallback } from 'react';
import { Save, Calculator } from 'lucide-react';
import { calculateOverallRating, calculateConditionDeficiency, getConditionCategory } from '../../utils/rankingEngine';
import { supabase } from '../../utils/supabaseClient';

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
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [ratings, setRatings] = useState({});
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('');

  const handleSelectBridge = (e) => {
    const id = e.target.value;
    setSelectedBridgeId(id);
    if (id) {
      const bridge = bridges.find(b => b.BridgeNumber === id);
      if (bridge && bridge.LegacyData) {
        const initialRatings = {};
        RATING_ELEMENTS.forEach(el => {
          initialRatings[el.id] = bridge.LegacyData[`${el.id}_rating`] ?? '';
        });
        setRatings(initialRatings);
        setResults({
          overallRating: bridge.LegacyData.overall_rating,
          deficiencyIndex: bridge.LegacyData.deficiency_index,
          category: bridge.LegacyData.overall_rating != null ? getConditionCategory(bridge.LegacyData.overall_rating) : 'N/A'
        });
      } else {
        const resetRatings = {};
        RATING_ELEMENTS.forEach(el => resetRatings[el.id] = '');
        setRatings(resetRatings);
        setResults(null);
      }
    }
  };

  const handleChange = (e) => {
    setRatings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCalculate = useCallback(() => {
    const parsedRatings = {};
    RATING_ELEMENTS.forEach(el => {
      parsedRatings[el.id] = ratings[el.id] === '' || ratings[el.id] === undefined ? null : Number(ratings[el.id]);
    });

    const overall = calculateOverallRating(parsedRatings);
    const dc = calculateConditionDeficiency(parsedRatings, 1000); // 1000 is dummy replacement value
    
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
      
      RATING_ELEMENTS.forEach(el => {
        b.LegacyData[`${el.id}_rating`] = ratings[el.id] === '' || ratings[el.id] === undefined ? null : Number(ratings[el.id]);
      });
      
      if (results && results.overallRating != null) {
        b.LegacyData.overall_rating = results.overallRating;
        b.LegacyData.deficiency_index = results.deficiencyIndex;
      }
      
      updatedBridges[idx] = b;
      
      try {
        const { error } = await supabase
          .from('bridges')
          .upsert({ id: b.BridgeNumber, data: b });

        if (error) throw error;
        
        setMessage('Inspection saved to Supabase successfully!');
        if (onBridgesUpdate) onBridgesUpdate(updatedBridges);
      } catch (err) {
        setMessage(`Supabase Sync Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '1000px' }}>
      <h3 className="card-title">Comprehensive Bridge Inspection (Condition Ratings)</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <select 
          className="slp-search-input" 
          style={{ width: '400px' }}
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
            
            <div className="bdc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {RATING_ELEMENTS.map(comp => (
                <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                  <label className="bdc-label" style={{ margin: 0 }}>{comp.label}</label>
                  <input 
                    type="number" 
                    min="0" max="9"
                    className="slp-search-input" 
                    style={{ width: '70px', textAlign: 'center', padding: '6px' }}
                    name={comp.id} 
                    value={ratings[comp.id] !== undefined ? ratings[comp.id] : ''} 
                    onChange={handleChange} 
                  />
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="nav-tab active" onClick={handleSave}>
                <Save size={16} /> Save Inspection Data
              </button>
            </div>
            {message && <span style={{ color: message.includes('Error') || message.includes('Failed') ? '#ff5252' : '#00e676', fontSize: '0.85rem' }}>{message}</span>}
          </div>
          
          <div style={{ width: '300px', background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 20px 0', color: 'var(--accent-cyan)' }}>Live Calculated Results</h4>
            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div className="bdc-label" style={{ marginBottom: '8px' }}>Overall Rating</div>
                  <div className="kpi-value" style={{ fontSize: '2.5rem', margin: 0 }}>{results.overallRating != null ? results.overallRating : 'N/A'} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/ 9</span></div>
                  <div style={{ color: 'var(--accent-purple)', fontWeight: 'bold', marginTop: '4px' }}>{results.category}</div>
                </div>
                <div>
                  <div className="bdc-label" style={{ marginBottom: '8px' }}>Condition Deficiency Index (DC)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{results.deficiencyIndex != null ? results.deficiencyIndex.toFixed(1) : 'N/A'}</div>
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
