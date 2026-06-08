import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  Landmark,
  MapPin,
  Route,
  TrendingUp,
} from 'lucide-react';
import { fetchBridges, fetchCulverts } from '../services/bmsDataService';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const CONDITION_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good'];
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
    const rated = bridges.filter((row) => row.OverallCondition && row.OverallCondition !== 'Unknown').length;
    const poor = bridges.filter((row) => ['Beyond Repair', 'Critical', 'Very Poor', 'Poor'].includes(row.OverallCondition)).length;
    const traffic = bridges.filter((row) => Number(row.Traffic?.aadt_2026) > 0);
    const averageAadt = traffic.length
      ? Math.round(traffic.reduce((sum, row) => sum + Number(row.Traffic.aadt_2026), 0) / traffic.length)
      : 0;
    return { rated, poor, averageAadt };
  }, [bridges]);

  const priorityRows = useMemo(() => critical.slice(0, 8).map((row) => ({
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

  if (!analytics) {
    return <div className="page-loader"><div className="spinner" /><span>Loading network status...</span></div>;
  }

  return (
    <div className="overview-layout">
      <section className="kpi-grid" aria-label="Network summary">
        <article className="kpi-card">
          <div className="kpi-icon green"><Landmark size={21} /></div>
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

      <section className="overview-grid">
        <article className="panel condition-panel">
          <div className="panel-header">
            <div><span className="panel-kicker">Network health</span><h2>Bridge condition distribution</h2></div>
            <button className="text-button" onClick={() => onNavigate('analytics')}>Full analytics <ArrowRight size={15} /></button>
          </div>
          <div className="condition-strip">
            {CONDITION_ORDER.map((label) => {
              const value = analytics.condition_overall?.[label] || 0;
              return <div key={label} className={CONDITION_CLASS[label]} style={{ flexGrow: value || 0.25 }} title={`${label}: ${value}`} />;
            })}
          </div>
          <div className="condition-legend">
            {CONDITION_ORDER.map((label) => (
              <div key={label}>
                <span className={`legend-swatch ${CONDITION_CLASS[label]}`} />
                <span>{label}</span>
                <strong>{analytics.condition_overall?.[label] || 0}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel coverage-panel">
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

      <section className="overview-grid lower">
        <article className="panel priority-panel">
          <div className="panel-header">
            <div><span className="panel-kicker">Engineer work queue</span><h2>Priority structures</h2></div>
            <button className="text-button" onClick={() => onNavigate('maintenance')}>Maintenance plan <ArrowRight size={15} /></button>
          </div>
          <div className="priority-table">
            <div className="priority-table-head"><span>Structure</span><span>Location</span><span>Condition</span><span>Action note</span></div>
            {priorityRows.map((row) => (
              <button
                className="priority-table-row"
                key={`${row.BridgeNumber}-${row.LinkID}`}
                onClick={() => row.asset && onSelectAsset({ ...row.asset, _structureType: 'bridge' })}
              >
                <span><strong>{row.BridgeNumber}</strong><small>{row.BridgeName || 'Unnamed bridge'}</small></span>
                <span><strong>{row.MaintenanceStation || 'Unassigned'}</strong><small>{row.LinkName || row.LinkID}</small></span>
                <span><em className={`condition-pill ${CONDITION_CLASS[row.OverallRating] || 'condition-watch'}`}>{row.OverallRating || 'Review'}</em></span>
                <span>{row.Comment || 'Engineering review required'}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel quick-actions-panel">
          <div className="panel-header"><div><span className="panel-kicker">Work areas</span><h2>Operational shortcuts</h2></div></div>
          <button onClick={() => onNavigate('map')}><MapPin size={18} /><span><strong>Open network map</strong><small>Locate and inspect structures</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('inspections')}><ClipboardCheck size={18} /><span><strong>Inspection programme</strong><small>Capture component ratings</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('maintenance')}><HardHat size={18} /><span><strong>Maintenance priorities</strong><small>Review urgent interventions</small></span><ArrowRight size={16} /></button>
          <button onClick={() => onNavigate('assets')}><Route size={18} /><span><strong>National asset register</strong><small>Search inventory and road links</small></span><ArrowRight size={16} /></button>
          <div className="data-assurance"><CheckCircle2 size={18} /><span><strong>Data assurance active</strong><small>National-road coordinates and host links validated</small></span></div>
        </article>
      </section>
    </div>
  );
}
