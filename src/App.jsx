import { useEffect, useState } from 'react';
import BmsMobileShell from './components/modern/BmsMobileShell';
import SuperDashboardShell from './components/modern/SuperDashboardShell';
import AdminDashboardShell from './components/modern/AdminDashboardShell';
import LoginPage from './components/modern/LoginPage';
import { fetchBridges, fetchCulverts } from './services/bmsDataService';

export default function App() {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [authRole, setAuthRole] = useState(null); // 'bms', 'super', 'admin'

  // Load datasets on startup
  useEffect(() => {
    Promise.all([fetchBridges(), fetchCulverts()])
      .then(([bridgeRows, culvertRows]) => {
        setBridges(bridgeRows || []);
        setCulverts(culvertRows || []);
      })
      .catch(console.error);
  }, []);

  if (!authRole) {
    return <LoginPage onLogin={setAuthRole} />;
  }

  if (authRole === 'bms') {
    return (
      <BmsMobileShell 
        bridges={bridges}
        culverts={culverts}
        setBridges={setBridges}
        setCulverts={setCulverts}
      />
    );
  }

  if (authRole === 'super') {
    return (
      <SuperDashboardShell 
        bridges={bridges}
        culverts={culverts}
      />
    );
  }

  return (
    <AdminDashboardShell 
      bridges={bridges}
      culverts={culverts}
      setBridges={setBridges}
      setCulverts={setCulverts}
    />
  );
}
