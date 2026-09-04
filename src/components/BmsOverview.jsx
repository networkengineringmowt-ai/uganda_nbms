import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  Landmark,
  MapPin,
  Route,
  TrendingUp,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { fetchBridges, fetchCulverts } from '../services/bmsDataService';
import { getCriticalBridgeRows } from '../utils/bmsAlgorithms';
import {
  TYPE_ABUTMENT,
  TYPE_BEARINGS,
  TYPE_BRIDGE,
  TYPE_CROSSING,
  TYPE_DECK,
  TYPE_DECK_MATERIAL,
  TYPE_PARAPET_RAILING,
  TYPE_PIERS,
  getConditionLabel,
  getDictionaryLabel,
  getRoadClassLabel,
  getScourRiskLabel,
  toProperCase,
} from '../utils/dataDictionary';
import {
  chartTextStyle,
  NEON_AXIS,
  chartColors,
  hexToRgba,
  neonItemStyle,
  neonEmphasisStyle,
  neonToolbox,
  chartFieldValue,
  countChartField as themeCountChartField,
} from '../utils/chartTheme';

// ── Categorical engineering-field charts (moved here from Analytics: charts
//    belong on the dashboard/Overview; Analytics is tables + formulas) ──────
// Neon palette: every bar/series gets a top-to-bottom gradient plus a
// colour-matched glow (shadowBlur/shadowColor), brightening further on hover.
// Shared with VisualAnalytics.jsx via src/utils/chartTheme.js so the look
// stays cohesive as more chart types are added.

// All categories are charted — no top-N truncation / "Other" bucket, per the
// platform's no-selective-reporting rule. Wide charts (many categories) get
// an interactive zoom/pan slider so every bar stays reachable without
// cramming the axis labels.
const bar2DOption = (rawData, xName) => {
  const data = Object.entries(rawData || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]);
  const total = data.reduce((sum, [, v]) => sum + v, 0);
  const needsZoom = data.length > 7;
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10, 18, 36, 0.95)',
      borderColor: NEON_AXIS,
      textStyle: { color: '#e8fbff' },
      formatter: (params) => {
        const p = params[0];
        const pct = total ? ((p.value / total) * 100).toFixed(1) : '0.0';
        return `<strong>${p.name}</strong><br/>Count: ${p.value.toLocaleString()} (${pct}%)`;
      },
    },
    toolbox: neonToolbox,
    grid: { left: '3%', right: '4%', bottom: needsZoom ? '22%' : '15%', containLabel: true },
    dataZoom: needsZoom ? [
      { type: 'inside', start: 0, end: Math.min(100, (7 / data.length) * 100) },
      { type: 'slider', start: 0, end: Math.min(100, (7 / data.length) * 100), height: 16, bottom: 6, handleStyle: { color: NEON_AXIS }, fillerColor: hexToRgba(NEON_AXIS, 0.15), borderColor: NEON_AXIS, textStyle: { color: chartTextStyle.color } },
    ] : undefined,
    xAxis: {
      type: 'category',
      data: data.map(([name]) => name),
      name: xName,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { ...chartTextStyle, fontSize: 12 },
      axisLabel: { ...chartTextStyle, interval: 0, fontSize: 10, rotate: data.length > 5 ? 45 : 0, hideOverlap: true },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: NEON_AXIS } },
      axisLine: { lineStyle: { color: NEON_AXIS } },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { ...chartTextStyle, padding: [0, 0, 0, 10] },
      axisLabel: { ...chartTextStyle, fontSize: 10 },
      axisTick: { show: true, lineStyle: { color: NEON_AXIS } },
      axisLine: { show: true, lineStyle: { color: NEON_AXIS } },
      splitLine: { show: true, lineStyle: { color: 'rgba(40, 224, 255, 0.15)', type: 'dashed' } },
    },
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    series: [{
      type: 'bar',
      data: data.map(([, value], i) => {
        const hex = chartColors[i % chartColors.length];
        return { value, itemStyle: neonItemStyle(hex), emphasis: neonEmphasisStyle(hex) };
      }),
      label: { show: true, position: 'top', ...chartTextStyle, fontSize: 10 },
    }],
  };
};

const countChartField = (rows, key, dictionary) => themeCountChartField(rows, key, dictionary, getDictionaryLabel);
// road_class/scour_risk have no code dictionary -- count using the
// formatting-only decode helpers so charts never show a bare letter/flag.
const countChartFieldWithLabelFn = (rows, key, labelFn) => rows.reduce((counts, row) => {
  const label = labelFn(chartFieldValue(row, key));
  counts[label] = (counts[label] || 0) + 1;
  return counts;
}, {});

const categoricalChartFields = [
  { id: 'type_bridge', label: 'Structural Type', dictionary: TYPE_BRIDGE },
  { id: 'type_deck', label: 'Deck Form', dictionary: TYPE_DECK },
  { id: 'type_deck_material', label: 'Deck Material', dictionary: TYPE_DECK_MATERIAL },
  { id: 'type_crossing', label: 'Crossing Type', dictionary: TYPE_CROSSING },
  { id: 'type_abutment_l', label: 'Abutment Type', dictionary: TYPE_ABUTMENT },
  { id: 'type_piers', label: 'Pier Type', dictionary: TYPE_PIERS },
  { id: 'type_para_rail', label: 'Parapet / Railing', dictionary: TYPE_PARAPET_RAILING },
  { id: 'type_bearings', label: 'Bearing Type', dictionary: TYPE_BEARINGS },
  { id: 'road_class', label: 'Road Class', labelFn: getRoadClassLabel },
  { id: 'scour_risk', label: 'Scour Risk', labelFn: getScourRiskLabel },
];

// Culverts use their own normalized field names (set by normalizeCulvert) --
// no dictionary lookup needed since CulvertType/Surface_Type/Road_Class/
// Region are already resolved to human-readable values.
const categoricalCulvertChartFields = [
  { id: 'CulvertType', label: 'Culvert Type' },
  { id: 'Surface_Type', label: 'Surface Type' },
  { id: 'Road_Class', label: 'Road Class', labelFn: getRoadClassLabel },
  { id: 'Region', label: 'Region' },
];

function ChartPanel({ kicker, title, data, wide = false }) {
  return (
    <article className={`panel chart-panel glass-card ${wide ? 'wide' : ''}`}>
      <div className="panel-header"><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div></div>
      <ReactECharts option={bar2DOption(data, title)} style={{ height: wide ? 430 : 370 }} opts={{ renderer: 'canvas' }} />
    </article>
  );
}

// Stacked bar: one series per row-field value (e.g. surface type), one x-axis
// category per col-field value (e.g. functional class) — every combination
// shown, no top-N cut.
const groupedBarOption = (rows, rowField, colField, xName) => {
  // road_class has no code dictionary -- decode via the formatting-only
  // helper so x-axis categories read "Class A" rather than a bare letter.
  const colNorm = /road_class/i.test(colField) ? getRoadClassLabel : (v) => v || 'Unknown';
  const norm = (v) => v || 'Unknown';
  const colKeys = [...new Set(rows.map((r) => colNorm(chartFieldValue(r, colField))))].sort();
  const rowKeys = [...new Set(rows.map((r) => norm(chartFieldValue(r, rowField))))].sort();
  const series = rowKeys.map((rk, i) => {
    const hex = chartColors[i % chartColors.length];
    return {
      name: rk,
      type: 'bar',
      stack: 'total',
      data: colKeys.map((ck) => rows.filter((r) => norm(chartFieldValue(r, rowField)) === rk && colNorm(chartFieldValue(r, colField)) === ck).length),
      itemStyle: neonItemStyle(hex),
      emphasis: neonEmphasisStyle(hex),
      label: { show: true, ...chartTextStyle, fontSize: 10 },
    };
  });

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10, 18, 36, 0.95)',
      borderColor: NEON_AXIS,
      textStyle: { color: '#e8fbff' },
    },
    toolbox: neonToolbox,
    legend: { top: 0, textStyle: { ...chartTextStyle, fontSize: 11 }, selectedMode: true },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: colKeys,
      name: xName,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { ...chartTextStyle, fontSize: 12 },
      axisLabel: { ...chartTextStyle, fontSize: 10 },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: NEON_AXIS } },
      axisLine: { lineStyle: { color: NEON_AXIS } },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { ...chartTextStyle, padding: [0, 0, 0, 10] },
      axisLabel: { ...chartTextStyle, fontSize: 10 },
      axisTick: { show: true, lineStyle: { color: NEON_AXIS } },
      axisLine: { show: true, lineStyle: { color: NEON_AXIS } },
      splitLine: { show: true, lineStyle: { color: 'rgba(40, 224, 255, 0.15)', type: 'dashed' } },
    },
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    series,
  };
};

function GroupedChartPanel({ kicker, title, rows, rowField, colField, xName }) {
  return (
    <article className="panel chart-panel glass-card">
      <div className="panel-header"><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div></div>
      <ReactECharts option={groupedBarOption(rows, rowField, colField, xName)} style={{ height: 370 }} opts={{ renderer: 'canvas' }} />
    </article>
  );
}

function SummaryPanel({ kicker, title, stats }) {
  return (
    <article className="panel glass-card">
      <div className="panel-header"><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div></div>
      <div className="kpi-grid compact" style={{ marginTop: 0 }}>
        {stats.map((s) => (
          <article className="kpi-card" key={s.label}>
            <span className="kpi-eyebrow">{s.label}</span>
            <strong>{s.value}</strong>
            {s.note && <p>{s.note}</p>}
          </article>
        ))}
      </div>
    </article>
  );
}

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent'];
const CONDITION_CLASS = {
  'Beyond Repair': 'condition-critical',
  Critical: 'condition-critical',
  'Very Poor': 'condition-critical',
  Poor: 'condition-poor',
  Marginal: 'condition-watch',
  Fair: 'condition-watch',
  Satisfactory: 'condition-ok',
  Good: 'condition-good',
  'Very Good': 'condition-good',
  Excellent: 'condition-good',
};

export default function BmsOverview({ onNavigate, onSelectAsset, bridges: bridgesProp, culverts: culvertsProp }) {
  // When a parent (e.g. the Dashboard filter bar) supplies bridges/culverts,
  // those are used as-is -- including a legitimately empty, filtered-down
  // array -- instead of self-fetching the full unfiltered registry.
  const usingExternalData = bridgesProp !== undefined && culvertsProp !== undefined;
  const [fetchedBridges, setFetchedBridges] = useState([]);
  const [fetchedCulverts, setFetchedCulverts] = useState([]);
  const bridges = usingExternalData ? bridgesProp : fetchedBridges;
  const culverts = usingExternalData ? culvertsProp : fetchedCulverts;
  const [analytics, setAnalytics] = useState(null);
  // Live-computed from the current bridge register -- see the note in the
  // data-fetch effect above on why this replaced a static snapshot file.
  const critical = useMemo(() => getCriticalBridgeRows(bridges), [bridges]);

  useEffect(() => {
    // Critical structures are computed live from the bridge register below
    // (bmsAlgorithms.js getCriticalBridgeRows) rather than read from a
    // separately-maintained snapshot file, which could silently drift stale
    // relative to a bridge's actual current condition.
    const requests = [
      fetch(dataUrl('data/analytics.json')).then((response) => response.json()),
    ];
    if (!usingExternalData) {
      requests.unshift(fetchBridges(), fetchCulverts());
    }
    Promise.all(requests).then((results) => {
      if (usingExternalData) {
        const [analyticsData] = results;
        setAnalytics(analyticsData);
      } else {
        const [bridgeRows, culvertRows, analyticsData] = results;
        setFetchedBridges(bridgeRows);
        setFetchedCulverts(culvertRows);
        setAnalytics(analyticsData);
      }
    }).catch(console.error);
  }, [usingExternalData]);

  // Computed live from the fetched bridge register (bridges_by_region /
  // condition_overall in analytics.json can drift out of sync with the live
  // registry as records are reclassified — see analytics.json audit note).
  const conditionOverall = useMemo(() => countChartField(bridges, 'OverallCondition'), [bridges]);

  const metrics = useMemo(() => {
    if (!bridges.length) return { rated: 0, poor: 0, averageAadt: 0, averageLength: 0, lengthSampleSize: 0 };

    const rated = Object.entries(conditionOverall)
      .filter(([k]) => k !== 'Unknown')
      .reduce((sum, entry) => sum + entry[1], 0);

    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor']
      .reduce((sum, k) => sum + (conditionOverall[k] || 0), 0);

    // Calculate traffic from top-level fields
    const traffic = bridges.filter((row) => Number(row.Traffic?.aadt_2026 ?? row.aadt_rebuilt_2026 ?? row.current_predicted_aadt) > 0);
    const averageAadt = traffic.length
      ? Math.round(traffic.reduce((sum, row) => sum + Number(row.Traffic?.aadt_2026 ?? row.aadt_rebuilt_2026 ?? row.current_predicted_aadt), 0) / traffic.length)
      : 0;

    // Average bridge deck length -- a plain arithmetic mean over every record
    // with a recorded, positive length on file (no outlier trimming, so this
    // is disclosed as a sample size alongside the mean rather than presented
    // as covering the full register).
    const lengths = bridges.map((row) => Number(row.length)).filter((v) => Number.isFinite(v) && v > 0);
    const averageLength = lengths.length ? Math.round((lengths.reduce((sum, v) => sum + v, 0) / lengths.length) * 10) / 10 : 0;

    return { rated, poor, averageAadt, averageLength, lengthSampleSize: lengths.length };
  }, [bridges, conditionOverall]);

  // Culverts get the same treatment as bridges -- computed separately, never
  // folded into the bridge figures (bridges and major culverts are always
  // reported as distinct structure classes on this platform).
  const conditionOverallCulverts = useMemo(() => countChartField(culverts, 'OverallCondition'), [culverts]);

  const culvertMetrics = useMemo(() => {
    if (!culverts.length) return { rated: 0, poor: 0, averageLength: 0, lengthSampleSize: 0 };

    const rated = Object.entries(conditionOverallCulverts)
      .filter(([k]) => k !== 'Unknown')
      .reduce((sum, entry) => sum + entry[1], 0);

    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor']
      .reduce((sum, k) => sum + (conditionOverallCulverts[k] || 0), 0);

    const lengths = culverts.map((row) => Number(row.CulvertLength)).filter((v) => Number.isFinite(v) && v > 0);
    const averageLength = lengths.length ? Math.round((lengths.reduce((sum, v) => sum + v, 0) / lengths.length) * 10) / 10 : 0;

    return { rated, poor, averageLength, lengthSampleSize: lengths.length };
  }, [culverts, conditionOverallCulverts]);

  const trafficBins = analytics?.traffic_bins;

  const categoryChartData = useMemo(() => Object.fromEntries(categoricalChartFields.map((field) => [
    field.id,
    field.labelFn ? countChartFieldWithLabelFn(bridges, field.id, field.labelFn) : countChartField(bridges, field.id, field.dictionary),
  ])), [bridges]);

  const categoryChartDataCulverts = useMemo(() => Object.fromEntries(categoricalCulvertChartFields.map((field) => [
    field.id,
    field.labelFn ? countChartFieldWithLabelFn(culverts, field.id, field.labelFn) : countChartField(culverts, field.id),
  ])), [culverts]);

  const priorityRows = useMemo(() => critical.map((row) => ({
    ...row,
    asset: bridges.find((bridgeRow) => bridgeRow.BridgeNumber === row.BridgeNumber),
  })), [bridges, critical]);

  const regionRows = useMemo(() => {
    const bridgesByRegion = countChartField(bridges, 'Region');
    const culvertsByRegion = countChartField(culverts, 'Region');
    const regions = new Set([...Object.keys(bridgesByRegion), ...Object.keys(culvertsByRegion)]);
    return [...regions]
      .filter((region) => region !== 'Unknown')
      .map((region) => ({
        region,
        bridges: bridgesByRegion[region] || 0,
        culverts: culvertsByRegion[region] || 0,
      }))
      .sort((a, b) => (b.bridges + b.culverts) - (a.bridges + a.culverts));
  }, [bridges, culverts]);
  // Records with no region on file are silently dropped from the panel above
  // rather than shown as a row -- surface the drop instead of letting the
  // panel look complete when it is missing coverage.
  const regionMissingCount = useMemo(() => {
    const missingRegion = (v) => !v || v === 'Unknown';
    return bridges.filter((b) => missingRegion(chartFieldValue(b, 'Region'))).length
      + culverts.filter((c) => missingRegion(chartFieldValue(c, 'Region'))).length;
  }, [bridges, culverts]);

  const stationRows = useMemo(() => {
    const stationMap = new Map();
    bridges.forEach(b => {
      const st = (b.LegacyData?.maintenanc || b.LegacyData?.maintenance_station || b.MaintenanceStation || b.maintenanc || 'Unknown').trim();
      if (!stationMap.has(st)) stationMap.set(st, { bridges: 0, culverts: 0 });
      stationMap.get(st).bridges++;
    });
    culverts.forEach(c => {
      const st = (c.MaintenanceStation || c.Maintenance_Station || 'Unknown').trim();
      if (!stationMap.has(st)) stationMap.set(st, { bridges: 0, culverts: 0 });
      stationMap.get(st).culverts++;
    });
    return Array.from(stationMap.entries())
      .map(([station, counts]) => ({ station, ...counts }))
      .filter(r => r.station !== 'Unknown' && r.station !== '-' && r.station !== '')
      .sort((a, b) => (b.bridges + b.culverts) - (a.bridges + a.culverts));
  }, [bridges, culverts]);
  // Same silent-drop issue as regions: records with no station on file never
  // appear in the panel, so disclose the count that's missing.
  const stationMissingCount = useMemo(() => {
    const missingStation = (v) => !v || ['Unknown', '-', ''].includes(String(v).trim());
    const bridgeMissing = bridges.filter((b) => missingStation(b.LegacyData?.maintenanc || b.LegacyData?.maintenance_station || b.MaintenanceStation || b.maintenanc)).length;
    const culvertMissing = culverts.filter((c) => missingStation(c.MaintenanceStation || c.Maintenance_Station)).length;
    return bridgeMissing + culvertMissing;
  }, [bridges, culverts]);

  const roadRows = useMemo(() => {
    const roadMap = new Map();
    bridges.forEach(b => {
      const rd = (b.RoadDescrPrincipal || b.RoadName || 'Unknown').trim();
      if (!roadMap.has(rd)) roadMap.set(rd, { bridges: 0, culverts: 0 });
      roadMap.get(rd).bridges++;
    });
    culverts.forEach(c => {
      const rd = (c.Road || c.Link__Name || 'Unknown').trim();
      if (!roadMap.has(rd)) roadMap.set(rd, { bridges: 0, culverts: 0 });
      roadMap.get(rd).culverts++;
    });
    return Array.from(roadMap.entries())
      .map(([road, counts]) => ({ road, ...counts }))
      .filter(r => r.road !== 'Unknown' && r.road !== '-' && r.road !== '')
      .sort((a, b) => (b.bridges + b.culverts) - (a.bridges + a.culverts));
  }, [bridges, culverts]);
  // Same silent-drop issue as regions/stations for road name.
  const roadMissingCount = useMemo(() => {
    const missingRoad = (v) => !v || ['Unknown', '-', ''].includes(String(v).trim());
    const bridgeMissing = bridges.filter((b) => missingRoad(b.RoadDescrPrincipal || b.RoadName)).length;
    const culvertMissing = culverts.filter((c) => missingRoad(c.Road || c.Link__Name)).length;
    return bridgeMissing + culvertMissing;
  }, [bridges, culverts]);

  const conditionChartOptions = useMemo(() => {
    if (!bridges.length) return {};
    const neonFor = (label) => (
      label === 'Beyond Repair' || label === 'Critical' || label === 'Very Poor' ? '#ff073a' :
      label === 'Poor' ? '#ff5f1f' :
      label === 'Marginal' || label === 'Fair' ? '#ffea00' :
      label === 'Satisfactory' ? '#c6ff00' : '#39ff14'
    );
    const rawData = CONDITION_ORDER.map((label) => ({ name: label, value: conditionOverall[label] || 0 })).filter((d) => d.value > 0);
    const total = rawData.reduce((sum, d) => sum + d.value, 0);
    const data = rawData.map((d) => {
      const hex = neonFor(d.name);
      return { name: d.name, value: d.value, itemStyle: neonItemStyle(hex), emphasis: neonEmphasisStyle(hex) };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(10, 18, 36, 0.95)',
        borderColor: NEON_AXIS,
        textStyle: { color: '#e8fbff' },
        formatter: (params) => {
          const p = params[0];
          const pct = total ? ((p.value / total) * 100).toFixed(1) : '0.0';
          return `<strong>${p.name}</strong><br/>Count: ${p.value.toLocaleString()} (${pct}%)`;
        },
      },
      toolbox: neonToolbox,
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: { color: chartTextStyle.color, fontWeight: 700, interval: 0, rotate: 25 },
        axisLine: { lineStyle: { color: NEON_AXIS } },
        axisTick: { lineStyle: { color: NEON_AXIS } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: chartTextStyle.color },
        axisLine: { lineStyle: { color: NEON_AXIS } },
        splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.12)' } }
      },
      series: [
        {
          name: 'Condition',
          type: 'bar',
          data: data,
          label: { show: true, position: 'top', color: chartTextStyle.color, fontWeight: 800 }
        }
      ]
    };
  }, [bridges, conditionOverall]);

  if (!analytics) {
    return <div className="page-loader"><div className="spinner" /><span>Loading network status...</span></div>;
  }

  return (
    <div className="overview-layout">
      <section className="kpi-grid" aria-label="Network summary">
        <article className="kpi-card">
          <div className="kpi-icon blue"><Landmark size={21} /></div>
          <span className="kpi-eyebrow">Bridge register</span>
          <strong>{bridges.length.toLocaleString()}</strong>
          <p>Bridges in the national inventory</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon blue"><Landmark size={21} /></div>
          <span className="kpi-eyebrow">Culvert register</span>
          <strong>{culverts.length.toLocaleString()}</strong>
          <p>Major culverts in the national inventory</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon red"><AlertTriangle size={21} /></div>
          <span className="kpi-eyebrow">Immediate attention</span>
          {/* Bare count reads as complete on its own -- scope it against the
              real bridge register length rather than a hardcoded total. */}
          <strong>{critical.length} of {bridges.length}</strong>
          <p>Bridges in the critical registry</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon blue"><ClipboardCheck size={21} /></div>
          <span className="kpi-eyebrow">Condition coverage</span>
          <strong>{bridges.length ? Math.round((metrics.rated / bridges.length) * 100) : 0}%</strong>
          <p>{metrics.rated} bridge records with a condition category</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon amber"><TrendingUp size={21} /></div>
          <span className="kpi-eyebrow">Average demand</span>
          <strong>{metrics.averageAadt.toLocaleString()}</strong>
          <p>Estimated vehicles per day across linked bridges</p>
        </article>
      </section>

      <section className="overview-grid" style={{ gap: '16px' }}>
        <article className="panel condition-panel glass-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div><span className="panel-kicker">Network health</span><h2>Bridge condition distribution</h2></div>
            <button className="text-button" style={{ fontWeight: 800 }} onClick={() => onNavigate('analytics')}>Full analytics <ArrowRight size={15} /></button>
          </div>
          <div style={{ height: '300px', position: 'relative', marginTop: '16px' }}>
            <ReactECharts option={conditionChartOptions} style={{ height: '100%', width: '100%', position: 'absolute' }} />
          </div>
        </article>

        <article className="panel coverage-panel glass-card">
          <div className="panel-header"><div><span className="panel-kicker">Regional coverage</span><h2>Structures by maintenance region</h2></div></div>
          {/* Records with no region on file are excluded from the rows above --
              disclose the drop instead of letting the panel look complete. */}
          {regionMissingCount > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 8px', padding: '0 16px' }}>{regionMissingCount} records have no region on file and are not shown below.</p>
          )}
          <div className="region-list">
            {regionRows.map((row) => (
              <div className="region-row" key={row.region}>
                <MapPin size={15} />
                <strong>{row.region}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-grid" style={{ gap: '16px', marginTop: '16px' }}>
        <article className="panel coverage-panel glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <div className="panel-header" style={{ flexShrink: 0 }}><div><span className="panel-kicker">Station coverage</span><h2>Structures by maintenance station</h2></div></div>
          {stationMissingCount > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 8px', padding: '0 16px' }}>{stationMissingCount} records have no station on file and are not shown below.</p>
          )}
          <div className="region-list modern-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {stationRows.map((row) => (
              <div className="region-row" key={row.station}>
                <HardHat size={15} />
                <strong>{row.station}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel coverage-panel glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <div className="panel-header" style={{ flexShrink: 0 }}><div><span className="panel-kicker">Route coverage</span><h2>Structures by road name</h2></div></div>
          {roadMissingCount > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 8px', padding: '0 16px' }}>{roadMissingCount} records have no road name on file and are not shown below.</p>
          )}
          <div className="region-list modern-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {roadRows.map((row) => (
              <div className="region-row" key={row.road}>
                <Route size={15} />
                <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.road}>{row.road}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-grid lower" style={{ gap: '16px' }}>
        <article className="panel priority-panel glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          <div className="panel-header" style={{ flexShrink: 0 }}>
            <div><span className="panel-kicker">Immediate interventions</span><h2>Critical structures</h2></div>
            <button className="text-button" onClick={() => onNavigate('critical_structures')}>Review critical registry <ArrowRight size={15} /></button>
          </div>
          <div className="priority-table" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="priority-table-head"><span>Structure</span><span>Location</span><span>Condition</span><span>Action note</span></div>
            <div className="modern-scroll" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
              {priorityRows.map((row) => (
                <button
                  className="priority-table-row"
                  key={`${row.BridgeNumber}-${row.LinkID}`}
                  onClick={() => row.asset && onSelectAsset({ ...row.asset, _structureType: 'bridge' })}
                >
                  <span><strong>{row.BridgeNumber}</strong><small>{row.BridgeName ? toProperCase(row.BridgeName) : 'Unnamed bridge'}</small></span>
                  <span><strong>{row.MaintenanceStation || 'Unassigned'}</strong><small>{row.LinkName || row.LinkID}</small></span>
                  <span><em className={`condition-pill ${CONDITION_CLASS[getConditionLabel(row.OverallRating)] || 'condition-watch'}`}>{getConditionLabel(row.OverallRating)}</em></span>
                  <span>{row.Comment || 'Engineering review required'}</span>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="panel quick-actions-panel glass-card">
          <div className="panel-header"><div><span className="panel-kicker">Work areas</span><h2>Operational shortcuts</h2></div></div>
          <button onClick={() => onNavigate('map')}><MapPin size={18} /><span><strong>Open network map</strong><small>Locate and inspect structures</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('inventory')}><Route size={18} /><span><strong>National asset register</strong><small>Search bridge and culvert tables</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('maintenance')}><HardHat size={18} /><span><strong>Maintenance priorities</strong><small>Review urgent interventions</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('photos')}><Camera size={18} /><span><strong>Evidence photo library</strong><small>Browse all indexed structure photos</small></span><ArrowRight size={16} /></button>
          <div className="data-assurance"><CheckCircle2 size={18} /><span><strong>Data assurance active</strong><small>National-road coordinates and host links validated</small></span></div>
        </article>
      </section>

      <section className="overview-grid" style={{ gap: '16px', marginTop: '16px' }}>
        <SummaryPanel
          kicker="Bridges"
          title="Bridges Summary"
          stats={[
            { label: 'Total bridges', value: bridges.length.toLocaleString() },
            { label: 'Condition rated', value: bridges.length ? `${Math.round((metrics.rated / bridges.length) * 100)}%` : '0%', note: `${metrics.rated.toLocaleString()} of ${bridges.length.toLocaleString()} records` },
            { label: 'Poor or worse', value: metrics.poor.toLocaleString(), note: bridges.length ? `${Math.round((metrics.poor / bridges.length) * 100)}% of register` : undefined },
            { label: 'Average AADT', value: metrics.averageAadt.toLocaleString(), note: 'Estimated vehicles/day' },
            { label: 'Average deck length', value: metrics.averageLength ? `${metrics.averageLength} m` : '—', note: `n=${metrics.lengthSampleSize.toLocaleString()} with length on file` },
          ]}
        />
        <SummaryPanel
          kicker="Culverts"
          title="Culverts Summary"
          stats={[
            { label: 'Total culverts', value: culverts.length.toLocaleString() },
            { label: 'Condition rated', value: culverts.length ? `${Math.round((culvertMetrics.rated / culverts.length) * 100)}%` : '0%', note: `${culvertMetrics.rated.toLocaleString()} of ${culverts.length.toLocaleString()} records` },
            { label: 'Poor or worse', value: culvertMetrics.poor.toLocaleString(), note: culverts.length ? `${Math.round((culvertMetrics.poor / culverts.length) * 100)}% of register` : undefined },
            { label: 'Average length', value: culvertMetrics.averageLength ? `${culvertMetrics.averageLength} m` : '—', note: `n=${culvertMetrics.lengthSampleSize.toLocaleString()} with length on file` },
          ]}
        />
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Bridges — data dictionary explorer</span><h2>Categorical engineering fields</h2></div>
      </section>
      <section className="analytics-grid">
        <ChartPanel kicker="Network demand" title="Traffic Demand Bands" data={trafficBins} />
        <GroupedChartPanel kicker="Cross-tabulation" title="Bridges — Surface Type by Functional Class" rows={bridges} rowField="surface_ty" colField="road_class" xName="Functional Class" />
        {categoricalChartFields.map((field) => (
          <ChartPanel
            key={field.id}
            kicker="Dictionary field"
            title={field.label}
            data={categoryChartData[field.id]}
          />
        ))}
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Culverts — data dictionary explorer</span><h2>Categorical engineering fields</h2></div>
      </section>
      <section className="analytics-grid">
        <GroupedChartPanel kicker="Cross-tabulation" title="Culverts — Surface Type by Functional Class" rows={culverts} rowField="Surface_Type" colField="Road_Class" xName="Functional Class" />
        {categoricalCulvertChartFields.map((field) => (
          <ChartPanel
            key={field.id}
            kicker="Dictionary field"
            title={field.label}
            data={categoryChartDataCulverts[field.id]}
          />
        ))}
      </section>
    </div>
  );
}
