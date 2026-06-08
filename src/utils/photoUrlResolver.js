/**
 * Dynamically resolves the URL of structure photos.
 * In development mode, files are served from the local public directory.
 * In production mode (deployed to GitHub Pages), files are loaded directly from the raw GitHub URL
 * to avoid packaging the 140MB+ photos database in the deployed static folder.
 */
export function getPhotoUrl(photo) {
  if (!photo) return '';
  const filename = photo.filename;
  if (!filename) return photo.url || '';
  
  if (import.meta.env.DEV) {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBaseUrl}gallery/images/${filename}`;
  }
  
  // Production fallback: raw content from the main branch on GitHub
  return `https://raw.githubusercontent.com/priscananjehe1996/uganda_bms/main/public/gallery/images/${filename}`;
}
