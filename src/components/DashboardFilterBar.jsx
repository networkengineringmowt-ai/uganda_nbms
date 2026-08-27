import { useEffect, useRef, useState } from 'react';
import { Filter, RotateCcw, Search, ChevronDown, X } from 'lucide-react';
import { buildDashboardFilterOptions } from '../utils/dashboardFilters';

// Each field is a combobox: it shows the full option list like a dropdown,
// but typing narrows that list by substring match, so a 500-row bridge name
// list is searchable instead of requiring a long native-select scroll.
function SearchableFilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const isSet = value !== 'All';
  const displayValue = open ? query : (isSet ? value : '');

  const selectOption = (opt) => {
    onChange(opt);
    setQuery('');
    setOpen(false);
    setHighlight(0);
  };

  const openList = () => {
    setOpen(true);
    setQuery('');
    setHighlight(0);
  };

  return (
    <div className={`dashboard-filter-field${isSet ? ' is-set' : ''}`} ref={rootRef}>
      <div className={`dashboard-filter-input-wrap${open ? ' is-open' : ''}`}>
        <Search size={12} className="dashboard-filter-search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={label}
          aria-label={label}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          onFocus={openList}
          onClick={openList}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) selectOption(filtered[highlight]); }
          }}
        />
        {isSet && !open && (
          <button
            type="button"
            className="dashboard-filter-clear"
            onClick={() => onChange('All')}
            title={`Clear ${label}`}
            aria-label={`Clear ${label}`}
          >
            <X size={11} />
          </button>
        )}
        <ChevronDown size={12} className="dashboard-filter-chevron" />
      </div>
      {open && (
        <div className="dashboard-filter-dropdown">
          <button
            type="button"
            className={`dashboard-filter-option dashboard-filter-option-all${!isSet ? ' is-selected' : ''}`}
            onClick={() => selectOption('All')}
          >
            {label}
          </button>
          {filtered.length === 0 && <div className="dashboard-filter-empty">No matches</div>}
          {filtered.map((opt, idx) => (
            <button
              type="button"
              key={opt}
              className={`dashboard-filter-option${value === opt ? ' is-selected' : ''}${idx === highlight ? ' is-highlighted' : ''}`}
              onClick={() => selectOption(opt)}
              onMouseEnter={() => setHighlight(idx)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardFilterBar({ bridges, culverts, filters, onChange, onReset, resultCount }) {
  const options = buildDashboardFilterOptions(bridges, culverts);
  const isActive = Object.values(filters).some((v) => v !== 'All');

  return (
    <div className="dashboard-filter-bar">
      <div className="dashboard-filter-bar-icon"><Filter size={15} /></div>
      <SearchableFilterSelect label="All Regions" value={filters.region} options={options.regions} onChange={(v) => onChange('region', v)} />
      <SearchableFilterSelect label="All Classes" value={filters.roadClass} options={options.roadClasses} onChange={(v) => onChange('roadClass', v)} />
      <SearchableFilterSelect label="All bridge names" value={filters.bridgeName} options={options.bridgeNames} onChange={(v) => onChange('bridgeName', v)} />
      <SearchableFilterSelect label="All bridge numbers" value={filters.bridgeNumber} options={options.bridgeNumbers} onChange={(v) => onChange('bridgeNumber', v)} />
      <SearchableFilterSelect label="All major culvert numbers" value={filters.culvertNumber} options={options.culvertNumbers} onChange={(v) => onChange('culvertNumber', v)} />
      <SearchableFilterSelect label="All stations" value={filters.station} options={options.stations} onChange={(v) => onChange('station', v)} />
      <SearchableFilterSelect label="All road link names" value={filters.roadLinkName} options={options.roadLinkNames} onChange={(v) => onChange('roadLinkName', v)} />
      <div className="dashboard-filter-bar-result">
        {resultCount.bridges.toLocaleString()} bridges · {resultCount.culverts.toLocaleString()} culverts
      </div>
      {isActive && (
        <button type="button" className="dashboard-filter-reset" onClick={onReset} title="Reset all filters">
          <RotateCcw size={13} /> Reset
        </button>
      )}
    </div>
  );
}
