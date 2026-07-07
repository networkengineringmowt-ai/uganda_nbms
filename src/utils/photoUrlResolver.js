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
