import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchBridges, fetchCulverts } from '../services/bmsDataService';
import {
  chartTextStyle,
  NEON_AXIS,
  chartColors,
  hexToRgba,
  neonItemStyle,
  neonToolbox,
  neonTooltipBase,
  chartFieldValue,
} from '../utils/chartTheme';
import { getRoadClassLabel } from '../utils/dataDictionary';

// ── Shared helpers (mirrors VisualAnalytics.jsx conventions for consistency) ─

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent'];

const countBy = (rows, key) => rows.reduce((counts, row) => {
  const raw = chartFieldValue(row, key) || 'Unknown';
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

function sunburstOption(data) {
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${p.treePathInfo?.map((t) => t.name).filter(Boolean).join(' → ') || p.name}<br/>${p.value ? p.value.toLocaleString() : ''}` },
    toolbox: neonToolbox,
    series: [{
      type: 'sunburst',
      radius: ['10%', '92%'],
      data,
      sort: undefined,
      label: { color: '#0b1224', fontWeight: 700, fontSize: 9, minAngle: 9 },
      itemStyle: { borderColor: '#0b1224', borderWidth: 1 },
      levels: [
        {},
        { r0: '10%', r: '38%', itemStyle: { borderWidth: 2 } },
        { r0: '38%', r: '65%' },
        { r0: '65%', r: '92%', label: { position: 'outside', silent: false, color: chartTextStyle.color, fontSize: 9 } },
      ],
    }],
  };
}

function sankeyOption({ nodes, links }) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...neonTooltipBase, formatter: (p) => (p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}<br/>${p.data.value.toLocaleString()}` : `${p.name}`) },
    toolbox: neonToolbox,
    series: [{
      type: 'sankey',
      emphasis: { focus: 'adjacency' },
      nodeGap: 14,
      data: nodes.map((n, i) => ({ ...n, itemStyle: { color: chartColors[i % chartColors.length], borderColor: '#0b1224' } })),
      links,
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.3 },
      label: { color: chartTextStyle.color, fontSize: 10, fontWeight: 700 },
    }],
  };
}

function parallelOption(rows, dimsMeta) {
  const rankMax = CONDITION_ORDER.length - 1;
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase },
    toolbox: neonToolbox,
    parallelAxis: [
      ...dimsMeta.map((d, i) => ({
        dim: i,
        name: d.name,
        nameTextStyle: { ...chartTextStyle, fontSize: 10 },
        axisLabel: { ...chartTextStyle, fontSize: 9 },
        axisLine: { lineStyle: { color: NEON_AXIS } },
      })),
      {
        dim: dimsMeta.length,
        name: 'Condition',
        type: 'category',
        data: CONDITION_ORDER,
        nameTextStyle: { ...chartTextStyle, fontSize: 10 },
        axisLabel: { ...chartTextStyle, fontSize: 9 },
        axisLine: { lineStyle: { color: NEON_AXIS } },
      },
    ],
    parallel: { left: '6%', right: '10%', bottom: '12%', top: '14%' },
    visualMap: {
      dimension: dimsMeta.length, min: 0, max: rankMax, show: false,
      inRange: { color: ['#ff453a', '#ffd60a', '#64d2ff'] },
    },
    series: [{
      type: 'parallel',
      lineStyle: { width: 1.4, opacity: 0.45 },
      data: rows,
    }],
  };
}

function bubbleOption(regionStats, xName, yName) {
  const maxCount = Math.max(1, ...regionStats.map((r) => r.count));
  return {
    backgroundColor: 'transparent',
    tooltip: {
      ...neonTooltipBase,
      formatter: (p) => `<strong>${p.data.name}</strong><br/>${xName}: ${p.data.value[0]}%<br/>${yName}: ${p.data.value[1]}<br/>Count: ${p.data.value[2].toLocaleString()}`,
    },
    toolbox: neonToolbox,
    grid: { left: '8%', right: '8%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'value', name: xName, nameLocation: 'middle', nameGap: 28, nameTextStyle: { ...chartTextStyle, fontSize: 11 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: { ...chartTextStyle, fontSize: 11 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: [{
      type: 'scatter',
      symbolSize: (val) => 10 + Math.sqrt(val[2] / maxCount) * 46,
      data: regionStats.map((r, i) => {
        const hex = chartColors[i % chartColors.length];
        return { name: r.region, value: [r.poorPct, r.avgLength, r.count], itemStyle: { color: hexToRgba(hex, 0.72), borderColor: hex, borderWidth: 1.5, shadowBlur: 16, shadowColor: hexToRgba(hex, 0.85) } };
      }),
      label: { show: true, formatter: '{b}', position: 'top', color: chartTextStyle.color, fontSize: 10, fontWeight: 700 },
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

function polarBarOption(counts) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `<strong>${p.name}</strong><br/>${p.value.toLocaleString()}` },
    toolbox: neonToolbox,
    polar: { radius: [24, '75%'], center: ['50%', '54%'] },
    angleAxis: { type: 'category', data: entries.map(([name]) => name), axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    radiusAxis: { axisLabel: { ...chartTextStyle, fontSize: 9 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
    series: [{
      type: 'bar',
      coordinateSystem: 'polar',
      data: entries.map(([, v], i) => ({ value: v, itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
    }],
  };
}

function corrMatrixOption(labels, matrix) {
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', ...neonTooltipBase, formatter: (p) => `${labels[p.value[0]]} × ${labels[p.value[1]]}<br/>r = ${p.value[2]}` },
    toolbox: neonToolbox,
    grid: { left: '20%', right: '5%', bottom: '22%', top: '8%' },
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

function paretoOption(entries) {
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let running = 0;
  const cum = entries.map(([, v]) => { running += v; return total ? Math.round((running / total) * 1000) / 10 : 0; });
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...neonTooltipBase },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 } },
    grid: { left: '6%', right: '8%', bottom: '22%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: entries.map(([n]) => n), axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: [
      { type: 'value', name: 'Count', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.12)' } } },
      { type: 'value', name: 'Cumulative %', max: 100, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10, formatter: '{value}%' }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { show: false } },
    ],
    series: [
      { name: 'Count', type: 'bar', data: entries.map(([, v], i) => ({ value: v, itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })) },
      { name: 'Cumulative %', type: 'line', yAxisIndex: 1, data: cum, smooth: true, symbolSize: 6, lineStyle: { color: '#ffd60a', width: 2, shadowBlur: 10, shadowColor: hexToRgba('#ffd60a', 0.8) }, itemStyle: { color: '#ffd60a' } },
    ],
  };
}

function pictorialBarOption(counts, xName) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase },
    toolbox: neonToolbox,
    grid: { left: '6%', right: '5%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: entries.map(([name]) => name), name: xName, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: 'Count', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(100, 210, 255,0.1)', type: 'dashed' } } },
    series: [{
      type: 'pictorialBar',
      symbol: 'roundRect',
      symbolRepeat: 'fixed',
      symbolSize: [12, 8],
      symbolMargin: 2,
      symbolClip: true,
      data: entries.map(([, v], i) => ({ value: v, itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
    }],
  };
}

function themeRiverOption(data, legendNames) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...neonTooltipBase },
    toolbox: neonToolbox,
    legend: { data: legendNames, top: 0, textStyle: { ...chartTextStyle, fontSize: 10 }, type: 'scroll' },
    singleAxis: { type: 'time', top: 60, bottom: 40, left: '6%', right: '4%', axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { show: false } },
    color: chartColors,
    series: [{
      type: 'themeRiver',
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.5)' } },
      label: { show: false },
      data,
    }],
  };
}

function calendarOption(counts, years) {
  const maxVal = Math.max(1, ...Object.values(counts));
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${p.value[0]}: ${p.value[1]} record(s)` },
    toolbox: neonToolbox,
    visualMap: {
      min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: chartTextStyle.color },
      inRange: { color: ['rgba(10,18,36,0.5)', '#64d2ff', '#bf5af2'] },
    },
    calendar: years.map((y, i) => ({
      range: String(y),
      top: 26 + i * 128,
      left: 70, right: 20,
      cellSize: [16, 14],
      itemStyle: { borderColor: '#0b1224', borderWidth: 2, color: 'rgba(10,18,36,0.4)' },
      dayLabel: { ...chartTextStyle, fontSize: 9 },
      monthLabel: { ...chartTextStyle, fontSize: 10 },
      yearLabel: { show: true, ...chartTextStyle, fontSize: 12, fontWeight: 800, color: NEON_AXIS },
      splitLine: { lineStyle: { color: NEON_AXIS, width: 1 } },
    })),
    series: years.map((y, i) => ({
      type: 'heatmap',
      coordinateSystem: 'calendar',
      calendarIndex: i,
      data: Object.entries(counts).filter(([d]) => d.startsWith(String(y))),
    })),
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CrossAnalysis({ bridges: bridgesProp, culverts: culvertsProp }) {
  // When a parent (e.g. the Dashboard filter bar) supplies bridges/culverts,
  // those are used as-is -- including a legitimately empty, filtered-down
  // array -- instead of self-fetching the full unfiltered registry.
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

  const regionStatsFor = (rows, lengthField) => {
    const regions = sortedNonUnknownKeys(countBy(rows, 'Region'));
    return regions.map((region) => {
      const inRegion = rows.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') === region);
      const conditionCounts = countBy(inRegion, 'OverallCondition');
      const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor'].reduce((s, k) => s + (conditionCounts[k] || 0), 0);
      const lengths = inRegion.map((r) => Number(chartFieldValue(r, lengthField))).filter((v) => Number.isFinite(v) && v > 0);
      return {
        region,
        count: inRegion.length,
        poorPct: inRegion.length ? Math.round((poor / inRegion.length) * 1000) / 10 : 0,
        avgLength: lengths.length ? Math.round((lengths.reduce((s, v) => s + v, 0) / lengths.length) * 10) / 10 : 0,
      };
    });
  };

  const sunburstDataFor = (rows, classField) => {
    // classField is always road_class/Road_Class at today's call sites -- it
    // has no code dictionary, so decode via the formatting-only helper
    // rather than let a bare letter render as the middle-ring label.
    const isRoadClass = /road_class/i.test(classField);
    const tree = {};
    rows.forEach((row) => {
      const region = chartFieldValue(row, 'Region') || 'Unknown';
      const rawCls = chartFieldValue(row, classField);
      const cls = isRoadClass ? getRoadClassLabel(rawCls) : (rawCls || 'Unknown');
      const cond = chartFieldValue(row, 'OverallCondition') || 'Unknown';
      tree[region] = tree[region] || {};
      tree[region][cls] = tree[region][cls] || {};
      tree[region][cls][cond] = (tree[region][cls][cond] || 0) + 1;
    });
    return Object.entries(tree).map(([region, classes], i) => ({
      name: region,
      itemStyle: { color: hexToRgba(chartColors[i % chartColors.length], 0.9) },
      children: Object.entries(classes).map(([cls, conditions]) => ({
        name: cls,
        children: Object.entries(conditions).map(([cond, value]) => ({ name: cond, value })),
      })),
    }));
  };

  const sankeyDataFor = (rows) => {
    const nodesSet = new Set();
    const linkMap = {};
    rows.forEach((row) => {
      const region = chartFieldValue(row, 'Region') || 'Unknown';
      const cond = chartFieldValue(row, 'OverallCondition') || 'Unknown';
      nodesSet.add(region); nodesSet.add(cond);
      const key = `${region}→${cond}`;
      linkMap[key] = (linkMap[key] || 0) + 1;
    });
    const nodes = [...nodesSet].map((name) => ({ name }));
    const links = Object.entries(linkMap).map(([key, value]) => {
      const [source, target] = key.split('→');
      return { source, target, value };
    });
    return { nodes, links };
  };

  const stackedPercentDataFor = (rows, groupField) => {
    const groupCounts = countBy(rows, groupField);
    const groups = sortedNonUnknownKeys(groupCounts).filter((g) => groupCounts[g] >= 3);
    const excludedGroups = Object.keys(groupCounts).filter((g) => g !== 'Unknown' && groupCounts[g] < 3).length;
    const conditionSet = CONDITION_ORDER.filter((c) => rows.some((r) => (chartFieldValue(r, 'OverallCondition') || 'Unknown') === c));
    const seriesData = {};
    conditionSet.forEach((cond) => { seriesData[cond] = []; });
    groups.forEach((g) => {
      const inGroup = rows.filter((r) => (chartFieldValue(r, groupField) || 'Unknown') === g);
      const total = inGroup.length;
      conditionSet.forEach((cond) => {
        const n = inGroup.filter((r) => (chartFieldValue(r, 'OverallCondition') || 'Unknown') === cond).length;
        seriesData[cond].push(total ? Math.round((n / total) * 1000) / 10 : 0);
      });
    });
    return { groups, conditions: conditionSet, seriesData, excludedGroups };
  };

  const corrMatrixFor = (rows, fields) => {
    const labels = fields.map((f) => f.label);
    const matrix = [];
    fields.forEach((fi, i) => {
      fields.forEach((fj, j) => {
        if (i === j) { matrix.push([i, j, 1]); return; }
        const pairs = rows.map((r) => [fi.accessor(r), fj.accessor(r)]).filter(([x, y]) => Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0);
        matrix.push([i, j, pearsonR(pairs) ?? 0]);
      });
    });
    return { labels, matrix };
  };

  // ── Bridges derived cross-analysis data ──────────────────────────────────
  const bSunburst = useMemo(() => sunburstDataFor(bridges, 'road_class'), [bridges]);
  const bSankey = useMemo(() => sankeyDataFor(bridges), [bridges]);
  const bParallel = useMemo(() => {
    const rows = [];
    let excluded = 0;
    bridges.forEach((r) => {
      const length = Number(r.length);
      const aadt = Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt);
      const spans = Number(r.no_of_spans ?? r.no_of_span);
      const cond = chartFieldValue(r, 'OverallCondition');
      const rank = CONDITION_ORDER.indexOf(cond);
      if (Number.isFinite(length) && length > 0 && Number.isFinite(aadt) && aadt > 0 && Number.isFinite(spans) && spans > 0 && rank >= 0) {
        rows.push([length, aadt, spans, rank]);
      } else excluded += 1;
    });
    return { rows, excluded, total: bridges.length };
  }, [bridges]);
  const bBubble = useMemo(() => regionStatsFor(bridges, 'length'), [bridges]);
  const bStacked = useMemo(() => stackedPercentDataFor(bridges, 'surface_ty'), [bridges]);
  const bPolar = useMemo(() => countBy(bridges, 'OverallCondition'), [bridges]);
  const bCorr = useMemo(() => corrMatrixFor(bridges, [
    { label: 'Deck length', accessor: (r) => Number(r.length) },
    { label: 'AADT', accessor: (r) => Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt) },
    { label: 'No. of spans', accessor: (r) => Number(r.no_of_spans ?? r.no_of_span) },
  ]), [bridges]);
  // road_class has no code dictionary -- decode the Pareto category keys via
  // the formatting-only helper before charting so the x-axis never shows a
  // bare letter.
  const bPareto = useMemo(() => Object.entries(countBy(bridges, 'road_class')).filter(([k]) => k !== 'Unknown').map(([k, v]) => [getRoadClassLabel(k), v]).sort((a, b) => b[1] - a[1]), [bridges]);
  const bPictorial = useMemo(() => countBy(bridges, 'Region'), [bridges]);

  // ── Culverts derived cross-analysis data ─────────────────────────────────
  const cSunburst = useMemo(() => sunburstDataFor(culverts, 'Road_Class'), [culverts]);
  const cSankey = useMemo(() => sankeyDataFor(culverts), [culverts]);
  const cParallel = useMemo(() => {
    const rows = [];
    let excluded = 0;
    culverts.forEach((r) => {
      const length = Number(r.CulvertLength);
      const span = Number(r.SpanOrDiameter);
      const cond = chartFieldValue(r, 'OverallCondition');
      const rank = CONDITION_ORDER.indexOf(cond);
      if (Number.isFinite(length) && length > 0 && Number.isFinite(span) && span > 0 && span <= 10 && rank >= 0) {
        rows.push([length, span, rank]);
      } else excluded += 1;
    });
    return { rows, excluded, total: culverts.length };
  }, [culverts]);
  const cBubble = useMemo(() => regionStatsFor(culverts, 'CulvertLength'), [culverts]);
  const cStacked = useMemo(() => stackedPercentDataFor(culverts, 'Surface_Type'), [culverts]);
  const cPolar = useMemo(() => countBy(culverts, 'OverallCondition'), [culverts]);
  const cCorr = useMemo(() => corrMatrixFor(culverts, [
    { label: 'Length', accessor: (r) => Number(r.CulvertLength) },
    { label: 'Span/diameter', accessor: (r) => Number(r.SpanOrDiameter) },
  ]), [culverts]);
  const cPareto = useMemo(() => Object.entries(countBy(culverts, 'CulvertType')).filter(([k]) => k !== 'Unknown').sort((a, b) => b[1] - a[1]), [culverts]);
  const cPictorial = useMemo(() => countBy(culverts, 'Region'), [culverts]);

  if (!usingExternalData && (!bridges.length || !culverts.length)) {
    return <div className="page-loader"><div className="spinner" /><span>Rendering cross analysis…</span></div>;
  }

  return (
    <div className="analytics-layout">
      <section className="category-explorer">
        <div><span className="panel-kicker">Cross analysis</span><h2>Bridges — multi-dimensional analysis</h2></div>
      </section>
      <section className="analytics-grid">
        <ChartCard kicker="Hierarchy × condition" title="Bridges — Region → Road Class → Condition" option={sunburstOption(bSunburst)} wide height={460} />
        <ChartCard kicker="Flow" title="Bridges — Region → Condition Flow" option={sankeyOption(bSankey)} wide />
        <ChartCard
          kicker="Multi-variable profile"
          title="Bridges — Length, AADT, Spans & Condition"
          note={`n=${bParallel.rows.length.toLocaleString()} of ${bParallel.total.toLocaleString()} bridges with deck length, AADT, span count and a condition rating all on file (${bParallel.excluded.toLocaleString()} excluded). Colour = condition (red = poor, cyan = excellent).`}
          option={parallelOption(bParallel.rows, [{ name: 'Deck length (m)' }, { name: 'AADT (veh/day)' }, { name: 'No. of spans' }])}
          wide
        />
        <ChartCard
          kicker="Region profile"
          title="Bridges — Poor% vs Avg Length by Region (bubble = count)"
          option={bubbleOption(bBubble, 'Poor-or-worse %', 'Avg deck length (m)')}
        />
        <ChartCard
          kicker="Cross-tabulation"
          title="Bridges — Surface Type × Condition (share)"
          note={bStacked.excludedGroups ? `${bStacked.excludedGroups} surface type(s) with fewer than 3 records omitted from the comparison.` : undefined}
          option={stackedPercentOption(bStacked.groups, bStacked.conditions, bStacked.seriesData)}
          wide
        />
        <ChartCard kicker="Condition share" title="Bridges — Condition (radial)" option={polarBarOption(bPolar)} />
        <ChartCard
          kicker="Correlation matrix"
          title="Bridges — Engineering Field Correlations"
          note="Pearson r between deck length, AADT and number of spans (pairwise, using only records with both values on file)."
          option={corrMatrixOption(bCorr.labels, bCorr.matrix)}
        />
        <ChartCard kicker="Ranked contribution" title="Bridges — Road Class Pareto" option={paretoOption(bPareto)} />
        <ChartCard kicker="Regional coverage" title="Bridges per Region (unit chart)" option={pictorialBarOption(bPictorial, 'Region')} />
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Cross analysis</span><h2>Culverts — multi-dimensional analysis</h2></div>
      </section>
      <section className="analytics-grid">
        <ChartCard kicker="Hierarchy × condition" title="Culverts — Region → Road Class → Condition" option={sunburstOption(cSunburst)} wide height={460} />
        <ChartCard kicker="Flow" title="Culverts — Region → Condition Flow" option={sankeyOption(cSankey)} wide />
        <ChartCard
          kicker="Multi-variable profile"
          title="Culverts — Length, Span & Condition"
          note={`n=${cParallel.rows.length.toLocaleString()} of ${cParallel.total.toLocaleString()} culverts with length, span/diameter (≤10 m) and a condition rating all on file (${cParallel.excluded.toLocaleString()} excluded). Colour = condition (red = poor, cyan = excellent).`}
          option={parallelOption(cParallel.rows, [{ name: 'Length (m)' }, { name: 'Span/diameter (m)' }])}
          wide
        />
        <ChartCard
          kicker="Region profile"
          title="Culverts — Poor% vs Avg Length by Region (bubble = count)"
          option={bubbleOption(cBubble, 'Poor-or-worse %', 'Avg length (m)')}
        />
        <ChartCard
          kicker="Cross-tabulation"
          title="Culverts — Surface Type × Condition (share)"
          note={cStacked.excludedGroups ? `${cStacked.excludedGroups} surface type(s) with fewer than 3 records omitted from the comparison.` : undefined}
          option={stackedPercentOption(cStacked.groups, cStacked.conditions, cStacked.seriesData)}
          wide
        />
        <ChartCard kicker="Condition share" title="Culverts — Condition (radial)" option={polarBarOption(cPolar)} />
        <ChartCard
          kicker="Correlation matrix"
          title="Culverts — Length vs Span/Diameter"
          note="Pearson r between culvert length and span/diameter, using only records with both values on file."
          option={corrMatrixOption(cCorr.labels, cCorr.matrix)}
        />
        <ChartCard kicker="Ranked contribution" title="Culverts — Type Pareto" option={paretoOption(cPareto)} />
        <ChartCard kicker="Regional coverage" title="Culverts per Region (unit chart)" option={pictorialBarOption(cPictorial, 'Region')} />
      </section>
    </div>
  );
}
