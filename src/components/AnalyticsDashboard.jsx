import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Landmark, MapPin, TrendingUp } from 'lucide-react';
import DataTable from './DataTable';
import StatisticalAnalysis from './StatisticalAnalysis';
import { fetchCulverts } from '../services/bmsDataService';
import {
  TYPE_ABUTMENT,
  TYPE_BEARINGS,
  TYPE_BRIDGE,
  TYPE_CROSSING,
  TYPE_DECK,
  TYPE_DECK_MATERIAL,
  TYPE_PARAPET_RAILING,
  TYPE_PIERS,
  getDictionaryLabel,
} from '../utils/dataDictionary';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';

const fieldValue = (row, key) => row[key] ?? row.LegacyData?.[key];
const countField = (rows, key, dictionary) => rows.reduce((counts, row) => {
  const raw = fieldValue(row, key);
  const label = dictionary ? getDictionaryLabel(dictionary, raw) : (raw || 'Unknown');
  counts[label] = (counts[label] || 0) + 1;
  return counts;
}, {});

const categoricalFields = [
  { id: 'type_bridge', label: 'Structural Type', dictionary: TYPE_BRIDGE },
  { id: 'type_deck', label: 'Deck Form', dictionary: TYPE_DECK },
  { id: 'type_deck_material', label: 'Deck Material', dictionary: TYPE_DECK_MATERIAL },
  { id: 'type_crossing', label: 'Crossing Type', dictionary: TYPE_CROSSING },
  { id: 'type_abutment_l', label: 'Abutment Type', dictionary: TYPE_ABUTMENT },
  { id: 'type_piers', label: 'Pier Type', dictionary: TYPE_PIERS },
  { id: 'type_para_rail', label: 'Parapet / Railing', dictionary: TYPE_PARAPET_RAILING },
  { id: 'type_bearings', label: 'Bearing Type', dictionary: TYPE_BEARINGS },
  { id: 'road_class', label: 'Road Class' },
  { id: 'scour_risk', label: 'Scour Risk' },
];

// Every category is shown — no top-N truncation / "Other" bucket, per the
// platform's no-selective-reporting rule.
const breakdownColumns = (totalCount) => [
  { header: 'Category', cell: (r) => r.category, sortValue: (r) => r.category },
  { header: 'Count', cell: (r) => r.count.toLocaleString(), sortValue: (r) => r.count },
  {
    header: '% of total',
    cell: (r) => (totalCount ? `${((r.count / totalCount) * 100).toFixed(1)}%` : '—'),
    sortValue: (r) => (totalCount ? r.count / totalCount : 0),
  },
];

function BreakdownTable({ kicker, title, formula, data }) {
  const rows = useMemo(
    () => Object.entries(data || {})
      .filter(([, count]) => Number(count) > 0)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    [data]
  );
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const columns = useMemo(() => breakdownColumns(total), [total]);

  return (
    <article className="panel glass-card">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        <span className="stat-meta">{rows.length} categories · {total.toLocaleString()} records</span>
      </div>
      {formula && <p className="stat-formula-note">Formula: % of total = category count ÷ total records × 100. {formula}</p>}
      <DataTable columns={columns} data={rows} />
    </article>
  );
}

// Two-dimensional surface type x functional road class cross-tab. Every row,
// column, and cell is shown in full (no top-N cut, no "Other" bucket), with
// row/column/grand totals so the numbers can be reconciled against the total
// record count at a glance.
function CrossTabTable({ kicker, title, rows, rowField, colField, unitLabel }) {
  const { matrix, rowKeys, colKeys, rowTotals, colTotals, grandTotal } = useMemo(() => {
    const matrix = {};
    const rowTotals = {};
    const colTotals = {};
    let grandTotal = 0;
    (rows || []).forEach((record) => {
      const rowKey = fieldValue(record, rowField) || 'Unknown';
      const colKey = fieldValue(record, colField) || 'Unknown';
      matrix[rowKey] = matrix[rowKey] || {};
      matrix[rowKey][colKey] = (matrix[rowKey][colKey] || 0) + 1;
      rowTotals[rowKey] = (rowTotals[rowKey] || 0) + 1;
      colTotals[colKey] = (colTotals[colKey] || 0) + 1;
      grandTotal += 1;
    });
    return {
      matrix,
      rowKeys: Object.keys(rowTotals).sort(),
      colKeys: Object.keys(colTotals).sort(),
      rowTotals,
      colTotals,
      grandTotal,
    };
  }, [rows, rowField, colField]);

  return (
    <article className="panel glass-card">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        <span className="stat-meta">{rowKeys.length} surface types × {colKeys.length} classes · {grandTotal.toLocaleString()} {unitLabel}</span>
      </div>
      <div className="crosstab-scroll">
        <table className="crosstab-table">
          <thead>
            <tr>
              <th>Surface type \ Functional class</th>
              {colKeys.map((col) => <th key={col}>{col}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((row) => (
              <tr key={row}>
                <td className="crosstab-row-label">{row}</td>
                {colKeys.map((col) => <td key={col}>{(matrix[row]?.[col] || 0).toLocaleString()}</td>)}
                <td className="crosstab-total-cell">{rowTotals[row].toLocaleString()}</td>
              </tr>
            ))}
            <tr className="crosstab-total-row">
              <td className="crosstab-row-label">Total</td>
              {colKeys.map((col) => <td key={col} className="crosstab-total-cell">{colTotals[col].toLocaleString()}</td>)}
              <td className="crosstab-total-cell">{grandTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}

const BRIDGE_GROUP_FIELDS = [
  { key: 'region', label: 'Region' },
  { key: 'road_class', label: 'Road class' },
  { key: 'surface_ty', label: 'Surface type' },
  { key: 'ConditionCategory', label: 'Condition category' },
  { key: 'type_bridge', label: 'Structural type' },
  { key: 'scour_risk', label: 'Scour risk' },
];

const CULVERT_GROUP_FIELDS = [
  { key: 'Region', label: 'Region' },
  { key: 'Road_Class', label: 'Road class' },
  { key: 'Surface_Type', label: 'Surface type' },
  { key: 'ConditionCategory', label: 'Condition category' },
  { key: 'TypeCulvert', label: 'Culvert type' },
];

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}data/analytics.json`).then((response) => response.json()).then(setData).catch(console.error);
    fetch(`${BASE_URL}data/bridges.json`).then((response) => response.json()).then(setBridges).catch(console.error);
    fetchCulverts().then(setCulverts).catch(console.error);
  }, []);

  // Regional coverage and condition distribution are computed live from the
  // fetched bridge/culvert registers rather than the pre-baked analytics.json
  // snapshot, which can drift out of sync as records are reclassified (traffic
  // demand bands are confirmed to still match the live registry, so that one
  // table keeps reading straight from the snapshot).
  const bridgesByRegion = useMemo(() => countField(bridges, 'region'), [bridges]);
  const conditionOverall = useMemo(() => countField(bridges, 'OverallCondition'), [bridges]);

  const metrics = useMemo(() => {
    const totalBridges = bridges.length;
    const totalCulverts = culverts.length;
    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor'].reduce((sum, key) => sum + (conditionOverall[key] || 0), 0);
    const highTraffic = (data?.traffic_bins?.['10,000 - 24,999'] || 0) + (data?.traffic_bins?.['25,000+'] || 0);
    return { totalBridges, totalCulverts, poor, highTraffic };
  }, [bridges, culverts, conditionOverall, data]);

  const categories = useMemo(() => Object.fromEntries(categoricalFields.map((field) => [
    field.id,
    countField(bridges, field.id, field.dictionary),
  ])), [bridges]);

  // Bridges and culverts use different raw field names for the same two
  // dimensions (surface_ty/road_class vs Surface_Type/Road_Class) — normalize
  // to a common shape so the combined cross-tab covers every structure.
  const combinedStructures = useMemo(() => ([
    ...bridges.map((row) => ({ surface: fieldValue(row, 'surface_ty'), roadClass: fieldValue(row, 'road_class') })),
    ...culverts.map((row) => ({ surface: fieldValue(row, 'Surface_Type'), roadClass: fieldValue(row, 'Road_Class') })),
  ]), [bridges, culverts]);

  if (!data || !bridges.length) return <div className="page-loader"><div className="spinner" /><span>Preparing analytics...</span></div>;

  return (
    <div className="analytics-layout">
      <section className="kpi-grid compact">
        <article className="kpi-card"><div className="kpi-icon blue"><Landmark size={20} /></div><span className="kpi-eyebrow">Bridges analysed</span><strong>{metrics.totalBridges}</strong><p>Across six maintenance regions</p></article>
        <article className="kpi-card"><div className="kpi-icon blue"><MapPin size={20} /></div><span className="kpi-eyebrow">Major culverts</span><strong>{metrics.totalCulverts}</strong><p>Linked to the national road network</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><BarChart3 size={20} /></div><span className="kpi-eyebrow">Poor or worse</span><strong>{metrics.poor}</strong><p>Bridge records requiring intervention</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><TrendingUp size={20} /></div><span className="kpi-eyebrow">High-traffic bridges</span><strong>{metrics.highTraffic}</strong><p>Estimated AADT above 10,000</p></article>
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Data dictionary explorer</span><h2>Categorical engineering fields — summary tables</h2></div>
      </section>

      <section className="analytics-grid tables">
        <BreakdownTable kicker="Regional coverage" title="Bridges by Region" data={bridgesByRegion} />
        <BreakdownTable kicker="Network demand" title="Traffic Demand Bands" data={data.traffic_bins} />
        <BreakdownTable kicker="Condition distribution" title="Overall Bridge Condition" data={conditionOverall} />
        {categoricalFields.map((field) => (
          <BreakdownTable
            key={field.id}
            kicker="Dictionary field"
            title={field.label}
            data={categories[field.id]}
          />
        ))}
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Cross-tabulation</span><h2>Surface type × functional road class</h2></div>
      </section>
      <section className="analytics-grid tables">
        <CrossTabTable kicker="Bridges" title="Bridges — Surface Type × Functional Class" rows={bridges} rowField="surface_ty" colField="road_class" unitLabel="bridges" />
        <CrossTabTable kicker="Culverts" title="Culverts — Surface Type × Functional Class" rows={culverts} rowField="Surface_Type" colField="Road_Class" unitLabel="culverts" />
        <CrossTabTable kicker="Bridges + Culverts" title="All Structures — Surface Type × Functional Class" rows={combinedStructures} rowField="surface" colField="roadClass" unitLabel="structures" />
      </section>

      <StatisticalAnalysis rows={bridges} label="Bridges" groupFields={BRIDGE_GROUP_FIELDS} />
      <StatisticalAnalysis rows={culverts} label="Culverts" groupFields={CULVERT_GROUP_FIELDS} />
    </div>
  );
}
