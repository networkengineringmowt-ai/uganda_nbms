import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapDashboard() {
  const [networkData, setNetworkData] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);

  useEffect(() => {
    fetch('/uganda_bms/data/spatial/network2026.geojson')
      .then(res => res.json())
      .then(setNetworkData)
      .catch(console.error);

    fetch('/uganda_bms/data/bridges.json')
      .then(res => res.json())
      .then(setBridges)
      .catch(console.error);

    fetch('/uganda_bms/data/culverts.json')
      .then(res => res.json())
      .then(setCulverts)
      .catch(console.error);
  }, []);

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
      
      <div style={{position: 'absolute', top: 16, right: 16, zIndex: 1000, background: 'rgba(10,15,28,0.85)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', backdropFilter: 'blur(10px)'}}>
        <h4 style={{margin: '0 0 12px 0', color: 'var(--text-primary)'}}>Map Legend</h4>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: '#00e5ff'}}></div>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Bridges ({bridges.length})</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: '#ff3366'}}></div>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Major Culverts ({culverts.length})</span>
        </div>
      </div>

      <MapContainer center={[1.3733, 32.2903]} zoom={7} style={{ height: '100%', width: '100%', background: '#0a0f1c' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {networkData && <GeoJSON data={networkData} style={{ color: '#5474ff', weight: 2, opacity: 0.6 }} />}
        
        {bridges.map((b, i) => {
          if (!b.LegacyData) return null;
          const lat = b.LegacyData.location_corrected_lat || b.LegacyData.map_y;
          const lon = b.LegacyData.location_corrected_lon || b.LegacyData.map_x;
          if (!lat || !lon) return null;
          return (
            <CircleMarker key={`b-${i}`} center={[lat, lon]} radius={4} pathOptions={{ fillColor: '#00e5ff', color: '#fff', weight: 1, fillOpacity: 0.8 }}>
              <Tooltip>
                <strong>{b.BridgeName || b.BridgeNumber}</strong><br/>
                Bridge No: {b.BridgeNumber}<br/>
                Road: {b.RoadDescrPrincipal}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {culverts.map((c, i) => {
          const lat = c.CoOrdinateS;
          const lon = c.CoOrdinateE;
          if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
          return (
            <CircleMarker key={`c-${i}`} center={[lat, lon]} radius={4} pathOptions={{ fillColor: '#ff3366', color: '#fff', weight: 1, fillOpacity: 0.8 }}>
              <Tooltip>
                <strong>Culvert {c.CulvertNumber}</strong><br/>
                River: {c.River}<br/>
                Road: {c.Road}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
