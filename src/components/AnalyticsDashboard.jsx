import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, Landmark, MapPin, TrendingUp } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';

const palette = ['#0b6b43', '#e3a008', '#be3a34', '#4b7f9f', '#7a6a4f', '#8e9a8b'];
const textStyle = { color: '#405047', fontFamily: 'Arial, sans-serif' };
const axis = { axisLabel: textStyle, axisLine: { lineStyle: { color: '#c9d2cc' } }, splitLine: { lineStyle: { color: '#e8ede9' } } };

const barOption = (data, horizontal = false) => ({
  color: [palette[0]],
  tooltip: { trigger: 'axis' },
  grid: { left: horizontal ? 105 : 45, right: 20, bottom: 42, top: 16 },
  xAxis: horizontal ? { ...axis, type: 'value' } : { ...axis, type: 'category', data: Object.keys(data), axisLabel: { ...textStyle, rotate: 25 } },
  yAxis: horizontal ? { ...axis, type: 'category', data: Object.keys(data) } : { ...axis, type: 'value' },
  series: [{ type: 'bar', data: Object.values(data), barMaxWidth: 32, itemStyle: { borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] } }],
});

const pieOption = (data) => ({
  color: palette,
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle, type: 'scroll' },
  series: [{ type: 'pie', radius: ['43%', '68%'], center: ['50%', '44%'], label: { color: '#405047', formatter: '{b}\n{c}' }, data: Object.entries(data).map(([name, value]) => ({ name, value })) }],
});

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}data/analytics.json`).then((response) => response.json()).then(setData).catch(console.error);
  }, []);

  const metrics = useMemo(() => {
    if (!data) return {};
    const totalBridges = Object.values(data.bridges_by_region || {}).reduce((a, b) => a + b, 0);
    const totalCulverts = Object.values(data.culverts_by_region || {}).reduce((a, b) => a + b, 0);
    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor'].reduce((sum, key) => sum + (data.condition_overall?.[key] || 0), 0);
    const highTraffic = (data.traffic_bins?.['10,000 - 24,999'] || 0) + (data.traffic_bins?.['25,000+'] || 0);
    return { totalBridges, totalCulverts, poor, highTraffic };
  }, [data]);

  if (!data) return <div className="page-loader"><div className="spinner" /><span>Preparing analytics...</span></div>;

  return (
    <div className="analytics-layout">
      <section className="kpi-grid compact">
        <article className="kpi-card"><div className="kpi-icon blue"><Landmark size={20} /></div><span className="kpi-eyebrow">Bridges analysed</span><strong>{metrics.totalBridges}</strong><p>Across six maintenance regions</p></article>
        <article className="kpi-card"><div className="kpi-icon blue"><MapPin size={20} /></div><span className="kpi-eyebrow">Major culverts</span><strong>{metrics.totalCulverts}</strong><p>Linked to the national road network</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><BarChart3 size={20} /></div><span className="kpi-eyebrow">Poor or worse</span><strong>{metrics.poor}</strong><p>Bridge records requiring intervention</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><TrendingUp size={20} /></div><span className="kpi-eyebrow">High-traffic bridges</span><strong>{metrics.highTraffic}</strong><p>Estimated AADT above 10,000</p></article>
      </section>
      <section className="analytics-grid">
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Condition</span><h2>Overall bridge condition</h2></div></div><ReactECharts option={barOption(data.condition_overall, true)} style={{ height: 360 }} /></article>
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Demand</span><h2>Traffic demand bands</h2></div></div><ReactECharts option={pieOption(data.traffic_bins)} style={{ height: 360 }} /></article>
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Regional distribution</span><h2>Bridges by region</h2></div></div><ReactECharts option={barOption(data.bridges_by_region)} style={{ height: 340 }} /></article>
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Regional distribution</span><h2>Major culverts by region</h2></div></div><ReactECharts option={barOption(data.culverts_by_region)} style={{ height: 340 }} /></article>
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Operations</span><h2>Maintenance stations</h2></div></div><ReactECharts option={barOption(data.maintenance_stations, true)} style={{ height: 420 }} /></article>
        <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">Risk</span><h2>Scour risk profile</h2></div></div><ReactECharts option={pieOption(data.scour_risk)} style={{ height: 420 }} /></article>
      </section>
    </div>
  );
}
