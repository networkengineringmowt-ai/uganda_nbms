const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const LOCAL_API_URL = (import.meta.env.VITE_LOCAL_BMS_API || 'http://localhost:3001/api').replace(/\/+$/, '');

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

  return {
    ...record,
    CulvertNumber: record.CulvertNumber || record.culvert_no || record['Culvert Number'],
    River: record.River || record.river || record.Stream,
    Road: record.Road || record.road || record.Link_Name || record.link_name,
    Link_Name: record.Link_Name || record.Link__Name || record.link_name || record.Link_ID,
    Maintenance_Station: record.Maintenance_Station || record.maintenance_station || record.station || record.maintenanc,
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

// Supabase is completely removed in favor of Local Drive backend

async function upsertLocalRecord(kind, record) {
  return fetchWithTimeout(`${LOCAL_API_URL}/${kind}/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

async function loadDataset(table, fallbackPath, normalize = (row) => row) {
  try {
    const rows = await fetchWithTimeout(`${LOCAL_API_URL}/${table}`);
    if (rows && rows.length) return rows.map(normalize);
  } catch (error) {
    console.warn(`Using bundled ${fallbackPath} because local server ${table} failed:`, error.message);
  }
  const rows = await fetchJson(fallbackPath);
  return Array.isArray(rows) ? rows.map(normalize) : rows;
}

async function loadRecord(table, fallbackPath, idField, id, normalize = (row) => row) {
  try {
    const rows = await fetchWithTimeout(`${LOCAL_API_URL}/${table}`);
    if (rows) {
      const row = rows.find((r) => r[idField] === id);
      if (row) return normalize(row);
    }
  } catch (error) {
    console.warn(`Using bundled ${fallbackPath} for ${id} because local server failed:`, error.message);
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
  try {
    return await fetchWithTimeout(`${LOCAL_API_URL}/documents/paginated?page=${page}&limit=${limit}`, {}, 5000) || [];
  } catch (err) {
    console.warn('Failed to fetch documents from local server', err);
    return [];
  }
}

export async function fetchDocumentPhotos(page = 0, limit = 50) {
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
