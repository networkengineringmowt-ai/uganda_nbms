import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceIndex = path.resolve('public/gallery/index.json');
const outputIndex = path.resolve('dist/gallery/index.json');
const outputImages = path.resolve('dist/gallery/images');

const gallery = JSON.parse(await readFile(sourceIndex, 'utf8'));
// Remove the copied images to keep build size tiny (loaded via raw github content in prod)
await rm(outputImages, { recursive: true, force: true });

// Remove the massive extracted offline data before deploy since it lives in Supabase now
const distExtractedPhotos = path.resolve('dist/data/extracted_photos');
const distExtractedMeta = path.resolve('dist/data/extracted_metadata.json');
await rm(distExtractedPhotos, { recursive: true, force: true });
await rm(distExtractedMeta, { force: true });

await mkdir(path.dirname(outputIndex), { recursive: true });
await writeFile(outputIndex, JSON.stringify(gallery));
console.log(`Prepared all ${gallery.length} structure photos for Pages metadata.`);

