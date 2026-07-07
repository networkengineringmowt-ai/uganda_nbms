import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SUPABASE_REST_URL = (process.env.SUPABASE_REST_URL || 'https://udionwmqmjcfzbdhoetv.supabase.co/rest/v1').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaW9ud21xbWpjZnpiZGhvZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDI3NjcsImV4cCI6MjA5NjIxODc2N30.EP5bruNS55m2PE1nf0p2KeOxm4Tnae5ESAj6DukqIr0';

const datasets = [
  { table: 'bridges', file: 'public/data/bridges.json', idField: 'BridgeNumber' },
  { table: 'culverts', file: 'public/data/culverts.json', idField: 'CulvertNumber' },
];

function assertConfig() {
  if (!SUPABASE_REST_URL || !SUPABASE_KEY) {
    throw new Error('Set SUPABASE_REST_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY before seeding.');
  }
}

async function readJson(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function postgrest(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_REST_URL}/${pathname.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    if (response.status === 403 || text.includes('row-level security')) {
      throw new Error(`${text}\nUse SUPABASE_SERVICE_ROLE_KEY for seeding, or apply supabase/anon-write-policy.local-only.sql only for a controlled internal deployment.`);
    }
    if (response.status === 401) {
      throw new Error('Supabase rejected the API key. Check SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.');
    }
    throw new Error(text || `PostgREST request failed with status ${response.status}`);
  }
  return text ? JSON.parse(text) : null;
}

async function upsertRows(table, rows, chunkSize = 100) {
  let done = 0;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    await postgrest(`${table}?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    done += chunk.length;
    console.log(`${table}: ${done}/${rows.length}`);
  }
}

async function seedDataset({ table, file, idField }) {
  const data = await readJson(file);
  const rows = data
    .map((record) => ({ id: record[idField], data: record }))
    .filter((row) => row.id);

  const duplicateIds = rows
    .map((row) => row.id)
    .filter((id, index, all) => all.indexOf(id) !== index);

  if (duplicateIds.length) {
    throw new Error(`${table} has duplicate ids: ${[...new Set(duplicateIds)].slice(0, 10).join(', ')}`);
  }

  console.log(`Seeding ${rows.length} ${table} rows from ${file}`);
  await upsertRows(table, rows);
}

async function main() {
  assertConfig();
  for (const dataset of datasets) {
    await seedDataset(dataset);
  }

  const checks = await Promise.all(datasets.map(async ({ table }) => {
    const rows = await postgrest(`${table}?select=id`);
    return { table, rows: rows.length };
  }));
  console.log(JSON.stringify({ ok: true, checks }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
