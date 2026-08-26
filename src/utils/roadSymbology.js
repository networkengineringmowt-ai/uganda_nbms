// Road symbology: color + zoom-adaptive line weight so the network reads as
// a legible road network at country scale instead of a solid block, while
// still thickening naturally as the user zooms in.

export const ROAD_SURFACE_COLOR = {
  paved: '#0a0a0a',
  unpaved: '#f2b544',
};

// Weight lookup by integer zoom level (Leaflet zooms are typically 3–18 here).
// Values are intentionally thin at the country-wide default zoom (7) and
// scale up gradually so district-level zoom still reads clearly.
const WEIGHT_BY_ZOOM = {
  paved: { 5: 0.9, 6: 1.0, 7: 1.2, 8: 1.5, 9: 1.9, 10: 2.3, 11: 2.7, 12: 3.1, 13: 3.6, 14: 4.1, 15: 4.6 },
  unpaved: { 5: 0.6, 6: 0.7, 7: 0.85, 8: 1.05, 9: 1.3, 10: 1.55, 11: 1.85, 12: 2.15, 13: 2.5, 14: 2.85, 15: 3.2 },
};

const clampZoom = (zoom) => Math.max(5, Math.min(15, Math.round(zoom)));

export const weightForZoom = (kind, zoom = 7) => {
  const table = WEIGHT_BY_ZOOM[kind] || WEIGHT_BY_ZOOM.unpaved;
  return table[clampZoom(zoom)] ?? table[7];
};

// Zoom-aware Leaflet path style for a given surface kind.
export const getRoadStyle = (kind, zoom = 7) => ({
  color: kind === 'paved' ? ROAD_SURFACE_COLOR.paved : ROAD_SURFACE_COLOR.unpaved,
  weight: weightForZoom(kind, zoom),
  opacity: kind === 'paved' ? 0.92 : 0.85,
  dashArray: kind === 'paved' ? undefined : '2 6',
  lineCap: 'round',
  lineJoin: 'round',
});

// Static fallback (used by simpler, non-zoom-reactive map views) — matches
// the style at the default country-wide zoom (7).
export const ROAD_SURFACE_STYLE = {
  paved: getRoadStyle('paved', 7),
  unpaved: getRoadStyle('unpaved', 7),
};

export const getRoadSurface = (props = {}) => {
  const surface = String(
    props.Surface__1 ||
    props.Surface_Type ||
    props.Surface__T ||
    props.surface_type ||
    props.SURFACE ||
    ''
  ).trim().toLowerCase();

  // Check unpaved keywords first: "unsealed" contains "sealed" as a substring,
  // so a naive paved-only regex was previously misclassifying the majority of
  // gravel/earth roads as paved. Explicit unpaved check first avoids that.
  if (/unsealed|unpaved|gravel|earth|murram/.test(surface)) return 'unpaved';
  return /bituminous|paved|sealed|asphalt/.test(surface) ? 'paved' : 'unpaved';
};
