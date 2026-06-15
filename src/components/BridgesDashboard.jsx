import { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { fetchBridges } from '../services/bmsDataService';
import DataTable from './DataTable';
import {
  TYPE_BEARINGS,
  TYPE_BRIDGE,
  TYPE_CROSSING,
  TYPE_DECK,
  TYPE_DECK_MATERIAL,
  getConditionLabel,
  getConditionColor,
  getDictionaryLabel,
} from '../utils/dataDictionary';

export default function BridgesDashboard({ initialBridges = [] }) {
  const [bridges, setBridges] = useState(initialBridges);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialBridges.length) return;
    fetchBridges()
      .then(setBridges)
      .catch(console.error);
  }, [initialBridges]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bridges;
    return bridges.filter((bridge) => [
      bridge.BridgeNumber,
      bridge.BridgeName,
      bridge.RoadDescrPrincipal,
      bridge.LinkID,
      bridge.Region,
      bridge.Station,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [bridges, search]);

  if (bridges.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Bridges Registry...</p>
    </div>
  );

  const condCol = (header, valFn) => ({
    header,
    sortValue: (row) => valFn(row),
    cell: (row) => {
      const label = valFn(row);
      if (label === 'Unknown') return label;
      return <span style={{ color: getConditionColor(label), fontWeight: 700 }}>{label}</span>;
    }
  });

  const cols = [
    { header: 'Bridge No', accessor: 'BridgeNumber' },
    { header: 'Name', cell: (row) => row.BridgeName || row.bridge_nam || 'Unknown' },
    { header: 'Region', cell: (row) => row.Region || row.region || 'Unknown' },
    { header: 'District', cell: (row) => row.LegacyData?.district_council || row.District || row.district_council || 'Unknown' },
    { header: 'Road', cell: (row) => row.RoadDescrPrincipal || row.road_descr_principal || 'Unknown' },
    { header: 'Link ID', cell: (row) => row.LinkID || row.link_no || 'Unknown' },
    { header: 'Station (km)', cell: (row) => row.Station || row.station || row.km || 'Unknown' },
    { header: 'Maintenance Station', cell: (row) => row.Station || row.LegacyData?.maintenanc || row.LegacyData?.station || 'Unknown' },
    { header: 'Owner', cell: (row) => row.LegacyData?.owner || row.owner || 'Unknown' },
    { header: 'Crossing', cell: (row) => getDictionaryLabel(TYPE_CROSSING, row.TypeCrossing || row.LegacyData?.type_crossing || row.type_crossing) },
    { header: 'Structure', cell: (row) => getDictionaryLabel(TYPE_BRIDGE, row.LegacyData?.type_bridge || row.type_bridge) },
    { header: 'Deck', cell: (row) => getDictionaryLabel(TYPE_DECK, row.LegacyData?.type_deck || row.type_deck) },
    { header: 'Material', cell: (row) => getDictionaryLabel(TYPE_DECK_MATERIAL, row.LegacyData?.type_deck_material || row.type_deck_material) },
    { header: 'Bearings', cell: (row) => getDictionaryLabel(TYPE_BEARINGS, row.LegacyData?.type_bearings || row.type_bearings) },
    { header: 'Length (m)', cell: (row) => row.TotalLength || row.LegacyData?.length_m || row.bridge_len || row.length || 'Unknown' },
    { header: 'Width (m)', cell: (row) => row.MinClearWidth || row.LegacyData?.width_m || row.bridge_wid || row.width || 'Unknown' },
    { header: 'Year Built', cell: (row) => row.YearBuilt || row.LegacyData?.year_built || row.year_compl || 'Unknown' },
    { header: 'Lanes', cell: (row) => row.LegacyData?.no_of_lane || row.no_of_lane || 'Unknown' },
    { header: 'Scour Risk', cell: (row) => row.LegacyData?.scour_risk === 'Y' ? 'Yes' : row.LegacyData?.scour_risk === 'N' ? 'No' : row.LegacyData?.scour_risk || row.scour_risk || 'Unknown' },
    { header: 'Latitude', cell: (row) => row.Latitude ?? row.Lat ?? row.LegacyData?.location_corrected_lat ?? row.LegacyData?.map_y ?? 'Unknown' },
    { header: 'Longitude', cell: (row) => row.Longitude ?? row.Lon ?? row.LegacyData?.location_corrected_lon ?? row.LegacyData?.map_x ?? 'Unknown' },
    { header: 'AADT', cell: (row) => { const aadt = row.Traffic?.aadt_2026 || row.aadt_rebuilt_2026 || row.current_predicted_aadt; return aadt ? Math.round(aadt).toLocaleString() : 'Unknown'; } },
    condCol('Superstructure', (row) => row.LegacyData?.superstructure_rating != null ? getConditionLabel(row.LegacyData.superstructure_rating) : row.superstructure_rating != null ? getConditionLabel(row.superstructure_rating) : 'Unknown'),
    condCol('Substructure', (row) => row.LegacyData?.substructure_rating != null ? getConditionLabel(row.LegacyData.substructure_rating) : row.substructure_rating != null ? getConditionLabel(row.substructure_rating) : 'Unknown'),
    condCol('Deck / Roadway', (row) => row.LegacyData?.roadway_rating != null ? getConditionLabel(row.LegacyData.roadway_rating) : row.roadway_rating != null ? getConditionLabel(row.roadway_rating) : 'Unknown'),
    condCol('Waterway', (row) => row.LegacyData?.waterway_rating != null ? getConditionLabel(row.LegacyData.waterway_rating) : row.waterway_rating != null ? getConditionLabel(row.waterway_rating) : 'Unknown'),
    condCol('Approaches', (row) => row.LegacyData?.approaches_rating != null ? getConditionLabel(row.LegacyData.approaches_rating) : row.approaches_rating != null ? getConditionLabel(row.approaches_rating) : 'Unknown'),
    condCol('Overall Condition', (row) => {
        const rating = row.OverallConditionRating ?? row.LegacyData?.overall_rating ?? row.overall_rating;
        return rating != null ? getConditionLabel(rating) : 'Unknown';
    }),
    { header: 'Inspector', cell: (row) => row.LegacyData?.inspector || row.inspector || 'Unknown' },
    { header: 'Date Modified', cell: (row) => row.DateModified || row.LegacyData?.date_modified || row.date_modified || 'Unknown' },
    { header: 'Engineering Comment', cell: (row) => row.LegacyData?.comment || row.comment || 'None' },
  ];

  return (
    <div className="registry-dashboard">
      <div className="glass-card registry-table-card" style={{padding:0, overflow:'hidden'}}>
        <div className="registry-table-header">
          <h3 className="card-title" style={{margin:0}}>Bridges Registry</h3>
          <span>{filtered.length.toLocaleString()} of {bridges.length.toLocaleString()} records</span>
          <label className="registry-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bridges..."
            />
          </label>
        </div>
        
        {filtered.length > 0 ? (
          <>
            <DataTable columns={cols} data={filtered} />
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No structures match your search.
          </div>
        )}
      </div>

    </div>
  );
}
