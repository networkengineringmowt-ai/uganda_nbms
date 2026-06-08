import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, MapPin, Activity } from 'lucide-react';
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

export default function StructureListPanel({ selectedBridge, onSelectBridge, dynamicBridges = [] }) {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState('bridges');
  const listRef = useRef(null);
  const selectedRef = useRef(null);

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

  const sourceBridges = dynamicBridges.length ? dynamicBridges : bridges;

  const filteredBridges = useMemo(() => {
    if (!term) return sourceBridges;
    return sourceBridges.filter(b => [
      b.BridgeNumber, b.BridgeName, b.RoadDescrPrincipal,
      b.LinkID, b.Region, b.Station,
    ].some(v => String(v || '').toLowerCase().includes(term)));
  }, [sourceBridges, term]);

  const filteredCulverts = useMemo(() => {
    if (!term) return culverts;
    return culverts.filter(c => [
      c.CulvertNumber, c.River, c.Road,
    ].some(v => String(v || '').toLowerCase().includes(term)));
  }, [culverts, term]);

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
      {/* Search */}
      <div className="slp-search-container">
        <Search size={15} className="slp-search-icon" />
        <input
          className="slp-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search structures..."
        />
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
    </div>
  );
}
