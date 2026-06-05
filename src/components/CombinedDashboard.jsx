import React, { Suspense, lazy } from 'react';
import InvestmentDashboard from './InvestmentDashboard';
import MapDashboard from './MapDashboard';

const BridgeDetailCard = lazy(() => import('./BridgeDetailCard'));

export default function CombinedDashboard({ selectedBridge, onSelectBridge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <InvestmentDashboard />

      {selectedBridge && (
        <Suspense fallback={null}>
          <BridgeDetailCard
            bridge={selectedBridge}
            onClose={() => onSelectBridge?.(null)}
          />
        </Suspense>
      )}

      <div style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', paddingLeft: '8px', borderLeft: '4px solid var(--accent-blue)' }}>Interactive Network Map</h2>
        <MapDashboard
          selectedBridge={selectedBridge}
          onSelectBridge={onSelectBridge}
        />
      </div>
    </div>
  );
}
