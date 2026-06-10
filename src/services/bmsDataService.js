import { BMS_DATA_SOURCE, supabaseRest } from '../utils/supabaseClient';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const LOCAL_API_URL = (import.meta.env.VITE_LOCAL_BMS_API || 'http://localhost:3001/api').replace(/\/+$/, '');

const sourceAllowsSupabase = () => BMS_DATA_SOURCE !== 'static';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

async function fetchJson(path) {
  const response = await fetch(dataUrl(path));
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSupabaseDataset(table) {
  const rows = await supabaseRest(`${table}?select=id,data&order=id.asc&limit=1000`);
  return (rows || []).map((row) => row.data).filter(Boolean);
}

async function fetchSupabaseRecord(table, id) {
  const rows = await supabaseRest(`${table}?select=id,data&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows?.[0]?.data || null;
}

async function upsertSupabaseRecord(table, id, record) {
  return supabaseRest(`${table}?on_conflict=id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ id, data: record }]),
  });
}

async function upsertLocalRecord(kind, record) {
  return fetchWithTimeout(`${LOCAL_API_URL}/${kind}/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

async function loadDataset(table, fallbackPath) {
  if (sourceAllowsSupabase()) {
    try {
      const rows = await fetchSupabaseDataset(table);
      if (rows.length) return rows;
    } catch (error) {
      console.warn(`Using bundled ${fallbackPath} because Supabase ${table} failed:`, error.message);
    }
  }
  return fetchJson(fallbackPath);
}

async function loadRecord(table, fallbackPath, idField, id) {
  if (sourceAllowsSupabase()) {
    try {
      const row = await fetchSupabaseRecord(table, id);
      if (row) return row;
    } catch (error) {
      console.warn(`Using bundled ${fallbackPath} for ${id} because Supabase failed:`, error.message);
    }
  }

  const rows = await fetchJson(fallbackPath);
  return rows.find((row) => row[idField] === id) || null;
}

export function fetchBridges() {
  return loadDataset('bridges', 'data/bridges.json');
}

export function fetchCulverts() {
  return loadDataset('culverts', 'data/culverts.json');
}

export function fetchBridgeByNumber(bridgeNumber) {
  return loadRecord('bridges', 'data/bridges.json', 'BridgeNumber', bridgeNumber);
}

export function fetchCulvertByNumber(culvertNumber) {
  return loadRecord('culverts', 'data/culverts.json', 'CulvertNumber', culvertNumber);
}

export async function fetchDocuments(page = 0, limit = 50) {
  const offset = page * limit;
  return supabaseRest(`documents?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`);
}

export async function fetchDocumentPhotos(page = 0, limit = 50) {
  const offset = page * limit;
  return supabaseRest(`document_photos?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`);
}

export async function saveBridge(bridge) {
  const id = bridge?.BridgeNumber;
  if (!id) throw new Error('BridgeNumber is required before saving.');

  const errors = [];
  if (sourceAllowsSupabase()) {
    try {
      await upsertSupabaseRecord('bridges', id, bridge);
      return { backend: 'supabase' };
    } catch (error) {
      errors.push(`Supabase: ${error.message}`);
    }
  }

  try {
    await upsertLocalRecord('bridges', bridge);
    return { backend: 'local-drive' };
  } catch (error) {
    errors.push(`Local Drive server: ${error.message}`);
  }

  throw new Error(errors.join(' | '));
}

export async function saveCulvert(culvert) {
  const id = culvert?.CulvertNumber;
  if (!id) throw new Error('CulvertNumber is required before saving.');

  const errors = [];
  if (sourceAllowsSupabase()) {
    try {
      await upsertSupabaseRecord('culverts', id, culvert);
      return { backend: 'supabase' };
    } catch (error) {
      errors.push(`Supabase: ${error.message}`);
    }
  }

  try {
    await upsertLocalRecord('culverts', culvert);
    return { backend: 'local-drive' };
  } catch (error) {
    errors.push(`Local Drive server: ${error.message}`);
  }

  throw new Error(errors.join(' | '));
}
