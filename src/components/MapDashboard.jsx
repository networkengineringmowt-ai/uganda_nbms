import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
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
          fillColor: isCulvert ? '#d89a18' : '#08784d',
          fillOpacity: 0.15,
          color: isCulvert ? '#d89a18' : '#08784d',
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
          color: isCulvert ? '#d89a18' : '#08784d',
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
      
      <div className="map-legend">
        <h4 style={{margin: '0 0 12px 0', color: 'var(--text-primary)'}}>Map Legend</h4>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: '#08784d'}}></div>
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

      <MapContainer center={[1.3733, 32.2903]} zoom={7} preferCanvas style={{ height: '100%', width: '100%', background: '#dce6df' }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri'
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='Labels &copy; Esri'
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
              pathOptions={{ fillColor: '#08784d', color: '#fff', weight: 1.5, fillOpacity: 0.9 }}
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
      </MapContainer>
    </div>
  );
}
