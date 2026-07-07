import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Wallet, Wrench, AlertTriangle, Layers } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_nbms/';
const dataUrl = (p) => `${BASE_URL}${p.replace(/^\/+/, '')}`;

const BAND_COLOR = { Critical: '#ef4444', Poor: '#f97316', Fair: '#eab308', Good: '#22c55e', 'No Data': '#64748b' };
const INTERV_COLOR = {
  'Bridge Replacement': '#ef4444', 'Major Rehabilitation': '#f97316',
  'Preventive Repair': '#eab308', 'Routine Maintenance': '#22c55e',
};
const fmtMn = (n) => (n == null ? '-' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }));
const fmtBn = (n) => (n == null ? '-' : (n / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }));

export default function InvestmentDashboard() {
  const [data, setData] = useState(null);
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    fetch(dataUrl('data/bridge_investment.json')).then(r => r.json()).then(setData).catch(console.error);
  }, []);

  const bridges = data?.bridges || [];
  const s = data?.summary;

  const ranked = useMemo(() => bridges
    .filter(b => b.priority_rank != null && (regionFilter === 'All' || b.region === regionFilter))
    .sort((a, b) => a.priority_rank - b.priority_rank), [bridges, regionFilter]);

  const regions = useMemo(() => ['All', ...Object.keys(s?.by_region || {}).sort()], [s]);

  const donut = useMemo(() => {
    if (!s) return {};
    const entries = Object.entries(s.by_band);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} bridges ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#9aa5c4', fontSize: 10 } },
      series: [{
        type: 'pie', radius: ['45%', '72%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
        label: { color: '#f0f3fa', fontSize: 11, formatter: '{b}\n{c}' },
        data: entries.map(([k, v]) => ({ name: k, value: v, itemStyle: { color: BAND_COLOR[k] || '#64748b' } })),
      }],
    };
  }, [s]);

  const costByInterv = useMemo(() => {
    if (!s) return {};
    const order = ['Bridge Replacement', 'Major Rehabilitation', 'Preventive Repair', 'Routine Maintenance'];
    const rows = order.filter(k => s.by_intervention[k]);
    return {
      grid: { left: 140, right: 60, top: 10, bottom: 24 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>UGX ${fmtMn(p[0].value)} Mn` },
      xAxis: { type: 'value', axisLabel: { color: '#9aa5c4' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
      yAxis: { type: 'category', data: rows, axisLabel: { color: '#f0f3fa', fontSize: 11 } },
      series: [{
        type: 'bar', barWidth: 18,
        data: rows.map(k => ({ value: Math.round(s.by_intervention[k].cost), itemStyle: { color: INTERV_COLOR[k], borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: '#f0f3fa', fontSize: 10, formatter: p => fmtMn(p.value) },
      }],
    };
  }, [s]);

  const costByRegion = useMemo(() => {
    if (!s) return {};
    const rows = Object.entries(s.by_region).sort((a, b) => b[1].cost - a[1].cost);
    return {
      grid: { left: 90, right: 60, top: 10, bottom: 24 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>UGX ${fmtMn(p[0].value)} Mn` },
      xAxis: { type: 'value', axisLabel: { color: '#9aa5c4' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
      yAxis: { type: 'category', data: rows.map(r => r[0]), axisLabel: { color: '#f0f3fa', fontSize: 11 } },
      series: [{
        type: 'bar', barWidth: 16,
        data: rows.map(r => Math.round(r[1].cost)),
        itemStyle: { color: '#38bdf8', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#9aa5c4', fontSize: 10, formatter: p => fmtMn(p.value) },
      }],
    };
  }, [s]);

  if (!data) return (
    <div className="loader-container"><div className="spinner"></div><p>Loading investment model…</p></div>
  );

  const kpis = [
    { icon: <Wallet size={20} />, label: 'Total capital need', value: `UGX ${fmtBn(s.total_cost_ugx_mn)} Bn`, sub: `${s.total_bridges} bridges · UNRA model 2026` },
    { icon: <AlertTriangle size={20} />, label: 'Replacements', value: s.by_intervention['Bridge Replacement']?.count || 0, sub: `UGX ${fmtBn(s.by_intervention['Bridge Replacement']?.cost)} Bn` },
    { icon: <Wrench size={20} />, label: 'Major rehabilitations', value: s.by_intervention['Major Rehabilitation']?.count || 0, sub: `UGX ${fmtBn(s.by_intervention['Major Rehabilitation']?.cost)} Bn` },
    { icon: <Layers size={20} />, label: 'Preventive + routine', value: (s.by_intervention['Preventive Repair']?.count || 0) + (s.by_intervention['Routine Maintenance']?.count || 0), sub: 'Programmed preservation' },
  ];

  return (
    <div className="panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto', height: '100%' }}>
      <div>
        <span className="panel-kicker"><TrendingUp size={12} style={{ display: 'inline', marginRight: 5 }} />UNRA Bridge Investment Model · FY2026/27</span>
        <h2 style={{ margin: '4px 0 0', fontWeight: 700 }}>Investment planning &amp; prioritisation</h2>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => (
          <article className="kpi-card" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: 'var(--accent-primary)' }}>{k.icon}</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k.label}</span>
            <strong style={{ fontSize: 24, fontWeight: 800, color: '#f0f3fa' }}>{k.value}</strong>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{k.sub}</span>
          </article>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ minHeight: 300 }}>
          <div className="panel-header"><div><span className="panel-kicker">Condition banding</span><h2>Bridges by investment band</h2></div></div>
          <ReactECharts option={donut} style={{ height: 250 }} />
        </div>
        <div className="glass-card" style={{ minHeight: 300 }}>
          <div className="panel-header"><div><span className="panel-kicker">Capital allocation</span><h2>Indicative cost by intervention</h2></div></div>
          <ReactECharts option={costByInterv} style={{ height: 250 }} />
        </div>
        <div className="glass-card" style={{ minHeight: 300 }}>
          <div className="panel-header"><div><span className="panel-kicker">Regional need</span><h2>Indicative cost by region (UGX Mn)</h2></div></div>
          <ReactECharts option={costByRegion} style={{ height: 250 }} />
        </div>
      </section>

      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 300 }}>
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><span className="panel-kicker">Prioritised backlog</span><h2>Bridge intervention priority ranking</h2></div>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Rank', 'Bridge', 'Name', 'Region', 'Class', 'Band', 'Recommended Intervention', 'Planning Window', 'Cost (UGX Mn)'].map(h => (
                  <th key={h} style={{ textAlign: h.includes('Cost') ? 'right' : 'left', padding: '10px 12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '.05em', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 120).map(b => (
                <tr key={b.bridge_no} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--accent-primary)' }}>{b.priority_rank}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{b.bridge_no}</td>
                  <td style={{ padding: '8px 12px' }}>{b.name || '-'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{b.region || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{b.road_class}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 800, color: BAND_COLOR[b.band], background: `${BAND_COLOR[b.band]}22`, border: `1px solid ${BAND_COLOR[b.band]}55` }}>{b.band}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: INTERV_COLOR[b.intervention] || 'var(--text-primary)', fontWeight: 600 }}>{b.intervention}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{b.planning_window}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{fmtMn(b.indicative_cost_ugx_mn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranked.length > 120 && <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>Showing top 120 of {ranked.length} ranked bridges.</div>}
        </div>
      </section>
    </div>
  );
}
