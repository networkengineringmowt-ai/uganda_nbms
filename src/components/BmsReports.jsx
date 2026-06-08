import { useMemo, useState } from 'react';

export default function BmsReports({ bridges = [], onSaveBridge }) {
  const [activeReport, setActiveReport] = useState('validation');
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [printPreviewData, setPrintPreviewData] = useState(null);
  const [unitCost, setUnitCost] = useState(1500000); // UGX per sqm

  // Data Validation Categories
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

  // CRC and CDRC Calculations
  const costSummary = useMemo(() => {
    return bridges.map(b => {
      const length = Number(b.LegacyData?.total_length || 12);
      const width = Number(b.LegacyData?.overall_width || 8);
      const area = length * width;
      const crc = area * unitCost;
      
      const rating = b.LegacyData?.overall_rating != null ? Number(b.LegacyData.overall_rating) : 9;
      // In National Roads BMS, 0 is Beyond Repair and 9 is Excellent.
      // CDRC (Depreciated Cost) = CRC * (9 - Rating) / 9 (higher rating = less depreciation)
      // The manual says: CDRC = (CRC * Condition) / 9. If condition is 9 (Excellent), CDRC = CRC.
      const cdrc = (crc * rating) / 9;

      return {
        number: b.BridgeNumber,
        name: b.BridgeName,
        length,
        width,
        area,
        crc,
        cdrc,
        rating
      };
    });
  }, [bridges, unitCost]);

  const handleToggleCheck = async (bridge) => {
    const updated = {
      ...bridge,
      LegacyData: {
        ...(bridge.LegacyData || {}),
        data_checked: !bridge.LegacyData?.data_checked
      }
    };
    if (onSaveBridge) {
      await onSaveBridge(updated);
    }
  };

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
    <div className="ms-form-tab-container" style={{ height: '100%' }}>
      {/* Tabs */}
      <div className="ms-form-tabs">
        <button 
          className={`ms-form-tab ${activeReport === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveReport('validation')}
        >
          Data Validation
        </button>
        <button 
          className={`ms-form-tab ${activeReport === 'costing' ? 'active' : ''}`}
          onClick={() => setActiveReport('costing')}
        >
          CRC & CDRC Costing
        </button>
        <button 
          className={`ms-form-tab ${activeReport === 'single' ? 'active' : ''}`}
          onClick={() => setActiveReport('single')}
        >
          Structure Reports
        </button>
        {activeReport === 'print' && (
          <button className="ms-form-tab active">
            Print Preview
          </button>
        )}
      </div>

      {/* Body */}
      <div className="ms-form-body">
        {activeReport === 'validation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0a246a' }}>Data Integrity Audits</h3>
            
            <div className="ms-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Unchecked Data */}
              <fieldset className="ms-fieldset">
                <legend>Unchecked Bridge Records ({validationData.unchecked.length})</legend>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
                  <table className="ms-grid-table">
                    <thead>
                      <tr><th>No</th><th>Name</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {validationData.unchecked.map(b => (
                        <tr key={b.BridgeNumber}>
                          <td>{b.BridgeNumber}</td>
                          <td>{b.BridgeName}</td>
                          <td>
                            <button className="ms-btn" style={{ padding: '2px 6px' }} onClick={() => handleToggleCheck(b)}>
                              Check
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              {/* Outstanding Ratings */}
              <fieldset className="ms-fieldset">
                <legend>Outstanding Main Ratings ({validationData.outstandingRatings.length})</legend>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
                  <table className="ms-grid-table">
                    <thead>
                      <tr><th>No</th><th>Name</th><th>Missing Components</th></tr>
                    </thead>
                    <tbody>
                      {validationData.outstandingRatings.slice(0, 50).map(b => {
                        const missing = [];
                        const leg = b.LegacyData || {};
                        if (!leg.approaches_rating) missing.push('Approaches');
                        if (!leg.waterway_rating) missing.push('Waterway');
                        if (!leg.substructure_rating) missing.push('Substructure');
                        if (!leg.superstructure_rating) missing.push('Superstructure');
                        return (
                          <tr key={b.BridgeNumber}>
                            <td>{b.BridgeNumber}</td>
                            <td>{b.BridgeName}</td>
                            <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{missing.join(', ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              {/* No Inspections */}
              <fieldset className="ms-fieldset" style={{ gridColumn: '1 / -1' }}>
                <legend>Bridges with No Inspection Available ({validationData.noInspections.length})</legend>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
                  <table className="ms-grid-table">
                    <thead>
                      <tr><th>Bridge No</th><th>Name</th><th>Road Link</th><th>District</th></tr>
                    </thead>
                    <tbody>
                      {validationData.noInspections.slice(0, 30).map(b => (
                        <tr key={b.BridgeNumber}>
                          <td>{b.BridgeNumber}</td>
                          <td>{b.BridgeName}</td>
                          <td>{b.LinkID} - {b.RoadDescrPrincipal}</td>
                          <td>{b.District}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {activeReport === 'costing' && (
          <div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Unit Replacement Cost (UGX / m²):</label>
              <input 
                type="number" 
                className="ms-input"
                style={{ width: '150px' }}
                value={unitCost} 
                onChange={(e) => setUnitCost(Number(e.target.value))} 
              />
              <button className="ms-btn" onClick={() => handleGeneratePrintPreview('cost')}>
                Print Cost Summary Report
              </button>
            </div>

            <fieldset className="ms-fieldset">
              <legend>Current Replacement Cost (CRC) & Depreciated Cost (CDRC) Summary</legend>
              <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#fff' }} className="ms-bevel-in">
                <table className="ms-grid-table">
                  <thead>
                    <tr>
                      <th>Bridge No</th>
                      <th>Name</th>
                      <th>Area (m²)</th>
                      <th>Condition</th>
                      <th>CRC (UGX)</th>
                      <th>CDRC (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSummary.slice(0, 100).map(row => (
                      <tr key={row.number}>
                        <td>{row.number}</td>
                        <td>{row.name}</td>
                        <td>{row.area.toFixed(1)}</td>
                        <td style={{ fontWeight: 'bold' }}>{row.rating} / 9</td>
                        <td>{Math.round(row.crc).toLocaleString()}</td>
                        <td>{Math.round(row.cdrc).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>
          </div>
        )}

        {activeReport === 'single' && (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#0a246a' }}>Structure Summary Reports</h3>
            
            <fieldset className="ms-fieldset" style={{ maxWidth: '500px' }}>
              <legend>Generate Inventory & Inspection Sheet</legend>
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
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    className="ms-btn" 
                    onClick={() => handleGeneratePrintPreview('bridge')}
                    disabled={!selectedBridgeId}
                  >
                    Generate Report Sheets
                  </button>
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {activeReport === 'print' && printPreviewData && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
              <button className="ms-btn" onClick={() => window.print()}>
                Print to PDF / Printer
              </button>
              <button className="ms-btn" onClick={() => setActiveReport('validation')}>
                Close Preview
              </button>
            </div>

            <div className="ms-print-preview ms-bevel-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 'extrabold', margin: 0 }}>UGANDA NATIONAL ROADS AUTHORITY</h1>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>ASSET MANAGEMENT SYSTEM · BRIDGE MANAGEMENT SECTION</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                  <strong>Date:</strong> {printPreviewData.date}<br />
                  <strong>Database:</strong> Supabase live
                </div>
              </div>

              <h2>{printPreviewData.title}</h2>

              {printPreviewData.type === 'bridge' && (
                <div>
                  <table style={{ width: '100%', marginBottom: '20px', border: '1px solid #000' }}>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold', width: '150px', background: '#f5f5f5' }}>Bridge Number:</td>
                        <td>{printPreviewData.bridge.BridgeNumber}</td>
                        <td style={{ fontWeight: 'bold', width: '150px', background: '#f5f5f5' }}>Bridge Name:</td>
                        <td>{printPreviewData.bridge.BridgeName}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>Principal Feature:</td>
                        <td>{printPreviewData.bridge.RoadDescrPrincipal}</td>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>Link ID:</td>
                        <td>{printPreviewData.bridge.LinkID}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>Latitude:</td>
                        <td>{printPreviewData.bridge.Latitude}</td>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>Longitude:</td>
                        <td>{printPreviewData.bridge.Longitude}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>District / Station:</td>
                        <td>{printPreviewData.bridge.District} / {printPreviewData.bridge.LegacyData?.station || 'N/A'}</td>
                        <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>Overall Condition:</td>
                        <td style={{ fontWeight: 'bold', color: '#0a246a' }}>
                          {printPreviewData.bridge.LegacyData?.overall_rating != null ? `${printPreviewData.bridge.LegacyData.overall_rating} / 9` : 'Unrated'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>INSPECTION CONDITION RATINGS</h3>
                  <table className="ms-grid-table" style={{ width: '100%', border: '1px solid #000' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}><th>Component</th><th>Rating (0-9)</th><th>Descriptor</th></tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Approaches', val: printPreviewData.bridge.LegacyData?.approaches_rating },
                        { label: 'Waterway', val: printPreviewData.bridge.LegacyData?.waterway_rating },
                        { label: 'Substructure', val: printPreviewData.bridge.LegacyData?.substructure_rating },
                        { label: 'Superstructure', val: printPreviewData.bridge.LegacyData?.superstructure_rating },
                        { label: 'Roadway (Deck)', val: printPreviewData.bridge.LegacyData?.roadway_rating },
                        { label: 'Expansion Joints', val: printPreviewData.bridge.LegacyData?.expansion_joints_rating },
                        { label: 'Drainage', val: printPreviewData.bridge.LegacyData?.drainage_rating },
                        { label: 'Traffic Barriers', val: printPreviewData.bridge.LegacyData?.traffic_barriers_rating },
                        { label: 'Guardrails & Railings', val: printPreviewData.bridge.LegacyData?.guardrails_rating },
                        { label: 'Cell Structures / CMP', val: printPreviewData.bridge.LegacyData?.cell_structures_cmp_rating },
                      ].map(r => (
                        <tr key={r.label}>
                          <td style={{ fontWeight: 'bold' }}>{r.label}</td>
                          <td>{r.val != null ? r.val : 'N/A'}</td>
                          <td>
                            {r.val === 9 ? 'Excellent' :
                             r.val === 8 ? 'Very Good' :
                             r.val === 7 ? 'Good' :
                             r.val === 6 ? 'Satisfactory' :
                             r.val === 5 ? 'Fair' :
                             r.val === 4 ? 'Marginal' :
                             r.val === 3 ? 'Poor' :
                             r.val === 2 ? 'Very Poor' :
                             r.val === 1 ? 'Critical' :
                             r.val === 0 ? 'Beyond Repair' : 'Not Inspected'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {printPreviewData.type === 'cost' && (
                <div>
                  <table className="ms-grid-table" style={{ width: '100%', border: '1px solid #000' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th>Bridge No</th>
                        <th>Bridge Name</th>
                        <th>Condition</th>
                        <th>CRC (UGX)</th>
                        <th>CDRC (UGX)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printPreviewData.costData.map(row => (
                        <tr key={row.number}>
                          <td style={{ fontWeight: 'bold' }}>{row.number}</td>
                          <td>{row.name}</td>
                          <td>{row.rating} / 9</td>
                          <td>{Math.round(row.crc).toLocaleString()}</td>
                          <td>{Math.round(row.cdrc).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
