import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, MapPin, Activity, Filter } from 'lucide-react';
import { fetchBridgeByNumber, fetchCulvertByNumber } from '../services/bmsDataService';

const CONDITION_COLORS = {
  9: '#00e676', 8: '#66ff66', 7: '#a0ff00',
  6: '#ffcc00', 5: '#ffa726', 4: '#ff7043',
  3: '#ff5252', 2: '#d50000', 1: '#b71c1c',
};

const getConditionColor = (rating) => CONDITION_COLORS[rating] || '#5a668a';

const getConditionLabel = (rating) => {
  if (rating >= 8) return 'Good';
  if (rating >= 6) return 'Fair';
  if (rating >= 4) return 'Poor';
  if (rating >= 1) return 'Critical';
  return '-';
};

export default function StructureListPanel({ selectedBridge, onSelectBridge, dynamicBridges = [], dynamicCulverts = [] }) {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState('bridges');
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('All'); // 'All', 'Bridges', 'Culverts'
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All'); // 'All', 'Good', 'Fair', 'Poor', 'Critical'
  const [filterAuditStatus, setFilterAuditStatus] = useState('All'); // 'All', 'Checked', 'Unchecked'

  useEffect(() => {
    const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
    const url = (p) => `${BASE_URL}${p.replace(/^\/+/, '')}`;
    fetch(url('data/spatial/bridges.geojson'))
      .then(r => r.json())
      .then(data => setBridges((data.features || []).map(feature => ({
        ...feature.properties,
        Lat: feature.geometry?.coordinates?.[1],
        Lon: feature.geometry?.coordinates?.[0],
        Traffic: feature.properties?.AADT2026 ? { aadt_2026: feature.properties.AADT2026 } : null,
      }))))
      .catch(console.error);
    fetch(url('data/spatial/major_culverts.geojson'))
      .then(r => r.json())
      .then(data => setCulverts((data.features || []).map((feature, index) => ({
        ...feature.properties,
        CulvertNumber: feature.properties?.Culvert__N || feature.properties?.CulvertNumber || `C${String(index + 1).padStart(3, '0')}`,
        River: feature.properties?.River || feature.properties?.Link__Name || feature.properties?.District || 'Major culvert',
        Road: feature.properties?.Road || feature.properties?.Link__Name || '',
        Lat: feature.geometry?.coordinates?.[1],
        Lon: feature.geometry?.coordinates?.[0],
        _summaryIndex: index,
      }))))
      .catch(console.error);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedBridge]);

  const term = search.trim().toLowerCase();

  const getConditionLabelFromCategory = (category) => {
    if (!category) return null;
    const cat = String(category).trim().toLowerCase();
    if (cat.includes('good') || cat.includes('satisfactory') || cat.includes('excellent') || cat.includes('very good')) return 'Good';
    if (cat.includes('fair') || cat.includes('marginal') || cat.includes('watch')) return 'Fair';
    if (cat.includes('poor') || cat.includes('very poor')) return 'Poor';
    if (cat.includes('critical') || cat.includes('beyond') || cat.includes('repair')) return 'Critical';
    return null;
  };

  const sourceBridges = dynamicBridges.length ? dynamicBridges : bridges;

  const filteredBridges = useMemo(() => {
    if (filterType === 'Culverts') return [];
    
    let result = sourceBridges;

    if (term) {
      result = result.filter(b => [
        b.BridgeNumber, b.BridgeName, b.RoadDescrPrincipal,
        b.LinkID, b.Region, b.Station,
      ].some(v => String(v || '').toLowerCase().includes(term)));
    }

    if (filterRegion !== 'All') {
      result = result.filter(b => b.Region && b.Region.toLowerCase().trim() === filterRegion.toLowerCase().trim());
    }

    if (filterCondition !== 'All') {
      result = result.filter(b => {
        const rating = b.OverallConditionRating ?? b.LegacyData?.overall_rating;
        const condLabel = rating != null ? getConditionLabel(rating) : (b.OverallCondition ? getConditionLabelFromCategory(b.OverallCondition) : null);
        return condLabel === filterCondition;
      });
    }

    if (filterAuditStatus !== 'All') {
      result = result.filter(b => {
        const isChecked = !!b.LegacyData?.data_checked;
        return filterAuditStatus === 'Checked' ? isChecked : !isChecked;
      });
    }

    return result;
  }, [sourceBridges, term, filterType, filterRegion, filterCondition, filterAuditStatus]);

  const sourceCulverts = dynamicCulverts.length ? dynamicCulverts : culverts;

  const filteredCulverts = useMemo(() => {
    if (filterType === 'Bridges') return [];

    let result = sourceCulverts;

    if (term) {
      result = result.filter(c => [
        c.CulvertNumber, c.River, c.Road, c.District, c.Link__Name, c.Region
      ].some(v => String(v || '').toLowerCase().includes(term)));
    }

    if (filterRegion !== 'All') {
      result = result.filter(c => {
        const reg = c.Region || c.Maintenance_Region;
        return reg && reg.toLowerCase().trim() === filterRegion.toLowerCase().trim();
      });
    }

    if (filterCondition !== 'All') {
      result = result.filter(c => {
        const rating = c['Overall Rating'] != null ? Number(c['Overall Rating']) : null;
        let condLabel = null;
        if (rating != null) {
          condLabel = getConditionLabel(rating);
        } else {
          const cat = c['Condition Category'] || c['Condition Category.4'];
          if (cat) {
            condLabel = getConditionLabelFromCategory(cat);
          }
        }
        return condLabel === filterCondition;
      });
    }

    if (filterAuditStatus !== 'All') {
      result = result.filter(c => {
        const isChecked = !!(c.CheckedBy || c.LegacyData?.data_checked);
        return filterAuditStatus === 'Checked' ? isChecked : !isChecked;
      });
    }

    return result;
  }, [sourceCulverts, term, filterType, filterRegion, filterCondition, filterAuditStatus]);

  const availableRegions = useMemo(() => {
    const set = new Set();
    sourceBridges.forEach(b => {
      if (b.Region) set.add(b.Region.trim());
    });
    sourceCulverts.forEach(c => {
      const reg = c.Region || c.Maintenance_Region;
      if (reg) set.add(reg.trim());
    });
    return Array.from(set)
      .filter(r => r && r.toLowerCase() !== 'unknown')
      .sort((a, b) => a.localeCompare(b));
  }, [sourceBridges, sourceCulverts]);

  const hasActiveFilters = filterType !== 'All' || filterRegion !== 'All' || filterCondition !== 'All' || filterAuditStatus !== 'All';

  const handleSelect = useCallback(async (item, type) => {
    if (type === 'bridge') {
      const fullBridge = await fetchBridgeByNumber(item.BridgeNumber).catch(() => null);
      onSelectBridge({ ...(fullBridge || item), _structureType: 'bridge' });
      return;
    }
    const fullCulvert = await fetchCulvertByNumber(item.CulvertNumber).catch(() => null);
    onSelectBridge({ ...(fullCulvert || item), _structureType: 'culvert' });
  }, [onSelectBridge]);

  const isSelected = (item, type) => {
    if (!selectedBridge) return false;
    if (type === 'bridge') {
      return selectedBridge.BridgeNumber === item.BridgeNumber &&
             selectedBridge.BridgeName === item.BridgeName &&
             selectedBridge._structureType === 'bridge';
    }
    return selectedBridge.CulvertNumber === item.CulvertNumber &&
           selectedBridge._structureType === 'culvert';
  };

  return (
    <div className="structure-list-panel">
      {/* Search and Filters Trigger */}
      <div className="slp-search-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} className="slp-search-icon" style={{ position: 'absolute', top: '11px', left: '11px', color: 'var(--text-muted)' }} />
          <input
            className="slp-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search structures..."
            style={{ paddingLeft: '33px', width: '100%', minHeight: '38px' }}
          />
        </div>
        <button
          className={`icon-button filter-trigger-btn ${hasActiveFilters ? 'filters-active' : ''}`}
          onClick={() => setShowFilters(true)}
          title="Filter Structures"
          style={{ height: '38px', width: '38px', flex: '0 0 38px', display: 'grid', placeItems: 'center', position: 'relative' }}
        >
          <Filter size={15} />
          {hasActiveFilters && <span className="filters-active-dot" />}
        </button>
      </div>

      {/* Counts */}
      <div className="slp-counts">
        <span>{filteredBridges.length} bridges</span>
        <span className="slp-dot">|</span>
        <span>{filteredCulverts.length} culverts</span>
      </div>

      {/* List */}
      <div className="slp-list" ref={listRef}>
        {/* Bridges Section */}
        <button
          className="slp-section-header"
          onClick={() => setExpandedSection(expandedSection === 'bridges' ? '' : 'bridges')}
        >
          {expandedSection === 'bridges' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Bridges ({filteredBridges.length})</span>
          <div className="slp-section-line" />
        </button>

        {expandedSection === 'bridges' && filteredBridges.map((b, i) => {
          const rating = b.OverallConditionRating ?? b.LegacyData?.overall_rating;
          const aadt = b.Traffic?.aadt_2026;
          const sel = isSelected(b, 'bridge');
          return (
            <div
              key={`b-${i}`}
              ref={sel ? selectedRef : null}
              className={`slp-item ${sel ? 'slp-item-active' : ''}`}
              onClick={() => handleSelect(b, 'bridge')}
            >
              <div className="slp-item-header">
                <span className="slp-item-number">{b.BridgeNumber}</span>
                {rating != null && (
                  <span
                    className="slp-condition-badge"
                    style={{ background: getConditionColor(rating) + '22', color: getConditionColor(rating), borderColor: getConditionColor(rating) + '44' }}
                  >
                    {rating} - {getConditionLabel(rating)}
                  </span>
                )}
              </div>
              <div className="slp-item-name">{b.BridgeName || '-'}</div>
              <div className="slp-item-meta">
                <MapPin size={11} />
                <span>{b.RoadDescrPrincipal || b.LinkID || '-'}</span>
              </div>
              {aadt != null && (
                <div className="slp-item-traffic">
                  <Activity size={11} />
                  <span>AADT: {Math.round(aadt).toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Culverts Section */}
        <button
          className="slp-section-header"
          onClick={() => setExpandedSection(expandedSection === 'culverts' ? '' : 'culverts')}
        >
          {expandedSection === 'culverts' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Major Culverts ({filteredCulverts.length})</span>
          <div className="slp-section-line" />
        </button>

        {expandedSection === 'culverts' && filteredCulverts.map((c, i) => {
          const sel = isSelected(c, 'culvert');
          return (
            <div
              key={`c-${i}`}
              ref={sel ? selectedRef : null}
              className={`slp-item slp-item-culvert ${sel ? 'slp-item-active' : ''}`}
              onClick={() => handleSelect(c, 'culvert')}
            >
              <div className="slp-item-header">
                <span className="slp-item-number">{c.CulvertNumber}</span>
              </div>
              <div className="slp-item-name">{c.River || '-'}</div>
              <div className="slp-item-meta">
                <MapPin size={11} />
                <span>{c.Road || '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Drawer Overlay */}
      {showFilters && (
        <>
          <div className="modern-filters-scrim" onClick={() => setShowFilters(false)} />
          <aside className="modern-filters-drawer">
            <div className="modern-filters-header">
              <h2>Filters</h2>
              <button className="modern-filters-close" onClick={() => setShowFilters(false)} aria-label="Close filters">
                ×
              </button>
            </div>
            
            <div className="modern-filters-body">
              {/* Type Filter */}
              <div className="modern-filter-field">
                <label>Structure Type</label>
                <div className="modern-select-wrapper">
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Structures</option>
                    <option value="Bridges">Bridges Only</option>
                    <option value="Culverts">Major Culverts Only</option>
                  </select>
                  <ChevronDown size={14} className="modern-select-arrow" />
                </div>
              </div>

              {/* Region Filter */}
              <div className="modern-filter-field">
                <label>Maintenance Region</label>
                <div className="modern-select-wrapper">
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                    <option value="All">All Regions</option>
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="modern-select-arrow" />
                </div>
              </div>

              {/* Condition Filter */}
              <div className="modern-filter-field">
                <label>Overall Condition</label>
                <div className="modern-select-wrapper">
                  <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}>
                    <option value="All">All Conditions</option>
                    <option value="Good">Good (Excellent / Good / Satisfactory)</option>
                    <option value="Fair">Fair (Fair / Marginal)</option>
                    <option value="Poor">Poor (Poor / Very Poor)</option>
                    <option value="Critical">Critical (Critical / Beyond Repair)</option>
                  </select>
                  <ChevronDown size={14} className="modern-select-arrow" />
                </div>
              </div>

              {/* Audit Status Filter */}
              <div className="modern-filter-field">
                <label>Validation Audit Status</label>
                <div className="modern-select-wrapper">
                  <select value={filterAuditStatus} onChange={(e) => setFilterAuditStatus(e.target.value)}>
                    <option value="All">All Records</option>
                    <option value="Checked">Audited & Checked</option>
                    <option value="Unchecked">Outstanding / Unchecked</option>
                  </select>
                  <ChevronDown size={14} className="modern-select-arrow" />
                </div>
              </div>
            </div>

            <div className="modern-filters-footer">
              <button className="modern-btn-secondary" onClick={() => {
                setFilterType('All');
                setFilterRegion('All');
                setFilterCondition('All');
                setFilterAuditStatus('All');
              }}>
                Reset
              </button>
              <button className="modern-btn-primary" onClick={() => setShowFilters(false)}>
                Apply
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
