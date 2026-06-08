import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, HardHat, Search, Wrench } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const conditionClass = (value) => {
  if (['Beyond Repair', 'Critical', 'Very Poor'].includes(value)) return 'condition-critical';
  if (value === 'Poor') return 'condition-poor';
  return 'condition-watch';
};

export default function MaintenanceWorkspace({ bridges, onSelectAsset }) {
  const [critical, setCritical] = useState([]);
  const [work, setWork] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      fetch(dataUrl('data/critical_structures.json')).then((response) => response.json()),
      fetch(dataUrl('data/bridge_works.json')).then((response) => response.json()).catch(() => null),
    ]).then(([priorityRows, workRow]) => {
      setCritical(priorityRows);
      setWork(workRow);
    }).catch(console.error);
  }, []);

  const filtered = useMemo(() => critical.filter((row) => {
    const matchesFilter = filter === 'All' || row.OverallRating === filter;
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [row.BridgeNumber, row.BridgeName, row.LinkName, row.MaintenanceStation, row.Comment]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesFilter && matchesQuery;
  }), [critical, filter, query]);

  const summary = useMemo(() => critical.reduce((acc, row) => {
    const key = row.OverallRating || 'Review';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [critical]);

  return (
    <div className="maintenance-layout">
      <section className="kpi-grid compact">
        <article className="kpi-card"><div className="kpi-icon red"><AlertTriangle size={20} /></div><span className="kpi-eyebrow">Priority programme</span><strong>{critical.length}</strong><p>Structures identified for intervention</p></article>
        <article className="kpi-card"><div className="kpi-icon red"><Wrench size={20} /></div><span className="kpi-eyebrow">Poor condition</span><strong>{summary.Poor || 0}</strong><p>Minor to major repairs required</p></article>
        <article className="kpi-card"><div className="kpi-icon amber"><HardHat size={20} /></div><span className="kpi-eyebrow">Active works record</span><strong>{work ? 1 : 0}</strong><p>{work?.bridge || 'No current works record'}</p></article>
      </section>

      <section className="panel maintenance-panel">
        <div className="panel-header maintenance-header">
          <div><span className="panel-kicker">Prioritisation register</span><h2>2026 intervention queue</h2></div>
          <div className="toolbar">
            <label className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search priority structures" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All</option><option>Poor</option><option>Fair</option><option>Critical</option>
            </select>
          </div>
        </div>
        <div className="maintenance-table">
          <div className="maintenance-table-head"><span>ID / structure</span><span>Road link</span><span>Station</span><span>Condition</span><span>Engineering action</span><span /></div>
          {filtered.map((row) => {
            const asset = bridges.find((bridge) => bridge.BridgeNumber === row.BridgeNumber);
            return (
              <div className="maintenance-table-row" key={`${row.BridgeNumber}-${row.LinkID}`}>
                <span><strong>{row.BridgeNumber}</strong><small>{row.BridgeName || 'Unnamed bridge'}</small></span>
                <span><strong>{row.LinkName || row.LinkID || 'Unlinked'}</strong><small>{row.BridgeLength || '-'} m long / {row.BridgeWidth || '-'} m wide</small></span>
                <span>{row.MaintenanceStation || 'Unassigned'}</span>
                <span><em className={`condition-pill ${conditionClass(row.OverallRating)}`}>{row.OverallRating || 'Review'}</em></span>
                <span>{row.Comment || 'Engineering assessment required'}</span>
                <button className="icon-button" disabled={!asset} onClick={() => asset && onSelectAsset({ ...asset, _structureType: 'bridge' })} title="Open on map"><ArrowRight size={16} /></button>
              </div>
            );
          })}
        </div>
      </section>

      {work && (
        <section className="panel active-work-panel">
          <div className="panel-header"><div><span className="panel-kicker">Active contract</span><h2>{work.bridge}</h2></div><span className="programme-badge">{work.funder || 'GOU'}</span></div>
          <div className="active-work-grid">
            <div><span>Contract team</span><p>{work.contractor_consultant}</p></div>
            <div><span>Financial status</span><p>{work.financial_status}</p></div>
            <div><span>Progress and constraints</span><p>{work.status}</p></div>
          </div>
        </section>
      )}
    </div>
  );
}
