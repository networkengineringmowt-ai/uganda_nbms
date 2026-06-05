import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const ROAD_CLASS_STYLE = {
  A: { color: '#ff4f7b', weight: 2.4, opacity: 0.78 },
  B: { color: '#ffb340', weight: 2.0, opacity: 0.72 },
  C: { color: '#72e58a', weight: 1.25, opacity: 0.62 },
  M: { color: '#f97316', weight: 2.6, opacity: 0.8 },
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
          fillColor: isCulvert ? '#ff3366' : '#00e5ff',
          fillOpacity: 0.15,
          color: isCulvert ? '#ff3366' : '#00e5ff',
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
          color: isCulvert ? '#ff3366' : '#00e5ff',
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
  const bridgeDetailsRef = useRef(null);
  const culvertDetailsRef = useRef(null);

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
    bridgeDetailsRef.current ||= fetch(dataUrl('data/bridges.json')).then(res => res.json()).catch(() => []);
    const details = await bridgeDetailsRef.current;
    const fullBridge = details.find(row => row.BridgeNumber === b.BridgeNumber) || b;
    onSelectBridge({ ...fullBridge, _structureType: 'bridge' });
  }, [onSelectBridge]);

  const handleCulvertClick = useCallback(async (c) => {
    if (!onSelectBridge) return;
    culvertDetailsRef.current ||= fetch(dataUrl('data/culverts.json')).then(res => res.json()).catch(() => []);
    const details = await culvertDetailsRef.current;
    const fullCulvert = details.find(row => row.CulvertNumber === c.CulvertNumber) || c;
    onSelectBridge({ ...fullCulvert, _structureType: 'culvert' });
  }, [onSelectBridge]);

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
      
      <div style={{position: 'absolute', top: 16, right: 16, zIndex: 1000, background: 'rgba(10,15,28,0.85)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', backdropFilter: 'blur(10px)'}}>
        <h4 style={{margin: '0 0 12px 0', color: 'var(--text-primary)'}}>Map Legend</h4>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: '#00e5ff'}}></div>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Bridges ({bridges.length})</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: '#ff3366'}}></div>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Major Culverts ({culverts.length})</span>
        </div>
        {Object.entries(ROAD_CLASS_STYLE).map(([roadClass, style]) => (
          <div key={roadClass} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px'}}>
            <div style={{width: 24, height: 3, borderRadius: 2, background: style.color}}></div>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Class {roadClass}</span>
          </div>
        ))}
      </div>

      <MapContainer center={[1.3733, 32.2903]} zoom={7} preferCanvas style={{ height: '100%', width: '100%', background: '#0a0f1c' }}>
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
              pathOptions={{ fillColor: '#00e5ff', color: '#fff', weight: 1.5, fillOpacity: 0.88 }}
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
              pathOptions={{ fillColor: '#ff3366', color: '#fff', weight: 1, fillOpacity: 0.8 }}
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
