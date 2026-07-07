import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const galleryDir = path.join(repoRoot, 'public', 'gallery', 'images');
const indexPath = path.join(repoRoot, 'public', 'gallery', 'index.json');
const sourceCandidates = [
  'G:\\My Drive\\MOWT\\Uganda National Road Network Repository\\Bridge stuff\\PHOTOS',
  'G:\\My Drive\\MOWT\\Uganda National Road Network Repository\\PHOTOS',
  'D:\\OneDrive\\Uganda National Road Network Repository\\Bridge stuff\\PHOTOS',
];
const sourceRoot = sourceCandidates.find((candidate) => fs.existsSync(candidate));
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const knownIds = new Set([
  ...readJson('public/data/bridges.json').map((row) => row.BridgeNumber || row.bridge_no || row.new_bridge_no),
  ...readJson('public/data/culverts.json').map((row) => row.CulvertNumber || row.culvert_no || row.culvert__n),
].filter(Boolean).map((id) => String(id).trim().toUpperCase()));

const structureCandidates = (value = '') => (
  String(value).toUpperCase().match(/[BC]\d{3}/g) || []
).filter((id) => knownIds.has(id));

const structureFromPath = (filePath) => {
  const segments = String(filePath).split(/[\\/]+/).reverse();
  for (const segment of segments) {
    const exact = segment.trim().toUpperCase();
    if (knownIds.has(exact)) return exact;
    const matches = structureCandidates(segment);
    if (matches.length) return matches[0];
  }
  return null;
};
const structureFromDirectory = (filePath) => structureFromPath(path.dirname(filePath));

const inferYear = (filename, sourcePath = '') => {
  const text = `${filename} ${sourcePath}`;
  const fullYear = text.match(/\b(20(?:0\d|1\d|2[0-6]))\b/);
  if (fullYear) return Number(fullYear[1]);

  const stem = filename.replace(/\.(?:jpg|jpeg|png|webp)+$/i, '');
  const tokens = stem.split(/[^0-9]+/).filter(Boolean);
  const likelyYear = tokens.find((token) => token.length === 2 && Number(token) >= 5 && Number(token) <= 26);
  return likelyYear ? 2000 + Number(likelyYear) : null;
};

const inferSequence = (filename) => {
  const stem = filename.replace(/\.(?:jpg|jpeg|png|webp)+$/i, '').replace(/_\d+x\d+$/i, '');
  const match = stem.match(/(\d+)\D*$/);
  return match ? Number(match[1]) : null;
};

const walkImages = (root) => {
  const images = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) images.push(fullPath);
    }
  }
  return images;
};

if (!sourceRoot) {
  throw new Error(`No photo source found. Checked:\n${sourceCandidates.join('\n')}`);
}

const sourceImages = walkImages(sourceRoot);
const sourcesByName = new Map();
for (const sourcePath of sourceImages) {
  const key = path.basename(sourcePath).toLowerCase();
  const candidates = sourcesByName.get(key) || [];
  candidates.push(sourcePath);
  sourcesByName.set(key, candidates);
}

const localGalleryFiles = fs.readdirSync(galleryDir)
  .filter((filename) => imageExtensions.has(path.extname(filename).toLowerCase()));
let galleryFiles = localGalleryFiles;
try {
  const tracked = execFileSync('git', ['ls-files', 'public/gallery/images'], { cwd: repoRoot, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((filePath) => path.basename(filePath))
    .filter((filename) => fs.existsSync(path.join(galleryDir, filename)));
  if (tracked.length) galleryFiles = tracked;
} catch {
  console.warn('Git publishable-file check unavailable; indexing every local gallery image.');
}

const chooseSource = (filename, filenameId) => {
  const exactCandidates = sourcesByName.get(filename.toLowerCase()) || [];
  const strippedName = filenameId && filename.toUpperCase().startsWith(`${filenameId}_`)
    ? filename.slice(filenameId.length + 1)
    : null;
  const candidates = exactCandidates.length
    ? exactCandidates
    : (strippedName ? sourcesByName.get(strippedName.toLowerCase()) || [] : []);

  if (!candidates.length) return null;
  return candidates.find((candidate) => structureFromDirectory(candidate) === filenameId)
    || candidates.find((candidate) => structureFromDirectory(candidate))
    || candidates[0];
};

const gallery = galleryFiles.map((filename) => {
  const filenameId = structureCandidates(filename)[0] || null;
  const originalPath = chooseSource(filename, filenameId);
  const pathId = originalPath ? structureFromDirectory(path.relative(sourceRoot, originalPath)) : null;
  const structureId = pathId || filenameId;
  const matchMethod = pathId
    ? (pathId === filenameId ? 'source-folder-and-filename' : 'source-folder')
    : (filenameId ? 'filename' : 'unassigned');

  return {
    structure_id: structureId,
    filename,
    path: `gallery/images/${filename}`,
    original_path: originalPath || null,
    source_relative_path: originalPath ? path.relative(sourceRoot, originalPath).replaceAll('\\', '/') : null,
    capture_year: inferYear(filename, originalPath),
    sequence: inferSequence(filename),
    match_method: matchMethod,
    naming_status: filenameId ? 'structured' : (pathId ? 'folder-assigned' : 'unstructured'),
  };
}).sort((a, b) => (
  String(a.structure_id || 'ZZZ').localeCompare(String(b.structure_id || 'ZZZ'))
  || (a.capture_year || 9999) - (b.capture_year || 9999)
  || (a.sequence || 9999) - (b.sequence || 9999)
  || a.filename.localeCompare(b.filename)
));

const seenSources = new Map();
gallery.forEach((photo) => {
  if (!photo.original_path) return;
  const key = photo.original_path.toLowerCase();
  if (seenSources.has(key)) photo.duplicate_of = seenSources.get(key);
  else seenSources.set(key, photo.filename);
});

fs.writeFileSync(indexPath, JSON.stringify(gallery, null, 2));

const assigned = gallery.filter((photo) => photo.structure_id).length;
const folderAssigned = gallery.filter((photo) => photo.match_method.includes('source-folder')).length;
const sourceLinked = gallery.filter((photo) => photo.original_path).length;
const aliases = gallery.filter((photo) => photo.duplicate_of).length;
const audit = {
  generated_at: new Date().toISOString(),
  source_root: sourceRoot,
  source_repository_images: sourceImages.length,
  local_gallery_images: localGalleryFiles.length,
  publishable_images: gallery.length,
  assigned_images: assigned,
  source_folder_confirmed: folderAssigned,
  source_linked: sourceLinked,
  duplicate_aliases: aliases,
  unassigned_images: gallery.length - assigned,
};
fs.writeFileSync(path.join(repoRoot, 'public', 'gallery', 'audit.json'), JSON.stringify(audit, null, 2));
console.log(`Photo evidence index rebuilt from ${sourceRoot}`);
console.log(`Source repository: ${sourceImages.length.toLocaleString()} images`);
console.log(`Local gallery: ${localGalleryFiles.length.toLocaleString()} images`);
console.log(`Publishable gallery: ${gallery.length.toLocaleString()} images`);
console.log(`Assigned to structures: ${assigned.toLocaleString()} (${folderAssigned.toLocaleString()} confirmed by source folder)`);
console.log(`Linked to original source: ${sourceLinked.toLocaleString()}`);
console.log(`Duplicate filename aliases retained in index: ${aliases.toLocaleString()}`);
