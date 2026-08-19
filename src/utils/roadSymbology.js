export const ROAD_SURFACE_STYLE = {
  paved: {
    color: '#050505',
    weight: 5.2,
    opacity: 0.96,
    lineCap: 'round',
    lineJoin: 'round',
  },
  unpaved: {
    color: '#f2b544',
    weight: 2.2,
    opacity: 0.82,
    dashArray: '2 7',
    lineCap: 'round',
    lineJoin: 'round',
  },
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

  return /bituminous|paved|sealed|asphalt/.test(surface) ? 'paved' : 'unpaved';
};
