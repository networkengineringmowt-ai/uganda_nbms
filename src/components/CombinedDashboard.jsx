import React from 'react';
import InvestmentDashboard from './InvestmentDashboard';
import MapDashboard from './MapDashboard';

export default function CombinedDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <InvestmentDashboard />
      <div style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', paddingLeft: '8px', borderLeft: '4px solid var(--accent-blue)' }}>Interactive Network Map</h2>
        <MapDashboard />
      </div>
    </div>
  );
}
