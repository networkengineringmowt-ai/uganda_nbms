import express from 'express';
import pg from 'pg';

const app = express();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
app.use(express.json({ limit: '10mb' }));

const allowedLayers = new Map([
  ['structures', { table: 'integration.structure_ogc', spatial: true }],
  ['priority-structures', { table: 'integration.priority_structures', spatial: true }],
  ['latest-inspections', { table: 'integration.latest_inspection', spatial: false }],
  ['twin-readiness', { table: 'integration.twin_readiness', spatial: false }],
]);

app.get('/health', async (_request, response) => {
  const result = await pool.query('SELECT now() AS database_time, postgis_full_version() AS postgis');
  response.json({ ok: true, service: 'uganda-bms-catalog-api', ...result.rows[0] });
});

app.get('/layers', (_request, response) => response.json([...allowedLayers.keys()]));

app.get('/layers/:layer', async (request, response) => {
  const layer = allowedLayers.get(request.params.layer);
  if (!layer) return response.status(404).json({ error: 'Unknown published layer' });
  const limit = Math.min(5000, Math.max(1, Number(request.query.limit) || 500));
  const geometry = layer.spatial ? ', CASE WHEN geom IS NULL THEN NULL ELSE ST_AsGeoJSON(geom)::json END AS geometry' : '';
  const result = await pool.query(`SELECT * ${geometry} FROM ${layer.table} LIMIT $1`, [limit]);
  return response.json(result.rows);
});

app.get('/structures/:id', async (request, response) => {
  const result = await pool.query('SELECT *, ST_AsGeoJSON(geom)::json AS geometry FROM core.structure WHERE structure_id = $1', [request.params.id.toUpperCase()]);
  return result.rows[0] ? response.json(result.rows[0]) : response.status(404).json({ error: 'Structure not found' });
});

app.patch('/structures/:id', async (request, response) => {
  const { name, condition_rating: conditionRating, length_m: lengthM, width_m: widthM, properties } = request.body;
  const result = await pool.query(
    `UPDATE core.structure SET name=COALESCE($2,name), condition_rating=COALESCE($3,condition_rating),
     length_m=COALESCE($4,length_m), width_m=COALESCE($5,width_m), properties=COALESCE($6,properties), updated_at=now()
     WHERE structure_id=$1 RETURNING *`,
    [request.params.id.toUpperCase(), name, conditionRating, lengthM, widthM, properties],
  );
  return result.rows[0] ? response.json(result.rows[0]) : response.status(404).json({ error: 'Structure not found' });
});

app.get('/audit/:id', async (request, response) => {
  const result = await pool.query('SELECT * FROM audit.change_log WHERE record_key=$1 ORDER BY changed_at DESC LIMIT 500', [request.params.id.toUpperCase()]);
  response.json(result.rows);
});

app.use((error, _request, response, _next) => response.status(500).json({ error: error.message }));
app.listen(Number(process.env.PORT || 8080), () => console.log('Catalog API listening'));
