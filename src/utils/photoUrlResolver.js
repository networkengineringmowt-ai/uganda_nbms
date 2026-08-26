/**
 * Resolves the URL of a structure photo. A web-optimised gallery is bundled
 * with the deploy (see scripts/build_gallery_from_gdrive.py), so images are
 * served from the site itself in both dev and production.
 */
function baseUrl() {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : `${b}/`;
}

export function getPhotoUrl(photo) {
  if (!photo) return '';
  if (photo.path) return `${baseUrl()}${photo.path.replace(/^\/+/, '')}`;
  const filename = photo.filename;
  if (!filename) return photo.url || '';
  return `${baseUrl()}gallery/images/${filename}`;
}

/** Small thumbnail (cards / grids). Falls back to the full image. */
export function getThumbUrl(photo) {
  if (!photo) return '';
  if (photo.thumbnail) return `${baseUrl()}${photo.thumbnail.replace(/^\/+/, '')}`;
  const filename = photo.filename;
  if (filename) {
    return `${baseUrl()}gallery/thumbnails/${filename.replace(/\.[^/.]+$/, '.jpg')}`;
  }
  return getPhotoUrl(photo);
}

// Lightweight inline placeholder shown when an evidence photo file is
// missing/404s, so the UI never shows a raw broken-image icon. Attach as
// the <img>'s onError handler.
const MISSING_PHOTO_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'>` +
  `<rect width='200' height='150' fill='#16213d'/>` +
  `<g fill='none' stroke='#4a6488' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'>` +
  `<path d='M36 108 L78 66 L104 92 L134 58 L166 108' />` +
  `<circle cx='58' cy='44' r='11' />` +
  `<line x1='24' y1='22' x2='176' y2='128' />` +
  `</g></svg>`
);

export function onPhotoError(e) {
  const img = e.target;
  if (img.dataset.photoFallback) return;
  img.dataset.photoFallback = '1';
  img.src = MISSING_PHOTO_SVG;
  img.style.objectFit = 'contain';
  img.style.background = '#16213d';
  img.alt = 'Photo unavailable';
}
