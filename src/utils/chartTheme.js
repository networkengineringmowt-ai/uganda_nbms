// Shared Apple system-dark chart theme -- used by every ECharts panel across the platform
// so the look stays cohesive as more chart types are added. Keeping this in
// one place means a future palette/style change only happens once, instead
// of drifting between components.

export const chartTextStyle = { color: '#e8fbff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 };
export const NEON_AXIS = '#64d2ff';

export const chartColors = [
  '#64d2ff', // systemCyan
  '#bf5af2', // systemPurple
  '#30d158', // systemGreen
  '#ffd60a', // systemYellow
  '#ff9f0a', // systemOrange
  '#5e5ce6', // systemIndigo
  '#66d4cf', // systemMint
  '#ff375f', // systemPink
  '#0a84ff', // systemBlue
  '#ac8e68', // systemBrown
  '#ff453a', // systemRed
  '#40c8e0', // systemTeal
];

export const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const neonItemStyle = (hex) => ({
  color: {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: hex },
      { offset: 1, color: hexToRgba(hex, 0.28) },
    ],
  },
  shadowBlur: 16,
  shadowColor: hexToRgba(hex, 0.9),
  borderRadius: [6, 6, 0, 0],
});

export const neonEmphasisStyle = (hex) => ({
  itemStyle: {
    shadowBlur: 30,
    shadowColor: hexToRgba(hex, 1),
    color: hex,
  },
});

export const neonToolbox = {
  right: 12,
  top: 4,
  iconStyle: { borderColor: NEON_AXIS },
  emphasis: { iconStyle: { borderColor: '#fff' } },
  feature: {
    saveAsImage: { title: 'Save as image', backgroundColor: '#0b1224' },
    dataView: { title: 'View data', readOnly: true, lang: ['Data view', 'Close', 'Refresh'] },
    restore: { title: 'Reset zoom/view' },
  },
};

export const neonTooltipBase = {
  backgroundColor: 'rgba(10, 18, 36, 0.95)',
  borderColor: NEON_AXIS,
  textStyle: { color: '#e8fbff' },
};

export const chartFieldValue = (row, key) => row[key] ?? row.LegacyData?.[key];

export const countChartField = (rows, key, dictionary, getDictionaryLabel) => rows.reduce((counts, row) => {
  const raw = chartFieldValue(row, key);
  const label = dictionary && getDictionaryLabel ? getDictionaryLabel(dictionary, raw) : (raw || 'Unknown');
  counts[label] = (counts[label] || 0) + 1;
  return counts;
}, {});
