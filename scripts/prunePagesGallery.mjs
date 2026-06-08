import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceIndex = path.resolve('public/gallery/index.json');
const outputIndex = path.resolve('dist/gallery/index.json');
const outputImages = path.resolve('dist/gallery/images');

const gallery = JSON.parse(await readFile(sourceIndex, 'utf8'));
const selected = [];
const selectedIds = new Set();

for (const item of gallery) {
  if (!item.structure_id || selectedIds.has(item.structure_id)) continue;
  
  selectedIds.add(item.structure_id);
  selected.push(item);
}

// Remove the copied images to keep build size tiny (loaded via raw github content in prod)
await rm(outputImages, { recursive: true, force: true });

await mkdir(path.dirname(outputIndex), { recursive: true });
await writeFile(outputIndex, JSON.stringify(selected));
console.log(`Prepared ${selected.length} representative structure photos for Pages metadata.`);


