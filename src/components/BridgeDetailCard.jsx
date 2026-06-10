import { useState, useEffect } from 'react';
import { X, MapPin, Truck, Camera, AlertTriangle, Layers, Gauge } from 'lucide-react';
import { getPhotoUrl } from '../utils/photoUrlResolver';

import ReactECharts from 'echarts-for-react';
const RATING_LABELS = {
  9: 'Excellent', 8: 'Very Good', 7: 'Good', 6: 'Satisfactory',
  5: 'Fair', 4: 'Marginal', 3: 'Poor', 2: 'Very Poor', 1: 'Critical', 0: 'Beyond Repair',
};

const EMPTY = '-';

const ratingColor = (r) => {
  if (r >= 8) return '#168257';
  if (r >= 6) return '#77a86e';
  if (r >= 4) return '#e3a008';
  return '#be3a34';
};

const CROSSING_TYPE = {
  1: 'River/Stream', 2: 'Railway', 3: 'Road Over Road',
  4: 'Pedestrian', 5: 'Flyover/Interchange',
};

export default function BridgeDetailCard({ bridge, onClose }) {
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
    fetch(`${BASE_URL}gallery/index.json`)
      .then(r => r.json())
      .then(setGallery)
      .catch(() => setGallery([]));
  }, []);

  if (!bridge) return null;

  const isCulvert = bridge._structureType === 'culvert';
  const legacy = bridge.LegacyData || {};
  const traffic = bridge.Traffic || {};
  const id = isCulvert ? bridge.CulvertNumber : bridge.BridgeNumber;
  const name = isCulvert ? (bridge.River || bridge.CulvertNumber) : (bridge.BridgeName || bridge.BridgeNumber);

  // Condition ratings for bridges
  const ratings = [
    { label: 'Approaches', value: legacy.approaches_rating },
    { label: 'Roadway', value: legacy.roadway_rating },
    { label: 'Substructure', value: legacy.substructure_rating },
    { label: 'Superstructure', value: legacy.superstructure_rating },
    { label: 'Waterway', value: legacy.waterway_rating },
  ].filter(r => r.value != null);

  const overallRating = legacy.overall_rating ?? bridge.OverallConditionRating;

  // Traffic pie chart
  const classShareEntries = Object.entries(traffic.class_shares || {});
  const trafficChartOption = classShareEntries.length ? {
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      itemStyle: { borderRadius: 3, borderColor: '#ffffff', borderWidth: 2 },
      label: { show: false },
      data: classShareEntries
        .map(([k, v]) => ({ name: k.replace(/Light |Medium |Large /g, ''), value: +(v * 100).toFixed(2) }))
        .sort((a, b) => b.value - a.value)
    }]
  } : null;

  // Find gallery photo
  const photo = gallery.find(g => g.structure_id === id || g.filename?.includes(id));

  return (
    <div className="bridge-detail-card">
      {/* Header */}
      <div className="bdc-header">
        <div className="bdc-header-left">
          <span className="bdc-type-badge">{isCulvert ? 'CULVERT' : 'BRIDGE'}</span>
          <h3 className="bdc-title">{id} - {name}</h3>
          {overallRating != null && (
            <div className="bdc-overall-rating" style={{ color: ratingColor(overallRating) }}>
              <Gauge size={16} />
              <span>Overall: {overallRating}/10 - {RATING_LABELS[overallRating] || EMPTY}</span>
            </div>
          )}
        </div>
        <button className="bdc-close" onClick={onClose} title="Close detail">
          <X size={18} />
        </button>
      </div>

      <div className="bdc-body">
        {/* Location Section */}
        <div className="bdc-section">
          <h4 className="bdc-section-title"><MapPin size={14} /> Location</h4>
          <div className="bdc-grid">
            <div className="bdc-field">
              <span className="bdc-label">Road</span>
              <span className="bdc-value">{bridge.RoadDescrPrincipal || bridge.Road || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Link ID</span>
              <span className="bdc-value">{bridge.LinkID || legacy.link_no || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Chainage</span>
              <span className="bdc-value">{legacy.chainage_km ? `${legacy.chainage_km} km` : (bridge.KmPrincipal ? `${bridge.KmPrincipal} km` : EMPTY)}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Region</span>
              <span className="bdc-value">{legacy.region || bridge.Region || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Station</span>
              <span className="bdc-value">{legacy.station || legacy.maintenanc || bridge.Station || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">District</span>
              <span className="bdc-value">{legacy.district_council || EMPTY}</span>
            </div>
            {!isCulvert && (
              <>
                <div className="bdc-field">
                  <span className="bdc-label">Crossing</span>
                  <span className="bdc-value">{CROSSING_TYPE[bridge.TypeCrossing] || legacy.river || EMPTY}</span>
                </div>
                <div className="bdc-field">
                  <span className="bdc-label">River</span>
                  <span className="bdc-value">{legacy.river || legacy.reference_attributes?.river || EMPTY}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Structural Section */}
        {!isCulvert && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Layers size={14} /> Structural Details</h4>
            <div className="bdc-grid">
              <div className="bdc-field">
                <span className="bdc-label">Length</span>
                <span className="bdc-value">{legacy.length || legacy.bridge_len || EMPTY} m</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Width</span>
                <span className="bdc-value">{legacy.width || legacy.bridge_wid || EMPTY} m</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Spans</span>
                <span className="bdc-value">{legacy.no_of_spans || legacy.no_of_span || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Piers</span>
                <span className="bdc-value">{legacy.no_of_piers ?? legacy.no_of_pier ?? EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Year Built</span>
                <span className="bdc-value">{legacy.year_compl || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Lanes</span>
                <span className="bdc-value">{legacy.no_of_lane || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Scour Risk</span>
                <span className="bdc-value" style={{ color: legacy.scour_risk === 'Y' ? '#be3a34' : legacy.scour_risk === 'N' ? '#168257' : '#e3a008' }}>
                  {legacy.scour_risk === 'Y' ? 'Yes' : legacy.scour_risk === 'N' ? 'No' : legacy.scour_risk || EMPTY}
                </span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Road Class</span>
                <span className="bdc-value">{legacy.road_class || EMPTY}</span>
              </div>
            </div>
          </div>
        )}

        {/* Condition Ratings */}
        {ratings.length > 0 && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><AlertTriangle size={14} /> Condition Ratings</h4>
            <div className="bdc-ratings">
              {ratings.map((r, i) => (
                <div key={i} className="bdc-rating-row">
                  <span className="bdc-rating-label">{r.label}</span>
                  <div className="bdc-rating-bar-track">
                    <div
                      className="bdc-rating-bar-fill"
                      style={{ width: `${(r.value / 10) * 100}%`, background: ratingColor(r.value) }}
                    />
                  </div>
                  <span className="bdc-rating-value" style={{ color: ratingColor(r.value) }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic Section */}
        {traffic.aadt_2026 != null && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Truck size={14} /> Traffic Data</h4>
            <div className="bdc-grid">
              <div className="bdc-field">
                <span className="bdc-label">AADT 2026</span>
                <span className="bdc-value bdc-value-highlight">{Math.round(traffic.aadt_2026).toLocaleString()}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Growth Rate</span>
                <span className="bdc-value" style={{ color: traffic.growth_rate >= 0 ? '#168257' : '#be3a34' }}>
                  {(traffic.growth_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Link</span>
                <span className="bdc-value">{traffic.link_name || traffic.link_id || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Data Sources</span>
                <span className="bdc-value">{traffic.sources?.length || 0} file(s)</span>
              </div>
            </div>

            {trafficChartOption && (
              <div className="bdc-traffic-chart">
                <ReactECharts
                  option={{
                    ...trafficChartOption,
                    color: ['#0b6b43', '#e3a008', '#be3a34', '#397596', '#7a6a4f', '#77a86e', '#d8673a', '#708aa2', '#50906e', '#9a514d'],
                  }}
                  style={{ height: '180px', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
                <div className="bdc-traffic-legend">
                  {Object.entries(traffic.class_shares || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([k, v], i) => (
                      <span key={i} className="bdc-traffic-legend-item">
                        {k.replace(/Light |Medium |Large /g, '')}: {(v * 100).toFixed(1)}%
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo */}
        {photo && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Camera size={14} /> Evidence Photo</h4>
            <div className="bdc-photo">
              <img src={getPhotoUrl(photo)} alt={id} loading="lazy" />
            </div>
          </div>
        )}

        {/* Inspector Info */}
        <div className="bdc-section bdc-section-footer">
          <div className="bdc-grid">
            <div className="bdc-field">
              <span className="bdc-label">Firm</span>
              <span className="bdc-value">{bridge.Firm || legacy.firm || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Inspector</span>
              <span className="bdc-value">{bridge.Inspector || legacy.inspector || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Last Modified</span>
              <span className="bdc-value">{bridge.DateModified || legacy.date_modified || EMPTY}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
