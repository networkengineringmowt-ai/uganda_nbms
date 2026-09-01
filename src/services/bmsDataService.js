import { getCulvertTypeLabel } from '../utils/dataDictionary';
import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const LOCAL_API_URL = (import.meta.env.VITE_LOCAL_BMS_API || 'http://localhost:3001/api').replace(/\/+$/, '');
// The Local Drive server only ever runs on the same machine as the browser (an
// office deployment). On the public GitHub Pages site there is nothing
// listening on this visitor's own localhost, so attempting it there does
// nothing but throw a connection-refused error into every visitor's console
// on every page load. Only attempt it when the app is actually being loaded
// from localhost -- everyone else goes straight to the bundled JSON.
const LOCAL_API_AVAILABLE = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;
const CONDITION_LABELS = [
  'Beyond Repair',
  'Critical',
  'Very Poor',
  'Poor',
  'Marginal',
  'Fair',
  'Satisfactory',
  'Good',
  'Very Good',
  'Excellent',
];

const conditionFromRating = (rating) => {
  // Guard against null/undefined/empty-string coercing to 0 via Number(),
  // which would silently mislabel unrated records (e.g. bridges still under
  // construction, with no rating on file) as "Beyond Repair" -- the worst
  // possible condition.
  if (rating === null || rating === undefined || rating === '') return undefined;
  const numeric = Number(rating);
  return Number.isFinite(numeric) ? CONDITION_LABELS[Math.round(numeric)] : undefined;
};

const normalizeBridge = (record) => {
  const { LegacyData: existingLegacy = {}, Traffic: existingTraffic = {}, ...flatRecord } = record;
  const bridgeNumber = record.BridgeNumber || record.bridge_no || record.new_bridge_no || record.original_bridge_no;
  const overallRating = record.OverallConditionRating ?? existingLegacy.overall_rating ?? record.overall_rating;
  const aadt = existingTraffic.aadt_2026 ?? record.aadt_rebuilt_2026 ?? record.current_predicted_aadt ?? record.aadt_2026;

  return {
    ...record,
    BridgeNumber: bridgeNumber,
    BridgeName: record.BridgeName || record.bridge_nam || record.reference_attributes?.bridgename || bridgeNumber,
    RoadDescrPrincipal: record.RoadDescrPrincipal || record.road_descr_principal || record.location_corrected_road_name || record.link_name,
    LinkID: record.LinkID || record.link_no || record.location_corrected_link_id,
    KmPrincipal: record.KmPrincipal ?? record.km ?? record.chainage_km,
    Region: record.Region || record.region,
    Station: record.Station || record.station || record.maintenanc,
    District: record.District || record.district_council,
    RoadClass: record.RoadClass || record.road_class,
    TypeCrossing: record.TypeCrossing || record.type_crossing,
    Lat: record.Lat ?? record.Latitude ?? record.location_corrected_lat ?? record.map_y ?? record.y_new,
    Lon: record.Lon ?? record.Longitude ?? record.location_corrected_lon ?? record.map_x ?? record.x_new,
    Latitude: record.Latitude ?? record.Lat ?? record.location_corrected_lat ?? record.map_y ?? record.y_new,
    Longitude: record.Longitude ?? record.Lon ?? record.location_corrected_lon ?? record.map_x ?? record.x_new,
    DateModified: record.DateModified || record.date_modified,
    OverallConditionRating: overallRating,
    OverallCondition: record.OverallCondition || conditionFromRating(overallRating) || 'Unknown',
    Traffic: {
      ...existingTraffic,
      aadt_2026: aadt,
      growth_rate: existingTraffic.growth_rate ?? record.annual_weighted_growth_rate,
      link_id: existingTraffic.link_id || record.link_no || record.location_corrected_link_id,
      link_name: existingTraffic.link_name || record.link_name || record.location_corrected_road_name,
    },
    LegacyData: {
      ...flatRecord,
      ...existingLegacy,
    },
  };
};

const normalizeCulvert = (record) => {
  const { LegacyData: existingLegacy = {}, ...flatRecord } = record;
  const overallRating = record.OverallConditionRating ?? existingLegacy.overall_rating ?? record['Overall Rating'];
  const rawCulvertType = record.TypeCulvert ?? record.CulvertTypeCode ?? record.type_culvert
    ?? existingLegacy.type_culvert ?? record.Type;

  return {
    ...record,
    CulvertNumber: record.CulvertNumber || record.culvert_no || record['Culvert Number'],
    River: record.River || record.river || record.Stream,
    Road: record.Road || record.road || record.Link_Name || record.link_name,
    TypeCulvert: rawCulvertType,
    CulvertType: getCulvertTypeLabel(rawCulvertType),
    Road_No: record.Road_No || record.RoadNumber || record.road_no,
    Road_Class: record.Road_Class || record.RoadClass || record.road_class,
    Link_ID: record.Link_ID || record.LinkID || record.SectionOrLinkNo || record.Link__No || record.link_no,
    LinkID: record.LinkID || record.Link_ID || record.SectionOrLinkNo || record.Link__No || record.link_no,
    Link_Name: record.Link_Name || record.Link__Name || record.link_name || record.Road,
    LinkName: record.LinkName || record.Link_Name || record.Link__Name || record.link_name || record.Road,
    Chainage_From: record.Chainage_From ?? record.chainage_from,
    Chainage_To: record.Chainage_To ?? record.chainage_to,
    LinkLengthKm: record.LinkLengthKm ?? record['Length(km)'] ?? record.length_km,
    Surface_Type: record.Surface_Type || record.Surface__T || record.surface_type,
    Maintenance_Station: record.Maintenance_Station || record.maintenance_station || record.station || record.maintenanc,
    Station: record.Station || record.Maintenance_Station || record.maintenance_station || record.station || record.maintenanc,
    Maintenance_Region: record.Maintenance_Region || record.Region || record.region,
    Region: record.Region || record.Maintenance_Region || record.region,
    Lat: record.Lat ?? record.Latitude ?? record.location_corrected_lat ?? record.CoOrdinateS,
    Lon: record.Lon ?? record.Longitude ?? record.location_corrected_lon ?? record.CoOrdinateE,
    Latitude: record.Latitude ?? record.Lat ?? record.location_corrected_lat ?? record.CoOrdinateS,
    Longitude: record.Longitude ?? record.Lon ?? record.location_corrected_lon ?? record.CoOrdinateE,
    OverallConditionRating: overallRating,
    OverallCondition: record.OverallCondition || record['Condition Category.4'] || conditionFromRating(overallRating) || 'Unknown',
    LegacyData: {
      ...flatRecord,
      waterway_rating: existingLegacy.waterway_rating ?? record.Waterway,
      inlet_outlet_rating: existingLegacy.inlet_outlet_rating ?? record['Inlet/Outlet '],
      structure_rating: existingLegacy.structure_rating ?? record.Structure,
      roadway_rating: existingLegacy.roadway_rating ?? record.Roadway,
      overall_rating: existingLegacy.overall_rating ?? overallRating,
      ...existingLegacy,
    },
  };
};

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

// Live database read path. Table names below match supabase/nbms_schema.sql.
// Each row stores the full original record in a `raw` jsonb column plus a
// handful of indexed columns for fast filtering -- fetching `raw` and
// running it through the same normalize() used for the bundled JSON means
// the rest of the app doesn't need to know whether a record came from the
// database or from public/data/*.json.
const SUPABASE_TABLES = {
  bridges: 'nbms_bridges',
  culverts: 'nbms_culverts',
  bridge_works: 'nbms_bridge_works',
};

async function fetchFromSupabase(table) {
  if (!supabase) return null;
  const supabaseTable = SUPABASE_TABLES[table];
  if (!supabaseTable) return null;
  const { data, error } = await supabase.from(supabaseTable).select('raw');
  if (error) {
    console.warn(`Supabase query for ${supabaseTable} failed, falling back:`, error.message);
    return null;
  }
  if (!data || !data.length) return null;
  return data.map((row) => row.raw);
}

// Reports which backend actually served the most recent dataset load, so UI
// status indicators (sidebar "Database Status" etc.) show the truth instead
// of a hardcoded claim. One of: 'local-drive', 'supabase', 'static-json'.
let lastBackendUsed = 'static-json';
export function getLastBackendUsed() {
  return lastBackendUsed;
}

async function upsertLocalRecord(kind, record) {
  if (!LOCAL_API_AVAILABLE) {
    throw new Error('The Local Drive server is only reachable from the office deployment, not from this public site.');
  }
  return fetchWithTimeout(`${LOCAL_API_URL}/${kind}/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

async function loadDataset(table, fallbackPath, normalize = (row) => row) {
  if (LOCAL_API_AVAILABLE) {
    try {
      const rows = await fetchWithTimeout(`${LOCAL_API_URL}/${table}`);
      if (rows && rows.length) {
        lastBackendUsed = 'local-drive';
        return rows.map(normalize);
      }
    } catch (error) {
      console.warn(`Local server ${table} failed, trying the live database next:`, error.message);
    }
  }

  const supabaseRows = await fetchFromSupabase(table);
  if (supabaseRows && supabaseRows.length) {
    lastBackendUsed = 'supabase';
    return supabaseRows.map(normalize);
  }

  const rows = await fetchJson(fallbackPath);
  lastBackendUsed = 'static-json';
  return Array.isArray(rows) ? rows.map(normalize) : rows;
}

async function loadRecord(table, fallbackPath, idField, id, normalize = (row) => row) {
  if (LOCAL_API_AVAILABLE) {
    try {
      const rows = await fetchWithTimeout(`${LOCAL_API_URL}/${table}`);
      if (rows) {
        const row = rows.find((r) => r[idField] === id);
        if (row) return normalize(row);
      }
    } catch (error) {
      console.warn(`Local server failed for ${id}, trying the live database next:`, error.message);
    }
  }

  const supabaseRows = await fetchFromSupabase(table);
  if (supabaseRows) {
    const row = supabaseRows.find((r) => r[idField] === id);
    if (row) return normalize(row);
  }

  const rows = (await fetchJson(fallbackPath)).map(normalize);
  return rows.find((row) => row[idField] === id) || null;
}

export function fetchBridges() {
  return loadDataset('bridges', 'data/bridges.json', normalizeBridge);
}

export function fetchCulverts() {
  return loadDataset('culverts', 'data/culverts.json', normalizeCulvert);
}

export function fetchBridgeWorks() {
  return loadDataset('bridge_works', 'data/bridge_works.json');
}

export function fetchBridgeByNumber(bridgeNumber) {
  return loadRecord('bridges', 'data/bridges.json', 'BridgeNumber', bridgeNumber, normalizeBridge);
}

export function fetchCulvertByNumber(culvertNumber) {
  return loadRecord('culverts', 'data/culverts.json', 'CulvertNumber', culvertNumber, normalizeCulvert);
}

export async function fetchDocuments(page = 0, limit = 50) {
  if (!LOCAL_API_AVAILABLE) return [];
  try {
    return await fetchWithTimeout(`${LOCAL_API_URL}/documents/paginated?page=${page}&limit=${limit}`, {}, 5000) || [];
  } catch (err) {
    console.warn('Failed to fetch documents from local server', err);
    return [];
  }
}

export async function fetchDocumentPhotos(page = 0, limit = 50) {
  if (!LOCAL_API_AVAILABLE) return [];
  try {
    return await fetchWithTimeout(`${LOCAL_API_URL}/document_photos/paginated?page=${page}&limit=${limit}`, {}, 5000) || [];
  } catch (err) {
    console.warn('Failed to fetch document photos from local server', err);
    return [];
  }
}

export async function saveBridge(bridge) {
  const id = bridge?.BridgeNumber;
  if (!id) throw new Error('BridgeNumber is required before saving.');

  try {
    await upsertLocalRecord('bridges', bridge);
    return { backend: 'local-drive' };
  } catch (error) {
    throw new Error(`Local Drive server: ${error.message}`, { cause: error });
  }
}

export async function saveCulvert(culvert) {
  const id = culvert?.CulvertNumber;
  if (!id) throw new Error('CulvertNumber is required before saving.');

  try {
    await upsertLocalRecord('culverts', culvert);
    return { backend: 'local-drive' };
  } catch (error) {
    throw new Error(`Local Drive server: ${error.message}`, { cause: error });
  }
}
