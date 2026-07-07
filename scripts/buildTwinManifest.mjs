import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const gallery = readJson('public/gallery/index.json').filter((photo) => photo.structure_id && !photo.duplicate_of);
const bridges = readJson('public/data/bridges.json');
const culverts = readJson('public/data/culverts.json');
const outputDir = path.join(root, 'public', 'twins');

const number = (...values) => {
  const match = values.find((value) => Number.isFinite(Number(value)));
  return match === undefined ? null : Number(match);
};
const idOf = (row) => row.BridgeNumber || row.bridge_no || row.new_bridge_no || row.CulvertNumber || row.culvert_no || row['Culvert Number'];

const photosByStructure = new Map();
for (const photo of gallery) {
  const list = photosByStructure.get(photo.structure_id) || [];
  list.push(photo);
  photosByStructure.set(photo.structure_id, list);
}

const manifest = [...bridges, ...culverts].map((asset) => {
  const id = idOf(asset);
  const photos = photosByStructure.get(id) || [];
  const cloudRelativePath = `twins/${id}/pointcloud.ply`;
  const meshRelativePath = `twins/${id}/textured.glb`;
  const cloudExists = fs.existsSync(path.join(root, 'public', cloudRelativePath));
  const meshExists = fs.existsSync(path.join(root, 'public', meshRelativePath));
  const isCulvert = String(id || '').startsWith('C');
  const width = number(asset.width, asset.bridge_wid, asset.overall_width, asset['Overall Width'], asset['Min Clear Width']);
  const length = number(asset.length, asset.bridge_len, asset.culvert_len, asset['Overall Length']);

  return {
    structure_id: id,
    structure_type: isCulvert ? 'culvert' : 'bridge',
    reconstruction_status: meshExists ? 'textured-mesh-ready' : cloudExists ? 'point-cloud-ready' : photos.length >= 12 ? 'photogrammetry-ready' : 'insufficient-photo-coverage',
    point_cloud_url: cloudExists ? cloudRelativePath : null,
    textured_mesh_url: meshExists ? meshRelativePath : null,
    canonical_photo_count: photos.length,
    capture_years: [...new Set(photos.map((photo) => photo.capture_year).filter(Boolean))].sort(),
    authoritative_dimensions: {
      length_m: length,
      width_m: width,
      span_count: number(asset.no_of_spans, asset.no_of_span, asset.no_of_pipes, asset.NoOfPipesOrCells),
      dimension_source: length || width ? 'BMS inventory record' : 'Not recorded',
      survey_control_status: 'not-registered',
    },
    quality_gate: {
      minimum_photos: 12,
      has_minimum_photo_count: photos.length >= 12,
      requires_survey_control_for_certified_dimensions: true,
      certified_dimension_accuracy: false,
    },
  };
}).filter((row) => row.structure_id);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const ready = manifest.filter((row) => row.reconstruction_status.includes('ready')).length;
console.log(`Prepared ${manifest.length} digital-twin reconstruction records; ${ready} are ready for reconstruction or viewing.`);
