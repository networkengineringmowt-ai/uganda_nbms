import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, Landmark, MapPin, TrendingUp } from 'lucide-react';
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
const colors = ['#4f8cff', '#28c7a1', '#f5c451', '#ff7d59', '#af83ff', '#52c7e8'];
const textStyle = { color: '#d9e7ff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 };

const topCategories = (data = {}, limit = 12) => {
  const entries = Object.entries(data).filter(([, value]) => Number(value) > 0).sort((a, b) => b[1] - a[1]);
  if (entries.length <= limit) return Object.fromEntries(entries);
  const head = entries.slice(0, limit - 1);
  const other = entries.slice(limit - 1).reduce((sum, [, value]) => sum + value, 0);
  return Object.fromEntries([...head, ['Other', other]]);
};

const extendedColors = ['#4f8cff', '#28c7a1', '#f5c451', '#ff7d59', '#af83ff', '#52c7e8', '#ff4f81', '#4fd1ff', '#8fff4f', '#ff9f4f'];

const bar2DOption = (rawData, xName) => {
  const data = Object.entries(topCategories(rawData));
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    color: extendedColors,
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(([name]) => name),
      name: xName,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { ...textStyle, fontSize: 12 },
      axisLabel: { ...textStyle, interval: 0, fontSize: 10, rotate: data.length > 5 ? 45 : 0, hideOverlap: true },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: '#6480ae' } },
      axisLine: { lineStyle: { color: '#6480ae' } },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { ...textStyle, padding: [0, 0, 0, 10] },
      axisLabel: { ...textStyle, fontSize: 10 },
      axisTick: { show: true, lineStyle: { color: '#6480ae' } },
      axisLine: { show: true, lineStyle: { color: '#6480ae' } },
      splitLine: { show: true, lineStyle: { color: 'rgba(100, 128, 174, 0.2)', type: 'dashed' } }
    },
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    series: [{
      type: 'bar',
      data: data.map(([, value]) => value),
      colorBy: 'data',
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', ...textStyle, fontSize: 10 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  };
};

const fieldValue = (row, key) => row[key] ?? row.LegacyData?.[key];
const countField = (rows, key, dictionary) => rows.reduce((counts, row) => {
  const raw = fieldValue(row, key);
  const label = dictionary ? getDictionaryLabel(dictionary, raw) : (raw || 'Unknown');
  counts[label] = (counts[label] || 0) + 1;
  return counts;
}, {});

const categoricalFields = [
  { id: 'type_bridge', label: 'Structural Type', short: 'Bridge type', dictionary: TYPE_BRIDGE, color: colors[0] },
  { id: 'type_deck', label: 'Deck Form', short: 'Deck', dictionary: TYPE_DECK, color: colors[1] },
  { id: 'type_deck_material', label: 'Deck Material', short: 'Material', dictionary: TYPE_DECK_MATERIAL, color: colors[2] },
  { id: 'type_crossing', label: 'Crossing Type', short: 'Crossing', dictionary: TYPE_CROSSING, color: colors[3] },
  { id: 'type_abutment_l', label: 'Abutment Type', short: 'Abutment', dictionary: TYPE_ABUTMENT, color: colors[4] },
  { id: 'type_piers', label: 'Pier Type', short: 'Piers', dictionary: TYPE_PIERS, color: colors[5] },
  { id: 'type_para_rail', label: 'Parapet / Railing', short: 'Railing', dictionary: TYPE_PARAPET_RAILING, color: colors[0] },
  { id: 'type_bearings', label: 'Bearing Type', short: 'Bearings', dictionary: TYPE_BEARINGS, color: colors[1] },
  { id: 'road_class', label: 'Road Class', short: 'Road class', color: colors[2] },
  { id: 'scour_risk', label: 'Scour Risk', short: 'Scour risk', color: colors[3] },
];

function ChartPanel({ kicker, title, data, color, wide = false }) {
  return (
    <article className={`panel chart-panel glass-card ${wide ? 'wide' : ''}`}>
      <div className="panel-header"><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div></div>
      <ReactECharts option={bar2DOption(data, title, color)} style={{ height: wide ? 430 : 370 }} opts={{ renderer: 'canvas' }} />
    </article>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [bridges, setBridges] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}data/analytics.json`).then((response) => response.json()).then(setData).catch(console.error);
    fetch(`${BASE_URL}data/bridges.json`).then((response) => response.json()).then(setBridges).catch(console.error);
  }, []);

  const metrics = useMemo(() => {
    if (!data) return {};
    const totalBridges = Object.values(data.bridges_by_region || {}).reduce((sum, value) => sum + value, 0);
    const totalCulverts = Object.values(data.culverts_by_region || {}).reduce((sum, value) => sum + value, 0);
    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor'].reduce((sum, key) => sum + (data.condition_overall?.[key] || 0), 0);
    const highTraffic = (data.traffic_bins?.['10,000 - 24,999'] || 0) + (data.traffic_bins?.['25,000+'] || 0);
    return { totalBridges, totalCulverts, poor, highTraffic };
  }, [data]);

  const categories = useMemo(() => Object.fromEntries(categoricalFields.map((field) => [
    field.id,
    countField(bridges, field.id, field.dictionary),
  ])), [bridges]);

  if (!data) return <div className="page-loader"><div className="spinner" /><span>Preparing analytics...</span></div>;

  return (
    <div className="analytics-layout">
      <section className="kpi-grid compact">
        <article className="kpi-card"><div className="kpi-icon blue"><Landmark size={20} /></div><span className="kpi-eyebrow">Bridges analysed</span><strong>{metrics.totalBridges}</strong><p>Across six maintenance regions</p></article>
        <article className="kpi-card"><div className="kpi-icon blue"><MapPin size={20} /></div><span className="kpi-eyebrow">Major culverts</span><strong>{metrics.totalCulverts}</strong><p>Linked to the national road network</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><BarChart3 size={20} /></div><span className="kpi-eyebrow">Poor or worse</span><strong>{metrics.poor}</strong><p>Bridge records requiring intervention</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><TrendingUp size={20} /></div><span className="kpi-eyebrow">High-traffic bridges</span><strong>{metrics.highTraffic}</strong><p>Estimated AADT above 10,000</p></article>
      </section>

      <section className="category-explorer">
        <div><span className="panel-kicker">Data dictionary explorer</span><h2>Categorical engineering fields</h2></div>
      </section>

      <section className="analytics-grid">
        <ChartPanel kicker="Regional coverage" title="Bridges by Region" data={data.bridges_by_region} color={colors[0]} />
        <ChartPanel kicker="Network demand" title="Traffic Demand Bands" data={data.traffic_bins} color={colors[2]} />
        <ChartPanel kicker="Condition distribution" title="Overall Bridge Condition" data={data.condition_overall} color={colors[3]} wide />
        {categoricalFields.map((field) => (
          <ChartPanel 
            key={field.id}
            kicker="Dictionary field" 
            title={field.label} 
            data={categories[field.id]} 
            color={field.color} 
          />
        ))}
      </section>
    </div>
  );
}
