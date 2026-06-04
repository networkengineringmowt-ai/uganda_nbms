import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapDashboard() {
  const [networkData, setNetworkData] = useState(null);
  const [bridgesData, setBridgesData] = useState(null);

  useEffect(() => {
    fetch('/uganda_bms/data/spatial/network2026.geojson')
      .then(res => res.json())
      .then(setNetworkData)
      .catch(console.error);

    fetch('/uganda_bms/data/spatial/bridges.geojson')
      .then(res => res.json())
      .then(setBridgesData)
      .catch(console.error);
  }, []);

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={[1.3733, 32.2903]} zoom={7} style={{ height: '100%', width: '100%', background: '#0a0f1c' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {networkData && <GeoJSON data={networkData} style={{ color: '#5474ff', weight: 2, opacity: 0.8 }} />}
        {bridgesData && <GeoJSON data={bridgesData} pointToLayer={(feature, latlng) => {
           return L.circleMarker(latlng, {
             radius: 5,
             fillColor: '#00e5ff',
             color: '#fff',
             weight: 1,
             opacity: 1,
             fillOpacity: 0.8
           });
        }} />}
      </MapContainer>
    </div>
  );
}
