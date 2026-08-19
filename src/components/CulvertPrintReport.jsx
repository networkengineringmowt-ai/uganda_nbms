import DigitalTwin from './DigitalTwin';
import ReportPhotoGrid from './ReportPhotoGrid';
import { getConditionColor, getConditionLabel, getCulvertTypeLabel } from '../utils/dataDictionary';

const cellStyle = { padding: '6px 10px', border: '1px solid rgba(148, 184, 255, 0.16)', fontSize: '12px', verticalAlign: 'top', color: '#cbd5e1' };
const headerCell = { ...cellStyle, fontWeight: 700, background: '#101f39', width: '180px', color: '#7dd3fc' };
const sectionTitle = { fontSize: '14px', fontWeight: 700, margin: '24px 0 10px 0', color: '#e8f2ff', borderBottom: '2px solid #274b83', paddingBottom: '4px' };

const present = (value) => value === null || value === undefined || value === '' || value === '?' ? '-' : value;
const ratingDesc = (value) => value === null || value === undefined || value === '' ? 'Not Assessed' : getConditionLabel(value);
const ratingColor = (value) => getConditionColor(ratingDesc(value));
const fmt = (value) => value === null || value === undefined ? '-' : Number(value).toLocaleString();
const fmtDec = (value, digits = 1) => value === null || value === undefined || value === '' ? '-' : Number(value).toFixed(digits);

function FieldTable({ rows }) {
  return (
    <table className="bms-report-field-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
      <tbody>
        {rows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
          <tr key={`${leftLabel}-${rightLabel}`}>
            <td style={headerCell}>{leftLabel}</td><td style={cellStyle}>{present(leftValue)}</td>
            <td style={headerCell}>{rightLabel}</td><td style={cellStyle}>{present(rightValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CulvertPrintReport({ reportData }) {
  const c = reportData.culvert;
  const leg = c.LegacyData || {};
  const metrics = reportData.assetMetrics;
  const overallRating = leg.overall_rating ?? c.OverallConditionRating ?? c['Overall Rating'];
  const componentRatings = [
    ['Waterway', leg.waterway_rating ?? c.Waterway],
    ['Inlet / Outlet', leg.inlet_outlet_rating ?? c['Inlet/Outlet ']],
    ['Culvert Structure', leg.structure_rating ?? c.Structure],
    ['Roadway', leg.roadway_rating ?? c.Roadway],
  ];
  const culvertType = c.CulvertType || getCulvertTypeLabel(c.TypeCulvert ?? leg.type_culvert ?? c.Type);
  const comments = c.Comments || c['Comment '] || c['Addditional remarks '];

  return (
    <div className="bms-culvert-print-report">
      <h3 style={sectionTitle}>1. IDENTIFICATION & LOCATION</h3>
      <FieldTable rows={[
        ['Culvert Number', c.CulvertNumber, 'River / Feature', c.River || c.CulvertName],
        ['Road', c.Road, 'Link Name', c.LinkName || c.Link_Name],
        ['Road Number', c.Road_No, 'Road Class', c.Road_Class],
        ['Link ID', c.LinkID || c.Link_ID || c.SectionOrLinkNo, 'Surface Type', c.Surface_Type],
        ['Chainage From (km)', c.Chainage_From, 'Chainage To (km)', c.Chainage_To],
        ['Link Length (km)', c.LinkLengthKm ?? c['Length(km)'], 'Culvert Chainage (km)', c.Km],
        ['Maintenance Region', c.Maintenance_Region || c.Region, 'Maintenance Station', c.Maintenance_Station || c.Station],
        ['District', c.MagisterialDistrict || c.DistrictOffice || c.District, 'Nearest Towns', [c.TownOrVilL, c.TownOrVilR].filter(Boolean).join(' – ')],
        ['Latitude', fmtDec(c.Lat ?? c.Latitude, 6), 'Longitude', fmtDec(c.Lon ?? c.Longitude, 6)],
      ]} />

      <h3 style={sectionTitle}>2. CULVERT STRUCTURAL INVENTORY</h3>
      <FieldTable rows={[
        ['Type of Culvert', culvertType, 'Pipes / Cells', c.NoOfPipesOrCells ?? leg.no_of_pipes],
        ['Span / Diameter (m)', c.SpanOrDiameter ?? leg.span_diameter, 'Height (m)', c.Height],
        ['Skew Angle (°)', c.SkewAngle, 'Fill Height (m)', c.FillHeight ?? leg.fill_height],
        ['Gradient', c.CulvertGradiant, 'Flow', c.Flow],
        ['Abutment', c.Abutment, 'Old Culvert Number', c.OldCulvertNumber],
      ]} />

      <h3 style={sectionTitle}>3. GEOMETRIC DATA</h3>
      <FieldTable rows={[
        ['Overall Length (m)', c['Overall Length'] ?? c.CulvertLength ?? leg.culvert_len, 'Overall Width (m)', c['Overall Width'] ?? leg.overall_width],
        ['Minimum Clear Width (m)', c['Min Clear Width'] ?? leg.min_clear_width, 'Overall Cell Length (m)', c['Overall Cell Length']],
        ['Minimum Road Width (m)', c['Min Road Width'], 'Approach Width (m)', c['Approach Width']],
        ['Minimum Vertical Clearance (m)', c['Min Vertical Clearance'], 'Maximum Cell Size (W × H)', `${present(c['Max Cell Size Width'])} × ${present(c['Max Cell Size Height'])} m`],
      ]} />

      <h3 style={sectionTitle}>4. COMPONENT CONDITION RATINGS</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead><tr style={{ background: '#101f39' }}><th style={{ ...cellStyle, fontWeight: 700, textAlign: 'left' }}>Component</th><th style={{ ...cellStyle, fontWeight: 700, textAlign: 'center', width: '200px' }}>Condition Assessment</th></tr></thead>
        <tbody>
          {componentRatings.map(([label, value]) => (
            <tr key={label}><td style={{ ...cellStyle, fontWeight: 600 }}>{label}</td><td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: ratingColor(value) }}>{ratingDesc(value)}</td></tr>
          ))}
          <tr style={{ background: '#101f39' }}><td style={{ ...cellStyle, fontWeight: 800 }}>OVERALL CONDITION INDEX</td><td style={{ ...cellStyle, textAlign: 'center', fontWeight: 800, fontSize: '14px', color: ratingColor(overallRating) }}>{ratingDesc(overallRating)}</td></tr>
        </tbody>
      </table>

      <h3 className="bms-page-break-before" style={sectionTitle}>5. ASSET VALUATION METRICS</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <tbody>
          <tr><td style={headerCell}>Structure Area</td><td style={cellStyle}>{fmtDec(metrics.area)} m²</td><td style={headerCell}>Unit Replacement Cost</td><td style={cellStyle}>UGX {fmt(metrics.unitCost)} / m²</td></tr>
          <tr><td style={headerCell}>Current Replacement Cost (CRC)</td><td style={cellStyle}><strong>UGX {fmt(Math.round(metrics.crc))}</strong></td><td style={headerCell}>Current Depreciated Replacement Cost (CDRC)</td><td style={cellStyle}><strong>{metrics.cdrc != null ? `UGX ${fmt(Math.round(metrics.cdrc))}` : 'Not Assessed'}</strong></td></tr>
          <tr><td style={headerCell}>Depreciation</td><td style={cellStyle}>{metrics.rating != null ? `${((9 - metrics.rating) / 9 * 100).toFixed(0)}%` : 'N/A'}</td><td style={headerCell}>Maintenance Backlog Value</td><td style={cellStyle}><strong style={{ color: '#dc2626' }}>{metrics.cdrc != null ? `UGX ${fmt(Math.round(metrics.crc - metrics.cdrc))}` : 'Not Assessed'}</strong></td></tr>
        </tbody>
      </table>

      <h3 className="bms-page-break-before" style={sectionTitle}>6. DIGITAL TWIN & PHOTO EVIDENCE</h3>
      <div className="bms-twin-photo-comparison">
        <div className="bms-print-twin-snapshot" style={{ border: '1px solid #ccc', background: '#000', height: '300px', borderRadius: '4px', overflow: 'hidden', position: 'relative', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <DigitalTwin asset={{ ...c, _structureType: 'culvert' }} isCulvert />
        </div>
        <ReportPhotoGrid photos={reportData.photos} structureId={c.CulvertNumber} compact />
      </div>

      {comments && <><h3 style={sectionTitle}>7. COMMENTS & REMARKS</h3><div style={{ ...cellStyle, minHeight: '60px' }}>{comments}</div></>}
    </div>
  );
}
