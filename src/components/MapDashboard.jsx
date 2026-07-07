import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap, ScaleControl, Polyline, useMapEvents } from 'react-leaflet';
import { Ruler, Trash2, Plus, Minus, Home } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchBridgeByNumber, fetchCulvertByNumber } from '../services/bmsDataService';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const ROAD_CLASS_STYLE = {
  A: { color: '#c84339', weight: 2.4, opacity: 0.82 },
  B: { color: '#d89a18', weight: 2.0, opacity: 0.78 },
  C: { color: '#26865c', weight: 1.25, opacity: 0.7 },
  M: { color: '#735b3c', weight: 2.6, opacity: 0.82 },
};

const getRoadClass = (props = {}) => String(
  props.Road_Cla_1 ||
  props.Road_Class ||
  props.road_class ||
  props.ROAD_CLASS ||
  'C'
).trim().toUpperCase().slice(0, 1);

const getPoint = (record) => {
  const lat = Number(record.Lat ?? record.LegacyData?.location_corrected_lat ?? record.LegacyData?.map_y);
  const lon = Number(record.Lon ?? record.LegacyData?.location_corrected_lon ?? record.LegacyData?.map_x);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};

/* ── FlyTo controller ─────────────────────────────────── */
function FlyToSelected({ selectedBridge }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedBridge) return;
    const point = getPoint(selectedBridge);
    if (point) {
      map.flyTo(point, 13, { duration: 1.2 });
    }
  }, [selectedBridge, map]);
  return null;
}

/* ── Pulsing selected marker via CSS ──────────────────── */
function SelectedMarker({ bridge }) {
  if (!bridge) return null;
  const point = getPoint(bridge);
  if (!point) return null;
  const isCulvert = bridge._structureType === 'culvert';

  return (
    <>
      {/* Outer pulse ring */}
      <CircleMarker
        center={point}
        radius={18}
        pathOptions={{
          fillColor: isCulvert ? '#d89a18' : '#1e40af',
          fillOpacity: 0.15,
          color: isCulvert ? '#d89a18' : '#1e40af',
          weight: 2,
          opacity: 0.5,
          className: 'selected-marker-pulse'
        }}
      />
      {/* Inner highlight */}
      <CircleMarker
        center={point}
        radius={8}
        pathOptions={{
          fillColor: '#fff',
          color: isCulvert ? '#d89a18' : '#1e40af',
          weight: 3,
          fillOpacity: 0.95,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -12]}>
          <strong style={{ fontSize: '13px' }}>
            {bridge.BridgeName || bridge.BridgeNumber || bridge.CulvertNumber}
          </strong>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

function ArcGISControls() {
  const map = useMap();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [points, setPoints] = useState([]);
  const [mousePos, setMousePos] = useState(null);

  useMapEvents({
    click(e) {
      if (isMeasuring) {
        setPoints(pts => [...pts, e.latlng]);
      }
    },
    mousemove(e) {
      if (isMeasuring) {
        setMousePos(e.latlng);
      }
    }
  });

  const distance = points.reduce((acc, pt, i, arr) => {
    return i > 0 ? acc + pt.distanceTo(arr[i-1]) : 0;
  }, 0);

  const formatDist = (d) => d > 1000 ? `${(d/1000).toFixed(2)} km` : `${d.toFixed(0)} m`;

  const handleZoomIn = (e) => { e.stopPropagation(); map.zoomIn(); };
  const handleZoomOut = (e) => { e.stopPropagation(); map.zoomOut(); };
  const handleHome = (e) => { e.stopPropagation(); map.setView([1.3733, 32.2903], 7); };

  const toolBtnStyle = (active = false) => ({
    width: '34px', height: '34px',
    background: active ? '#3b82f6' : 'rgba(15, 23, 42, 0.85)',
    color: active ? '#fff' : '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.15s ease',
  });

  return (
    <>
      {/* ── Horizontal Toolbar at Top-Left ── */}
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000,
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '6px 8px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        {/* Navigation Group */}
        <button onClick={handleHome} title="Default Extent" style={toolBtnStyle()}>
          <Home size={16} />
        </button>
        <button onClick={handleZoomIn} title="Zoom In" style={toolBtnStyle()}>
          <Plus size={16} />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" style={toolBtnStyle()}>
          <Minus size={16} />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

        {/* Measure Tool */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsMeasuring(!isMeasuring); setPoints([]); }}
          title="Measure Distance"
          style={toolBtnStyle(isMeasuring)}
        >
          <Ruler size={16} />
        </button>

        {/* Live Measurement Readout */}
        {isMeasuring && points.length > 0 && (
          <>
            <div style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <strong style={{ fontSize: '13px', color: '#38bdf8', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {formatDist(distance)}
              </strong>
              <button
                onClick={(e) => { e.stopPropagation(); setPoints([]); }}
                title="Clear measurement"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px',
                  borderRadius: '4px', cursor: 'pointer', display: 'flex'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Measurement Polylines */}
      {points.length > 0 && (
        <Polyline
          positions={points}
          color="#ef4444"
          weight={4}
          dashArray="10, 10"
        />
      )}
      {points.map((pt, i) => (
        <CircleMarker key={i} center={pt} radius={5} pathOptions={{ color: '#ef4444', fillColor: '#fff', fillOpacity: 1, weight: 2 }} />
      ))}
      {isMeasuring && points.length > 0 && mousePos && (
        <Polyline positions={[points[points.length-1], mousePos]} color="#ef4444" weight={2} opacity={0.5} dashArray="5, 5" />
      )}
    </>
  );
}

export default function MapDashboard({ selectedBridge, onSelectBridge }) {
  const [networkData, setNetworkData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);

  useEffect(() => {
    fetch(dataUrl('data/spatial/water.geojson'))
      .then(res => res.json())
      .then(setWaterData)
      .catch(console.error);

    fetch(dataUrl('data/spatial/network2026_light.geojson'))
      .then(res => res.json())
      .then(setNetworkData)
      .catch(() => {
        fetch(dataUrl('data/spatial/network2026.geojson'))
          .then(res => res.json())
          .then(setNetworkData)
          .catch(console.error);
      });

    fetch(dataUrl('data/spatial/bridges.geojson'))
      .then(res => res.json())
      .then((geojson) => {
        const rows = (geojson.features || []).map((feature) => ({
          ...feature.properties,
          Lat: feature.geometry?.coordinates?.[1],
          Lon: feature.geometry?.coordinates?.[0],
          Traffic: feature.properties?.AADT2026 ? { aadt_2026: feature.properties.AADT2026 } : null,
        }));
        setBridges(rows);
      })
      .catch(console.error);

    fetch(dataUrl('data/spatial/major_culverts.geojson'))
      .then(res => res.json())
      .then((geojson) => {
        const rows = (geojson.features || []).map((feature, index) => ({
          CulvertNumber: feature.properties?.Culvert__N || feature.properties?.CulvertNumber || `C${String(index + 1).padStart(3, '0')}`,
          River: feature.properties?.River || feature.properties?.Link__Name || feature.properties?.District || 'Major culvert',
          Road: feature.properties?.Road || feature.properties?.Link__Name || '',
          Lat: feature.geometry?.coordinates?.[1],
          Lon: feature.geometry?.coordinates?.[0],
        }));
        setCulverts(rows);
      })
      .catch(console.error);
  }, []);

  const handleBridgeClick = useCallback(async (b) => {
    if (!onSelectBridge) return;
    const fullBridge = await fetchBridgeByNumber(b.BridgeNumber).catch(() => null);
    onSelectBridge({ ...(fullBridge || b), _structureType: 'bridge' });
  }, [onSelectBridge]);

  const handleCulvertClick = useCallback(async (c) => {
    if (!onSelectBridge) return;
    const fullCulvert = await fetchCulvertByNumber(c.CulvertNumber).catch(() => null);
    onSelectBridge({ ...(fullCulvert || c), _structureType: 'culvert' });
  }, [onSelectBridge]);

  return (
    <div className="network-map">
      
      {!selectedBridge && (
        <div className="modern-map-legend">
          <h4 style={{margin: '0 0 12px 0', color: 'var(--text-primary)'}}>Map Legend</h4>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#1e40af'}}></div>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Bridges ({bridges.length})</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#d89a18'}}></div>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Major Culverts ({culverts.length})</span>
          </div>
          {Object.entries(ROAD_CLASS_STYLE).map(([roadClass, style]) => (
            <div key={roadClass} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px'}}>
              <div style={{width: 24, height: 3, borderRadius: 2, background: style.color}}></div>
              <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Class {roadClass}</span>
            </div>
          ))}

        </div>
      )}

      <MapContainer center={[1.3733, 32.2903]} zoom={7} zoomControl={false} preferCanvas style={{ height: '100%', width: '100%', background: '#dce6df' }}>
        {/* Base map — Esri World Imagery + reference labels (always-on, non-removable) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
          opacity={0.7}
        />
        {waterData && <GeoJSON data={waterData} style={{ color: '#0055ff', weight: 1.5, opacity: 0.7, fillColor: '#002288', fillOpacity: 0.3 }} />}
        {networkData && (
          <GeoJSON
            data={networkData}
            style={(feature) => ROAD_CLASS_STYLE[getRoadClass(feature?.properties)] || ROAD_CLASS_STYLE.C}
            interactive={false}
          />
        )}
        

        
        {bridges.map((b, i) => {
          const point = getPoint(b);
          if (!point) return null;
          return (
            <CircleMarker
              key={`b-${i}`}
              center={point}
              radius={4.5}
              pathOptions={{ fillColor: '#1e40af', color: '#fff', weight: 1.5, fillOpacity: 0.9 }}
              eventHandlers={{ click: () => handleBridgeClick(b) }}
            >
              <Tooltip>
                <strong>{b.BridgeName || b.BridgeNumber}</strong><br/>
                Bridge No: {b.BridgeNumber}<br/>
                Road: {b.RoadDescrPrincipal}<br/>
                Link: {b.LinkID || 'Unknown'}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {culverts.map((c, i) => {
          if (!c.Lat || !c.Lon) return null;
          return (
            <CircleMarker
              key={`c-${i}`}
              center={[c.Lat, c.Lon]}
              radius={4}
              pathOptions={{ fillColor: '#d89a18', color: '#fff', weight: 1, fillOpacity: 0.85 }}
              eventHandlers={{ click: () => handleCulvertClick(c) }}
            >
              <Tooltip>
                <strong>Culvert {c.CulvertNumber}</strong><br/>
                River: {c.River || 'Unknown'}<br/>
                Road: {c.Road || 'Unknown'}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Selected marker overlay */}
        <FlyToSelected selectedBridge={selectedBridge} />
        <SelectedMarker bridge={selectedBridge} />
        <ArcGISControls />
        <ScaleControl position="bottomleft" metric={true} imperial={false} />
      </MapContainer>
    </div>
  );
}
