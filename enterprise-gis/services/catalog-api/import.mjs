import fs from 'node:fs';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const read = (name) => JSON.parse(fs.readFileSync(`/seed-data/${name}`, 'utf8'));
const number = (...values) => {
  const value = values.find((candidate) => Number.isFinite(Number(candidate)));
  return value === undefined ? null : Number(value);
};

const bridgeRows = read('bridges.json').map((row) => ({
  id: row.BridgeNumber || row.bridge_no || row.new_bridge_no,
  type: 'bridge',
  name: row.BridgeName || row.bridge_nam,
  roadLinkId: row.LinkID || row.link_no || row.location_corrected_link_id,
  roadName: row.RoadDescrPrincipal || row.road_descr_principal || row.location_corrected_road_name,
  roadClass: row.RoadClass || row.road_class,
  region: row.Region || row.region,
  station: row.Station || row.station || row.maintenanc,
  condition: number(row.OverallConditionRating, row.overall_rating),
  length: number(row.length, row.bridge_len),
  width: number(row.width, row.bridge_wid),
  spans: number(row.no_of_spans, row.no_of_span),
  lon: number(row.Lon, row.location_corrected_lon, row.map_x, row.x_new),
  lat: number(row.Lat, row.location_corrected_lat, row.map_y, row.y_new),
  properties: row,
}));

const culvertRows = read('culverts.json').map((row) => ({
  id: row.CulvertNumber || row.culvert_no || row['Culvert Number'],
  type: 'culvert',
  name: row.River || row.river || row.Stream,
  roadLinkId: row.Link_ID || row.link_no,
  roadName: row.Road || row.road || row.Link_Name || row.link_name,
  roadClass: row.RoadClass || row.road_class,
  region: row.Region || row.Maintenance_Region || row.region,
  station: row.Maintenance_Station || row.station || row.maintenanc,
  condition: number(row.OverallConditionRating, row['Overall Rating']),
  length: number(row['Overall Length'], row.culvert_len),
  width: number(row['Overall Width'], row.overall_width),
  spans: number(row.NoOfPipesOrCells, row.no_of_pipes),
  lon: number(row.Lon, row.Longitude, row.location_corrected_lon, row.CoOrdinateE),
  lat: number(row.Lat, row.Latitude, row.location_corrected_lat, row.CoOrdinateS),
  properties: row,
}));

for (const row of [...bridgeRows, ...culvertRows].filter((item) => item.id)) {
  await pool.query(
    `INSERT INTO core.structure(structure_id, structure_type, name, road_link_id, road_name, road_class, region, station,
      condition_rating, length_m, width_m, span_count, properties, geom)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
       CASE WHEN $14::double precision IS NULL OR $15::double precision IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($14,$15),4326) END)
     ON CONFLICT(structure_id) DO UPDATE SET structure_type=EXCLUDED.structure_type, name=EXCLUDED.name, road_link_id=EXCLUDED.road_link_id,
       road_name=EXCLUDED.road_name, road_class=EXCLUDED.road_class, region=EXCLUDED.region, station=EXCLUDED.station,
       condition_rating=EXCLUDED.condition_rating, length_m=EXCLUDED.length_m, width_m=EXCLUDED.width_m, span_count=EXCLUDED.span_count,
       properties=EXCLUDED.properties, geom=EXCLUDED.geom, updated_at=now()`,
    [row.id, row.type, row.name, row.roadLinkId, row.roadName, row.roadClass, row.region, row.station, row.condition, row.length, row.width, row.spans, row.properties, row.lon, row.lat],
  );
}
console.log(`Imported ${bridgeRows.length} bridges and ${culvertRows.length} culverts.`);
await pool.end();
