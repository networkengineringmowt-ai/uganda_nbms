import { useEffect, useState } from 'react';
import ModernDashboardShell from './components/modern/ModernDashboardShell';
import { fetchBridges, fetchCulverts } from './services/bmsDataService';

export default function App() {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);

  // Load datasets on startup
  useEffect(() => {
    Promise.all([fetchBridges(), fetchCulverts()])
      .then(([bridgeRows, culvertRows]) => {
        setBridges(bridgeRows || []);
        setCulverts(culvertRows || []);
      })
      .catch(console.error);
  }, []);

  return (
    <ModernDashboardShell 
      bridges={bridges}
      culverts={culverts}
      setBridges={setBridges}
      setCulverts={setCulverts}
    />
  );
}
