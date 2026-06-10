import { useMemo, useState } from 'react';
import { FileText, Printer, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function BmsReports({ bridges = [], culverts = [] }) {
  const [activeReport, setActiveReport] = useState('validation');
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [printPreviewData, setPrintPreviewData] = useState(null);
  const [unitCost, setUnitCost] = useState(1500000); 

  const validationData = useMemo(() => {
    const unchecked = bridges.filter(b => !b.LegacyData?.data_checked);
    const checked = bridges.filter(b => b.LegacyData?.data_checked);
    
    const outstandingRatings = bridges.filter(b => {
      const legacy = b.LegacyData || {};
      return !legacy.approaches_rating || !legacy.waterway_rating || !legacy.substructure_rating || !legacy.superstructure_rating;
    });

    const noInspections = bridges.filter(b => {
      const legacy = b.LegacyData || {};
      const ratings = ['approaches', 'waterway', 'substructure', 'superstructure', 'roadway', 'expansion_joints', 'drainage', 'traffic_barriers', 'guardrails'];
      return ratings.every(r => !legacy[`${r}_rating`]);
    });

    return { unchecked, checked, outstandingRatings, noInspections };
  }, [bridges]);

  const costSummary = useMemo(() => {
    return bridges.map(b => {
      const length = Number(b.LegacyData?.total_length || 12);
      const width = Number(b.LegacyData?.overall_width || 8);
      const area = length * width;
      const crc = area * unitCost;
      const rating = b.LegacyData?.overall_rating != null ? Number(b.LegacyData.overall_rating) : 9;
      const cdrc = (crc * rating) / 9;

      return {
        number: b.BridgeNumber, name: b.BridgeName,
        length, width, area, crc, cdrc, rating
      };
    });
  }, [bridges, unitCost]);

  const handleGeneratePrintPreview = (type) => {
    if (type === 'bridge' && selectedBridgeId) {
      const b = bridges.find(x => x.BridgeNumber === selectedBridgeId);
      if (b) {
        setPrintPreviewData({
          type: 'bridge',
          title: `BRIDGE INVENTORY & RATING REPORT - ${b.BridgeNumber}`,
          bridge: b,
          date: new Date().toLocaleDateString()
        });
        setActiveReport('print');
      }
    } else if (type === 'cost') {
      setPrintPreviewData({
        type: 'cost',
        title: 'NETWORK Current Replacement Cost (CRC) & Depreciated Cost (CDRC) Summary',
        costData: costSummary,
        date: new Date().toLocaleDateString()
      });
      setActiveReport('print');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', display: 'grid', placeItems: 'center', borderRadius: '12px' }}>
          <FileText size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Reports & Audits</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Data integrity checks, financial valuations, and printable exports.</p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '8px' }}>
        <button 
          onClick={() => setActiveReport('validation')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeReport === 'validation' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeReport === 'validation' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: activeReport === 'validation' ? 700 : 500, cursor: 'pointer', fontSize: '13px' }}
        >
          Data Validation
        </button>
        <button 
          onClick={() => setActiveReport('costing')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeReport === 'costing' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeReport === 'costing' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: activeReport === 'costing' ? 700 : 500, cursor: 'pointer', fontSize: '13px' }}
        >
          Financial Valuation (CRC)
        </button>
        <button 
          onClick={() => setActiveReport('single')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeReport === 'single' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeReport === 'single' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: activeReport === 'single' ? 700 : 500, cursor: 'pointer', fontSize: '13px' }}
        >
          Print Structure Reports
        </button>
        {activeReport === 'print' && (
          <button style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent-amber)', color: 'var(--accent-amber)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
            Print Preview
          </button>
        )}
      </div>

      <div className="modern-scroll" style={{ height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
        
        {activeReport === 'validation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-red)' }}>
                <AlertCircle size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Unchecked Records ({validationData.unchecked.length})</h3>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {validationData.unchecked.slice(0, 100).map(b => (
                  <div key={b.BridgeNumber} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{b.BridgeNumber}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{b.BridgeName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-amber)' }}>
                <AlertCircle size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Missing Core Ratings ({validationData.outstandingRatings.length})</h3>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {validationData.outstandingRatings.slice(0, 100).map(b => (
                  <div key={b.BridgeNumber} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{b.BridgeNumber}</span>
                    <span style={{ color: 'var(--accent-amber)', fontSize: '11px', fontWeight: 700 }}>NEEDS INSPECTION</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeReport === 'costing' && (
          <div className="panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ padding: '24px', background: 'rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Current Replacement Cost & Depreciated Cost</h2>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit Cost (UGX/m²)</label>
                  <input 
                    type="number" 
                    className="toolbar-search" style={{ height: '36px', borderRadius: '8px', width: '200px' }}
                    value={unitCost} 
                    onChange={(e) => setUnitCost(Number(e.target.value))} 
                  />
                  <button className="modern-btn-primary" onClick={() => handleGeneratePrintPreview('cost')} style={{ height: '36px', padding: '0 16px', gap: '8px' }}>
                    <Printer size={14} /> Print Summary
                  </button>
                </div>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Bridge #</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Area (m²)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Condition</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>CRC (UGX)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>CDRC (UGX)</th>
                </tr>
              </thead>
              <tbody>
                {costSummary.slice(0, 50).map(row => (
                  <tr key={row.number} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{row.number}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{row.name}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>{row.area.toFixed(1)}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700 }}>{row.rating} / 9</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>{Math.round(row.crc).toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>{Math.round(row.cdrc).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'single' && (
          <div className="panel" style={{ padding: '32px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '24px' }}>Generate PDF Inspection Sheet</h3>
            <div className="modern-filter-field" style={{ marginBottom: '24px' }}>
              <label>Select Bridge Structure</label>
              <div className="modern-select-wrapper">
                <select 
                  value={selectedBridgeId}
                  onChange={(e) => setSelectedBridgeId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.02)', color: 'var(--text-primary)', height: '48px' }}
                >
                  <option value="">-- Choose Bridge --</option>
                  {bridges.map(b => (
                    <option key={b.BridgeNumber} value={b.BridgeNumber}>
                      {b.BridgeNumber} - {b.BridgeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              className="modern-btn-primary" 
              onClick={() => handleGeneratePrintPreview('bridge')}
              disabled={!selectedBridgeId}
              style={{ width: '100%', gap: '8px', opacity: !selectedBridgeId ? 0.5 : 1 }}
            >
              <Printer size={16} /> Generate Report PDF
            </button>
          </div>
        )}

        {activeReport === 'print' && printPreviewData && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '24px' }}>
              <button className="modern-btn-secondary" onClick={() => setActiveReport('validation')} style={{ width: '150px' }}>
                Close Preview
              </button>
              <button className="modern-btn-primary" onClick={() => window.print()} style={{ width: '150px', gap: '8px' }}>
                <Printer size={16} /> Print Document
              </button>
            </div>

            <div className="panel" style={{ padding: '48px', background: '#fff', color: '#000', borderRadius: '4px', border: '1px solid #ccc', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px double #000', paddingBottom: '16px', marginBottom: '32px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>MINISTRY OF WORKS AND TRANSPORT (MoWT)</h1>
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>DEPARTMENT OF NATIONAL ROADS · BRIDGE MANAGEMENT SYSTEM</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  <strong>Date Issued:</strong> {printPreviewData.date}<br />
                  <strong>Data Source:</strong> Verified Supabase API
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>{printPreviewData.title}</h2>

              {printPreviewData.type === 'bridge' && (
                <div>
                  <table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, width: '200px', background: '#f8f9fa' }}>Bridge Number:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 600 }}>{printPreviewData.bridge.BridgeNumber}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, width: '200px', background: '#f8f9fa' }}>Bridge Name:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 600 }}>{printPreviewData.bridge.BridgeName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, background: '#f8f9fa' }}>Principal Feature:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{printPreviewData.bridge.RoadDescrPrincipal}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, background: '#f8f9fa' }}>Link ID:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{printPreviewData.bridge.LinkID}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, background: '#f8f9fa' }}>District:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{printPreviewData.bridge.District}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700, background: '#f8f9fa' }}>Overall Condition Index:</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 800 }}>
                          {printPreviewData.bridge.LegacyData?.overall_rating != null ? `${printPreviewData.bridge.LegacyData.overall_rating} / 9` : 'Unrated'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>COMPONENT INSPECTION RATINGS</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Component</th>
                        <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>Rating (0-9)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Approaches', val: printPreviewData.bridge.LegacyData?.approaches_rating },
                        { label: 'Waterway', val: printPreviewData.bridge.LegacyData?.waterway_rating },
                        { label: 'Substructure', val: printPreviewData.bridge.LegacyData?.substructure_rating },
                        { label: 'Superstructure', val: printPreviewData.bridge.LegacyData?.superstructure_rating },
                        { label: 'Roadway (Deck)', val: printPreviewData.bridge.LegacyData?.roadway_rating },
                        { label: 'Expansion Joints', val: printPreviewData.bridge.LegacyData?.expansion_joints_rating },
                        { label: 'Drainage', val: printPreviewData.bridge.LegacyData?.drainage_rating }
                      ].map(r => (
                        <tr key={r.label}>
                          <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 600 }}>{r.label}</td>
                          <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{r.val != null ? r.val : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {printPreviewData.type === 'cost' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Bridge No</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>Condition</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>CRC (UGX)</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>CDRC (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printPreviewData.costData.map(row => (
                      <tr key={row.number}>
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 700 }}>{row.number}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{row.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>{row.rating} / 9</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{Math.round(row.crc).toLocaleString()}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 600 }}>{Math.round(row.cdrc).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
