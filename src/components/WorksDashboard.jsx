import { useState, useEffect } from 'react';
import { Construction, CheckCircle2, DollarSign, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const WORKS_COORDS = {
  "Lot 1: Nyamugasani Bridge (Lower) on Rwentare-Katwe-Katojo Road": [0.057398, 29.835154],
  "Lot 2: Kyanya Bridge on Mobuku-Maliba-Kyanya-Ibanda Road and Isango Bridge on Bwera-Kithoma-Kiraro Road": [0.287, 30.045],
  "Civil Works for Emergency Restoration Of Karuma Bridge Along Kampala-Gulu Road": [2.2359, 32.2472],
  "Emergency Temporary Construction and Maintenance Works at Pakwach Bridge Over the Albert Nile Under Design and Build": [2.4578, 31.4988],
  "Kampala Flyover Construction and Road Upgrading Project: \nLot-1 (Package 1: Clock Tower Flyover & Package 2: Nsambya - Mukwano Road)": [0.3060, 32.5855]
};

export default function WorksDashboard() {
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    fetch('/uganda_bms/data/bridge_works.json')
      .then(r => r.json())
      .then(data => {
        // Attach coords
        const withCoords = data.map(w => ({
          ...w,
          coords: WORKS_COORDS[w.bridge] || [1.3733, 32.2903] // Default to center of Uganda if unknown
        }));
        setWorks(withCoords);
      })
      .catch(console.error);
  }, []);

  if (!works.length) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Bridge Works...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* MAP PANE */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer 
          center={[1.3733, 32.2903]} 
          zoom={7} 
          zoomControl={false} 
          style={{ height: '100%', width: '100%', background: '#dce6df' }}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
          />
          <ZoomControl position="bottomleft" />
          
          {works.map((work, i) => (
            <CircleMarker
              key={i}
              center={work.coords}
              radius={selectedWork === work ? 8 : 6}
              pathOptions={{ 
                fillColor: selectedWork === work ? '#ef4444' : '#f59e0b', 
                color: '#fff', 
                weight: 2, 
                fillOpacity: 0.9 
              }}
              eventHandlers={{
                click: () => setSelectedWork(work)
              }}
            >
              <Tooltip>
                <strong>{work.bridge}</strong><br/>
                Status: {work.status ? 'Ongoing' : 'Planned'}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
          padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          color: 'white', maxWidth: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Construction size={16} color="#f59e0b" />
            Active Work Sites
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Map shows {works.length} structures currently under maintenance, rehabilitation, or emergency construction.
          </p>
        </div>
      </div>

      {/* LIST PANE */}
      <div className="modern-scroll" style={{ width: '450px', background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Construction size={24} color="var(--accent-amber)" /> 
            Ongoing Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
            Tracking {works.length} structural intervention contracts and rehabilitation projects.
          </p>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {works.map((work, i) => {
            const isSelected = selectedWork === work;
            return (
              <div 
                key={i} 
                onClick={() => setSelectedWork(work)}
                style={{ 
                  background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border-light)',
                  borderLeft: isSelected ? '4px solid var(--accent-amber)' : '4px solid var(--border-light)',
                  padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <h3 style={{ fontSize: '13px', marginBottom: '12px', marginTop: 0, color: isSelected ? 'var(--accent-amber)' : 'var(--text-primary)', lineHeight: 1.4 }}>
                  {work.bridge || work.Bridge_Name}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {work.Intervention || work.intervention || 'General Rehabilitation'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <HardHatIcon size={14} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {work.contractor || work.Contractor || 'Unknown'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Ongoing
                    </span>
                    <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={12} /> {work.funder || work.Funder || 'GOU'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HardHatIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a6 6 0 0 1 6-6h0" />
      <path d="M14 6h0a6 6 0 0 1 6 6v3" />
    </svg>
  );
}
