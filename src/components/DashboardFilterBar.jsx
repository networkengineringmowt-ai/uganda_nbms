import { useEffect, useRef, useState } from 'react';
import { Filter, RotateCcw, Search, ChevronDown, X, ArrowLeft, ArrowUp, Download, Printer } from 'lucide-react';
import { buildDashboardFilterOptions } from '../utils/dashboardFilters';
import { exportStructuresCSV, printCurrentPage } from '../utils/exportUtils';

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

// Compact icon button shared by the Back / Scroll-to-top / Clear-filters
// controls in the corner cluster -- same enabled/disabled treatment as the
// old floating PageUtilityBar, just sized to sit inline in the filter bar.
function CornerIconButton({ onClick, disabled, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: danger && !disabled ? 'rgba(255, 7, 58, 0.14)' : 'rgba(0, 0, 0, 0.28)',
        color: disabled ? '#475569' : (danger ? '#ff6b81' : '#cbd5e1'),
        border: danger && !disabled ? '1px solid rgba(255, 7, 58, 0.4)' : '1px solid var(--border-light)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--transition-smooth)',
      }}
    >
      {children}
    </button>
  );
}

export default function DashboardFilterBar({
  bridges,
  culverts,
  filters,
  onChange,
  onReset,
  resultCount,
  onBack,
  canGoBack,
  scrollTargetRef,
}) {
  const options = buildDashboardFilterOptions(bridges, culverts);
  const isActive = Object.values(filters).some((v) => v !== 'All');

  const [showTop, setShowTop] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const el = scrollTargetRef?.current;
    if (!el) return undefined;
    const onScroll = () => setShowTop(el.scrollTop > 240);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollTargetRef]);

  useEffect(() => {
    if (!exportOpen) return undefined;
    const closeIfOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [exportOpen]);

  const scrollToTop = () => {
    const el = scrollTargetRef?.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    setExportOpen(false);
    const ok = exportStructuresCSV(bridges, culverts);
    if (!ok) printCurrentPage();
  };

  const handlePrint = () => {
    setExportOpen(false);
    printCurrentPage();
  };

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

      {/* Corner cluster: result count + Back / Scroll-to-top / Export / Clear-filters,
          pushed to the far right of the bar with marginLeft: auto. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        <div className="dashboard-filter-bar-result">
          {resultCount.bridges.toLocaleString()} bridges · {resultCount.culverts.toLocaleString()} culverts
        </div>

        {onBack && (
          <CornerIconButton onClick={onBack} disabled={!canGoBack} title="Back">
            <ArrowLeft size={16} />
          </CornerIconButton>
        )}

        {scrollTargetRef && (
          <CornerIconButton onClick={scrollToTop} disabled={!showTop} title="Scroll to top">
            <ArrowUp size={16} />
          </CornerIconButton>
        )}

        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            title="Export"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '0 10px',
              height: 34,
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={13} /> Export
            <ChevronDown size={12} style={{ transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {exportOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: 210,
                background: '#0c1830',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                zIndex: 50,
              }}
            >
              <button type="button" onClick={handleExportCSV} style={menuItemStyle}>
                <Download size={13} /> Export structures (CSV)
              </button>
              <button type="button" onClick={handlePrint} style={menuItemStyle}>
                <Printer size={13} /> Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        <CornerIconButton onClick={onReset} disabled={!isActive} title="Clear all filters" danger>
          <RotateCcw size={15} />
        </CornerIconButton>
      </div>
    </div>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  color: '#e2e8f0',
  fontSize: 12.5,
  cursor: 'pointer',
  textAlign: 'left',
};
