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
import { getConditionLabel } from '../utils/dataDictionary';

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

export default function BmsOverview({ onNavigate, onSelectAsset }) {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [critical, setCritical] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchBridges(),
      fetchCulverts(),
      fetch(dataUrl('data/analytics.json')).then((response) => response.json()),
      fetch(dataUrl('data/critical_structures.json')).then((response) => response.json()),
    ]).then(([bridgeRows, culvertRows, analyticsData, criticalRows]) => {
      setBridges(bridgeRows);
      setCulverts(culvertRows);
      setAnalytics(analyticsData);
      setCritical(criticalRows);
    }).catch(console.error);
  }, []);

  const metrics = useMemo(() => {
    if (!analytics) return { rated: 0, poor: 0, averageAadt: 0 };

    // Calculate rated and poor from analytics directly
    const rated = Object.entries(analytics.condition_overall || {})
      .filter(([k]) => k !== 'Unknown')
      .reduce((sum, entry) => sum + entry[1], 0);

    const poor = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor']
      .reduce((sum, k) => sum + (analytics.condition_overall?.[k] || 0), 0);

    // Calculate traffic from top-level fields
    const traffic = bridges.filter((row) => Number(row.Traffic?.aadt_2026 ?? row.aadt_rebuilt_2026 ?? row.current_predicted_aadt) > 0);
    const averageAadt = traffic.length
      ? Math.round(traffic.reduce((sum, row) => sum + Number(row.Traffic?.aadt_2026 ?? row.aadt_rebuilt_2026 ?? row.current_predicted_aadt), 0) / traffic.length)
      : 0;

    return { rated, poor, averageAadt };
  }, [bridges, analytics]);

  const priorityRows = useMemo(() => critical.map((row) => ({
    ...row,
    asset: bridges.find((bridgeRow) => bridgeRow.BridgeNumber === row.BridgeNumber),
  })), [bridges, critical]);

  const regionRows = useMemo(() => {
    if (!analytics) return [];
    const regions = new Set([...Object.keys(analytics.bridges_by_region || {}), ...Object.keys(analytics.culverts_by_region || {})]);
    return [...regions]
      .filter((region) => region !== 'Unknown')
      .map((region) => ({
        region,
        bridges: analytics.bridges_by_region?.[region] || 0,
        culverts: analytics.culverts_by_region?.[region] || 0,
      }))
      .sort((a, b) => (b.bridges + b.culverts) - (a.bridges + a.culverts));
  }, [analytics]);

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

  const conditionChartOptions = useMemo(() => {
    if (!analytics || !analytics.condition_overall) return {};
    const data = CONDITION_ORDER.map(label => ({
      name: label,
      value: analytics.condition_overall[label] || 0,
      itemStyle: {
        color: label === 'Beyond Repair' || label === 'Critical' || label === 'Very Poor' ? '#ef4444' :
               label === 'Poor' ? '#f97316' :
               label === 'Marginal' || label === 'Fair' ? '#eab308' :
               label === 'Satisfactory' ? '#84cc16' : '#22c55e'
      }
    })).filter(d => d.value > 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: data.map(d => d.name),
        axisLabel: { color: '#ffffff', fontWeight: 600, interval: 0, rotate: 25 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
      },
      yAxis: { 
        type: 'value',
        axisLabel: { color: '#ffffff' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      series: [
        {
          name: 'Condition',
          type: 'bar',
          data: data,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: { show: true, position: 'top', color: '#ffffff', fontWeight: 800 }
        }
      ]
    };
  }, [analytics]);

  if (!analytics) {
    return <div className="page-loader"><div className="spinner" /><span>Loading network status...</span></div>;
  }

  return (
    <div className="overview-layout">
      <section className="kpi-grid" aria-label="Network summary">
        <article className="kpi-card">
          <div className="kpi-icon blue"><Landmark size={21} /></div>
          <span className="kpi-eyebrow">Structure register</span>
          <strong>{(bridges.length + culverts.length).toLocaleString()}</strong>
          <p>{bridges.length} bridges and {culverts.length} major culverts</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon red"><AlertTriangle size={21} /></div>
          <span className="kpi-eyebrow">Immediate attention</span>
          <strong>{critical.length}</strong>
          <p>{metrics.poor} bridges rated poor or worse</p>
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
          <div className="region-list">
            {regionRows.map((row) => (
              <div className="region-row" key={row.region}>
                <MapPin size={15} />
                <strong>{row.region}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
                <b>{row.bridges + row.culverts}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-grid" style={{ gap: '16px', marginTop: '16px' }}>
        <article className="panel coverage-panel glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <div className="panel-header" style={{ flexShrink: 0 }}><div><span className="panel-kicker">Station coverage</span><h2>Structures by maintenance station</h2></div></div>
          <div className="region-list modern-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {stationRows.map((row) => (
              <div className="region-row" key={row.station}>
                <HardHat size={15} />
                <strong>{row.station}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
                <b>{row.bridges + row.culverts}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel coverage-panel glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <div className="panel-header" style={{ flexShrink: 0 }}><div><span className="panel-kicker">Route coverage</span><h2>Structures by road name</h2></div></div>
          <div className="region-list modern-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {roadRows.map((row) => (
              <div className="region-row" key={row.road}>
                <Route size={15} />
                <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.road}>{row.road}</strong>
                <span>{row.bridges} bridges</span>
                <span>{row.culverts} culverts</span>
                <b>{row.bridges + row.culverts}</b>
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
                  <span><strong>{row.BridgeNumber}</strong><small>{row.BridgeName || 'Unnamed bridge'}</small></span>
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
    </div>
  );
}
