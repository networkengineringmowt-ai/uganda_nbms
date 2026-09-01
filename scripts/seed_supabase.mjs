// One-time (or re-run-anytime) seed script: loads the bundled JSON files
// this site already ships and upserts them into the nbms_* tables created
// by supabase/nbms_schema.sql.
//
// Run this YOURSELF, locally -- it needs your Supabase project's
// service_role key (the one that bypasses Row-Level Security), which must
// never be pasted into chat, committed to this repo, or put in any file
// that gets built into the public site. Pass it as an environment
// variable for this one command only:
//
//   SUPABASE_URL="https://xxxx.supabase.co" \
//   SUPABASE_SERVICE_KEY="ey..." \
//   node scripts/seed_supabase.mjs
//
// Safe to re-run: every row is upserted by its natural key (bridge_no /
// culvert_number), so running it again after re-ingesting new data just
// updates existing rows and adds new ones.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'public', 'data');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function loadJson(filename) {
  const text = await readFile(join(dataDir, filename), 'utf8');
  return JSON.parse(text);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function seedBridges() {
  const bridges = await loadJson('bridges.json');
  const rows = bridges.map((b) => ({
    bridge_no: String(b.BridgeNumber || b.bridge_no || b.new_bridge_no || b.original_bridge_no),
    bridge_name: b.BridgeName || b.bridge_nam || null,
    region: b.Region || b.region || null,
    station: b.Station || b.station || b.maintenanc || null,
    road_class: b.RoadClass || b.road_class || null,
    link_no: b.LinkID || b.link_no || null,
    km: toNumber(b.KmPrincipal ?? b.km ?? b.chainage_km),
    overall_rating: toNumber(b.OverallConditionRating ?? b.overall_rating),
    overall_condition: b.OverallCondition || null,
    lat: toNumber(b.Lat ?? b.Latitude ?? b.location_corrected_lat ?? b.y_new),
    lon: toNumber(b.Lon ?? b.Longitude ?? b.location_corrected_lon ?? b.x_new),
    raw: b,
    updated_at: new Date().toISOString(),
  })).filter((r) => r.bridge_no && r.bridge_no !== 'undefined');

  const { error, count } = await supabase.from('nbms_bridges').upsert(rows, { onConflict: 'bridge_no', count: 'exact' });
  if (error) throw new Error(`nbms_bridges upsert failed: ${error.message}`);
  console.log(`nbms_bridges: upserted ${rows.length} rows (server reports count=${count ?? 'n/a'})`);
}

async function seedCulverts() {
  const culverts = await loadJson('culverts.json');
  const rows = culverts.map((c) => ({
    culvert_number: String(c.CulvertNumber || c['New Culvert Number'] || c['Culvert Number']),
    region: c.Region || c.Maintenance_Region || null,
    station: c.Station || c.Maintenance_Station || null,
    road_class: c.Road_Class || c.RoadClass || null,
    link_id: c.Link_ID || c.LinkID || c.SectionOrLinkNo || null,
    overall_rating: toNumber(c.OverallConditionRating ?? c['Overall Rating']),
    overall_condition: c.OverallCondition || c['Condition Category.4'] || null,
    lat: toNumber(c.Lat ?? c.Latitude ?? c.CoOrdinateS),
    lon: toNumber(c.Lon ?? c.Longitude ?? c.CoOrdinateE),
    raw: c,
    updated_at: new Date().toISOString(),
  })).filter((r) => r.culvert_number && r.culvert_number !== 'undefined');

  const { error, count } = await supabase.from('nbms_culverts').upsert(rows, { onConflict: 'culvert_number', count: 'exact' });
  if (error) throw new Error(`nbms_culverts upsert failed: ${error.message}`);
  console.log(`nbms_culverts: upserted ${rows.length} rows (server reports count=${count ?? 'n/a'})`);
}

async function seedBridgeWorks() {
  const works = await loadJson('bridge_works.json');
  // No stable natural key in the source data (sn is a plain row number) --
  // this table is small (14 rows) and re-ingested wholesale each time, so
  // clear and re-insert rather than upsert.
  const { error: deleteError } = await supabase.from('nbms_bridge_works').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw new Error(`nbms_bridge_works clear failed: ${deleteError.message}`);

  const rows = works.map((w) => ({
    bridge: w.bridge || null,
    raw: w,
    updated_at: new Date().toISOString(),
  }));
  const { error, count } = await supabase.from('nbms_bridge_works').insert(rows, { count: 'exact' });
  if (error) throw new Error(`nbms_bridge_works insert failed: ${error.message}`);
  console.log(`nbms_bridge_works: inserted ${rows.length} rows (server reports count=${count ?? 'n/a'})`);
}

async function main() {
  await seedBridges();
  await seedCulverts();
  await seedBridgeWorks();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
