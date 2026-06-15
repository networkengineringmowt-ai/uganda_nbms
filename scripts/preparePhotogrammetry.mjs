import fs from 'node:fs';
import path from 'node:path';

const structureId = String(process.argv[2] || '').trim().toUpperCase();
if (!/^[BC]\d{3}$/.test(structureId)) {
  throw new Error('Usage: node scripts/preparePhotogrammetry.mjs B001');
}

const root = process.cwd();
const gallery = JSON.parse(fs.readFileSync(path.join(root, 'public/gallery/index.json'), 'utf8'));
const photos = gallery.filter((photo) => photo.structure_id === structureId && !photo.duplicate_of && photo.original_path && fs.existsSync(photo.original_path));
if (photos.length < 3) throw new Error(`${structureId} has only ${photos.length} source-linked photos. At least 3 are required.`);

const projectDir = path.join(root, 'photogrammetry', structureId);
const imagesDir = path.join(projectDir, 'images');
fs.mkdirSync(imagesDir, { recursive: true });

for (const photo of photos) {
  const target = path.join(imagesDir, photo.filename.replace(/[<>:"/\\|?*]/g, '_'));
  if (!fs.existsSync(target)) fs.copyFileSync(photo.original_path, target);
}

const project = {
  structure_id: structureId,
  created_at: new Date().toISOString(),
  source_photo_count: photos.length,
  source_photos: photos.map((photo) => ({
    filename: photo.filename,
    original_path: photo.original_path,
    capture_year: photo.capture_year,
    sequence: photo.sequence,
  })),
  accuracy_note: 'Photogrammetry is scale-ambiguous until surveyed control points or authoritative dimensions are registered.',
  output_contract: {
    point_cloud: `public/twins/${structureId}/pointcloud.ply`,
    textured_mesh: `public/twins/${structureId}/textured.glb`,
  },
};
fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(project, null, 2));
console.log(`Prepared ${photos.length} canonical source photos in ${projectDir}`);
