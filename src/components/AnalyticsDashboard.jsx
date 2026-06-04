import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/uganda_bms/data/analytics.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Rendering Analytics Matrix...</p>
    </div>
  );

  const theme = {
    color: ['#00e5ff', '#a64dff', '#ff3366', '#ffcc00', '#00ffcc', '#3366ff'],
    textStyle: { fontFamily: 'Inter, sans-serif' }
  };

  const getPie = (obj, name) => ({
    title: { text: name, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 10, borderColor: '#0a0f1c', borderWidth: 2 }, data: Object.keys(obj).map(k => ({name: k, value: obj[k]})) }]
  });

  const getBar = (obj, name) => ({
    title: { text: name, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(obj), axisLabel: { color: '#8892b0' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1a2235' } }, axisLabel: { color: '#8892b0' } },
    series: [{ type: 'bar', data: Object.values(obj), itemStyle: { borderRadius: [4, 4, 0, 0] } }]
  });

  const getRadar = (title, items) => {
    const keys = [...new Set(items.flatMap(i => Object.keys(i.data)))];
    return {
      title: { text: title, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 } },
      tooltip: {},
      radar: { indicator: keys.map(k => ({ name: k })), axisName: { color: '#8892b0' }, splitLine: { lineStyle: { color: '#1a2235' } }, splitArea: { show: false } },
      series: [{ type: 'radar', data: items.map(i => ({ name: i.name, value: keys.map(k => i.data[k] || 0) })) }]
    };
  };

  const getFunnel = (obj, name) => ({
    title: { text: name, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{ type: 'funnel', left: '10%', top: 60, bottom: 60, width: '80%', sort: 'descending', gap: 2, label: { show: true, position: 'inside' }, data: Object.keys(obj).map(k => ({name: k, value: obj[k]})) }]
  });

  const getSparkline = (obj, name) => ({
    title: { text: name, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(obj), show: false },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', data: Object.values(obj), areaStyle: { opacity: 0.2 }, smooth: true, symbol: 'none' }]
  });

  const get3DScatter = (title, array) => ({
    title: { text: title, left: 'center', textStyle: { color: '#e0e5ec', fontSize: 14 }, top: 0 },
    tooltip: {},
    xAxis3D: { type: 'value', name: 'AADT', axisLabel: { color: '#8892b0' } },
    yAxis3D: { type: 'value', name: 'Growth Rate', axisLabel: { color: '#8892b0' } },
    zAxis3D: { type: 'value', name: 'Length (m)', axisLabel: { color: '#8892b0' } },
    grid3D: { viewControl: { autoRotate: true }, axisLine: { lineStyle: { color: '#8892b0' } }, splitLine: { lineStyle: { color: '#1a2235' } } },
    series: [{ type: 'scatter3D', symbolSize: 5, data: array.map(v => [v[0], v[1]*100, v[2]]), itemStyle: { color: '#00e5ff', opacity: 0.8 } }]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(166, 77, 255, 0.1))', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem' }}>Advanced Analytics Matrix</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>20 dynamic visualizations aggregating the complete BMS dataset.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-card"><ReactECharts option={getBar(data.bridges_by_region, '1. Bridges by Region')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getBar(data.culverts_by_region, '2. Culverts by Region')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.traffic_bins, '3. Traffic AADT Distribution')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.condition_overall, '4. Overall Conditions')} theme={theme} style={{ height: '300px' }} /></div>
        
        <div className="glass-card"><ReactECharts option={getRadar('5. Structural Health Matrix', [{name: 'Substructure', data: data.condition_substructure}, {name: 'Superstructure', data: data.condition_superstructure}])} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getFunnel(data.deck_materials, '6. Deck Materials Funnel')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.bridge_types, '7. Bridge Types')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getSparkline(data.construction_timeline, '8. Construction Timeline')} theme={theme} style={{ height: '300px' }} /></div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <ReactECharts option={get3DScatter('9. Traffic Growth vs Span Length 3D Matrix', data.traffic_growth_scatter)} theme={theme} style={{ height: '500px' }} />
        </div>

        <div className="glass-card"><ReactECharts option={getBar(data.bridge_lengths, '10. Bridge Length Categories')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.scour_risk, '11. Scour Risk Levels')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getBar(data.maintenance_stations, '12. Maintenance Stations')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.culvert_conditions, '13. Culvert Conditions')} theme={theme} style={{ height: '300px' }} /></div>

        <div className="glass-card"><ReactECharts option={getBar(data.culvert_spans, '14. Culvert Spans (m)')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.bridge_owners, '15. Structure Ownership')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getBar(data.superload_routes, '16. Superload Routes')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getFunnel(data.critical_counts, '17. Critical Structure Triage')} theme={theme} style={{ height: '300px' }} /></div>

        <div className="glass-card"><ReactECharts option={getSparkline(data.condition_waterway, '18. Waterway Health Distribution')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getPie(data.condition_substructure, '19. Substructure Ratings')} theme={theme} style={{ height: '300px' }} /></div>
        <div className="glass-card"><ReactECharts option={getBar(data.condition_superstructure, '20. Superstructure Ratings')} theme={theme} style={{ height: '300px' }} /></div>
      </div>
    </div>
  );
}
