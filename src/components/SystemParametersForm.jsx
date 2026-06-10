import { useState } from 'react';
import { Save, CheckCircle, Settings } from 'lucide-react';

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
    setSavedMessage('Global parameters updated successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const totalWeight = (
    params.conditionWeight + 
    params.verticalClearanceWeight + 
    params.horizontalClearanceWeight + 
    params.alignmentWeight + 
    params.trafficFactorWeight
  ).toFixed(2);

  const isValid = totalWeight === "1.00";

  const renderSlider = (label, name) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-primary-soft)', padding: '2px 8px', borderRadius: '4px' }}>
          {(params[name] * 100).toFixed(0)}%
        </span>
      </div>
      <input 
        type="range" 
        min="0" max="1" step="0.05"
        value={params[name]}
        onChange={(e) => setParams({ ...params, [name]: Number(e.target.value) })}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '24px' }}>
      <div className="panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', display: 'grid', placeItems: 'center', borderRadius: '12px' }}>
            <Settings size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>System Parameters</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Configure global weights for the Deficiency Index Engine</p>
          </div>
        </div>

        {savedMessage && (
          <div style={{
            padding: '12px 16px', marginBottom: '24px', borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
          }}>
            <CheckCircle size={16} /> {savedMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {renderSlider('Bridge Condition Weight', 'conditionWeight')}
            {renderSlider('Vertical Clearance Weight', 'verticalClearanceWeight')}
            {renderSlider('Horizontal Clearance Weight', 'horizontalClearanceWeight')}
            {renderSlider('Approach Roadway Alignment', 'alignmentWeight')}
            {renderSlider('Traffic Demand Weight', 'trafficFactorWeight')}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Validation</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Weight Sum</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: isValid ? 'var(--accent-primary)' : 'var(--accent-red)' }}>
                {totalWeight}
              </span>
            </div>

            {!isValid && (
              <div style={{ color: 'var(--accent-red)', fontSize: '12px', marginBottom: '24px' }}>
                Weights must sum to exactly 1.00 to save configuration. Please adjust the sliders.
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', marginTop: 'auto' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={params.strategicImportanceFactor} 
                  onChange={(e) => setParams({ ...params, strategicImportanceFactor: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Include Strategic Importance Override</span>
              </label>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0 30px' }}>
                If checked, bridges on essential supply routes will automatically get a 10% penalty reduction.
              </p>
            </div>
            
            <button 
              className="modern-btn-primary" 
              onClick={handleSave} 
              disabled={!isValid}
              style={{ marginTop: '32px', gap: '8px', opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
            >
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
