import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchBridges, fetchCulverts } from '../services/bmsDataService';
import { TYPE_DECK_MATERIAL, TYPE_EXPANSION_JOINTS, getDictionaryLabel } from '../utils/dataDictionary';
import {
  chartTextStyle,
  NEON_AXIS,
  chartColors,
  hexToRgba,
  neonItemStyle,
  neonToolbox,
  neonTooltipBase,
} from '../utils/chartTheme';

// ── Shared helpers (mirrors CrossAnalysis.jsx / VisualAnalytics.jsx conventions) ─

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent'];
const CURRENT_YEAR = 2026;

const conditionRank = (cond) => {
  const i = CONDITION_ORDER.indexOf(cond);
  return i >= 0 ? i : null;
};

const countBy = (rows, accessor) => rows.reduce((counts, row) => {
  const raw = accessor(row) || 'Unknown';
  counts[raw] = (counts[raw] || 0) + 1;
  return counts;
}, {});

const sortedNonUnknownKeys = (counts) => Object.keys(counts).filter((k) => k !== 'Unknown').sort();

const pearsonR = (pairs) => {
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((s, [x]) => s + x, 0) / n;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  pairs.forEach(([x, y]) => {
    const dx = x - mx, dy = y - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  });
  const denom = Math.sqrt(dx2 * dy2);
  return denom ? Math.round((num / denom) * 1000) / 1000 : null;
};

function ChartCard({ kicker, title, note, height = 380, wide = false, option }) {
  return (
    <article className={`panel chart-panel glass-card${wide ? ' wide' : ''}`}>
      <div className="panel-header">
        <div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div>
      </div>
      {note && <p className="stat-formula-note">{note}</p>}
      <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge />
    </article>
  );
}

// ── Chart option builders ────────────────────────────────────────────────────

function stackedPercentOption(groups, conditions, seriesData) {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase,
      formatter: (params) => `<strong>${params[0].axisValue}</strong><br/>${params.map((p) => `${p.marker} ${p.seriesName}: ${p.value}%`).join('<br/>')}`,
    },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 }, type: 'scroll' },
    grid: { left: '6%', right: '5%', bottom: '18%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: groups, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 25 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', max: 100, name: '% of group', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10, formatter: '{value}%' }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: conditions.map((cond, i) => ({
      name: cond,
      type: 'bar',
      stack: 'total',
      data: seriesData[cond],
      itemStyle: neonItemStyle(chartColors[i % chartColors.length]),
    })),
  };
}

function barOption(categories, values, { yName = 'Count', rotate = 0, colorOffset = 0 } = {}) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase },
    toolbox: neonToolbox,
    grid: { left: '7%', right: '5%', bottom: rotate ? '18%' : '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10, rotate }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({ value: v, itemStyle: neonItemStyle(chartColors[(i + colorOffset) % chartColors.length]) })),
    }],
  };
}

function avgRankLineOption(categories, values, counts, yName = 'Avg. condition rank (0=worst, 9=best)') {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...neonTooltipBase,
      formatter: (p) => `<strong>${p[0].axisValue}</strong><br/>Avg rank: ${p[0].value != null ? p[0].value.toFixed(2) : 'n/a'}<br/>n=${counts[p[0].dataIndex].toLocaleString()}`,
    },
    toolbox: neonToolbox,
    grid: { left: '7%', right: '5%', bottom: '14%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: yName, min: 0, max: 9, nameTextStyle: { ...chartTextStyle, fontSize: 10 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbolSize: 8,
      lineStyle: { color: '#64d2ff', width: 3, shadowBlur: 12, shadowColor: 'rgba(100, 210, 255,0.7)' },
      itemStyle: { color: '#64d2ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: hexToRgba('#64d2ff', 0.35) }, { offset: 1, color: hexToRgba('#64d2ff', 0) }] } },
    }],
  };
}

function corrMatrixOption(labels, matrix) {
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', ...neonTooltipBase, formatter: (p) => `${labels[p.value[0]]} × ${labels[p.value[1]]}<br/>r = ${p.value[2]}` },
    toolbox: neonToolbox,
    grid: { left: '22%', right: '5%', bottom: '22%', top: '8%' },
    xAxis: { type: 'category', data: labels, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 20 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    yAxis: { type: 'category', data: labels, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    visualMap: {
      min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: chartTextStyle.color },
      inRange: { color: ['#ff453a', 'rgba(10,18,36,0.4)', '#64d2ff'] },
    },
    series: [{
      type: 'heatmap',
      data: matrix,
      label: { show: true, color: '#e8fbff', fontSize: 10, fontWeight: 700 },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.7)' } },
    }],
  };
}

function countHeatmapOption(xCats, yCats, data) {
  const maxVal = Math.max(1, ...data.map((d) => d[2]));
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', ...neonTooltipBase, formatter: (p) => `${yCats[p.value[1]]} × ${xCats[p.value[0]]}<br/>${p.value[2].toLocaleString()} record(s)` },
    toolbox: neonToolbox,
    grid: { left: '18%', right: '5%', bottom: '10%', top: '8%' },
    xAxis: { type: 'category', data: xCats, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    yAxis: { type: 'category', data: yCats, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    visualMap: {
      min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: chartTextStyle.color },
      inRange: { color: ['rgba(10,18,36,0.4)', '#64d2ff', '#bf5af2'] },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: true, color: '#e8fbff', fontSize: 10, fontWeight: 700 },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.7)' } },
    }],
  };
}

function groupedBarOption(categories, series) {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase,
      formatter: (params) => `<strong>${params[0].axisValue}</strong><br/>${params.map((p) => `${p.marker} ${p.seriesName}: ${p.value}%`).join('<br/>')}`,
    },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 }, type: 'scroll' },
    grid: { left: '6%', right: '5%', bottom: '18%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 20 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', max: 100, name: '% of group', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10, formatter: '{value}%' }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: series.map((s, i) => ({ ...s, type: 'bar', itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
  };
}

function scatterOption(points, xName, yName) {
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${xName}: ${p.value[0]}<br/>${yName}: ${CONDITION_ORDER[p.value[1]] || 'n/a'}` },
    toolbox: neonToolbox,
    grid: { left: '8%', right: '6%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'value', name: xName, nameLocation: 'middle', nameGap: 28, nameTextStyle: { ...chartTextStyle, fontSize: 11 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    yAxis: {
      type: 'value', name: yName, min: 0, max: 9, nameTextStyle: { ...chartTextStyle, fontSize: 11 },
      axisLabel: { ...chartTextStyle, fontSize: 9, formatter: (v) => CONDITION_ORDER[Math.round(v)]?.slice(0, 4) || '' },
      axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } },
    },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: points,
      itemStyle: { color: hexToRgba('#64d2ff', 0.65), borderColor: '#64d2ff', borderWidth: 1 },
    }],
  };
}

// ── Bucketing helpers ────────────────────────────────────────────────────────

const AGE_BUCKETS = ['0–9 yrs', '10–19 yrs', '20–29 yrs', '30–49 yrs', '50+ yrs'];
const ageBucket = (age) => {
  if (age == null) return null;
  if (age < 10) return AGE_BUCKETS[0];
  if (age < 20) return AGE_BUCKETS[1];
  if (age < 30) return AGE_BUCKETS[2];
  if (age < 50) return AGE_BUCKETS[3];
  return AGE_BUCKETS[4];
};

const RECENCY_BUCKETS = ['0–4 yrs ago', '5–9 yrs ago', '10–19 yrs ago', '20+ yrs ago'];
const recencyBucket = (yrs) => {
  if (yrs == null) return null;
  if (yrs < 5) return RECENCY_BUCKETS[0];
  if (yrs < 10) return RECENCY_BUCKETS[1];
  if (yrs < 20) return RECENCY_BUCKETS[2];
  return RECENCY_BUCKETS[3];
};

const AADT_BUCKETS = ['<1,000', '1,000–4,999', '5,000–14,999', '15,000+'];
const aadtBucket = (v) => {
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v < 1000) return AADT_BUCKETS[0];
  if (v < 5000) return AADT_BUCKETS[1];
  if (v < 15000) return AADT_BUCKETS[2];
  return AADT_BUCKETS[3];
};

const PAVE_AGE_BUCKETS = ['0–9 yrs', '10–19 yrs', '20–29 yrs', '30+ yrs'];
const paveAgeBucket = (v) => {
  if (!Number.isFinite(v) || v < 0) return null;
  if (v < 10) return PAVE_AGE_BUCKETS[0];
  if (v < 20) return PAVE_AGE_BUCKETS[1];
  if (v < 30) return PAVE_AGE_BUCKETS[2];
  return PAVE_AGE_BUCKETS[3];
};

function avgRankByBucket(rows, bucketOrder, bucketFn, condFn) {
  const sums = {}; const counts = {};
  bucketOrder.forEach((b) => { sums[b] = 0; counts[b] = 0; });
  let excluded = 0;
  rows.forEach((r) => {
    const bucket = bucketFn(r);
    const rank = conditionRank(condFn(r));
    if (bucket == null || rank == null) { excluded += 1; return; }
    sums[bucket] += rank; counts[bucket] += 1;
  });
  const present = bucketOrder.filter((b) => counts[b] > 0);
  return {
    categories: present,
    values: present.map((b) => Math.round((sums[b] / counts[b]) * 100) / 100),
    counts: present.map((b) => counts[b]),
    excluded,
  };
}

const effectiveYear = (r) => {
  const completion = Number(r.Completion_Year);
  const rehab = Number(r.Rehabilitation_Year);
  const candidates = [completion, rehab].filter((v) => Number.isFinite(v) && v > 1900 && v <= CURRENT_YEAR);
  if (candidates.length) return Math.max(...candidates);
  const lastInterv = Number(r.Year_of_Last_Interventation);
  if (Number.isFinite(lastInterv) && lastInterv > 1900 && lastInterv <= CURRENT_YEAR) return lastInterv;
  return null;
};
const ageOf = (r) => { const y = effectiveYear(r); return y ? CURRENT_YEAR - y : null; };

function stackedByBucket(rows, bucketOrder, bucketFn, condFn) {
  const conditionSet = CONDITION_ORDER.filter((c) => rows.some((r) => condFn(r) === c));
  const groups = bucketOrder.filter((b) => rows.some((r) => bucketFn(r) === b));
  const seriesData = {};
  conditionSet.forEach((cond) => { seriesData[cond] = []; });
  let excluded = 0;
  groups.forEach((g) => {
    const inGroup = rows.filter((r) => bucketFn(r) === g);
    const total = inGroup.length;
    conditionSet.forEach((cond) => {
      const n = inGroup.filter((r) => (condFn(r) || 'Unknown') === cond).length;
      seriesData[cond].push(total ? Math.round((n / total) * 1000) / 10 : 0);
    });
  });
  rows.forEach((r) => { if (bucketFn(r) == null) excluded += 1; });
  return { groups, conditions: conditionSet, seriesData, excluded };
}

// ── Main component ──────────────────────────────────────────────────────────

export default function DeteriorationAnalysis({ bridges: bridgesProp, culverts: culvertsProp }) {
  const usingExternalData = bridgesProp !== undefined && culvertsProp !== undefined;
  const [fetchedBridges, setFetchedBridges] = useState([]);
  const [fetchedCulverts, setFetchedCulverts] = useState([]);
  const bridges = usingExternalData ? bridgesProp : fetchedBridges;
  const culverts = usingExternalData ? culvertsProp : fetchedCulverts;

  useEffect(() => {
    if (usingExternalData) return;
    Promise.all([fetchBridges(), fetchCulverts()]).then(([b, c]) => {
      setFetchedBridges(b);
      setFetchedCulverts(c);
    }).catch(console.error);
  }, [usingExternalData]);

  const bCond = (r) => r.OverallCondition || 'Unknown';
  const cCond = (r) => r.OverallCondition || 'Unknown';

  // ── Bridges: risk-factor proxies (no genuine construction-year field exists) ─
  const bDeckMaterial = useMemo(() => stackedByBucket(
    bridges,
    Object.values(TYPE_DECK_MATERIAL).filter((v) => v !== 'Unknown'),
    (r) => { const label = getDictionaryLabel(TYPE_DECK_MATERIAL, r.type_deck_material); return label === r.type_deck_material || !r.type_deck_material ? null : label; },
    bCond,
  ), [bridges]);

  const bJointType = useMemo(() => stackedByBucket(
    bridges,
    Object.values(TYPE_EXPANSION_JOINTS).filter((v) => v !== 'Unknown'),
    (r) => { const label = getDictionaryLabel(TYPE_EXPANSION_JOINTS, r.type_exp_joints); return label === r.type_exp_joints || !r.type_exp_joints ? null : label; },
    bCond,
  ), [bridges]);

  const bJointCount = useMemo(() => {
    const jointsOf = (r) => { const v = Number(r.no_of_exp_joints ?? r.no_expansion_joints); return Number.isFinite(v) ? String(v) : null; };
    return avgRankByBucket(bridges, ['0', '1', '2', '3', '4', '5', '6', '7'], jointsOf, bCond);
  }, [bridges]);

  const bScour = useMemo(() => stackedByBucket(
    bridges, ['Yes (scour risk)', 'No', 'Unknown risk'],
    (r) => (r.scour_risk === 'Y' ? 'Yes (scour risk)' : r.scour_risk === 'N' ? 'No' : (r.scour_risk === 'U' ? 'Unknown risk' : null)),
    bCond,
  ), [bridges]);

  const bAadt = useMemo(() => {
    const aadtOf = (r) => Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt ?? r.aadt_2025);
    return stackedByBucket(bridges, AADT_BUCKETS, (r) => aadtBucket(aadtOf(r)), bCond);
  }, [bridges]);

  const bPaveAge = useMemo(() => avgRankByBucket(
    bridges, PAVE_AGE_BUCKETS,
    (r) => paveAgeBucket(Number(r.pave_age)),
    bCond,
  ), [bridges]);

  const bRiskCorr = useMemo(() => {
    const fields = [
      { label: 'AADT', accessor: (r) => Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt ?? r.aadt_2025) },
      { label: 'Pavement age', accessor: (r) => Number(r.pave_age) },
      { label: 'No. exp. joints', accessor: (r) => Number(r.no_of_exp_joints ?? r.no_expansion_joints) },
      { label: 'Deck length', accessor: (r) => Number(r.length ?? r.bridge_len) },
      { label: 'Condition rating', accessor: (r) => Number(r.OverallConditionRating) },
    ];
    const labels = fields.map((f) => f.label);
    const matrix = [];
    fields.forEach((fi, i) => {
      fields.forEach((fj, j) => {
        if (i === j) { matrix.push([i, j, 1]); return; }
        const pairs = bridges.map((r) => [fi.accessor(r), fj.accessor(r)]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && (fi.label !== 'Condition rating' || x >= 0) && (fj.label !== 'Condition rating' || y >= 0) && (fi.label === 'Condition rating' || x > 0) && (fj.label === 'Condition rating' || y > 0));
        matrix.push([i, j, pearsonR(pairs) ?? 0]);
      });
    });
    return { labels, matrix };
  }, [bridges]);

  const bRiskScore = useMemo(() => {
    const aadtOf = (r) => Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt ?? r.aadt_2025);
    const aadtValues = bridges.map(aadtOf).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
    const q3 = aadtValues.length ? aadtValues[Math.floor(aadtValues.length * 0.75)] : Infinity;
    const scoreOf = (r) => {
      const scour = r.scour_risk;
      const aadt = aadtOf(r);
      const joints = Number(r.no_of_exp_joints ?? r.no_expansion_joints);
      if ((scour !== 'Y' && scour !== 'N') || !Number.isFinite(aadt) || aadt <= 0 || !Number.isFinite(joints)) return null;
      let score = 0;
      if (scour === 'Y') score += 1;
      if (aadt >= q3) score += 1;
      if (joints >= 4) score += 1;
      return `${score} risk factor${score === 1 ? '' : 's'}`;
    };
    return stackedByBucket(bridges, ['0 risk factors', '1 risk factor', '2 risk factors', '3 risk factors'], scoreOf, bCond);
  }, [bridges]);

  const bScourRegion = useMemo(() => {
    const regions = sortedNonUnknownKeys(countBy(bridges, (r) => r.Region));
    const cats = ['Yes', 'No', 'Unknown'];
    const data = [];
    regions.forEach((region, yi) => {
      const inRegion = bridges.filter((r) => (r.Region || 'Unknown') === region);
      cats.forEach((cat, xi) => {
        const n = inRegion.filter((r) => (cat === 'Yes' ? r.scour_risk === 'Y' : cat === 'No' ? r.scour_risk === 'N' : (r.scour_risk !== 'Y' && r.scour_risk !== 'N'))).length;
        data.push([xi, yi, n]);
      });
    });
    return { regions, cats, data };
  }, [bridges]);

  const bDeckPareto = useMemo(() => {
    const counts = countBy(bridges, (r) => { const label = getDictionaryLabel(TYPE_DECK_MATERIAL, r.type_deck_material); return (!r.type_deck_material || label === r.type_deck_material) ? 'Unknown' : label; });
    return Object.entries(counts).filter(([k]) => k !== 'Unknown').sort((a, b) => b[1] - a[1]);
  }, [bridges]);

  // ── Culverts: genuine construction/rehabilitation-year deterioration analysis ─
  const cAgeCoverage = useMemo(() => {
    const withAge = culverts.filter((r) => ageOf(r) != null).length;
    return { withAge, total: culverts.length };
  }, [culverts]);

  const cAgeHistogram = useMemo(() => {
    const buckets = {}; AGE_BUCKETS.forEach((b) => { buckets[b] = 0; });
    culverts.forEach((r) => { const b = ageBucket(ageOf(r)); if (b) buckets[b] += 1; });
    const present = AGE_BUCKETS.filter((b) => buckets[b] > 0);
    return { categories: present, values: present.map((b) => buckets[b]) };
  }, [culverts]);

  const cAgeCondition = useMemo(() => stackedByBucket(culverts, AGE_BUCKETS, (r) => ageBucket(ageOf(r)), cCond), [culverts]);
  const cAgeRankTrend = useMemo(() => avgRankByBucket(culverts, AGE_BUCKETS, (r) => ageBucket(ageOf(r)), cCond), [culverts]);

  const cCompletionTimeline = useMemo(() => {
    const buckets = {};
    culverts.forEach((r) => {
      const y = Number(r.Completion_Year);
      if (!Number.isFinite(y) || y <= 1900 || y > CURRENT_YEAR) return;
      const decade = `${Math.floor(y / 10) * 10}s`;
      buckets[decade] = (buckets[decade] || 0) + 1;
    });
    const cats = Object.keys(buckets).sort();
    return { categories: cats, values: cats.map((c) => buckets[c]) };
  }, [culverts]);

  const cRecencyCondition = useMemo(() => stackedByBucket(
    culverts, RECENCY_BUCKETS,
    (r) => { const y = Number(r.Year_of_Last_Interventation); const yrs = Number.isFinite(y) && y > 1900 ? CURRENT_YEAR - y : null; return recencyBucket(yrs); },
    cCond,
  ), [culverts]);

  const cAgeByRegion = useMemo(() => {
    const regions = sortedNonUnknownKeys(countBy(culverts, (r) => r.Region));
    const stats = regions.map((region) => {
      const ages = culverts.filter((r) => (r.Region || 'Unknown') === region).map(ageOf).filter((a) => a != null);
      return { region, avgAge: ages.length ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10 : null };
    }).filter((s) => s.avgAge != null);
    return { categories: stats.map((s) => s.region), values: stats.map((s) => s.avgAge) };
  }, [culverts]);

  const cAgeScatter = useMemo(() => {
    const points = [];
    let excluded = 0;
    culverts.forEach((r) => {
      const age = ageOf(r);
      const rank = conditionRank(cCond(r));
      if (age == null || rank == null) { excluded += 1; return; }
      points.push([age, rank]);
    });
    return { points, excluded };
  }, [culverts]);

  const cAgeCorr = useMemo(() => {
    const fields = [
      { label: 'Age (yrs)', accessor: (r) => ageOf(r) },
      { label: 'Length', accessor: (r) => Number(r.CulvertLength) },
      { label: 'Span/diameter', accessor: (r) => Number(r.SpanOrDiameter) },
      { label: 'Condition rating', accessor: (r) => Number(r.OverallConditionRating) },
    ];
    const labels = fields.map((f) => f.label);
    const matrix = [];
    fields.forEach((fi, i) => {
      fields.forEach((fj, j) => {
        if (i === j) { matrix.push([i, j, 1]); return; }
        const pairs = culverts.map((r) => [fi.accessor(r), fj.accessor(r)]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && (fi.label === 'Condition rating' || x > 0) && (fj.label === 'Condition rating' || y > 0));
        matrix.push([i, j, pearsonR(pairs) ?? 0]);
      });
    });
    return { labels, matrix };
  }, [culverts]);

  const cRehabCompare = useMemo(() => stackedByBucket(
    culverts, ['Rehabilitated on record', 'No rehabilitation on record'],
    (r) => (Number(r.Rehabilitation_Year) > 1900 ? 'Rehabilitated on record' : (effectiveYear(r) != null ? 'No rehabilitation on record' : null)),
    cCond,
  ), [culverts]);

  const cTypeAge = useMemo(() => {
    const types = sortedNonUnknownKeys(countBy(culverts, (r) => r.CulvertType));
    const stats = types.map((type) => {
      const ages = culverts.filter((r) => (r.CulvertType || 'Unknown') === type).map(ageOf).filter((a) => a != null);
      return { type, avgAge: ages.length ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10 : null, n: ages.length };
    }).filter((s) => s.avgAge != null && s.n >= 3);
    return { categories: stats.map((s) => s.type), values: stats.map((s) => s.avgAge) };
  }, [culverts]);

  if (!usingExternalData && (!bridges.length || !culverts.length)) {
    return <div className="page-loader"><div className="spinner" /><span>Rendering deterioration analysis…</span></div>;
  }

  return (
    <div className="analytics-layout">
      <section className="category-explorer">
        <div><span className="panel-kicker">Deterioration analysis</span><h2>Bridges — condition vs. engineering risk factors</h2></div>
        <p className="stat-formula-note">
          The bridge register has no genuine construction-year / age field. The panels below use engineering risk-factor
          proxies actually on file — deck material, expansion joints, scour risk, traffic loading (AADT) and pavement
          age (a resurfacing-cycle figure, not the age of the bridge structure itself) — rather than a fabricated age value.
        </p>
      </section>
      <section className="analytics-grid">
        <ChartCard
          kicker="Structural material"
          title="Bridges — Deck Material × Condition (share)"
          option={stackedPercentOption(bDeckMaterial.groups, bDeckMaterial.conditions, bDeckMaterial.seriesData)}
          note={`${bDeckMaterial.excluded.toLocaleString()} bridge(s) with no deck-material code on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Structural detailing"
          title="Bridges — Expansion Joint Type × Condition (share)"
          option={stackedPercentOption(bJointType.groups, bJointType.conditions, bJointType.seriesData)}
          note={`${bJointType.excluded.toLocaleString()} bridge(s) with no expansion-joint-type code on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Structural complexity"
          title="Bridges — No. of Expansion Joints vs Avg Condition Rank"
          option={avgRankLineOption(bJointCount.categories, bJointCount.values, bJointCount.counts)}
          note={`${bJointCount.excluded.toLocaleString()} bridge(s) with no expansion-joint count on file excluded.`}
        />
        <ChartCard
          kicker="Hydraulic risk"
          title="Bridges — Scour Risk × Condition (share)"
          option={stackedPercentOption(bScour.groups, bScour.conditions, bScour.seriesData)}
          note={`${bScour.excluded.toLocaleString()} bridge(s) with no scour-risk assessment on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Traffic loading"
          title="Bridges — Traffic Volume (AADT) × Condition (share)"
          option={stackedPercentOption(bAadt.groups, bAadt.conditions, bAadt.seriesData)}
          note={`${bAadt.excluded.toLocaleString()} bridge(s) with no AADT on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Pavement cycle"
          title="Bridges — Pavement Age vs Avg Condition Rank"
          option={avgRankLineOption(bPaveAge.categories, bPaveAge.values, bPaveAge.counts)}
          note={`Pavement age (last resurfacing), not structure age — ${bPaveAge.excluded.toLocaleString()} bridge(s) with no pavement-age value on file excluded.`}
        />
        <ChartCard
          kicker="Correlation matrix"
          title="Bridges — Risk Factors vs Condition Rating"
          option={corrMatrixOption(bRiskCorr.labels, bRiskCorr.matrix)}
          note="Pearson r, pairwise, using only records with both values on file. Condition rating: 0 = Beyond Repair, 9 = Excellent."
          wide
        />
        <ChartCard
          kicker="Composite risk"
          title="Bridges — Combined Risk-Factor Count × Condition (share)"
          option={stackedPercentOption(bRiskScore.groups, bRiskScore.conditions, bRiskScore.seriesData)}
          note={`Risk factors counted: scour risk = Yes, AADT in the top quartile, 4+ expansion joints. ${bRiskScore.excluded.toLocaleString()} bridge(s) missing one or more inputs excluded.`}
          wide
        />
        <ChartCard
          kicker="Regional pattern"
          title="Bridges — Scour Risk by Region"
          option={countHeatmapOption(bScourRegion.cats, bScourRegion.regions, bScourRegion.data)}
        />
        <ChartCard
          kicker="Ranked contribution"
          title="Bridges — Deck Material Pareto"
          option={barOption(bDeckPareto.map(([n]) => n), bDeckPareto.map(([, v]) => v), { rotate: 20 })}
        />
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Deterioration analysis</span><h2>Culverts — condition vs. structure age</h2></div>
        <p className="stat-formula-note">
          Culverts carry genuine construction/rehabilitation-year data: {cAgeCoverage.withAge.toLocaleString()} of{' '}
          {cAgeCoverage.total.toLocaleString()} culverts have a usable completion, rehabilitation or last-intervention
          year on file, giving a real (not proxied) age for the panels below.
        </p>
      </section>
      <section className="analytics-grid">
        <ChartCard
          kicker="Age distribution"
          title="Culverts — Structure Age (histogram)"
          option={barOption(cAgeHistogram.categories, cAgeHistogram.values)}
        />
        <ChartCard
          kicker="Deterioration"
          title="Culverts — Age × Condition (share)"
          option={stackedPercentOption(cAgeCondition.groups, cAgeCondition.conditions, cAgeCondition.seriesData)}
          note={`${cAgeCondition.excluded.toLocaleString()} culvert(s) with no usable age on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Deterioration trend"
          title="Culverts — Age vs Avg Condition Rank"
          option={avgRankLineOption(cAgeRankTrend.categories, cAgeRankTrend.values, cAgeRankTrend.counts)}
          note={`${cAgeRankTrend.excluded.toLocaleString()} culvert(s) with no usable age or condition on file excluded.`}
        />
        <ChartCard
          kicker="Construction era"
          title="Culverts — Completion Year Timeline"
          option={barOption(cCompletionTimeline.categories, cCompletionTimeline.values, { yName: 'Culverts completed' })}
        />
        <ChartCard
          kicker="Maintenance recency"
          title="Culverts — Years Since Last Intervention × Condition (share)"
          option={stackedPercentOption(cRecencyCondition.groups, cRecencyCondition.conditions, cRecencyCondition.seriesData)}
          note={`${cRecencyCondition.excluded.toLocaleString()} culvert(s) with no intervention year on file excluded.`}
          wide
        />
        <ChartCard
          kicker="Regional pattern"
          title="Culverts — Average Age by Region"
          option={barOption(cAgeByRegion.categories, cAgeByRegion.values, { yName: 'Avg. age (yrs)', rotate: 15 })}
        />
        <ChartCard
          kicker="Age vs condition"
          title="Culverts — Age vs Condition Rating (scatter)"
          option={scatterOption(cAgeScatter.points, 'Age (yrs)', 'Condition rating')}
          note={`${cAgeScatter.excluded.toLocaleString()} culvert(s) with no usable age or condition on file excluded.`}
        />
        <ChartCard
          kicker="Correlation matrix"
          title="Culverts — Age, Size & Condition Correlations"
          option={corrMatrixOption(cAgeCorr.labels, cAgeCorr.matrix)}
          note="Pearson r, pairwise, using only records with both values on file. Condition rating: 0 = Beyond Repair, 9 = Excellent."
          wide
        />
        <ChartCard
          kicker="Intervention effect"
          title="Culverts — Rehabilitated vs Not Rehabilitated (condition share)"
          option={groupedBarOption(cRehabCompare.conditions, cRehabCompare.groups.map((g, i) => ({ name: g, data: cRehabCompare.conditions.map((_, ci) => cRehabCompare.seriesData[cRehabCompare.conditions[ci]][i]) })))}
          note="Compares the condition mix of culverts with a rehabilitation year on file against those with none, among culverts that otherwise have a usable age."
          wide
        />
        <ChartCard
          kicker="Type profile"
          title="Culverts — Average Age by Type"
          option={barOption(cTypeAge.categories, cTypeAge.values, { yName: 'Avg. age (yrs)', rotate: 20 })}
          note="Types with fewer than 3 aged records omitted."
        />
      </section>
    </div>
  );
}
