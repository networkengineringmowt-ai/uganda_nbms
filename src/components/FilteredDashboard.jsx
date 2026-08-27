import { useMemo, useState } from 'react';
import BmsOverview from './BmsOverview';
import VisualAnalytics from './VisualAnalytics';
import CrossAnalysis from './CrossAnalysis';
import DeteriorationAnalysis from './DeteriorationAnalysis';
import DashboardFilterBar from './DashboardFilterBar';
import { DEFAULT_DASHBOARD_FILTERS, applyDashboardFilters } from '../utils/dashboardFilters';

// Wraps the merged Dashboard tab (Overview + Visual Analytics + Cross
// Analysis) with one sticky filter bar. The filter narrows the shared
// bridges/culverts arrays once, here, and every chart below -- across all
// three sections -- reads from that same filtered pair, so nothing ever
// shows a stat computed from a different slice of the register than the
// bar currently displays.
export default function FilteredDashboard({ bridges = [], culverts = [], onNavigate, onSelectAsset }) {
  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);

  const { filteredBridges, filteredCulverts } = useMemo(
    () => applyDashboardFilters(bridges, culverts, filters),
    [bridges, culverts, filters],
  );

  const handleChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilters(DEFAULT_DASHBOARD_FILTERS);

  return (
    <div className="dashboard-merged">
      <DashboardFilterBar
        bridges={bridges}
        culverts={culverts}
        filters={filters}
        onChange={handleChange}
        onReset={handleReset}
        resultCount={{ bridges: filteredBridges.length, culverts: filteredCulverts.length }}
      />
      <BmsOverview
        bridges={filteredBridges}
        culverts={filteredCulverts}
        onNavigate={onNavigate}
        onSelectAsset={onSelectAsset}
      />
      <VisualAnalytics bridges={filteredBridges} culverts={filteredCulverts} />
      <CrossAnalysis bridges={filteredBridges} culverts={filteredCulverts} />
      <DeteriorationAnalysis bridges={filteredBridges} culverts={filteredCulverts} />
    </div>
  );
}
