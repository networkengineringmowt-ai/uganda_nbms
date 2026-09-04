import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import { getConditionLabel, toProperCase } from '../utils/dataDictionary';
import { getCriticalBridgeRows } from '../utils/bmsAlgorithms';

// Worst-to-best condition order, used only to give the "Condition" column a
// meaningful sort (its display value is a label, not a number).
const CONDITION_SORT_ORDER = ['Beyond Repair', 'Critical', 'Very Poor', 'Poor', 'Marginal', 'Fair', 'Satisfactory', 'Good', 'Very Good', 'Excellent', 'Unknown'];

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const conditionClass = (value) => {
  if (['Beyond Repair', 'Critical', 'Very Poor'].includes(value)) return 'condition-critical';
  if (value === 'Poor') return 'condition-poor';
  return 'condition-watch';
};

// bridge_works.json's contractor_consultant field is free text that always
// embeds named individuals ("Project Manager: <name>", "Project Engineer(s):
// <name>") alongside the organisational lines ("Contractor", "Consultant",
// "Supervisor"). This platform never surfaces individual/staff names, so
// only the organisational blocks are kept for display.
const PERSONNEL_LABEL_RE = /^project (manager|engineer)s?\s*:?\s*$/i;
const stripPersonnelNames = (text) => {
  if (!text) return text;
  return text
    .split(/\n\s*\n/)
    .filter((block) => !PERSONNEL_LABEL_RE.test(block.split('\n')[0].trim()))
    .join('\n\n')
    .trim();
};

export default function MaintenanceWorkspace({ bridges, onSelectAsset }) {
  // Live-computed from the current bridge register (bmsAlgorithms.js
  // getCriticalBridgeRows) rather than a separately-maintained snapshot
  // file -- a bridge re-inspected to a better (or worse) condition since
  // that snapshot was taken now shows up here correctly, instead of the
  // 2026 intervention queue silently disagreeing with the bridge's actual
  // current record shown everywhere else in the app.
  const critical = useMemo(() => getCriticalBridgeRows(bridges), [bridges]);
  const [works, setWorks] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch(dataUrl('data/bridge_works.json')).then((response) => response.json()).catch(() => [])
      .then((workRows) => setWorks(Array.isArray(workRows) ? workRows : []))
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => critical.filter((row) => {
    const matchesFilter = filter === 'All' || getConditionLabel(row.OverallRating) === filter;
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [row.BridgeNumber, row.BridgeName, row.LinkName, row.MaintenanceStation, row.Comment]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesFilter && matchesQuery;
  }), [critical, filter, query]);

  // Sort state for the div-grid "2026 intervention queue" table below --
  // this table has no <table>/<th> elements to attach sort to, so the sort
  // is driven off column keys matched to each grid cell's underlying value.
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const toggleSort = (key) => setSort((current) => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  }));
  const queueSortValue = (row, key) => {
    if (key === 'id') return row.BridgeNumber || '';
    if (key === 'link') return row.LinkName || row.LinkID || '';
    if (key === 'station') return row.MaintenanceStation || '';
    if (key === 'condition') return CONDITION_SORT_ORDER.indexOf(getConditionLabel(row.OverallRating));
    if (key === 'action') return row.Comment || '';
    return '';
  };
  const sortedFiltered = useMemo(() => {
    if (!sort.key) return filtered;
    return [...filtered].sort((a, b) => {
      const aValue = queueSortValue(a, sort.key);
      const bValue = queueSortValue(b, sort.key);
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filtered, sort]);
  const sortIcon = (key) => (
    sort.key === key
      ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
      : <ArrowUpDown size={12} opacity={0.35} />
  );
  const sortableHead = (label, key) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 0, padding: 0, font: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', color: 'inherit', cursor: 'pointer' }}
    >
      <span>{label}</span>
      {sortIcon(key)}
    </button>
  );

  return (
    <div className="maintenance-layout">


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
          <div className="maintenance-table-head">
            <span>{sortableHead('ID / structure', 'id')}</span>
            <span>{sortableHead('Road link', 'link')}</span>
            <span>{sortableHead('Station', 'station')}</span>
            <span>{sortableHead('Condition', 'condition')}</span>
            <span>{sortableHead('Engineering action', 'action')}</span>
            <span />
          </div>
          {sortedFiltered.map((row) => {
            const asset = bridges.find((bridge) => bridge.BridgeNumber === row.BridgeNumber);
            return (
              <div className="maintenance-table-row" key={`${row.BridgeNumber}-${row.LinkID}`}>
                <span><strong>{row.BridgeNumber}</strong><small>{row.BridgeName ? toProperCase(row.BridgeName) : 'Unnamed bridge'}</small></span>
                <span><strong>{row.LinkName || row.LinkID || 'Unlinked'}</strong><small>{row.BridgeLength ?? '-'} m long / {row.BridgeWidth ?? '-'} m wide</small></span>
                <span>{row.MaintenanceStation || 'Unassigned'}</span>
                <span><em className={`condition-pill ${conditionClass(getConditionLabel(row.OverallRating))}`}>{getConditionLabel(row.OverallRating)}</em></span>
                <span>{row.Comment || 'Engineering assessment required'}</span>
                <button className="icon-button" disabled={!asset} onClick={() => asset && onSelectAsset({ ...asset, _structureType: 'bridge' })} title="Open on map"><ArrowRight size={16} /></button>
              </div>
            );
          })}
        </div>
      </section>

      {works.map((work, index) => (
        <section className="panel active-work-panel" key={`${work.bridge}-${index}`}>
          <div className="panel-header"><div><span className="panel-kicker">Active contract</span><h2>{work.bridge}</h2></div><span className="programme-badge">{work.funder || 'GOU'}</span></div>
          <div className="active-work-grid">
            {/* financial_status/status/contractor_consultant are free text with embedded
                blank-line paragraph breaks (e.g. multi-section "Challenges" narratives);
                without pre-wrap those breaks collapse and the text reads as one jumbled block. */}
            <div><span>Contract team</span><p style={{ whiteSpace: 'pre-wrap' }}>{stripPersonnelNames(work.contractor_consultant)}</p></div>
            <div><span>Financial status</span><p style={{ whiteSpace: 'pre-wrap' }}>{work.financial_status}</p></div>
            <div><span>Progress and constraints</span><p style={{ whiteSpace: 'pre-wrap' }}>{work.status}</p></div>
          </div>
        </section>
      ))}
    </div>
  );
}
