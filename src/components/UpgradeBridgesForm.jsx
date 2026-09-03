import { useState, useEffect, useMemo, useRef } from 'react';
import { Save, FilePlus, ArrowUpCircle, Search, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchBridgeWorks } from '../services/bmsDataService';

// Reuses DashboardFilterBar.jsx's type-to-filter combobox pattern (same
// dashboard-filter-* classes) so a 546-option bridge list is searchable here
// too, instead of a long native <select> scroll.
function SearchableBridgeSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

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
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const selected = options.find((opt) => opt.value === value);
  const displayValue = open ? query : (selected ? selected.label : '');

  const selectOption = (opt) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="dashboard-filter-field" ref={rootRef} style={{ width: '100%', flex: 'none' }}>
      <div className={`dashboard-filter-input-wrap${open ? ' is-open' : ''}`} style={{ height: '40px' }}>
        <Search size={12} className="dashboard-filter-search-icon" />
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          onFocus={() => { setOpen(true); setQuery(''); }}
          onClick={() => { setOpen(true); setQuery(''); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            else if (e.key === 'Enter' && filtered[0]) selectOption(filtered[0]);
          }}
        />
        <ChevronDown size={12} className="dashboard-filter-chevron" />
      </div>
      {open && (
        <div className="dashboard-filter-dropdown">
          {filtered.length === 0 && <div className="dashboard-filter-empty">No matches</div>}
          {filtered.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`dashboard-filter-option${value === opt.value ? ' is-selected' : ''}`}
              onClick={() => selectOption(opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// financial_status is free text ("Contract Sum:\nUGX 29,544,160,265\n\nAmount
// Certified: ..."), not a structured number -- taking just its first line
// (the old approach) produces a bare label like "Contract Sum:" with no
// figure at all for most records. Pull the contract-sum UGX amount out of
// the text instead, expanding a "bn"/"million" suffix where present.
function extractBudget(text) {
  if (!text) return null;
  const withUnit = (match) => {
    if (!match) return null;
    let value = Number(match[1].replace(/,/g, ''));
    const unit = (match[2] || '').toLowerCase();
    if (unit.startsWith('bn') || unit.startsWith('billion')) value *= 1e9;
    else if (unit.startsWith('m') || unit.startsWith('million')) value *= 1e6;
    return Number.isFinite(value) ? value : null;
  };
  const labeled = text.match(/(?:contract sum|works contract)\s*:?\s*\n?\s*UGX[.:]?\s*([\d,]+(?:\.\d+)?)\s*(bn|billion|m|million)?/i);
  return withUnit(labeled) ?? withUnit(text.match(/UGX[.:]?\s*([\d,]+(?:\.\d+)?)\s*(bn|billion|m|million)?/i));
}

export default function UpgradeBridgesForm({ bridges = [] }) {
  const [selectedBridgeId, setSelectedBridgeId] = useState('');
  const [upgradesList, setUpgradesList] = useState([]);

  useEffect(() => {
    fetchBridgeWorks().then(data => {
      // Data might have "bridge", "financial_status", "status"
      const mapped = data.map(item => {
        const budget = extractBudget(item.financial_status);
        return {
          bridgeNo: item.bridge,
          date: 'Active',
          // `item.status?.slice(...) + '...'` printed the literal string
          // "undefined..." for any work record with no status field, since
          // string concatenation coerces `undefined` to text instead of
          // short-circuiting. Only append text (and the ellipsis) when a
          // status was actually present.
          desc: item.status ? `${item.status.slice(0, 100)}...` : 'No status update on file',
          ref: item.funder,
          budget,
          hasReport: 'Yes',
        };
      });
      setUpgradesList(mapped);
    }).catch(err => console.error("Failed to fetch bridge works:", err));
  }, []);

  const [formData, setFormData] = useState({
    date: '', desc: '', ref: '', budget: '', hasReport: 'No'
  });

  // Sort state for the "Active Upgrades" table -- toggles asc/desc on the
  // clicked column, matching the click-to-sort convention used by
  // DataTable.jsx elsewhere in the app.
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const toggleSort = (key) => setSort((current) => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  }));
  const sortedUpgrades = useMemo(() => {
    if (!sort.key) return upgradesList;
    return [...upgradesList].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      const aNumber = Number(aValue);
      const bNumber = Number(bValue);
      const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [upgradesList, sort]);
  const sortIcon = (key) => (
    sort.key === key
      ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
      : <ArrowUpDown size={12} opacity={0.35} />
  );
  const sortableTh = (label, key, align = 'left') => (
    <th style={{ padding: '16px 24px', textAlign: align, fontWeight: 700, color: 'var(--text-secondary)' }}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}
      >
        <span>{label}</span>
        {sortIcon(key)}
      </button>
    </th>
  );

  const handleAddUpgrade = () => {
    if (!selectedBridgeId || !formData.date || !formData.desc) return;
    
    setUpgradesList(prev => [
      {
        bridgeNo: selectedBridgeId,
        date: formData.date,
        desc: formData.desc,
        ref: formData.ref,
        budget: Number(formData.budget || 0),
        hasReport: formData.hasReport
      },
      ...prev
    ]);
    
    setFormData({ date: '', desc: '', ref: '', budget: '', hasReport: 'No' });
  };

  return (
    <div style={{ width: '100%', padding: '0 32px', margin: '0 auto', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', display: 'grid', placeItems: 'center', borderRadius: '12px' }}>
          <ArrowUpCircle size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Bridge Upgrades</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Record and track historical and planned rehabilitation projects.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        
        {/* Left Form */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Record New Upgrade</h3>

          <div className="modern-filter-field">
            <label>Select Bridge</label>
            <div className="modern-select-wrapper">
              <SearchableBridgeSelect
                value={selectedBridgeId}
                onChange={setSelectedBridgeId}
                placeholder="-- Choose Bridge --"
                options={bridges.map((b) => ({ value: b.BridgeNumber, label: `${b.BridgeNumber} - ${b.BridgeName || 'Unnamed'}` }))}
              />
            </div>
          </div>

          <div className="modern-filter-field">
            <label>Date of Upgrade</label>
            <input 
              type="date" 
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Reference #</label>
            <input 
              type="text" placeholder="e.g. MoWT/WKS/26-27/01"
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.ref} onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Budget (UGX)</label>
            <input 
              type="number" placeholder="Enter amount..."
              className="toolbar-search" style={{ height: '40px', borderRadius: '8px', width: '100%' }}
              value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Description</label>
            <textarea 
              placeholder="Describe the scope of works..."
              className="toolbar-search" style={{ height: '80px', borderRadius: '8px', width: '100%', padding: '12px', resize: 'vertical' }}
              value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          <div className="modern-filter-field">
            <label>Has Summary Report?</label>
            <div className="modern-select-wrapper">
              <select 
                value={formData.hasReport}
                onChange={(e) => setFormData({ ...formData, hasReport: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.02)', color: 'var(--text-primary)', height: '40px' }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <button 
            className="modern-btn-primary" 
            onClick={handleAddUpgrade}
            disabled={!selectedBridgeId || !formData.date || !formData.desc}
            style={{ marginTop: '16px', gap: '8px', opacity: (!selectedBridgeId || !formData.date || !formData.desc) ? 0.5 : 1 }}
          >
            <Save size={16} /> Save Record
          </button>
        </div>

        {/* Right Table */}
        <div className="panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Dataset</div>
              <h2>Active Upgrades</h2>
            </div>
          </div>
          
          <div className="modern-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  {sortableTh('Bridge #', 'bridgeNo')}
                  {sortableTh('Date', 'date')}
                  {sortableTh('Reference', 'ref')}
                  {sortableTh('Description', 'desc')}
                  {sortableTh('Budget (UGX)', 'budget', 'right')}
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {sortedUpgrades.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <FilePlus size={32} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                      No upgrades recorded yet.
                    </td>
                  </tr>
                ) : sortedUpgrades.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{row.bridgeNo}</td>
                    <td style={{ padding: '16px 24px' }}>{row.date}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{row.ref || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', maxWidth: '300px' }}>{row.desc}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>{Number.isFinite(row.budget) ? row.budget.toLocaleString() : 'Not on file'}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {row.hasReport === 'Yes' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>YES</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
