import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchBridges, fetchCulverts } from '../services/bmsDataService';
import {
  chartTextStyle,
  NEON_AXIS,
  chartColors,
  hexToRgba,
  neonItemStyle,
  neonEmphasisStyle,
  neonToolbox,
  neonTooltipBase,
  chartFieldValue,
} from '../utils/chartTheme';
import { getRoadClassLabel } from '../utils/dataDictionary';

// ── Shared helpers ──────────────────────────────────────────────────────────

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent'];
const POOR_LABELS = new Set(['Beyond Repair', 'Critical', 'Very Poor', 'Poor']);

const countBy = (rows, key) => rows.reduce((counts, row) => {
  const raw = chartFieldValue(row, key) || 'Unknown';
  counts[raw] = (counts[raw] || 0) + 1;
  return counts;
}, {});

const sortedNonUnknownKeys = (counts) => Object.keys(counts).filter((k) => k !== 'Unknown').sort();

const trafficBandsFor = (rows) => {
  const bands = { '< 1,000': 0, '1,000 - 4,999': 0, '5,000 - 9,999': 0, '10,000 - 24,999': 0, '25,000+': 0 };
  rows.forEach((r) => {
    const aadt = Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt);
    if (!Number.isFinite(aadt) || aadt <= 0) return;
    if (aadt < 1000) bands['< 1,000'] += 1;
    else if (aadt < 5000) bands['1,000 - 4,999'] += 1;
    else if (aadt < 10000) bands['5,000 - 9,999'] += 1;
    else if (aadt < 25000) bands['10,000 - 24,999'] += 1;
    else bands['25,000+'] += 1;
  });
  return bands;
};

const quantile = (sortedArr, q) => {
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sortedArr[base + 1] !== undefined ? sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]) : sortedArr[base];
};

const boxStats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return [
    Math.round(sorted[0] * 10) / 10,
    Math.round(quantile(sorted, 0.25) * 10) / 10,
    Math.round(quantile(sorted, 0.5) * 10) / 10,
    Math.round(quantile(sorted, 0.75) * 10) / 10,
    Math.round(sorted[sorted.length - 1] * 10) / 10,
  ];
};

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

function ChartCard({ kicker, title, note, height = 360, wide = false, option }) {
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

// ── Chart option builders (all neon-themed, all interactive) ───────────────

function donutOption(counts) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...neonTooltipBase, formatter: (p) => `<strong>${p.name}</strong><br/>${p.value.toLocaleString()} (${p.percent}%)` },
    toolbox: neonToolbox,
    legend: { orient: 'vertical', right: 8, top: 'middle', textStyle: { ...chartTextStyle, fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['38%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0b1224', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', color: chartTextStyle.color, fontSize: 10, fontWeight: 700 },
      labelLine: { lineStyle: { color: NEON_AXIS } },
      data: entries.map(([name, value], i) => {
        const hex = chartColors[i % chartColors.length];
        return { name, value, itemStyle: neonItemStyle(hex), emphasis: neonEmphasisStyle(hex) };
      }),
    }],
    graphic: total ? [{ type: 'text', left: '18%', top: '46%', style: { text: `${total.toLocaleString()}\nTotal`, textAlign: 'center', fill: chartTextStyle.color, fontSize: 14, fontWeight: 800 } }] : [],
  };
}

function roseOption(counts) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...neonTooltipBase, formatter: (p) => `<strong>${p.name}</strong><br/>${p.value.toLocaleString()} (${p.percent}%)` },
    toolbox: neonToolbox,
    legend: { show: false },
    series: [{
      type: 'pie',
      roseType: 'area',
      radius: ['12%', '72%'],
      center: ['50%', '54%'],
      itemStyle: { borderColor: '#0b1224', borderWidth: 1 },
      label: { color: chartTextStyle.color, fontSize: 10, fontWeight: 700 },
      labelLine: { lineStyle: { color: NEON_AXIS } },
      data: entries.map(([name, value], i) => {
        const hex = chartColors[i % chartColors.length];
        return { name, value, itemStyle: neonItemStyle(hex), emphasis: neonEmphasisStyle(hex) };
      }),
    }],
  };
}

function hbarOption(counts, xName) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...neonTooltipBase,
      formatter: (params) => {
        const p = params[0];
        const pct = total ? ((p.value / total) * 100).toFixed(1) : '0.0';
        return `<strong>${p.name}</strong><br/>Count: ${p.value.toLocaleString()} (${pct}%)`;
      },
    },
    toolbox: neonToolbox,
    grid: { left: '18%', right: '8%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'value', name: 'Count', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.15)', type: 'dashed' } } },
    yAxis: { type: 'category', data: entries.map(([name]) => name), name: xName, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    series: [{
      type: 'bar',
      data: entries.map(([, value], i) => {
        const hex = chartColors[i % chartColors.length];
        return { value, itemStyle: { ...neonItemStyle(hex), borderRadius: [0, 6, 6, 0] }, emphasis: neonEmphasisStyle(hex) };
      }),
      label: { show: true, position: 'right', ...chartTextStyle, fontSize: 10 },
    }],
  };
}

function radarOption(regionStats) {
  const maxCount = Math.max(1, ...regionStats.map((r) => r.count));
  const maxLength = Math.max(1, ...regionStats.map((r) => r.avgLength));
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase },
    toolbox: neonToolbox,
    legend: { bottom: 0, textStyle: { ...chartTextStyle, fontSize: 10 }, type: 'scroll' },
    radar: {
      indicator: [
        { name: 'Structure count', max: Math.ceil(maxCount * 1.15) },
        { name: 'Poor-or-worse %', max: 100 },
        { name: 'Avg length (m)', max: Math.ceil(maxLength * 1.2) || 10 },
      ],
      axisName: { color: chartTextStyle.color, fontSize: 11, fontWeight: 700 },
      splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.2)' } },
      splitArea: { areaStyle: { color: ['rgba(10,18,36,0.3)', 'rgba(10,18,36,0.55)'] } },
      axisLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.3)' } },
    },
    series: [{
      type: 'radar',
      data: regionStats.map((r, i) => {
        const hex = chartColors[i % chartColors.length];
        return {
          name: r.region,
          value: [r.count, r.poorPct, r.avgLength],
          areaStyle: { color: hexToRgba(hex, 0.18) },
          lineStyle: { color: hex, width: 2, shadowBlur: 10, shadowColor: hexToRgba(hex, 0.8) },
          itemStyle: { color: hex },
        };
      }),
    }],
  };
}

function scatterOption(pairs, xName, yName, colorHex) {
  const r = pearsonR(pairs);
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item', ...neonTooltipBase,
      formatter: (p) => `${xName}: ${p.value[0].toLocaleString()}<br/>${yName}: ${p.value[1].toLocaleString()}`,
    },
    toolbox: neonToolbox,
    grid: { left: '5%', right: '5%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'value', name: xName, nameLocation: 'middle', nameGap: 28, nameTextStyle: { ...chartTextStyle, fontSize: 12 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.12)' } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: { ...chartTextStyle, fontSize: 12 }, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.12)' } } },
    series: [{
      type: 'scatter',
      symbolSize: 9,
      data: pairs,
      itemStyle: { color: colorHex, shadowBlur: 12, shadowColor: hexToRgba(colorHex, 0.8), opacity: 0.85 },
      emphasis: { itemStyle: { shadowBlur: 24, opacity: 1 } },
    }],
    graphic: r !== null ? [{ type: 'text', right: 12, top: 8, style: { text: `r = ${r}`, fill: chartTextStyle.color, fontSize: 13, fontWeight: 800 } }] : [],
  };
}

function dualGaugeOption(ratedPct, poorPct) {
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase },
    series: [
      {
        type: 'gauge',
        center: ['27%', '58%'],
        radius: '85%',
        min: 0, max: 100,
        startAngle: 210, endAngle: -30,
        progress: { show: true, width: 14, itemStyle: { color: '#00f5ff', shadowBlur: 14, shadowColor: hexToRgba('#00f5ff', 0.8) } },
        axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(40,224,255,0.15)']] } },
        pointer: { show: false },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, '75%'], color: chartTextStyle.color, fontSize: 11, fontWeight: 700 },
        detail: { valueAnimation: true, offsetCenter: [0, '5%'], formatter: '{value}%', color: '#00f5ff', fontSize: 22, fontWeight: 800 },
        data: [{ value: ratedPct, name: 'Condition rated' }],
      },
      {
        type: 'gauge',
        center: ['73%', '58%'],
        radius: '85%',
        min: 0, max: 100,
        startAngle: 210, endAngle: -30,
        progress: { show: true, width: 14, itemStyle: { color: '#ff073a', shadowBlur: 14, shadowColor: hexToRgba('#ff073a', 0.8) } },
        axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(255,7,58,0.15)']] } },
        pointer: { show: false },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, '75%'], color: chartTextStyle.color, fontSize: 11, fontWeight: 700 },
        detail: { valueAnimation: true, offsetCenter: [0, '5%'], formatter: '{value}%', color: '#ff073a', fontSize: 22, fontWeight: 800 },
        data: [{ value: poorPct, name: 'Poor or worse' }],
      },
    ],
  };
}

function funnelOption(stages) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...neonTooltipBase, formatter: (p) => `<strong>${p.name}</strong><br/>${p.value.toLocaleString()} (${p.percent}%)` },
    toolbox: neonToolbox,
    series: [{
      type: 'funnel',
      left: '8%', width: '84%', top: '6%', bottom: '6%',
      min: 0, max: stages[0].value,
      sort: 'descending',
      gap: 4,
      label: { show: true, position: 'inside', color: '#0b1224', fontWeight: 800, fontSize: 11 },
      labelLine: { show: false },
      itemStyle: { borderColor: '#0b1224', borderWidth: 1 },
      data: stages.map((s, i) => ({ name: s.name, value: s.value, itemStyle: neonItemStyle(chartColors[i % chartColors.length]) })),
    }],
  };
}

function treemapOption(regionRoadClassMap) {
  const data = Object.entries(regionRoadClassMap).map(([region, classes], i) => {
    const hex = chartColors[i % chartColors.length];
    return {
      name: region,
      itemStyle: { color: hexToRgba(hex, 0.85), borderColor: '#0b1224', gapWidth: 2 },
      children: Object.entries(classes).filter(([, v]) => v > 0).map(([cls, value]) => ({ name: cls, value, itemStyle: { color: hexToRgba(hex, 0.55) } })),
    };
  });
  return {
    backgroundColor: 'transparent',
    tooltip: { ...neonTooltipBase, formatter: (p) => `${p.name}<br/>${p.value ? p.value.toLocaleString() : ''}` },
    toolbox: neonToolbox,
    series: [{
      type: 'treemap',
      roam: true,
      breadcrumb: { show: true, itemStyle: { color: 'rgba(10,18,36,0.9)', borderColor: NEON_AXIS, textStyle: { color: chartTextStyle.color } } },
      label: { show: true, color: '#0b1224', fontWeight: 700, fontSize: 11 },
      upperLabel: { show: true, height: 22, color: '#0b1224', fontWeight: 800 },
      itemStyle: { borderRadius: 4 },
      data,
    }],
  };
}

function heatmapOption(regions, conditions, matrix) {
  const maxVal = Math.max(1, ...matrix.map((d) => d[2]));
  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', ...neonTooltipBase, formatter: (p) => `${conditions[p.value[0]]} × ${regions[p.value[1]]}<br/>${p.value[2].toLocaleString()} structures` },
    toolbox: neonToolbox,
    grid: { left: '18%', right: '5%', bottom: '18%', top: '5%' },
    xAxis: { type: 'category', data: conditions, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    yAxis: { type: 'category', data: regions, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitArea: { show: true } },
    visualMap: {
      min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: chartTextStyle.color },
      inRange: { color: ['rgba(10,18,36,0.4)', '#00f5ff', '#ff00e5'] },
    },
    series: [{
      type: 'heatmap',
      data: matrix,
      label: { show: true, color: '#e8fbff', fontSize: 10, fontWeight: 700 },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.7)' } },
    }],
  };
}

function boxplotOption(regions, boxData) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...neonTooltipBase, formatter: (p) => `<strong>${p.name}</strong><br/>Min ${p.data[0]} / Q1 ${p.data[1]} / Median ${p.data[2]} / Q3 ${p.data[3]} / Max ${p.data[4]} (m)` },
    toolbox: neonToolbox,
    grid: { left: '8%', right: '5%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: regions, axisLabel: { ...chartTextStyle, fontSize: 10, rotate: 20 }, axisLine: { lineStyle: { color: NEON_AXIS } }, boundaryGap: true },
    yAxis: { type: 'value', name: 'Length (m)', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.12)' } } },
    series: [{
      type: 'boxplot',
      data: boxData,
      itemStyle: { color: hexToRgba('#00f5ff', 0.35), borderColor: '#00f5ff', borderWidth: 2, shadowBlur: 10, shadowColor: hexToRgba('#00f5ff', 0.6) },
      emphasis: { itemStyle: { borderColor: '#ff00e5', shadowColor: hexToRgba('#ff00e5', 0.8) } },
    }],
  };
}

function lineAreaOption(yearCounts, xName) {
  const years = Object.keys(yearCounts).sort();
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...neonTooltipBase },
    toolbox: neonToolbox,
    grid: { left: '5%', right: '5%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: years, name: xName, nameLocation: 'middle', nameGap: 28, nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } } },
    yAxis: { type: 'value', name: 'Records', nameTextStyle: chartTextStyle, axisLabel: { ...chartTextStyle, fontSize: 10 }, axisLine: { lineStyle: { color: NEON_AXIS } }, splitLine: { lineStyle: { color: 'rgba(40, 224, 255, 0.12)' } } },
    series: [{
      type: 'line',
      smooth: true,
      symbolSize: 8,
      data: years.map((y) => yearCounts[y]),
      lineStyle: { color: '#00f5ff', width: 3, shadowBlur: 12, shadowColor: hexToRgba('#00f5ff', 0.8) },
      itemStyle: { color: '#00f5ff', shadowBlur: 10, shadowColor: hexToRgba('#00f5ff', 0.9) },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: hexToRgba('#00f5ff', 0.45) }, { offset: 1, color: hexToRgba('#00f5ff', 0.02) }] } },
    }],
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export default function VisualAnalytics({ bridges: bridgesProp, culverts: culvertsProp }) {
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

  const regionStatsFor = (rows) => {
    const regions = sortedNonUnknownKeys(countBy(rows, 'Region'));
    return regions.map((region) => {
      const inRegion = rows.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') === region);
      const conditionCounts = countBy(inRegion, 'OverallCondition');
      const poor = Object.entries(conditionCounts).filter(([k]) => POOR_LABELS.has(k)).reduce((s, [, v]) => s + v, 0);
      const lengths = inRegion.map((r) => Number(chartFieldValue(r, 'length') ?? chartFieldValue(r, 'CulvertLength'))).filter((v) => Number.isFinite(v) && v > 0);
      return {
        region,
        count: inRegion.length,
        poorPct: inRegion.length ? Math.round((poor / inRegion.length) * 1000) / 10 : 0,
        avgLength: lengths.length ? Math.round((lengths.reduce((s, v) => s + v, 0) / lengths.length) * 10) / 10 : 0,
      };
    });
  };

  const regionRoadClassMapFor = (rows, classField) => {
    const regions = sortedNonUnknownKeys(countBy(rows, 'Region'));
    const map = {};
    regions.forEach((region) => {
      const inRegion = rows.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') === region);
      // road_class/Road_Class has no code dictionary -- decode the tile keys
      // via the formatting-only helper so treemap labels never show a bare
      // letter code (this map is only ever built with a road_class field).
      const rawCounts = countBy(inRegion, classField);
      map[region] = Object.fromEntries(
        Object.entries(rawCounts).map(([code, count]) => [getRoadClassLabel(code === 'Unknown' ? null : code), count])
      );
    });
    return map;
  };

  const heatmapDataFor = (rows) => {
    const regions = sortedNonUnknownKeys(countBy(rows, 'Region'));
    const conditionCounts = countBy(rows, 'OverallCondition');
    const conditions = CONDITION_ORDER.filter((c) => conditionCounts[c] > 0);
    const matrix = [];
    conditions.forEach((cond, ci) => {
      regions.forEach((region, ri) => {
        const n = rows.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') === region && (chartFieldValue(r, 'OverallCondition') || 'Unknown') === cond).length;
        matrix.push([ci, ri, n]);
      });
    });
    return { regions, conditions, matrix };
  };

  const boxplotDataFor = (rows, lengthField) => {
    const allRegions = sortedNonUnknownKeys(countBy(rows, 'Region'));
    // The chart caption promises regions with fewer than 4 measured lengths
    // are omitted from the spread -- actually drop them from both `regions`
    // and `boxData` here (rather than keeping the region with a [0,0,0,0,0]
    // placeholder row) so a sparsely-measured region can't render as a fake
    // all-zero boxplot.
    const regions = [];
    const boxData = [];
    allRegions.forEach((region) => {
      const values = rows.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') === region)
        .map((r) => Number(chartFieldValue(r, lengthField))).filter((v) => Number.isFinite(v) && v > 0);
      if (values.length >= 4) {
        regions.push(region);
        boxData.push(boxStats(values));
      }
    });
    return { regions, boxData };
  };

  // ── Bridges derived data ──────────────────────────────────────────────────
  const bConditionCounts = useMemo(() => countBy(bridges, 'OverallCondition'), [bridges]);
  const bRegionCounts = useMemo(() => countBy(bridges, 'Region'), [bridges]);
  const bRegionStats = useMemo(() => regionStatsFor(bridges), [bridges]);
  const bScatterPairs = useMemo(() => bridges
    .map((r) => [Number(r.length), Number(r.Traffic?.aadt_2026 ?? r.aadt_rebuilt_2026 ?? r.current_predicted_aadt)])
    .filter(([x, y]) => Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0), [bridges]);
  const bGauges = useMemo(() => {
    const rated = Object.entries(bConditionCounts).filter(([k]) => k !== 'Unknown').reduce((s, [, v]) => s + v, 0);
    const poor = Object.entries(bConditionCounts).filter(([k]) => POOR_LABELS.has(k)).reduce((s, [, v]) => s + v, 0);
    return {
      ratedPct: bridges.length ? Math.round((rated / bridges.length) * 100) : 0,
      poorPct: bridges.length ? Math.round((poor / bridges.length) * 100) : 0,
    };
  }, [bridges, bConditionCounts]);
  const bFunnel = useMemo(() => {
    const total = bridges.length;
    const withRegion = bridges.filter((r) => (chartFieldValue(r, 'Region') || 'Unknown') !== 'Unknown');
    const withCondition = withRegion.filter((r) => (chartFieldValue(r, 'OverallCondition') || 'Unknown') !== 'Unknown');
    const withLength = withCondition.filter((r) => Number(r.length) > 0);
    return [
      { name: 'Total bridges', value: total },
      { name: 'Region on file', value: withRegion.length },
      { name: 'Condition rated', value: withCondition.length },
      { name: 'Deck length on file', value: withLength.length },
    ];
  }, [bridges]);
  const bTreemap = useMemo(() => regionRoadClassMapFor(bridges, 'road_class'), [bridges]);
  const bHeatmap = useMemo(() => heatmapDataFor(bridges), [bridges]);
  const bBoxplot = useMemo(() => boxplotDataFor(bridges, 'length'), [bridges]);
  const bTrafficBands = useMemo(() => trafficBandsFor(bridges), [bridges]);

  // ── Culvert derived data ──────────────────────────────────────────────────
  const cConditionCounts = useMemo(() => countBy(culverts, 'OverallCondition'), [culverts]);
  const cRegionCounts = useMemo(() => countBy(culverts, 'Region'), [culverts]);
  const cRegionStats = useMemo(() => regionStatsFor(culverts), [culverts]);
  const cScatterRaw = useMemo(() => culverts
    .map((r) => [Number(r.CulvertLength), Number(r.SpanOrDiameter)])
    .filter(([x, y]) => Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0), [culverts]);
  const cScatterPairs = useMemo(() => cScatterRaw.filter(([, y]) => y <= 10), [cScatterRaw]);
  const cScatterExcluded = cScatterRaw.length - cScatterPairs.length;
  const cGauges = useMemo(() => {
    const rated = Object.entries(cConditionCounts).filter(([k]) => k !== 'Unknown').reduce((s, [, v]) => s + v, 0);
    const poor = Object.entries(cConditionCounts).filter(([k]) => POOR_LABELS.has(k)).reduce((s, [, v]) => s + v, 0);
    return {
      ratedPct: culverts.length ? Math.round((rated / culverts.length) * 100) : 0,
      poorPct: culverts.length ? Math.round((poor / culverts.length) * 100) : 0,
    };
  }, [culverts, cConditionCounts]);
  const cTreemap = useMemo(() => regionRoadClassMapFor(culverts, 'Road_Class'), [culverts]);
  const cHeatmap = useMemo(() => heatmapDataFor(culverts), [culverts]);
  const cBoxplot = useMemo(() => boxplotDataFor(culverts, 'CulvertLength'), [culverts]);
  const cTypeCounts = useMemo(() => countBy(culverts, 'CulvertType'), [culverts]);

  if (!usingExternalData && (!bridges.length || !culverts.length)) {
    return <div className="page-loader"><div className="spinner" /><span>Rendering visual analytics…</span></div>;
  }

  return (
    <div className="analytics-layout">
      <section className="category-explorer">
        <div><span className="panel-kicker">Visual analytics</span><h2>Bridges — chart gallery</h2></div>
      </section>
      <section className="analytics-grid">
        <ChartCard kicker="Condition share" title="Bridges by Overall Condition" option={donutOption(bConditionCounts)} />
        <ChartCard kicker="Regional coverage" title="Bridges by Region" option={hbarOption(bRegionCounts, 'Region')} />
        <ChartCard kicker="Region profile" title="Bridges — Region Comparison" option={radarOption(bRegionStats)} wide />
        <ChartCard
          kicker="Correlation"
          title="Bridge Deck Length vs AADT"
          note={`n=${bScatterPairs.length.toLocaleString()} bridges with both a deck length and an estimated AADT on file.`}
          option={scatterOption(bScatterPairs, 'Deck length (m)', 'AADT (veh/day)', '#00f5ff')}
        />
        <ChartCard kicker="Data quality" title="Bridges — Coverage at a Glance" option={dualGaugeOption(bGauges.ratedPct, bGauges.poorPct)} />
        <ChartCard kicker="Data completeness" title="Bridges — Register Completeness Funnel" option={funnelOption(bFunnel)} />
        <ChartCard kicker="Hierarchy" title="Bridges — Region → Road Class" option={treemapOption(bTreemap)} wide />
        <ChartCard kicker="Region × condition" title="Bridges — Condition Heatmap by Region" option={heatmapOption(bHeatmap.regions, bHeatmap.conditions, bHeatmap.matrix)} />
        <ChartCard
          kicker="Distribution"
          title="Bridges — Deck Length Spread by Region"
          note="Box shows min / Q1 / median / Q3 / max deck length per region (regions with fewer than 4 measured lengths are omitted from the spread)."
          option={boxplotOption(bBoxplot.regions, bBoxplot.boxData)}
        />
        <ChartCard kicker="Network demand" title="Bridges — Traffic Demand Bands" option={roseOption(bTrafficBands)} />
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Visual analytics</span><h2>Culverts — chart gallery</h2></div>
      </section>
      <section className="analytics-grid">
        <ChartCard kicker="Condition share" title="Culverts by Overall Condition" option={donutOption(cConditionCounts)} />
        <ChartCard kicker="Regional coverage" title="Culverts by Region" option={hbarOption(cRegionCounts, 'Region')} />
        <ChartCard kicker="Region profile" title="Culverts — Region Comparison" option={radarOption(cRegionStats)} wide />
        <ChartCard
          kicker="Correlation"
          title="Culvert Length vs Span/Diameter"
          note={`n=${cScatterPairs.length.toLocaleString()} culverts with both dimensions on file${cScatterExcluded ? ` · ${cScatterExcluded} outlier(s) beyond 10 m span excluded as likely data-entry errors` : ''}.`}
          option={scatterOption(cScatterPairs, 'Length (m)', 'Span/diameter (m)', '#ff00e5')}
        />
        <ChartCard kicker="Data quality" title="Culverts — Coverage at a Glance" option={dualGaugeOption(cGauges.ratedPct, cGauges.poorPct)} />
        <ChartCard kicker="Hierarchy" title="Culverts — Region → Road Class" option={treemapOption(cTreemap)} wide />
        <ChartCard kicker="Region × condition" title="Culverts — Condition Heatmap by Region" option={heatmapOption(cHeatmap.regions, cHeatmap.conditions, cHeatmap.matrix)} />
        <ChartCard
          kicker="Distribution"
          title="Culverts — Length Spread by Region"
          note="Box shows min / Q1 / median / Q3 / max culvert length per region (regions with fewer than 4 measured lengths are omitted from the spread)."
          option={boxplotOption(cBoxplot.regions, cBoxplot.boxData)}
        />
        <ChartCard kicker="Culvert types" title="Culverts by Type" option={roseOption(cTypeCounts)} />
      </section>
    </div>
  );
}
