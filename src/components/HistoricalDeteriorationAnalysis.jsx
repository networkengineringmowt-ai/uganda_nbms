import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  chartTextStyle,
  NEON_AXIS,
  chartColors,
  hexToRgba,
  neonItemStyle,
  neonToolbox,
  neonTooltipBase,
} from '../utils/chartTheme';
import { getConditionColor } from '../utils/dataDictionary';

// ── Historical BMS records (2015 legacy capture + the 2022 nationwide condition
// re-rating survey) recovered from the department's archive and reconciled
// against today's live register by bridge/culvert number. These are the ONLY
// two panels sets on the Dashboard that compare a structure's condition across
// two real points in time -- everything else on the Dashboard describes a
// single snapshot. ──────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;
const CURRENT_YEAR = 2026;

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent'];

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

function TableCard({ kicker, title, note, wide = false, columns, rows, emptyLabel = 'No records to show.' }) {
  // Sort state keyed by column index -- rows here are plain cell-value
  // arrays (not row objects), so sorting compares the cell at sort.index
  // the same numeric-aware way DataTable.jsx does.
  const [sort, setSort] = useState({ index: null, direction: 'asc' });
  const conditionIndex = columns.indexOf('Condition');

  const sortedRows = useMemo(() => {
    if (sort.index === null) return rows;
    return [...rows].sort((a, b) => {
      const aValue = a[sort.index];
      const bValue = b[sort.index];
      const aNumber = Number(String(aValue ?? '').replace(/,/g, ''));
      const bNumber = Number(String(bValue ?? '').replace(/,/g, ''));
      const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [rows, sort]);

  const toggleSort = (index) => setSort((current) => ({
    index,
    direction: current.index === index && current.direction === 'asc' ? 'desc' : 'asc',
  }));

  return (
    <article className={`panel chart-panel glass-card${wide ? ' wide' : ''}`}>
      <div className="panel-header">
        <div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div>
      </div>
      {note && <p className="stat-formula-note">{note}</p>}
      <div className="data-table-container" style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c}>
                  <button className="table-sort-button" type="button" onClick={() => toggleSort(i)}>
                    <span>{c}</span>
                    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {sort.index === i ? (
                        sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} opacity={0.3} />
                      )}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr><td colSpan={columns.length}>{emptyLabel}</td></tr>
            )}
            {sortedRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  // Condition, like every other condition column in the app, is
                  // color-coded by severity via the shared getConditionColor scale.
                  <td key={j} style={j === conditionIndex ? { color: getConditionColor(cell), fontWeight: 600 } : undefined}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// ── Chart option builders ────────────────────────────────────────────────────

function barOption(categories, values, { yName = 'Count', rotate = 0, colorFn } = {}) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase },
    toolbox: neonToolbox,
    grid: { left: '7%', right: '5%', bottom: rotate ? '20%' : '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10, rotate }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({ value: v, itemStyle: neonItemStyle(colorFn ? colorFn(categories[i], v) : chartColors[i % chartColors.length]) })),
    }],
  };
}

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
    xAxis: { type: 'category', data: groups, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 20 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', max: 100, name: '% of group', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10, formatter: '{value}%' }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: conditions.map((cond, i) => ({
      name: cond, type: 'bar', stack: 'total', data: seriesData[cond], itemStyle: neonItemStyle(chartColors[i % chartColors.length]),
    })),
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
    yAxis: { type: 'value', name: yName, min: 0, max: 9, nameTextStyle: { ...chartTextStyle, fontSize: 10 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: [{
      type: 'line', data: values, smooth: true, symbolSize: 8,
      lineStyle: { color: '#28e0ff', width: 3, shadowBlur: 12, shadowColor: 'rgba(40,224,255,0.7)' },
      itemStyle: { color: '#28e0ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: hexToRgba('#28e0ff', 0.35) }, { offset: 1, color: hexToRgba('#28e0ff', 0) }] } },
    }],
  };
}

function groupedBarOption(categories, series) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 } },
    grid: { left: '7%', right: '5%', bottom: '18%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 15 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: 'Avg. rating (0–9)', min: 0, max: 9, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: series.map((s, i) => ({ ...s, type: 'bar', itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
  };
}

function percentGroupedBarOption(categories, series) {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase,
      formatter: (params) => `<strong>${params[0].axisValue}</strong><br/>${params.map((p) => `${p.marker} ${p.seriesName}: ${p.value}%`).join('<br/>')}`,
    },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 } },
    grid: { left: '7%', right: '5%', bottom: '18%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 20 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: '% of comparable register', max: 100, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10, formatter: '{value}%' }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: series.map((s, i) => ({ ...s, type: 'bar', itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
  };
}

function transitionHeatmapOption(matrix) {
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', ...neonTooltipBase, formatter: (p) => `Prior: ${CONDITION_ORDER[p.value[1]]}<br/>Current: ${CONDITION_ORDER[p.value[0]]}<br/>${p.value[2]} structure(s)` },
    toolbox: neonToolbox,
    grid: { left: '14%', right: '14%', bottom: '24%', top: '6%' },
    xAxis: { type: 'category', name: 'Current condition', nameLocation: 'middle', nameGap: 48, data: CONDITION_ORDER, axisLabel: { ...chartTextStyle, fontSize: 9, rotate: 30 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    yAxis: { type: 'category', name: 'Prior condition', data: CONDITION_ORDER, axisLabel: { ...chartTextStyle, fontSize: 9 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    visualMap: {
      min: 0, max: Math.max(1, ...matrix.map((d) => d[2])), calculable: true, orient: 'vertical', right: 0, top: 'middle', itemHeight: 160,
      textStyle: { color: chartTextStyle.color, fontSize: 10 }, inRange: { color: ['rgba(10,18,36,0.4)', '#28e0ff', '#ff00e5'] },
    },
    series: [{ type: 'heatmap', data: matrix, label: { show: true, color: '#e8fbff', fontSize: 9, fontWeight: 700 }, emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.7)' } } }],
  };
}

function donutOption(counts, centerLabel) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${p.name}: ${p.value.toLocaleString()} (${p.percent}%)` },
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 } },
    series: [{
      type: 'pie',
      radius: ['46%', '72%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0b1224', borderWidth: 2 },
      label: { show: true, color: chartTextStyle.color, fontSize: 10, formatter: '{b}\n{d}%' },
      data: entries.map(([name, value], i) => ({ name, value, itemStyle: { color: chartColors[i % chartColors.length] } })),
    }],
    graphic: [{ type: 'text', left: 'center', top: 'center', style: { text: `${total.toLocaleString()}\n${centerLabel}`, fill: chartTextStyle.color, fontSize: 13, fontWeight: 700, textAlign: 'center' } }],
  };
}

function scatterOption(points, xName, yName) {
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${xName}: ${p.value[0]}<br/>${yName}: ${p.value[1]}` },
    toolbox: neonToolbox,
    grid: { left: '8%', right: '6%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'value', name: xName, nameLocation: 'middle', nameGap: 28, nameTextStyle: { ...chartTextStyle, fontSize: 11 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: { ...chartTextStyle, fontSize: 11 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40,224,255,0.12)' } } },
    series: [{ type: 'scatter', symbolSize: 8, data: points, itemStyle: { color: hexToRgba('#ff00e5', 0.6), borderColor: '#ff00e5', borderWidth: 1 } }],
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

const YEARS_SINCE_BUCKETS = ['0–4 yrs', '5–9 yrs', '10–14 yrs', '15+ yrs'];
const yearsSinceBucket = (yrs) => {
  if (yrs == null || yrs < 0) return null;
  if (yrs < 5) return YEARS_SINCE_BUCKETS[0];
  if (yrs < 10) return YEARS_SINCE_BUCKETS[1];
  if (yrs < 15) return YEARS_SINCE_BUCKETS[2];
  return YEARS_SINCE_BUCKETS[3];
};

function avgRankByBucket(rows, bucketOrder, bucketFn, rankFn) {
  const sums = {}; const counts = {};
  bucketOrder.forEach((b) => { sums[b] = 0; counts[b] = 0; });
  let excluded = 0;
  rows.forEach((r) => {
    const bucket = bucketFn(r);
    const rank = rankFn(r);
    if (bucket == null || rank == null) { excluded += 1; return; }
    sums[bucket] += rank; counts[bucket] += 1;
  });
  const present = bucketOrder.filter((b) => counts[b] > 0);
  return { categories: present, values: present.map((b) => Math.round((sums[b] / counts[b]) * 100) / 100), counts: present.map((b) => counts[b]), excluded };
}

// For structures with no current numeric rating on file, the most recent
// rating on record -- the historical one -- stands as the reported condition
// for the current reporting year (2026). Used only where a single, present-day
// "what condition is it in" figure is being reported; the before/after
// comparison panels always require an independently-sourced current value, so
// they never use this fallback.
const effectiveRating = (r) => {
  const cur = Number(r.OverallConditionRating);
  if (Number.isFinite(cur)) return cur;
  const prior = r.hist?.prior_overall_rating;
  return prior != null ? prior : null;
};
const effectiveConditionLabel = (rating) => (rating != null ? CONDITION_ORDER[Math.min(9, Math.max(0, Math.round(rating)))] : 'Unknown');

function stackedByBucket(rows, bucketOrder, bucketFn, condFn) {
  const conditionSet = CONDITION_ORDER.filter((c) => rows.some((r) => condFn(r) === c));
  const groups = bucketOrder.filter((b) => rows.some((r) => bucketFn(r) === b));
  const seriesData = {};
  conditionSet.forEach((cond) => { seriesData[cond] = []; });
  groups.forEach((g) => {
    const inGroup = rows.filter((r) => bucketFn(r) === g);
    const total = inGroup.length;
    conditionSet.forEach((cond) => {
      const n = inGroup.filter((r) => (condFn(r) || 'Unknown') === cond).length;
      seriesData[cond].push(total ? Math.round((n / total) * 1000) / 10 : 0);
    });
  });
  let excluded = 0;
  rows.forEach((r) => { if (bucketFn(r) == null) excluded += 1; });
  return { groups, conditions: conditionSet, seriesData, excluded };
}

// ── Main component ──────────────────────────────────────────────────────────

export default function HistoricalDeteriorationAnalysis({ bridges = [], culverts = [] }) {
  const [bridgeHist, setBridgeHist] = useState(null);
  const [culvertHist, setCulvertHist] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(dataUrl('data/bridge_historical.json')).then((r) => r.json()),
      fetch(dataUrl('data/culvert_historical.json')).then((r) => r.json()),
    ]).then(([bh, ch]) => { setBridgeHist(bh); setCulvertHist(ch); }).catch(console.error);
  }, []);

  // ── Bridges: merge current register with recovered historical records ────
  const bMerged = useMemo(() => {
    if (!bridgeHist) return [];
    return bridges.map((r) => ({ ...r, hist: bridgeHist[r.bridge_no || r.BridgeNumber] || null }));
  }, [bridges, bridgeHist]);

  const bCoverage = useMemo(() => ({
    total: bridges.length,
    withHist: bMerged.filter((r) => r.hist).length,
    withPriorRating: bMerged.filter((r) => r.hist?.prior_overall_rating != null).length,
    withAge: bMerged.filter((r) => r.hist?.legacy_backfill?.year_compl).length,
  }), [bMerged, bridges.length]);

  const bAge = useMemo(() => {
    const withAge = bMerged.map((r) => ({ ...r, age: r.hist?.legacy_backfill?.year_compl ? CURRENT_YEAR - r.hist.legacy_backfill.year_compl : null }));
    const rankOf = (r) => effectiveRating(r);
    const condOf = (r) => effectiveConditionLabel(effectiveRating(r));
    const histogram = stackedByBucket(withAge, AGE_BUCKETS, (r) => ageBucket(r.age), condOf);
    const trend = avgRankByBucket(withAge, AGE_BUCKETS, (r) => ageBucket(r.age), rankOf);
    const timeline = {};
    withAge.forEach((r) => { const yc = r.hist?.legacy_backfill?.year_compl; if (yc) { const d = `${Math.floor(yc / 10) * 10}s`; timeline[d] = (timeline[d] || 0) + 1; } });
    const timelineCats = Object.keys(timeline).sort();
    const byRegion = {};
    withAge.forEach((r) => { if (r.age != null) { const reg = r.Region || 'Unknown'; if (reg === 'Unknown') return; byRegion[reg] = byRegion[reg] || []; byRegion[reg].push(r.age); } });
    const regionCats = Object.keys(byRegion).sort();
    return {
      histogram, trend,
      timeline: { categories: timelineCats, values: timelineCats.map((c) => timeline[c]) },
      byRegion: { categories: regionCats, values: regionCats.map((reg) => Math.round((byRegion[reg].reduce((s, a) => s + a, 0) / byRegion[reg].length) * 10) / 10) },
    };
  }, [bMerged]);

  const bDelta = useMemo(() => {
    const deltas = [];
    let excluded = 0;
    bMerged.forEach((r) => {
      const cur = Number(r.OverallConditionRating);
      const prior = r.hist?.prior_overall_rating;
      if (!Number.isFinite(cur) || prior == null) { excluded += 1; return; }
      deltas.push({ delta: cur - prior, cur, prior, region: r.Region || 'Unknown' });
    });
    const buckets = { 'Declined 2+': 0, 'Declined 1': 0, 'Unchanged': 0, 'Improved 1': 0, 'Improved 2+': 0 };
    deltas.forEach((d) => {
      if (d.delta <= -2) buckets['Declined 2+'] += 1;
      else if (d.delta === -1) buckets['Declined 1'] += 1;
      else if (d.delta === 0) buckets['Unchanged'] += 1;
      else if (d.delta === 1) buckets['Improved 1'] += 1;
      else buckets['Improved 2+'] += 1;
    });
    const matrix = [];
    for (let priorRank = 0; priorRank <= 9; priorRank += 1) {
      for (let curRank = 0; curRank <= 9; curRank += 1) {
        const n = deltas.filter((d) => Math.round(d.prior) === priorRank && Math.round(d.cur) === curRank).length;
        if (n > 0) matrix.push([curRank, priorRank, n]);
      }
    }
    const declinedByRegion = {};
    const totalByRegion = {};
    deltas.forEach((d) => {
      if (d.region === 'Unknown') return;
      totalByRegion[d.region] = (totalByRegion[d.region] || 0) + 1;
      if (d.delta < 0) declinedByRegion[d.region] = (declinedByRegion[d.region] || 0) + 1;
    });
    const regionCats = Object.keys(totalByRegion).sort();
    return {
      total: deltas.length, excluded, buckets,
      matrix,
      declinedPctByRegion: { categories: regionCats, values: regionCats.map((reg) => Math.round(((declinedByRegion[reg] || 0) / totalByRegion[reg]) * 1000) / 10) },
    };
  }, [bMerged]);

  const bSubComponents = useMemo(() => {
    const pairs = [
      { name: 'Waterway', prior: 'prior_waterway', cur: 'waterway_rating' },
      { name: 'Substructure', prior: 'prior_substructure', cur: 'substructure_rating' },
      { name: 'Superstructure', prior: 'prior_superstructure', cur: 'superstructure_rating' },
      { name: 'Roadway', prior: 'prior_roadway', cur: 'roadway_rating' },
      { name: 'Approach', prior: 'prior_approach', cur: 'approaches_rating' },
    ];
    const priorAvgs = []; const curAvgs = []; const cats = [];
    pairs.forEach((p) => {
      const priorVals = bMerged.map((r) => r.hist?.[p.prior]).filter((v) => Number.isFinite(v));
      const curVals = bMerged.map((r) => Number(r[p.cur])).filter((v) => Number.isFinite(v));
      if (!priorVals.length || !curVals.length) return;
      cats.push(p.name);
      priorAvgs.push(Math.round((priorVals.reduce((s, v) => s + v, 0) / priorVals.length) * 100) / 100);
      curAvgs.push(Math.round((curVals.reduce((s, v) => s + v, 0) / curVals.length) * 100) / 100);
    });
    return { cats, priorAvgs, curAvgs };
  }, [bMerged]);

  // year_compl is charted separately (construction-era timeline above), and
  // weight_load_restr has no maintained value dictionary on this platform --
  // it is never surfaced anywhere, including here as a bare field name.
  const RECOVERED_FIELDS_EXCLUDED = new Set(['year_compl', 'weight_load_restr']);
  // Raw archive column names (e.g. "type_abutment_l") are never shown to a
  // public viewer -- humanize to a plain-language label for display only;
  // counting still keys off the original field name.
  const humanizeFieldName = (key) => key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const bRecoveredFields = useMemo(() => {
    const counts = {};
    bMerged.forEach((r) => {
      const lb = r.hist?.legacy_backfill;
      if (!lb) return;
      Object.keys(lb).forEach((k) => { if (!RECOVERED_FIELDS_EXCLUDED.has(k)) counts[k] = (counts[k] || 0) + 1; });
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([k, v]) => [humanizeFieldName(k), v]);
    return entries;
  }, [bMerged]);

  const bYearsSince = useMemo(() => {
    const withYears = bMerged.map((r) => {
      let yrs = null;
      if (r.hist?.prior_inspec_date) yrs = CURRENT_YEAR - Number(r.hist.prior_inspec_date.slice(0, 4));
      else if (r.hist?.prior_year_of_assessment) yrs = CURRENT_YEAR - r.hist.prior_year_of_assessment;
      return { ...r, yearsSince: yrs };
    });
    return avgRankByBucket(withYears, YEARS_SINCE_BUCKETS, (r) => yearsSinceBucket(r.yearsSince), effectiveRating);
  }, [bMerged]);

  // A separate, independently-dated field re-inspection (2021-2025) of a subset
  // of bridges flagged for closer attention. Kept entirely apart from
  // prior_overall_rating (the 2015/2022 archive) rather than merged into it --
  // the two sources sometimes disagree on the same bridge on overlapping
  // dates, and blending them would silently pick a winner. Reported here as
  // its own labeled source instead. The source's Inspector field is never
  // read into this app.
  const bCritical = useMemo(() => {
    const flagged = bMerged
      .map((r) => ({ bridgeNo: r.bridge_no || r.BridgeNumber, flag: r.hist?.critical_structures_flag }))
      .filter((r) => r.flag);
    const categoryCounts = {};
    flagged.forEach(({ flag }) => {
      const cat = flag.condition_category || 'Unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const withRemarks = flagged
      .filter(({ flag }) => flag.remarks)
      .sort((a, b) => (b.flag.date || '').localeCompare(a.flag.date || ''));
    return { total: flagged.length, categoryCounts, withRemarks };
  }, [bMerged]);

  // ── Culverts: current-vs-2022 comparison ─────────────────────────────────
  const cMerged = useMemo(() => {
    if (!culvertHist) return [];
    return culverts.map((r) => ({ ...r, hist: culvertHist[r.CulvertNumber] || null }));
  }, [culverts, culvertHist]);

  const cCoverage = useMemo(() => ({
    total: culverts.length,
    withHist: cMerged.filter((r) => r.hist).length,
    withPriorRating: cMerged.filter((r) => r.hist?.prior_overall_rating != null).length,
  }), [cMerged, culverts.length]);

  const cDelta = useMemo(() => {
    const deltas = [];
    let excluded = 0;
    cMerged.forEach((r) => {
      const cur = Number(r.OverallConditionRating);
      const prior = r.hist?.prior_overall_rating;
      if (!Number.isFinite(cur) || prior == null) { excluded += 1; return; }
      deltas.push({ delta: cur - prior, cur, prior, region: r.Region || 'Unknown', type: r.CulvertType || 'Unknown' });
    });
    const buckets = { 'Declined 2+': 0, 'Declined 1': 0, 'Unchanged': 0, 'Improved 1': 0, 'Improved 2+': 0 };
    deltas.forEach((d) => {
      if (d.delta <= -2) buckets['Declined 2+'] += 1;
      else if (d.delta === -1) buckets['Declined 1'] += 1;
      else if (d.delta === 0) buckets['Unchanged'] += 1;
      else if (d.delta === 1) buckets['Improved 1'] += 1;
      else buckets['Improved 2+'] += 1;
    });
    const matrix = [];
    for (let priorRank = 0; priorRank <= 9; priorRank += 1) {
      for (let curRank = 0; curRank <= 9; curRank += 1) {
        const n = deltas.filter((d) => Math.round(d.prior) === priorRank && Math.round(d.cur) === curRank).length;
        if (n > 0) matrix.push([curRank, priorRank, n]);
      }
    }
    const declinedByRegion = {}; const totalByRegion = {};
    deltas.forEach((d) => {
      if (d.region === 'Unknown') return;
      totalByRegion[d.region] = (totalByRegion[d.region] || 0) + 1;
      if (d.delta < 0) declinedByRegion[d.region] = (declinedByRegion[d.region] || 0) + 1;
    });
    const regionCats = Object.keys(totalByRegion).sort();
    const declinedByType = {}; const totalByType = {};
    deltas.forEach((d) => {
      if (d.type === 'Unknown') return;
      totalByType[d.type] = (totalByType[d.type] || 0) + 1;
      if (d.delta < 0) declinedByType[d.type] = (declinedByType[d.type] || 0) + 1;
    });
    const typeCats = Object.keys(totalByType).filter((t) => totalByType[t] >= 5).sort((a, b) => totalByType[b] - totalByType[a]);
    const conditionCats = CONDITION_ORDER.filter((c) => deltas.some((d) => Math.round(d.prior) === CONDITION_ORDER.indexOf(c) || Math.round(d.cur) === CONDITION_ORDER.indexOf(c)));
    const priorMix = conditionCats.map((c) => Math.round((deltas.filter((d) => Math.round(d.prior) === CONDITION_ORDER.indexOf(c)).length / (deltas.length || 1)) * 1000) / 10);
    const curMix = conditionCats.map((c) => Math.round((deltas.filter((d) => Math.round(d.cur) === CONDITION_ORDER.indexOf(c)).length / (deltas.length || 1)) * 1000) / 10);
    return {
      total: deltas.length, excluded, buckets, matrix,
      declinedPctByRegion: { categories: regionCats, values: regionCats.map((reg) => Math.round(((declinedByRegion[reg] || 0) / totalByRegion[reg]) * 1000) / 10) },
      declinedCountByType: { categories: typeCats, values: typeCats.map((t) => declinedByType[t] || 0) },
      conditionMix: { categories: conditionCats, priorMix, curMix },
    };
  }, [cMerged]);

  const cSubComponents = useMemo(() => {
    const pairs = [
      { name: 'Waterway', prior: 'prior_waterway', cur: 'waterway_rating' },
      { name: 'Inlet/Outlet', prior: 'prior_inlet_outlet', cur: 'inlet_outlet_rating' },
      { name: 'Structure', prior: 'prior_structure', cur: 'structure_rating' },
      { name: 'Roadway', prior: 'prior_roadway', cur: 'roadway_rating' },
    ];
    const priorAvgs = []; const curAvgs = []; const cats = [];
    pairs.forEach((p) => {
      const priorVals = cMerged.map((r) => r.hist?.[p.prior]).filter((v) => Number.isFinite(v));
      const curVals = cMerged.map((r) => Number(r.LegacyData?.[p.cur])).filter((v) => Number.isFinite(v));
      if (!priorVals.length || !curVals.length) return;
      cats.push(p.name);
      priorAvgs.push(Math.round((priorVals.reduce((s, v) => s + v, 0) / priorVals.length) * 100) / 100);
      curAvgs.push(Math.round((curVals.reduce((s, v) => s + v, 0) / curVals.length) * 100) / 100);
    });
    return { cats, priorAvgs, curAvgs };
  }, [cMerged]);

  const cAgeVsDelta = useMemo(() => {
    const points = [];
    cMerged.forEach((r) => {
      const cy = Number(r.Completion_Year);
      const cur = Number(r.OverallConditionRating);
      const prior = r.hist?.prior_overall_rating;
      if (!Number.isFinite(cy) || cy <= 1900 || !Number.isFinite(cur) || prior == null) return;
      points.push([CURRENT_YEAR - cy, cur - prior]);
    });
    return points;
  }, [cMerged]);

  const cRatePerYear = useMemo(() => {
    const rates = [];
    cMerged.forEach((r) => {
      const cur = Number(r.OverallConditionRating);
      const prior = r.hist?.prior_overall_rating;
      const assessYear = r.hist?.prior_year_of_assessment;
      if (!Number.isFinite(cur) || prior == null || !assessYear) return;
      const yrsElapsed = CURRENT_YEAR - assessYear;
      if (yrsElapsed <= 0) return;
      rates.push((cur - prior) / yrsElapsed);
    });
    const buckets = { 'Fast decline (< -0.3/yr)': 0, 'Slow decline': 0, 'Stable': 0, 'Improving': 0 };
    rates.forEach((r) => {
      if (r < -0.3) buckets['Fast decline (< -0.3/yr)'] += 1;
      else if (r < -0.05) buckets['Slow decline'] += 1;
      else if (r <= 0.05) buckets['Stable'] += 1;
      else buckets['Improving'] += 1;
    });
    return { buckets, total: rates.length };
  }, [cMerged]);

  if (bridgeHist === null || culvertHist === null) {
    return <div className="page-loader"><div className="spinner" /><span>Reconciling historical BMS records…</span></div>;
  }

  return (
    <div className="analytics-layout">
      <section className="category-explorer">
        <div><span className="panel-kicker">Historical deterioration</span><h2>Bridges — condition change since the last recorded assessment</h2></div>
        <p className="stat-formula-note">
          Recovered from the department&apos;s archived BMS records (the 2015 legacy capture and the 2022 nationwide
          condition re-rating survey) and reconciled against the live register by bridge number, covering all{' '}
          {bCoverage.total.toLocaleString()} bridges. {bCoverage.withHist.toLocaleString()} have a matching historical
          record; {bCoverage.withPriorRating.toLocaleString()} have both a prior and current condition rating (enabling a
          real before/after comparison), and {bCoverage.withAge.toLocaleString()} have a genuine recovered construction
          year. Where a bridge has no current condition rating on file, its most recent recorded rating — from the
          historical archive — is reported as its current condition. A further, independently-dated field
          re-inspection (2021–2025) of {bCritical.total.toLocaleString()} flagged bridges is reported separately below,
          rather than merged into the 2015/2022 archive figures above.
        </p>
      </section>
      <section className="analytics-grid">
        <ChartCard
          kicker="Recovered age data"
          title="Bridges — Construction-Year Age × Condition (share)"
          option={stackedPercentOption(bAge.histogram.groups, bAge.histogram.conditions, bAge.histogram.seriesData)}
          note={`Genuine construction year, recovered from the 2015 legacy BMS capture — available for ${bCoverage.withAge.toLocaleString()} of ${bCoverage.total.toLocaleString()} bridges. Condition shown is each bridge's most recently recorded rating.`}
          wide
        />
        <ChartCard
          kicker="Deterioration trend"
          title="Bridges — Recovered Age vs Avg Condition Rank"
          option={avgRankLineOption(bAge.trend.categories, bAge.trend.values, bAge.trend.counts)}
        />
        <ChartCard
          kicker="Construction era"
          title="Bridges — Recovered Construction-Year Timeline"
          option={barOption(bAge.timeline.categories, bAge.timeline.values, { yName: 'Bridges completed' })}
        />
        <ChartCard
          kicker="Regional pattern"
          title="Bridges — Average Recovered Age by Region"
          option={barOption(bAge.byRegion.categories, bAge.byRegion.values, { yName: 'Avg. age (yrs)', rotate: 15 })}
        />
        <ChartCard
          kicker="Change since last inspection"
          title="Bridges — Condition Change (prior rating → current rating)"
          option={donutOption(bDelta.buckets, `n=${bDelta.total}`)}
          note={`${bDelta.total.toLocaleString()} of ${bCoverage.total.toLocaleString()} bridges have both a prior and current condition rating on file, giving a genuine before/after comparison.`}
        />
        <ChartCard
          kicker="Transition matrix"
          title="Bridges — Prior Condition → Current Condition"
          option={transitionHeatmapOption(bDelta.matrix, bDelta.total)}
          note="Cells on the diagonal are unchanged; below the diagonal (current rank lower than prior) means the structure has deteriorated."
          wide
          height={460}
        />
        <ChartCard
          kicker="Regional pattern"
          title="Bridges — % Declined Since Last Assessment, by Region"
          option={barOption(bDelta.declinedPctByRegion.categories, bDelta.declinedPctByRegion.values, { yName: '% declined', rotate: 15 })}
        />
        <ChartCard
          kicker="Sub-component comparison"
          title="Bridges — Prior vs Current Rating by Sub-Component"
          option={groupedBarOption(bSubComponents.cats, [{ name: 'Prior (recovered)', data: bSubComponents.priorAvgs }, { name: 'Current', data: bSubComponents.curAvgs }])}
          note="Averages computed independently per sub-component, over whichever bridges have both a prior and current value for that sub-component — the two series are not necessarily the same n."
          wide
        />
        <ChartCard
          kicker="Inspection recency"
          title="Bridges — Years Since Prior Assessment vs Current Condition"
          option={avgRankLineOption(bYearsSince.categories, bYearsSince.values, bYearsSince.counts)}
          note="Years since each bridge's prior recorded assessment. Condition is each bridge's most recently recorded rating (current where on file, otherwise the historical rating)."
        />
        <ChartCard
          kicker="Data recovery"
          title="Bridges — Engineering Fields Recovered from Historical Records"
          option={barOption(bRecoveredFields.map(([k]) => k), bRecoveredFields.map(([, v]) => v), { rotate: 30 })}
          note="Field values present in the 2015/2022 archive but missing from the live register for that bridge — recovered here rather than reported as missing."
          wide
        />
        <ChartCard
          kicker="Coverage"
          title="Bridges — Historical Record Match Coverage"
          option={donutOption({ 'Has recovered age': bCoverage.withAge, 'Has prior rating only': Math.max(0, bCoverage.withHist - bCoverage.withAge), 'No historical match': bCoverage.total - bCoverage.withHist }, `n=${bCoverage.total}`)}
        />
        <ChartCard
          kicker="Field re-inspection"
          title="Bridges — Critical-Structures Field Re-Inspection Condition Mix"
          option={donutOption(bCritical.categoryCounts, `n=${bCritical.total}`)}
          note="A separate, independently-dated 2021–2025 field re-inspection of a subset of bridges flagged for closer attention. Kept apart from the 2015/2022 archive ratings above rather than merged, since the two sources sometimes disagree for the same bridge on overlapping dates."
        />
        <TableCard
          kicker="Field re-inspection"
          title="Bridges — Flagged Remarks from Critical-Structures Re-Inspection"
          note={`${bCritical.withRemarks.length.toLocaleString()} of the ${bCritical.total.toLocaleString()} re-inspected bridges carry a written field remark; the rest were re-inspected with a rating only.`}
          columns={['Bridge No.', 'Date', 'Condition', 'Remark']}
          rows={bCritical.withRemarks.map((r) => [r.bridgeNo, r.flag.date || 'n/a', r.flag.condition_category || 'Unknown', r.flag.remarks])}
          wide
        />
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Historical deterioration</span><h2>Culverts — condition change since the 2022 survey</h2></div>
        <p className="stat-formula-note">
          Recovered from the department&apos;s 2022 nationwide major-culvert condition re-rating survey and reconciled
          against the live register by culvert number, covering all {cCoverage.total.toLocaleString()} culverts.{' '}
          {cCoverage.withHist.toLocaleString()} have a matching 2022 record, and{' '}
          {cCoverage.withPriorRating.toLocaleString()} have both a 2022 and current condition rating.
        </p>
      </section>
      <section className="analytics-grid">
        <ChartCard
          kicker="Change since 2022"
          title="Culverts — Condition Change (2022 rating → current rating)"
          option={donutOption(cDelta.buckets, `n=${cDelta.total}`)}
          note={`${cDelta.total.toLocaleString()} of ${cCoverage.total.toLocaleString()} culverts have both a 2022 and current condition rating on file, giving a genuine before/after comparison.`}
        />
        <ChartCard
          kicker="Transition matrix"
          title="Culverts — 2022 Condition → Current Condition"
          option={transitionHeatmapOption(cDelta.matrix, cDelta.total)}
          note="Cells on the diagonal are unchanged; below the diagonal (current rank lower than 2022) means the structure has deteriorated since the 2022 survey."
          wide
          height={460}
        />
        <ChartCard
          kicker="Regional pattern"
          title="Culverts — % Declined Since 2022, by Region"
          option={barOption(cDelta.declinedPctByRegion.categories, cDelta.declinedPctByRegion.values, { yName: '% declined', rotate: 15 })}
        />
        <ChartCard
          kicker="Type profile"
          title="Culverts — Count Declined Since 2022, by Type"
          option={barOption(cDelta.declinedCountByType.categories, cDelta.declinedCountByType.values, { yName: 'Culverts declined', rotate: 20 })}
          note="Types with fewer than 5 comparable culverts omitted."
          wide
        />
        <ChartCard
          kicker="Sub-component comparison"
          title="Culverts — 2022 vs Current Rating by Sub-Component"
          option={groupedBarOption(cSubComponents.cats, [{ name: '2022 survey', data: cSubComponents.priorAvgs }, { name: 'Current', data: cSubComponents.curAvgs }])}
          note="Averages computed independently per sub-component, over whichever culverts have both a 2022 and current value for that sub-component."
          wide
        />
        <ChartCard
          kicker="Age vs change"
          title="Culverts — Structure Age vs Condition Change Since 2022"
          option={scatterOption(cAgeVsDelta, 'Age (yrs, from Completion Year)', 'Rating change (2022 → current)')}
          note={`n=${cAgeVsDelta.length.toLocaleString()} culverts with a genuine completion year, a 2022 rating and a current rating all on file.`}
        />
        <ChartCard
          kicker="Rate of change"
          title="Culverts — Deterioration Rate Since 2022 Survey"
          option={donutOption(cRatePerYear.buckets, `n=${cRatePerYear.total}`)}
          note="Rating-points change per year elapsed since each culvert's 2022 assessment date, bucketed into fast decline, slow decline, stable, and improving."
        />
        <ChartCard
          kicker="Coverage"
          title="Culverts — Historical Record Match Coverage"
          option={donutOption({ 'Matched to 2022 survey': cCoverage.withHist, 'No 2022 record recovered': cCoverage.total - cCoverage.withHist }, `n=${cCoverage.total}`)}
        />
        <ChartCard
          kicker="Condition mix"
          title="Culverts — 2022 vs Current Condition Mix"
          option={percentGroupedBarOption(cDelta.conditionMix.categories, [{ name: '2022 survey', data: cDelta.conditionMix.priorMix }, { name: 'Current', data: cDelta.conditionMix.curMix }])}
          note={`Share of the ${cDelta.total.toLocaleString()} culverts with both a 2022 and current rating on file, by condition category, at each point in time.`}
          wide
        />
      </section>
    </div>
  );
}
