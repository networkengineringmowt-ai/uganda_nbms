// Exhaustive descriptive + inferential statistics, computed live from the
// actual dataset in the browser (nothing pre-baked/fabricated). Used by the
// Statistical Analysis panels in AnalyticsDashboard.
//
// Only genuinely numeric fields are ever analysed here — as a side effect
// that automatically keeps any personal/confidential text fields (inspector
// names, "checked by", firm, etc.) out of the numeric-stats pipeline. An
// explicit name-pattern block below is a second, independent safeguard.

const CONFIDENTIAL_FIELD_PATTERN = /inspector|checked.?by|firm\b|funder|owner|engineer|surveyor|contractor|^name$|_name$/i;

const toNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Field detection
// ---------------------------------------------------------------------------

// Auto-detect which fields in a row set are "numeric enough" to analyse:
// at least `minCount` non-blank values, and at least `minCoverage` of the
// non-blank values must parse as numbers.
export function detectNumericFields(rows, { minCoverage = 0.8, minCount = 5 } = {}) {
  if (!rows || !rows.length) return [];
  const keys = new Set();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => keys.add(k)));

  const fields = [];
  keys.forEach((key) => {
    if (CONFIDENTIAL_FIELD_PATTERN.test(key)) return;
    let nonBlank = 0;
    let numeric = 0;
    for (const r of rows) {
      const raw = r ? r[key] : undefined;
      if (raw === null || raw === undefined || raw === '') continue;
      nonBlank += 1;
      if (toNumber(raw) !== null) numeric += 1;
    }
    if (nonBlank === 0) return;
    if (numeric >= minCount && numeric / nonBlank >= minCoverage) fields.push(key);
  });
  return fields.sort((a, b) => a.localeCompare(b));
}

export function fieldValues(rows, key) {
  return (rows || [])
    .map((r) => (r ? toNumber(r[key]) : null))
    .filter((v) => v !== null);
}

// ---------------------------------------------------------------------------
// Core descriptive math
// ---------------------------------------------------------------------------

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => (xs.length ? sum(xs) / xs.length : NaN);

export function median(xs) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mode(xs) {
  if (!xs.length) return NaN;
  const counts = new Map();
  xs.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  let best = xs[0];
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) { best = value; bestCount = count; }
  });
  return bestCount > 1 ? best : NaN; // no meaningful mode if all values unique
}

// Percentile via linear interpolation (the common "R type 7" method).
export function percentile(xs, p) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const rank = (p / 100) * (s.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (rank - lo);
}

export function variance(xs) { // sample variance (n-1)
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return sum(xs.map((v) => (v - m) ** 2)) / (xs.length - 1);
}

export const stdev = (xs) => Math.sqrt(variance(xs));
export const stderr = (xs) => stdev(xs) / Math.sqrt(xs.length);

export function skewness(xs) { // sample (Fisher-Pearson, bias-adjusted)
  const n = xs.length;
  if (n < 3) return NaN;
  const m = mean(xs);
  const sd = stdev(xs);
  if (!sd) return NaN;
  const g1 = (sum(xs.map((v) => ((v - m) / sd) ** 3))) / n;
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
}

export function kurtosisExcess(xs) { // sample excess kurtosis, bias-adjusted
  const n = xs.length;
  if (n < 4) return NaN;
  const m = mean(xs);
  const sd = stdev(xs);
  if (!sd) return NaN;
  const m4 = sum(xs.map((v) => ((v - m) / sd) ** 4)) / n;
  return ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * m4 - 3 * (n - 1)) + 3 - 3;
}

// ---------------------------------------------------------------------------
// Regularized incomplete beta function (Numerical Recipes' betai), used to
// derive exact p-values for the t-distribution (correlation/regression
// significance) and F-distribution (ANOVA) without any external stats
// library.
// ---------------------------------------------------------------------------

function logGamma(x) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(x, a, b) {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta I_x(a, b)
export function betainc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// Two-tailed p-value for a t-statistic with `df` degrees of freedom.
export function tTestPValue(t, df) {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return betainc(x, df / 2, 0.5);
}

// Upper-tail p-value for an F-statistic (used by one-way ANOVA).
export function fTestPValue(f, df1, df2) {
  if (!Number.isFinite(f) || f < 0 || df1 <= 0 || df2 <= 0) return NaN;
  const x = (df1 * f) / (df1 * f + df2);
  return 1 - betainc(x, df1 / 2, df2 / 2);
}

// ---------------------------------------------------------------------------
// Descriptive summary for one field
// ---------------------------------------------------------------------------

export function describeField(rows, key) {
  const totalNonBlank = (rows || []).filter((r) => {
    const raw = r ? r[key] : undefined;
    return raw !== null && raw !== undefined && raw !== '';
  }).length;
  const xs = fieldValues(rows, key);
  const n = xs.length;
  if (n === 0) {
    return { field: key, n: 0, missing: totalNonBlank === 0 ? (rows || []).length : totalNonBlank };
  }
  const m = mean(xs);
  const sd = stdev(xs);
  const se = stderr(xs);
  const q1 = percentile(xs, 25);
  const q3 = percentile(xs, 75);
  return {
    field: key,
    n,
    missing: (rows || []).length - n,
    mean: m,
    median: median(xs),
    mode: mode(xs),
    min: Math.min(...xs),
    max: Math.max(...xs),
    range: Math.max(...xs) - Math.min(...xs),
    variance: variance(xs),
    stdev: sd,
    stderr: se,
    cv: m !== 0 ? (sd / Math.abs(m)) * 100 : NaN,
    p10: percentile(xs, 10),
    q1,
    q3,
    p90: percentile(xs, 90),
    p95: percentile(xs, 95),
    iqr: q3 - q1,
    skewness: skewness(xs),
    kurtosisExcess: kurtosisExcess(xs),
    ciLow95: n > 1 ? m - 1.96 * se : NaN,
    ciHigh95: n > 1 ? m + 1.96 * se : NaN,
  };
}

export function describeAllFields(rows, fields) {
  return fields.map((f) => describeField(rows, f));
}

// ---------------------------------------------------------------------------
// Inferential: pairwise Pearson correlation + significance
// ---------------------------------------------------------------------------

export function pearsonCorrelation(rows, keyA, keyB) {
  const pairs = [];
  (rows || []).forEach((r) => {
    if (!r) return;
    const a = toNumber(r[keyA]);
    const b = toNumber(r[keyB]);
    if (a !== null && b !== null) pairs.push([a, b]);
  });
  const n = pairs.length;
  if (n < 4) return { keyA, keyB, n, r: NaN, p: NaN };

  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return { keyA, keyB, n, r: NaN, p: NaN };
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const denom = Math.max(1e-12, 1 - r * r);
  const t = r * Math.sqrt(df / denom);
  const p = tTestPValue(t, df);
  return { keyA, keyB, n, r, t, df, p };
}

export function allPairwiseCorrelations(rows, fields) {
  const out = [];
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      out.push(pearsonCorrelation(rows, fields[i], fields[j]));
    }
  }
  return out;
}

// Simple linear regression y = a + b*x, derived from the same summary stats
// used for correlation (so R² and the slope's p-value stay consistent with
// the correlation test above).
export function simpleLinearRegression(rows, keyX, keyY) {
  const corr = pearsonCorrelation(rows, keyX, keyY);
  if (!Number.isFinite(corr.r)) return { ...corr, slope: NaN, intercept: NaN, r2: NaN };
  const xs = fieldValues(rows, keyX);
  const ys = fieldValues(rows, keyY);
  // Recompute on paired rows (not the marginal arrays) for correctness.
  const pairs = [];
  (rows || []).forEach((r) => {
    if (!r) return;
    const a = toNumber(r[keyX]);
    const b = toNumber(r[keyY]);
    if (a !== null && b !== null) pairs.push([a, b]);
  });
  const px = pairs.map((p) => p[0]);
  const py = pairs.map((p) => p[1]);
  const mx = mean(px);
  const my = mean(py);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < px.length; i++) {
    sxy += (px[i] - mx) * (py[i] - my);
    sxx += (px[i] - mx) ** 2;
  }
  const slope = sxx !== 0 ? sxy / sxx : NaN;
  const intercept = my - slope * mx;
  return { ...corr, slope, intercept, r2: corr.r * corr.r, xs, ys };
}

// ---------------------------------------------------------------------------
// Inferential: one-way ANOVA (numeric field grouped by a categorical field)
// ---------------------------------------------------------------------------

export function oneWayAnova(rows, numericKey, groupKey) {
  const groups = new Map();
  (rows || []).forEach((r) => {
    if (!r) return;
    const g = r[groupKey];
    const v = toNumber(r[numericKey]);
    if (g === null || g === undefined || g === '' || v === null) return;
    const label = String(g);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(v);
  });

  const groupList = Array.from(groups.entries()).filter(([, vs]) => vs.length >= 2);
  const k = groupList.length;
  const n = groupList.reduce((acc, [, vs]) => acc + vs.length, 0);
  if (k < 2 || n <= k) {
    return { numericKey, groupKey, k, n, f: NaN, df1: NaN, df2: NaN, p: NaN, etaSquared: NaN, groups: groupList.map(([label, vs]) => ({ label, n: vs.length, mean: mean(vs) })) };
  }

  const allValues = groupList.flatMap(([, vs]) => vs);
  const grandMean = mean(allValues);

  let ssBetween = 0;
  let ssWithin = 0;
  groupList.forEach(([, vs]) => {
    const gm = mean(vs);
    ssBetween += vs.length * (gm - grandMean) ** 2;
    ssWithin += sum(vs.map((v) => (v - gm) ** 2));
  });
  const ssTotal = ssBetween + ssWithin;
  const df1 = k - 1;
  const df2 = n - k;
  const msBetween = ssBetween / df1;
  const msWithin = df2 > 0 ? ssWithin / df2 : NaN;

  // Edge case: zero within-group variance. If the groups also have zero
  // between-group variance, there's simply no variation anywhere (F=0,
  // p=1 — no evidence of a difference). If the groups differ but each is
  // perfectly uniform internally, that's a perfect (infinite-F) separation.
  let f;
  let p;
  if (msWithin > 0) {
    f = msBetween / msWithin;
    p = fTestPValue(f, df1, df2);
  } else if (msBetween > 0) {
    f = Infinity;
    p = 0;
  } else {
    f = 0;
    p = 1;
  }
  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : NaN;

  return {
    numericKey,
    groupKey,
    k,
    n,
    f,
    df1,
    df2,
    p,
    etaSquared,
    groups: groupList
      .map(([label, vs]) => ({ label, n: vs.length, mean: mean(vs), stdev: stdev(vs) }))
      .sort((a, b) => b.n - a.n),
  };
}

export function allOneWayAnovas(rows, numericFields, groupFields) {
  const out = [];
  numericFields.forEach((numericKey) => {
    groupFields.forEach((groupKey) => {
      out.push(oneWayAnova(rows, numericKey, groupKey));
    });
  });
  return out;
}
