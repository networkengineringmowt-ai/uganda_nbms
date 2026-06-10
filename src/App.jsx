import { useEffect, useState } from 'react';
import ModernDashboardShell from './components/modern/ModernDashboardShell';
import ClassicAccessShell from './components/classic/ClassicAccessShell';
import { fetchBridges, fetchCulverts } from './services/bmsDataService';

export default function App() {
  const [viewMode, setViewMode] = useState('modern'); // 'classic' or 'modern'
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

  if (viewMode === 'modern') {
    return (
      <ModernDashboardShell 
        bridges={bridges}
        culverts={culverts}
        setBridges={setBridges}
        setViewMode={setViewMode}
      />
    );
  }

  return (
    <ClassicAccessShell 
      bridges={bridges}
      culverts={culverts}
      setBridges={setBridges}
      setCulverts={setCulverts}
      setViewMode={setViewMode}
    />
  );
}
