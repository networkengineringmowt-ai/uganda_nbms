import { useState } from 'react';

export default function UpgradeBridgesForm({ bridges = [] }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [upgradesList, setUpgradesList] = useState([
    { bridgeNo: 'B001', date: '12/04/2024', desc: 'Deck expansion joint reseal and approach resurfacing', ref: 'MoWT/WKS/23-24/09', budget: 120000000, hasReport: 'Yes' },
    { bridgeNo: 'B004', date: '05/09/2025', desc: 'Wingwall stabilization and substructure crack injection', ref: 'MoWT/WKS/24-25/12', budget: 85000000, hasReport: 'No' },
    { bridgeNo: 'B042', date: '18/02/2026', desc: 'Full rehabilitation of superstructure, replacement of bearings', ref: 'MoWT/WKS/25-26/01', budget: 450000000, hasReport: 'Yes' }
  ]);

  const [formData, setFormData] = useState({
    date: '',
    desc: '',
    ref: '',
    budget: '',
    hasReport: 'No'
  });

  const handleAddUpgrade = () => {
    if (!selectedBridgeId || !formData.date || !formData.desc) return;
    
    setUpgradesList(prev => [
      ...prev,
      {
        bridgeNo: selectedBridgeId,
        date: formData.date,
        desc: formData.desc,
        ref: formData.ref,
        budget: Number(formData.budget || 0),
        hasReport: formData.hasReport
      }
    ]);
    
    setFormData({
      date: '',
      desc: '',
      ref: '',
      budget: '',
      hasReport: 'No'
    });
  };

  return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>Upgrade of Bridges</h3>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Form fields */}
        <fieldset className="ms-fieldset" style={{ width: '400px', flexShrink: 0 }}>
          <legend>Enter Rehabilitation/Upgrade Record</legend>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="ms-form-row">
              <label>Select Bridge:</label>
              <div className="ms-select-container">
                <select 
                  className="ms-select"
                  value={selectedBridgeId}
                  onChange={(e) => setSelectedBridgeId(e.target.value)}
                >
                  <option value="">-- Choose Bridge --</option>
                  {bridges.map(b => (
                    <option key={b.BridgeNumber} value={b.BridgeNumber}>
                      {b.BridgeNumber} - {b.BridgeName}
                    </option>
                  ))}
                </select>
                <div className="ms-select-arrow">▼</div>
              </div>
            </div>

            <div className="ms-form-row">
              <label>Date of Upgrade:</label>
              <input 
                type="text" 
                placeholder="dd/MM/yyyy"
                className="ms-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="ms-form-row">
              <label>Reference #:</label>
              <input 
                type="text" 
                className="ms-input"
                value={formData.ref}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
              />
            </div>

            <div className="ms-form-row">
              <label>Budget (UGX):</label>
              <input 
                type="number" 
                className="ms-input"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>

            <div className="ms-form-row">
              <label>Description:</label>
              <textarea 
                className="ms-textarea"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              />
            </div>

            <div className="ms-form-row">
              <label>Has Summary Report:</label>
              <div className="ms-select-container" style={{ width: '80px', flex: 'none' }}>
                <select 
                  className="ms-select"
                  value={formData.hasReport}
                  onChange={(e) => setFormData({ ...formData, hasReport: e.target.value })}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <div className="ms-select-arrow">▼</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                className="ms-btn" 
                onClick={handleAddUpgrade}
                disabled={!selectedBridgeId || !formData.date || !formData.desc}
              >
                Add Upgrade Record
              </button>
            </div>
          </div>
        </fieldset>

        {/* Existing records grid */}
        <fieldset className="ms-fieldset" style={{ flex: 1 }}>
          <legend>Active Upgrades Dataset</legend>
          
          <div style={{ maxHeight: '280px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
            <table className="ms-grid-table">
              <thead>
                <tr>
                  <th>Bridge #</th>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Budget (UGX)</th>
                  <th>Upgrade Description</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {upgradesList.map((row, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{row.bridgeNo}</td>
                    <td>{row.date}</td>
                    <td>{row.ref || 'N/A'}</td>
                    <td>{row.budget.toLocaleString()}</td>
                    <td>{row.desc}</td>
                    <td>{row.hasReport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>

      </div>
    </div>
  );
}
