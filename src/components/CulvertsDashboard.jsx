import { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getConditionColor, getConditionLabel } from '../utils/dataDictionary';
import DataTable from './DataTable';
import { fetchCulverts } from '../services/bmsDataService';

export default function CulvertsDashboard({ initialCulverts = [] }) {
  const [culverts, setCulverts] = useState(initialCulverts);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialCulverts.length) return;
    fetchCulverts()
      .then(setCulverts)
      .catch(console.error);
  }, [initialCulverts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return culverts;
    return culverts.filter((culvert) => [
      culvert.CulvertNumber,
      culvert.River,
      culvert.Road,
      culvert.Region,
      culvert.SectionOrLinkNo,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [culverts, search]);

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
    { header: 'Culvert No', accessor: 'CulvertNumber' },
    { header: 'River', cell: (row) => row.River || row.river || 'Unknown' },
    { header: 'Road / Section', cell: (row) => `${row.Road || row.road_descr_principal || 'Unknown'} (${row.SectionOrLinkNo || row.link_no || 'Unknown'})` },
    { header: 'Km', cell: (row) => row.Km || row.km || 'Unknown' },
    { header: 'Region', cell: (row) => row.Region || row.Maintenance_Region || row.region || 'Unknown' },
    { header: 'Firm', cell: (row) => row.Firm || row.firm || 'Unknown' },
    { header: 'Checked By', cell: (row) => row.CheckedBy || row.inspector || 'Unknown' },
    { header: 'Type', cell: (row) => row.Type || row.LegacyData?.type_culvert || row.type_culvert || 'Unknown' },
    { header: 'Cells / Pipes', cell: (row) => row.NoOfPipesOrCells || row.LegacyData?.no_of_pipes || row.no_of_pipes || 'Unknown' },
    { header: 'Span / Diameter', cell: (row) => row.SpanOrDiameter || row.LegacyData?.span_diameter || row.span_diameter || 'Unknown' },
    { header: 'Length (m)', cell: (row) => row['Overall Length'] || row.LegacyData?.culvert_len || row.culvert_len || 'Unknown' },
    { header: 'Width (m)', cell: (row) => row['Overall Width'] || row.LegacyData?.overall_width || row.overall_width || 'Unknown' },
    { header: 'Min Clear Width (m)', cell: (row) => row['Min Clear Width'] || row.LegacyData?.min_clear_width || 'Unknown' },
    { header: 'Fill Height (m)', cell: (row) => row.FillHeight || row.LegacyData?.fill_height || 'Unknown' },
    { header: 'Latitude', cell: (row) => row.Latitude ?? row.Lat ?? row.LegacyData?.Lat ?? row.LegacyData?.CoOrdinateS ?? 'Unknown' },
    { header: 'Longitude', cell: (row) => row.Longitude ?? row.Lon ?? row.LegacyData?.Lon ?? row.LegacyData?.CoOrdinateE ?? 'Unknown' },
    condCol('Structure', (row) => getConditionLabel(row.LegacyData?.structure_rating ?? row.structure_rating)),
    condCol('Inlet / Outlet', (row) => getConditionLabel(row.LegacyData?.inlet_outlet_rating ?? row.inlet_outlet_rating)),
    condCol('Roadway', (row) => getConditionLabel(row.LegacyData?.roadway_rating ?? row.roadway_rating)),
    condCol('Waterway', (row) => getConditionLabel(row.LegacyData?.waterway_rating ?? row.waterway_rating)),
    condCol('Overall Condition', (row) => getConditionLabel(row['Overall Rating'] ?? row.LegacyData?.overall_rating ?? row.overall_rating ?? row['Condition Category'] ?? row['Condition Category.4'])),
    { header: 'Inspection Date', cell: (row) => row.InspectionDate || row.LegacyData?.InspectionDate || row.DateModified || row.date_modified || 'Unknown' },
    { header: 'Date Modified', cell: (row) => row.DateModified || row.date_modified || 'Unknown' },
    { header: 'Comments', cell: (row) => row.Comments || row['Comment '] || row.LegacyData?.Comments || row.LegacyData?.['Comment '] || 'None' },
  ];

  if (culverts.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Culverts Registry...</p>
    </div>
  );

  return (
    <div className="registry-dashboard">
      <div className="glass-card registry-table-card" style={{padding:0, overflow:'hidden'}}>
        <div className="registry-table-header">
          <h3 className="card-title" style={{margin:0}}>Major Culverts Registry</h3>
          <span>{filtered.length.toLocaleString()} of {culverts.length.toLocaleString()} records</span>
          <label className="registry-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search culverts..." />
          </label>
        </div>
        <DataTable columns={cols} data={filtered} />
      </div>
    </div>
  );
}
