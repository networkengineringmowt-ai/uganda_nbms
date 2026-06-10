import { useState, useEffect } from 'react';
import { Save, FilePlus, ArrowUpCircle } from 'lucide-react';
import { fetchBridgeWorks } from '../services/bmsDataService';

export default function UpgradeBridgesForm({ bridges = [] }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [upgradesList, setUpgradesList] = useState([]);

  useEffect(() => {
    fetchBridgeWorks().then(data => {
      // Data might have "bridge", "financial_status", "status"
      const mapped = data.map(item => ({
        bridgeNo: item.bridge,
        date: 'Active',
        desc: item.status?.slice(0, 100) + '...',
        ref: item.funder,
        budget: item.financial_status?.split('\n')[0] || item.financial_status || '0',
        hasReport: 'Yes'
      }));
      setUpgradesList(mapped);
    }).catch(err => console.error("Failed to fetch bridge works:", err));
  }, []);

  const [formData, setFormData] = useState({
    date: '', desc: '', ref: '', budget: '', hasReport: 'No'
  });

  const handleAddUpgrade = () => {
    if (!selectedBridgeId || !formData.date || !formData.desc) return;
    
    setUpgradesList(prev => [
      {
        bridgeNo: selectedBridgeId,
        date: formData.date,
        desc: formData.desc,
        ref: formData.ref,
        budget: Number(formData.budget || 0),
        hasReport: formData.hasReport
      },
      ...prev
    ]);
    
    setFormData({ date: '', desc: '', ref: '', budget: '', hasReport: 'No' });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', display: 'grid', placeItems: 'center', borderRadius: '12px' }}>
          <ArrowUpCircle size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Bridge Upgrades</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Record and track historical and planned rehabilitation projects.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        
        {/* Left Form */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Record New Upgrade</h3>

          <div className="modern-filter-field">
            <label>Select Bridge</label>
            <div className="modern-select-wrapper">
              <select 
                value={selectedBridgeId}
                onChange={(e) => setSelectedBridgeId(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.02)', color: 'var(--text-primary)', height: '40px' }}
              >
                <option value="">-- Choose Bridge --</option>
                {bridges.map(b => (
                  <option key={b.BridgeNumber} value={b.BridgeNumber}>
                    {b.BridgeNumber} - {b.BridgeName || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modern-filter-field">
            <label>Date of Upgrade</label>
            <input 
              type="date" 
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Reference #</label>
            <input 
              type="text" placeholder="e.g. MoWT/WKS/26-27/01"
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.ref} onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Budget (UGX)</label>
            <input 
              type="number" placeholder="Enter amount..."
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Description</label>
            <textarea 
              placeholder="Describe the scope of works..."
              className="toolbar-search" style={{ height: '80px', borderRadius: '8px', width: '100%', padding: '12px', resize: 'vertical' }}
              value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Has Summary Report?</label>
            <div className="modern-select-wrapper">
              <select 
                value={formData.hasReport}
                onChange={(e) => setFormData({ ...formData, hasReport: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.02)', color: 'var(--text-primary)', height: '40px' }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <button 
            className="modern-btn-primary" 
            onClick={handleAddUpgrade}
            disabled={!selectedBridgeId || !formData.date || !formData.desc}
            style={{ marginTop: '16px', gap: '8px', opacity: (!selectedBridgeId || !formData.date || !formData.desc) ? 0.5 : 1 }}
          >
            <Save size={16} /> Save Record
          </button>
        </div>

        {/* Right Table */}
        <div className="panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Dataset</div>
              <h2>Active Upgrades</h2>
            </div>
          </div>
          
          <div className="modern-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Bridge #</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Reference</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Description</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Budget (UGX)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {upgradesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <FilePlus size={32} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                      No upgrades recorded yet.
                    </td>
                  </tr>
                ) : upgradesList.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{row.bridgeNo}</td>
                    <td style={{ padding: '16px 24px' }}>{row.date}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{row.ref || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', maxWidth: '300px' }}>{row.desc}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>{row.budget.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {row.hasReport === 'Yes' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>YES</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
