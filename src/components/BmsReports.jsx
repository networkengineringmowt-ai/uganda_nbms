import { useMemo, useState, useEffect } from 'react';
import { FileText, Printer, AlertCircle } from 'lucide-react';
import DigitalTwin from './DigitalTwin';
import { getPhotoUrl } from '../utils/photoUrlResolver';
import {
  TYPE_CROSSING, TYPE_BRIDGE, TYPE_DECK, TYPE_DECK_MATERIAL,
  TYPE_ABUTMENT, TYPE_PIERS, TYPE_PARAPET_RAILING, TYPE_EXPANSION_JOINTS,
  TYPE_BEARINGS,
  getConditionColor, getConditionLabel, getDictionaryLabel
} from '../utils/dataDictionary';

/* ── helpers ─────────────────────────────────────────── */
const ratingDesc = (val) => {
  if (val == null || val === '') return 'Not Assessed';
  return getConditionLabel(val);
};

const ratingColor = (val) => {
  return getConditionColor(ratingDesc(val));
};

const fmt = (n) => n != null ? Number(n).toLocaleString() : '-';
const fmtDec = (n, d = 1) => n != null ? Number(n).toFixed(d) : '-';

/* Lookup a legacy code → human description. Returns '-' if missing. */
const desc = (dict, code) => {
  if (!code || code === '97') return 'None';
  return getDictionaryLabel(dict, code);
};

const DISTRICT_MAP = {
  '01': 'Kampala', '02': 'Wakiso', '03': 'Mukono', '04': 'Jinja', '05': 'Iganga',
  '06': 'Mbale', '07': 'Tororo', '08': 'Busia', '09': 'Bugiri', '10': 'Mayuge',
  '11': 'Kamuli', '12': 'Soroti', '13': 'Kumi', '14': 'Pallisa', '15': 'Katakwi',
  '16': 'Lira', '17': 'Apac', '18': 'Gulu', '19': 'Kitgum', '20': 'Pader',
  '21': 'Moroto', '22': 'Kotido', '23': 'Nakapiripirit', '24': 'Kapchorwa',
  '25': 'Sironko', '26': 'Manafwa', '27': 'Bududa', '28': 'Bukwo',
  '30': 'Masaka', '31': 'Mpigi', '32': 'Rakai', '33': 'Kalangala',
  '34': 'Lyantonde', '35': 'Sembabule', '36': 'Mubende', '37': 'Mityana',
  '38': 'Kiboga', '39': 'Kyankwanzi', '40': 'Luwero', '41': 'Nakasongola',
  '42': 'Kayunga', '43': 'Buikwe', '44': 'Buvuma',
  '50': 'Fort Portal', '51': 'Kasese', '52': 'Kabarole', '53': 'Bundibugyo',
  '54': 'Ntoroko', '55': 'Kyenjojo', '56': 'Kamwenge', '57': 'Kibaale',
  '58': 'Hoima', '59': 'Masindi', '60': 'Buliisa', '61': 'Kiryandongo',
  '70': 'Mbarara', '71': 'Bushenyi', '72': 'Ntungamo', '73': 'Rukungiri',
  '74': 'Kanungu', '75': 'Kisoro', '76': 'Kabale', '77': 'Isingiro',
  '78': 'Ibanda', '79': 'Kiruhura', '80': 'Buhweju', '81': 'Mitooma',
  '82': 'Rubirizi', '83': 'Sheema',
  '90': 'Arua', '91': 'Nebbi', '92': 'Moyo', '93': 'Adjumani',
  '94': 'Yumbe', '95': 'Koboko', '96': 'Maracha', '97': 'Zombo',
};

const lookupDistrict = (code) => {
  if (!code) return '-';
  const s = String(code).trim();
  return DISTRICT_MAP[s] || s;
};

/* ── style constants for print ──────────────────────── */
const cellStyle = { padding: '6px 10px', border: '1px solid rgba(148, 184, 255, 0.16)', fontSize: '12px', verticalAlign: 'top', color: '#cbd5e1' };
const headerCell = { ...cellStyle, fontWeight: 700, background: '#101f39', width: '180px', color: '#7dd3fc' };
const sectionTitle = { fontSize: '14px', fontWeight: 700, margin: '24px 0 10px 0', color: '#e8f2ff', borderBottom: '2px solid #274b83', paddingBottom: '4px' };

export default function BmsReports({ bridges = [] }) {
  const [activeReport, setActiveReport] = useState('validation');
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [printPreviewData, setPrintPreviewData] = useState(null);
  const [unitCost, setUnitCost] = useState(1500000);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
    fetch(`${BASE_URL}gallery/index.json`)
      .then(r => r.json())
      .then(setGallery)
      .catch(console.error);
  }, []);

  const validationData = useMemo(() => {
    const unchecked = bridges.filter(b => !b.LegacyData?.data_checked);
    const checked = bridges.filter(b => b.LegacyData?.data_checked);

    const outstandingRatings = bridges.filter(b => {
      const legacy = b.LegacyData || {};
      return !legacy.approaches_rating || !legacy.waterway_rating || !legacy.substructure_rating || !legacy.superstructure_rating;
    });

    const noInspections = bridges.filter(b => {
      const legacy = b.LegacyData || {};
      const ratings = ['approaches', 'waterway', 'substructure', 'superstructure', 'roadway', 'expansion_joints', 'drainage'];
      return ratings.every(r => !legacy[`${r}_rating`]);
    });

    return { unchecked, checked, outstandingRatings, noInspections };
  }, [bridges]);

  const costSummary = useMemo(() => {
    return bridges.map(b => {
      const leg = b.LegacyData || {};
      const length = Number(leg.total_length || leg.bridge_len || leg.length || 12);
      const width = Number(leg.overall_width || leg.bridge_wid || leg.width || 8);
      const area = length * width;
      const crc = area * unitCost;
      const rating = leg.overall_rating != null ? Number(leg.overall_rating) : null;
      const cdrc = rating != null ? (crc * rating) / 9 : null;
      const depreciationPct = rating != null ? ((9 - rating) / 9 * 100) : null;

      return {
        number: b.BridgeNumber, name: b.BridgeName,
        road: b.RoadDescrPrincipal, district: lookupDistrict(b.District),
        length, width, area, crc, cdrc, rating, depreciationPct,
        conditionDesc: ratingDesc(rating),
      };
    });
  }, [bridges, unitCost]);

  /* ── Aggregate asset portfolio metrics ── */
  const portfolioMetrics = useMemo(() => {
    const rated = costSummary.filter(r => r.rating != null);
    const totalCRC = costSummary.reduce((s, r) => s + r.crc, 0);
    const totalCDRC = rated.reduce((s, r) => s + (r.cdrc || 0), 0);
    const totalArea = costSummary.reduce((s, r) => s + r.area, 0);
    const avgRating = rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length) : null;
    const backlogValue = totalCRC - totalCDRC;
    return { totalCRC, totalCDRC, totalArea, avgRating, backlogValue, ratedCount: rated.length, totalCount: costSummary.length };
  }, [costSummary]);

  const handleGeneratePrintPreview = (type) => {
    if (type === 'bridge' && selectedBridgeId) {
      const b = bridges.find(x => x.BridgeNumber === selectedBridgeId);
      if (b) {
        const photos = gallery.filter(g => !g.duplicate_of && (g.structure_id === b.BridgeNumber || g.filename?.includes(b.BridgeNumber)));
        const leg = b.LegacyData || {};
        const length = Number(leg.total_length || leg.bridge_len || leg.length || 0);
        const width = Number(leg.overall_width || leg.bridge_wid || leg.width || 0);
        const area = length * width;
        const crc = area * unitCost;
        const rating = leg.overall_rating != null ? Number(leg.overall_rating) : null;
        const cdrc = rating != null ? (crc * rating) / 9 : null;

        setPrintPreviewData({
          type: 'bridge',
          title: `BRIDGE INVENTORY & RATING REPORT - ${b.BridgeNumber}`,
          bridge: b,
          photos,
          assetMetrics: { length, width, area, crc, cdrc, rating, unitCost },
          date: new Date().toLocaleDateString()
        });
        setActiveReport('print');
      }
    } else if (type === 'cost') {
      setPrintPreviewData({
        type: 'cost',
        title: 'NATIONAL BRIDGE ASSET VALUATION REPORT',
        costData: costSummary,
        portfolioMetrics,
        date: new Date().toLocaleDateString()
      });
      setActiveReport('print');
    }
  };

  const tabBtn = (id, label) => (
    <button
      onClick={() => setActiveReport(id)}
      style={{
        padding: '12px 24px', background: 'transparent', border: 'none',
        borderBottom: activeReport === id ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeReport === id ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontWeight: activeReport === id ? 700 : 500, cursor: 'pointer', fontSize: '13px'
      }}
    >{label}</button>
  );

  return (
    <div style={{ width: '100%', padding: '0 24px', margin: '0 auto', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', display: 'grid', placeItems: 'center', borderRadius: '10px' }}>
          <FileText size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>Reports & Audits</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Data integrity, asset valuations, and printable structure reports.</p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '16px', gap: '4px' }}>
        {tabBtn('validation', 'Data Validation')}
        {tabBtn('costing', 'Asset Valuation (CRC)')}
        {tabBtn('single', 'Print Structure Reports')}
        {activeReport === 'print' && (
          <button style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent-amber)', color: 'var(--accent-amber)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
            Print Preview
          </button>
        )}
      </div>

      <div className="modern-scroll" style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}>

        {activeReport === 'validation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-red)' }}>
                <AlertCircle size={16} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Unchecked Records ({validationData.unchecked.length})</h3>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {validationData.unchecked.slice(0, 100).map(b => (
                  <div key={b.BridgeNumber} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{b.BridgeNumber}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{b.BridgeName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-amber)' }}>
                <AlertCircle size={16} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Missing Core Ratings ({validationData.outstandingRatings.length})</h3>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {validationData.outstandingRatings.slice(0, 100).map(b => (
                  <div key={b.BridgeNumber} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
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
            <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, flex: 1 }}>National Bridge Asset Valuation</h2>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit Cost (UGX/m²)</label>
                <input
                  type="number" className="toolbar-search"
                  style={{ height: '32px', borderRadius: '6px', width: '160px' }}
                  value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))}
                />
                <button className="modern-btn-primary" onClick={() => handleGeneratePrintPreview('cost')} style={{ height: '32px', padding: '0 14px', gap: '6px', fontSize: '12px' }}>
                  <Printer size={14} /> Print Summary
                </button>
              </div>
              {/* Portfolio KPIs */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Total CRC: </span><strong style={{ color: 'var(--accent-primary)' }}>UGX {fmt(Math.round(portfolioMetrics.totalCRC))}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total CDRC: </span><strong>UGX {fmt(Math.round(portfolioMetrics.totalCDRC))}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Maint. Backlog: </span><strong style={{ color: '#ef4444' }}>UGX {fmt(Math.round(portfolioMetrics.backlogValue))}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Deck Area: </span><strong>{fmt(Math.round(portfolioMetrics.totalArea))} m²</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Avg Condition: </span><strong>{portfolioMetrics.avgRating != null ? ratingDesc(Math.round(portfolioMetrics.avgRating)) : 'N/A'}</strong></div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Bridge</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Road</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Area (m²)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>Condition</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>CRC (UGX)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>CDRC (UGX)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Deprec. %</th>
                </tr>
              </thead>
              <tbody>
                {costSummary.map(row => (
                  <tr key={row.number} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--accent-primary)' }}>{row.number}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.name || '-'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>{row.road || '-'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtDec(row.area)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: ratingColor(row.rating) }}>{row.conditionDesc}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(Math.round(row.crc))}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{row.cdrc != null ? fmt(Math.round(row.cdrc)) : 'N/A'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: row.depreciationPct != null && row.depreciationPct > 50 ? '#ef4444' : 'var(--text-muted)' }}>{row.depreciationPct != null ? `${row.depreciationPct.toFixed(0)}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'single' && (
          <div className="panel" style={{ padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Generate Comprehensive Structure Report</h3>
            <div className="modern-filter-field" style={{ marginBottom: '16px' }}>
              <label>Select Bridge Structure</label>
              <div className="modern-select-wrapper">
                <select
                  value={selectedBridgeId}
                  onChange={(e) => setSelectedBridgeId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.02)', color: 'var(--text-primary)', height: '44px' }}
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
              <Printer size={16} /> Generate Full Report
            </button>
          </div>
        )}

        {activeReport === 'print' && printPreviewData && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
              <button className="modern-btn-secondary" onClick={() => setActiveReport('validation')} style={{ width: '130px' }}>Close Preview</button>
              <button className="modern-btn-primary" onClick={() => window.print()} style={{ width: '130px', gap: '8px' }}><Printer size={16} /> Print</button>
            </div>

            <div className="panel" style={{ padding: '40px', background: '#071126', color: '#e8f2ff', borderRadius: '4px', border: '1px solid rgba(148, 184, 255, 0.18)', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}>
              {/* ── MoWT Letterhead ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="mowt.jpg" alt="MoWT Logo" style={{ height: '50px', objectFit: 'contain' }} />
                  <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>MINISTRY OF WORKS AND TRANSPORT (MoWT)</h1>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>DEPARTMENT OF NATIONAL ROADS · BRIDGE MANAGEMENT SYSTEM</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                  <strong>Date Issued:</strong> {printPreviewData.date}<br />
                  <strong>Data Source:</strong> National BMS Registry
                </div>
              </div>

              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', textAlign: 'center', textTransform: 'uppercase' }}>{printPreviewData.title}</h2>

              {/* ══════════════════════════════════════════════════════
                   SINGLE BRIDGE REPORT
                 ══════════════════════════════════════════════════════ */}
              {printPreviewData.type === 'bridge' && (() => {
                const b = printPreviewData.bridge;
                const leg = b.LegacyData || {};
                const am = printPreviewData.assetMetrics;

                return (
                  <div>
                    {/* SECTION 1: IDENTIFICATION & LOCATION */}
                    <h3 style={sectionTitle}>1. IDENTIFICATION & LOCATION</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>Bridge Number</td>
                          <td style={cellStyle}>{b.BridgeNumber || '-'}</td>
                          <td style={headerCell}>Bridge Name</td>
                          <td style={cellStyle}>{b.BridgeName || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Road Description</td>
                          <td style={cellStyle}>{b.RoadDescrPrincipal || leg.road_descr_principal || leg.link_name || '-'}</td>
                          <td style={headerCell}>Link ID</td>
                          <td style={cellStyle}>{b.LinkID || leg.link_no || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Road Class</td>
                          <td style={cellStyle}>{b.RoadClass || leg.road_class || '-'}</td>
                          <td style={headerCell}>Chainage (km)</td>
                          <td style={cellStyle}>{b.KmPrincipal || leg.chainage_km || leg.km || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Region</td>
                          <td style={cellStyle}>{b.Region || leg.region || '-'}</td>
                          <td style={headerCell}>Maintenance Station</td>
                          <td style={cellStyle}>{b.Station || leg.station || leg.maintenanc || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>District</td>
                          <td style={cellStyle}>{lookupDistrict(b.District || leg.district_council)}</td>
                          <td style={headerCell}>Type of Crossing</td>
                          <td style={cellStyle}>{desc(TYPE_CROSSING, leg.type_crossing || b.TypeCrossing)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Latitude</td>
                          <td style={cellStyle}>{fmtDec(b.Lat || b.Latitude, 6)}</td>
                          <td style={headerCell}>Longitude</td>
                          <td style={cellStyle}>{fmtDec(b.Lon || b.Longitude, 6)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>River/Feature Crossed</td>
                          <td style={cellStyle} colSpan={3}>{leg.river || leg.feature_crossed || b.BridgeName || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 2: STRUCTURAL INVENTORY (Data Dictionary) */}
                    <h3 style={sectionTitle}>2. STRUCTURAL INVENTORY</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>Type of Bridge</td>
                          <td style={cellStyle}>{desc(TYPE_BRIDGE, leg.type_bridge)}</td>
                          <td style={headerCell}>Type of Deck</td>
                          <td style={cellStyle}>{desc(TYPE_DECK, leg.type_deck)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Deck Material</td>
                          <td style={cellStyle}>{desc(TYPE_DECK_MATERIAL, leg.type_deck_material)}</td>
                          <td style={headerCell}>Year Completed</td>
                          <td style={cellStyle}>{leg.year_compl || leg.year_completed || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Left Abutment Type</td>
                          <td style={cellStyle}>{desc(TYPE_ABUTMENT, leg.type_abutment_l || leg.type_abutment)}</td>
                          <td style={headerCell}>Right Abutment Type</td>
                          <td style={cellStyle}>{desc(TYPE_ABUTMENT, leg.type_abutment_r || leg.type_abutment)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Pier Type</td>
                          <td style={cellStyle}>{desc(TYPE_PIERS, leg.type_piers || leg.pier_type)}</td>
                          <td style={headerCell}>Number of Piers</td>
                          <td style={cellStyle}>{leg.no_of_pier || leg.no_of_piers || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Bearing Type</td>
                          <td style={cellStyle}>{desc(TYPE_BEARINGS, leg.type_bearing || leg.bearing_type)}</td>
                          <td style={headerCell}>Expansion Joint Type</td>
                          <td style={cellStyle}>{desc(TYPE_EXPANSION_JOINTS, leg.type_exp_joints || leg.expansion_joint_type)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Parapet / Railing Type</td>
                          <td style={cellStyle}>{desc(TYPE_PARAPET_RAILING, leg.type_para_rail || leg.parapet_railing_type)}</td>
                          <td style={headerCell}>Number of Spans</td>
                          <td style={cellStyle}>{b.Spans || leg.no_of_spans || leg.spans || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 3: GEOMETRIC DATA */}
                    <h3 style={sectionTitle}>3. GEOMETRIC DATA</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>Total Length (m)</td>
                          <td style={cellStyle}>{fmtDec(leg.total_length || leg.bridge_len || leg.length)}</td>
                          <td style={headerCell}>Overall Width (m)</td>
                          <td style={cellStyle}>{fmtDec(leg.overall_width || leg.bridge_wid || leg.width)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Carriageway Width (m)</td>
                          <td style={cellStyle}>{fmtDec(leg.carriageway_width || leg.carriage_w)}</td>
                          <td style={headerCell}>Number of Lanes</td>
                          <td style={cellStyle}>{leg.no_of_lane || leg.no_of_lanes || '-'}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Vertical Clearance (m)</td>
                          <td style={cellStyle}>{fmtDec(leg.vertical_clearance || leg.vert_clear)}</td>
                          <td style={headerCell}>Horizontal Clearance (m)</td>
                          <td style={cellStyle}>{fmtDec(leg.horizontal_clearance || leg.horiz_clea)}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Skew Angle (°)</td>
                          <td style={cellStyle}>{leg.skew_angle || leg.skew || '-'}</td>
                          <td style={headerCell}>Deck Area (m²)</td>
                          <td style={cellStyle}><strong>{fmtDec(am.area)}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 4: COMPONENT CONDITION RATINGS */}
                    <h3 style={sectionTitle}>4. COMPONENT CONDITION RATINGS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <thead>
                        <tr style={{ background: '#101f39' }}>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'left' }}>Component</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'center', width: '200px' }}>Condition Assessment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Approaches', key: 'approaches_rating' },
                          { label: 'Waterway / Channel', key: 'waterway_rating' },
                          { label: 'Substructure (Abutments & Piers)', key: 'substructure_rating' },
                          { label: 'Superstructure (Girders & Deck)', key: 'superstructure_rating' },
                          { label: 'Roadway (Deck Surface)', key: 'roadway_rating' },
                          { label: 'Expansion Joints', key: 'expansion_joints_rating' },
                          { label: 'Drainage', key: 'drainage_rating' },
                          { label: 'Traffic Barriers / Guardrails', key: 'traffic_barriers_rating' },
                          { label: 'Parapets / Railings', key: 'parapets_rating' },
                          { label: 'Bearings', key: 'bearings_rating' },
                          { label: 'Wingwalls', key: 'wingwalls_rating' },
                          { label: 'Bridge Surfacing', key: 'surfacing_rating' },
                        ].map(r => {
                          const val = leg[r.key];
                          const label = ratingDesc(val);
                          const color = ratingColor(val);
                          return (
                            <tr key={r.label}>
                              <td style={{ ...cellStyle, fontWeight: 600 }}>{r.label}</td>
                              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color }}>{label}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: '#101f39' }}>
                          <td style={{ ...cellStyle, fontWeight: 800 }}>OVERALL CONDITION INDEX</td>
                          <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 800, fontSize: '14px', color: ratingColor(leg.overall_rating) }}>
                            {ratingDesc(leg.overall_rating)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 5: ASSET VALUATION */}
                    <h3 style={sectionTitle}>5. ASSET VALUATION METRICS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>Deck Area</td>
                          <td style={cellStyle}>{fmtDec(am.area)} m²</td>
                          <td style={headerCell}>Unit Replacement Cost</td>
                          <td style={cellStyle}>UGX {fmt(am.unitCost)} / m²</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Current Replacement Cost (CRC)</td>
                          <td style={cellStyle}><strong>UGX {fmt(Math.round(am.crc))}</strong></td>
                          <td style={headerCell}>Current Depreciated Replacement Cost (CDRC)</td>
                          <td style={cellStyle}><strong>{am.cdrc != null ? `UGX ${fmt(Math.round(am.cdrc))}` : 'Not Assessed'}</strong></td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Depreciation</td>
                          <td style={cellStyle}>{am.rating != null ? `${((9 - am.rating) / 9 * 100).toFixed(0)}%` : 'N/A'}</td>
                          <td style={headerCell}>Maintenance Backlog Value</td>
                          <td style={cellStyle}><strong style={{ color: '#dc2626' }}>{am.cdrc != null ? `UGX ${fmt(Math.round(am.crc - am.cdrc))}` : 'Not Assessed'}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 6: TRAFFIC & LOADING */}
                    <h3 style={sectionTitle}>6. TRAFFIC & LOADING</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>AADT (2026 Estimated)</td>
                          <td style={cellStyle}>{fmt(b.Traffic?.aadt_2026 || leg.aadt_rebuilt_2026 || leg.current_predicted_aadt)}</td>
                          <td style={headerCell}>Annual Growth Rate</td>
                          <td style={cellStyle}>{b.Traffic?.growth_rate ? `${(Number(b.Traffic.growth_rate) * 100).toFixed(1)}%` : (leg.annual_weighted_growth_rate ? `${(Number(leg.annual_weighted_growth_rate) * 100).toFixed(1)}%` : '-')}</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Design Load</td>
                          <td style={cellStyle}>{leg.design_load || leg.loading || '-'}</td>
                          <td style={headerCell}>Scour Risk</td>
                          <td style={cellStyle}>{leg.scour_risk || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SECTION 7: DIGITAL TWIN & EVIDENCE */}
                    <h3 style={sectionTitle}>7. DIGITAL TWIN & EVIDENCE SNAPSHOTS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ border: '1px solid #ccc', background: '#000', height: '300px', borderRadius: '4px', overflow: 'hidden', position: 'relative', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <DigitalTwin asset={b} />
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '3px 6px', fontSize: '10px', borderRadius: '4px' }}>
                          Digital Twin Reconstruction
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', height: '300px' }}>
                        {printPreviewData.photos.slice(0, 4).map((p, i) => (
                          <div key={i} style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', background: '#f8f9fa' }}>
                            <img src={getPhotoUrl(p)} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                        {printPreviewData.photos.length === 0 && (
                          <div style={{ gridColumn: '1 / -1', gridRow: '1 / -1', background: '#f8f9fa', display: 'grid', placeItems: 'center', border: '1px solid #ccc', borderRadius: '4px', color: '#666', fontSize: '12px' }}>
                            No indexed photos available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ══════════════════════════════════════════════════════
                   COST SUMMARY REPORT
                 ══════════════════════════════════════════════════════ */}
              {printPreviewData.type === 'cost' && (() => {
                const pm = printPreviewData.portfolioMetrics;
                return (
                  <div>
                    {/* Portfolio Summary */}
                    <h3 style={sectionTitle}>PORTFOLIO SUMMARY</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                      <tbody>
                        <tr>
                          <td style={headerCell}>Total Structures</td>
                          <td style={cellStyle}>{pm.totalCount}</td>
                          <td style={headerCell}>Structures Rated</td>
                          <td style={cellStyle}>{pm.ratedCount} ({(pm.ratedCount / pm.totalCount * 100).toFixed(0)}%)</td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Total Deck Area</td>
                          <td style={cellStyle}>{fmt(Math.round(pm.totalArea))} m²</td>
                          <td style={headerCell}>Average Condition</td>
                          <td style={cellStyle}><strong>{pm.avgRating != null ? ratingDesc(Math.round(pm.avgRating)) : 'N/A'}</strong></td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Total CRC</td>
                          <td style={cellStyle}><strong>UGX {fmt(Math.round(pm.totalCRC))}</strong></td>
                          <td style={headerCell}>Total CDRC</td>
                          <td style={cellStyle}><strong>UGX {fmt(Math.round(pm.totalCDRC))}</strong></td>
                        </tr>
                        <tr>
                          <td style={headerCell}>Maintenance Backlog</td>
                          <td style={cellStyle} colSpan={3}><strong style={{ color: '#dc2626' }}>UGX {fmt(Math.round(pm.backlogValue))}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 style={sectionTitle}>INDIVIDUAL STRUCTURE VALUATIONS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#101f39' }}>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'left' }}>Bridge</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'left' }}>Name</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'center' }}>Condition</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'right' }}>CRC (UGX)</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'right' }}>CDRC (UGX)</th>
                          <th style={{ ...cellStyle, fontWeight: 700, textAlign: 'right' }}>Deprec.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printPreviewData.costData.map(row => (
                          <tr key={row.number}>
                            <td style={{ ...cellStyle, fontWeight: 700 }}>{row.number}</td>
                            <td style={cellStyle}>{row.name || '-'}</td>
                            <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600, color: ratingColor(row.rating) }}>{row.conditionDesc}</td>
                            <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(Math.round(row.crc))}</td>
                            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>{row.cdrc != null ? fmt(Math.round(row.cdrc)) : 'N/A'}</td>
                            <td style={{ ...cellStyle, textAlign: 'right' }}>{row.depreciationPct != null ? `${row.depreciationPct.toFixed(0)}%` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
