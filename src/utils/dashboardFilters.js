export const DEFAULT_DASHBOARD_FILTERS = {
  region: 'All',
  roadClass: 'All',
  bridgeName: 'All',
  bridgeNumber: 'All',
  culvertNumber: 'All',
  station: 'All',
  roadLinkName: 'All',
};

const uniqueSorted = (values) => [...new Set(values.filter((v) => v !== undefined && v !== null && String(v).trim() !== ''))]
  .map((v) => String(v))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export function buildDashboardFilterOptions(bridges, culverts) {
  return {
    regions: uniqueSorted([...bridges.map((b) => b.Region), ...culverts.map((c) => c.Region)]),
    roadClasses: uniqueSorted([...bridges.map((b) => b.RoadClass), ...culverts.map((c) => c.Road_Class)]),
    bridgeNames: uniqueSorted(bridges.map((b) => b.BridgeName)),
    bridgeNumbers: uniqueSorted(bridges.map((b) => b.BridgeNumber)),
    culvertNumbers: uniqueSorted(culverts.map((c) => c.CulvertNumber)),
    stations: uniqueSorted([...bridges.map((b) => b.Station), ...culverts.map((c) => c.Maintenance_Station)]),
    roadLinkNames: uniqueSorted([...bridges.map((b) => b.RoadDescrPrincipal), ...culverts.map((c) => c.Link_Name)]),
  };
}

export function applyDashboardFilters(bridges, culverts, filters) {
  const filteredBridges = bridges.filter((b) => (
    (filters.region === 'All' || b.Region === filters.region)
    && (filters.roadClass === 'All' || b.RoadClass === filters.roadClass)
    && (filters.bridgeName === 'All' || b.BridgeName === filters.bridgeName)
    && (filters.bridgeNumber === 'All' || b.BridgeNumber === filters.bridgeNumber)
    && (filters.station === 'All' || b.Station === filters.station)
    && (filters.roadLinkName === 'All' || b.RoadDescrPrincipal === filters.roadLinkName)
    // A bridge can never match a culvert-number filter -- excluded once one is chosen.
    && filters.culvertNumber === 'All'
  ));
  const filteredCulverts = culverts.filter((c) => (
    (filters.region === 'All' || c.Region === filters.region)
    && (filters.roadClass === 'All' || c.Road_Class === filters.roadClass)
    && (filters.culvertNumber === 'All' || c.CulvertNumber === filters.culvertNumber)
    && (filters.station === 'All' || c.Maintenance_Station === filters.station)
    && (filters.roadLinkName === 'All' || c.Link_Name === filters.roadLinkName)
    // A culvert has no bridge name/number -- excluded once either filter is set.
    && filters.bridgeName === 'All'
    && filters.bridgeNumber === 'All'
  ));
  return { filteredBridges, filteredCulverts };
}
