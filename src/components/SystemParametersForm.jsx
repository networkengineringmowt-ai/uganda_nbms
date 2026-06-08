import { useState } from 'react';

export default function SystemParametersForm() {
  const [params, setParams] = useState({
    conditionWeight: 0.50,
    verticalClearanceWeight: 0.15,
    horizontalClearanceWeight: 0.15,
    alignmentWeight: 0.10,
    trafficFactorWeight: 0.10,
    strategicImportanceFactor: true
  });

  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = () => {
    setSavedMessage('Parameters updated successfully!');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>System Parameters</h3>
      
      <fieldset className="ms-fieldset" style={{ maxWidth: '600px' }}>
        <legend>Deficiency Index Formula Weights</legend>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontStyle: 'italic', color: '#005a5b', marginBottom: '10px' }}>
            Adjust the weights used to calculate the Deficiency Index. The sum of all weights must equal 1.0 (100%).
          </p>

          <div className="ms-form-row">
            <label>Bridge Condition Weight:</label>
            <input 
              type="number" 
              step="0.05"
              min="0" max="1"
              className="ms-input"
              value={params.conditionWeight} 
              onChange={(e) => setParams({ ...params, conditionWeight: Number(e.target.value) })}
            />
          </div>

          <div className="ms-form-row">
            <label>Vertical Clearance Weight:</label>
            <input 
              type="number" 
              step="0.05"
              min="0" max="1"
              className="ms-input"
              value={params.verticalClearanceWeight} 
              onChange={(e) => setParams({ ...params, verticalClearanceWeight: Number(e.target.value) })}
            />
          </div>

          <div className="ms-form-row">
            <label>Horizontal Clearance Weight:</label>
            <input 
              type="number" 
              step="0.05"
              min="0" max="1"
              className="ms-input"
              value={params.horizontalClearanceWeight} 
              onChange={(e) => setParams({ ...params, horizontalClearanceWeight: Number(e.target.value) })}
            />
          </div>

          <div className="ms-form-row">
            <label>Approach Roadway Alignment:</label>
            <input 
              type="number" 
              step="0.05"
              min="0" max="1"
              className="ms-input"
              value={params.alignmentWeight} 
              onChange={(e) => setParams({ ...params, alignmentWeight: Number(e.target.value) })}
            />
          </div>

          <div className="ms-form-row">
            <label>Traffic Demand Weight:</label>
            <input 
              type="number" 
              step="0.05"
              min="0" max="1"
              className="ms-input"
              value={params.trafficFactorWeight} 
              onChange={(e) => setParams({ ...params, trafficFactorWeight: Number(e.target.value) })}
            />
          </div>

          <div className="ms-form-row" style={{ marginTop: '10px' }}>
            <label style={{ width: '180px' }}>Consider Strategic Importance:</label>
            <input 
              type="checkbox" 
              className="ms-checkbox"
              checked={params.strategicImportanceFactor} 
              onChange={(e) => setParams({ ...params, strategicImportanceFactor: e.target.checked })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', borderTop: '1px solid #808080', paddingTop: '12px' }}>
            {savedMessage && <span style={{ color: '#005a5b', alignSelf: 'center', fontWeight: 'bold' }}>{savedMessage}</span>}
            <button className="ms-btn" onClick={handleSave}>
              Save Variables
            </button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
