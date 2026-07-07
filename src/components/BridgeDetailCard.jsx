import { useState, useEffect } from 'react';
import { X, MapPin, Truck, Camera, AlertTriangle, Layers, Gauge, Box } from 'lucide-react';
import DigitalTwin from './DigitalTwin';
import EvidenceTimeline from './EvidenceTimeline';

import ReactECharts from 'echarts-for-react';

const EMPTY = '-';

const ratingColor = (r) => {
  if (r >= 8) return '#168257';
  if (r >= 6) return '#77a86e';
  if (r >= 4) return '#e3a008';
  return '#be3a34';
};

import {
  TYPE_CROSSING, TYPE_BRIDGE, TYPE_DECK_MATERIAL, TYPE_DECK,
  TYPE_ABUTMENT, TYPE_PIERS, TYPE_PARAPET_RAILING,
  TYPE_EXPANSION_JOINTS, TYPE_CULVERT, getConditionLabel, getDictionaryLabel
} from '../utils/dataDictionary';
import { calculateBridgeDeficiencyIndex, calculateAssetValue } from '../utils/bmsAlgorithms';

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

  const rawRatings = {
    approaches: legacy.approaches_rating,
    roadway: legacy.roadway_rating,
    substructure: legacy.substructure_rating,
    superstructure: legacy.superstructure_rating,
    waterway: legacy.waterway_rating
  };
  const deficiency = !isCulvert ? calculateBridgeDeficiencyIndex(rawRatings) : null;
  const assetVal = calculateAssetValue(bridge, isCulvert);
  const fmtMoney = (m) => m ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(m) : null;

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

  const photos = gallery
    .filter(g => !g.duplicate_of && (g.structure_id === id || g.filename?.includes(id)))
    .sort((a, b) => b.filename.localeCompare(a.filename));

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
              <span>Overall: {getConditionLabel(overallRating)}</span>
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
                  <span className="bdc-value">{getDictionaryLabel(TYPE_CROSSING, bridge.TypeCrossing || legacy.type_crossing) || legacy.river || EMPTY}</span>
                </div>
                <div className="bdc-field">
                  <span className="bdc-label">River</span>
                  <span className="bdc-value">{legacy.river || legacy.reference_attributes?.river || EMPTY}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Digital Twin 3D View */}
        <div className="bdc-section">
          <h4 className="bdc-section-title"><Box size={14} /> Digital Twin</h4>
          <DigitalTwin asset={bridge} isCulvert={isCulvert} />
        </div>

        {/* Structural Section */}
        {!isCulvert && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Layers size={14} /> Structural Details</h4>
            <div className="bdc-grid">
              <div className="bdc-field">
                <span className="bdc-label">Bridge Type</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_BRIDGE, legacy.type_bridge) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Deck Type</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_DECK, legacy.type_deck) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Material</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_DECK_MATERIAL, legacy.type_deck_material) || legacy.reference_attributes?.material || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Abutments</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_ABUTMENT, legacy.type_abutment_l || legacy.type_abutments?.split('/')[0]?.trim()) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Piers Type</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_PIERS, legacy.type_piers) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Parapet/Railing</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_PARAPET_RAILING, legacy.type_para_rail) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Expansion Joints</span>
                <span className="bdc-value">{getDictionaryLabel(TYPE_EXPANSION_JOINTS, legacy.type_exp_joints) || EMPTY}</span>
              </div>
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
                <span className="bdc-label">Piers Count</span>
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
            </div>
          </div>
        )}

        {isCulvert && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Layers size={14} /> Structural Details</h4>
            <div className="bdc-grid">
              <div className="bdc-field">
                <span className="bdc-label">Type</span>
                <span className="bdc-value">{bridge.Type || getDictionaryLabel(TYPE_CULVERT, legacy.type_culvert) || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Pipes/Cells</span>
                <span className="bdc-value">{bridge.NoOfPipesOrCells || legacy.no_of_pipes || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Span/Diameter</span>
                <span className="bdc-value">{bridge.SpanOrDiameter || legacy.span_diameter || EMPTY}</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Overall Length</span>
                <span className="bdc-value">{bridge['Overall Length'] || legacy.culvert_len || EMPTY} m</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Overall Width</span>
                <span className="bdc-value">{bridge['Overall Width'] || legacy.overall_width || EMPTY} m</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Min Clear Width</span>
                <span className="bdc-value">{bridge['Min Clear Width'] || legacy.min_clear_width || EMPTY} m</span>
              </div>
              <div className="bdc-field">
                <span className="bdc-label">Max Fill Height</span>
                <span className="bdc-value">{bridge.FillHeight || legacy.fill_height || EMPTY} m</span>
              </div>
            </div>
          </div>
        )}

        {/* Engineering Analytics */}
        <div className="bdc-section">
          <h4 className="bdc-section-title"><Gauge size={14} /> Engineering Analytics</h4>
          <div className="bdc-grid">
            <div className="bdc-field">
              <span className="bdc-label">Replacement Cost (CRC)</span>
              <span className="bdc-value bdc-value-highlight">{fmtMoney(assetVal?.crc) || EMPTY}</span>
            </div>
            <div className="bdc-field">
              <span className="bdc-label">Depreciated Cost (CDRC)</span>
              <span className="bdc-value" style={{ color: '#be3a34' }}>{fmtMoney(assetVal?.cdrc) || EMPTY}</span>
            </div>
            {!isCulvert && (
              <div className="bdc-field">
                <span className="bdc-label">Deficiency Score</span>
                <span className="bdc-value" style={{ fontWeight: 'bold', color: deficiency >= 50 ? '#be3a34' : deficiency >= 20 ? '#e3a008' : '#168257' }}>
                  {deficiency != null ? `${deficiency.toFixed(1)} / 100` : EMPTY}
                </span>
              </div>
            )}
          </div>
        </div>

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
                  <span className="bdc-rating-value" style={{ color: ratingColor(r.value) }}>{getConditionLabel(r.value)}</span>
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

        {/* Photos */}
        {photos.length > 0 && (
          <div className="bdc-section">
            <h4 className="bdc-section-title"><Camera size={14} /> Evidence Photos ({photos.length})</h4>
            <EvidenceTimeline photos={photos} structureId={id} compact />
          </div>
        )}


      </div>
    </div>
  );
}
