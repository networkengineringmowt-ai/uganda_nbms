import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

export default function GalleryDashboard() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('/uganda_bms/gallery/index.json')
      .then(res => res.json())
      .then(setImages)
      .catch(console.error);
  }, []);

  if (images.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Photographic Evidence...</p>
    </div>
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 className="card-title"><Camera size={14} style={{display:'inline', marginRight:6}}/> Photo Gallery</h3>
          <div className="kpi-value">{images.length}</div>
          <div className="kpi-label">Images Processed</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {images.map((img, i) => (
          <div key={i} className="glass-card" style={{ padding: '8px' }}>
            <img src={img.url} alt={img.filename} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} loading="lazy" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', wordBreak: 'break-all' }}>{img.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
