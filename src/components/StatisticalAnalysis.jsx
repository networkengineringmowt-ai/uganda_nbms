import { useMemo, useState } from 'react';
import { Sigma, GitBranch, Layers3, ChevronDown, ChevronRight } from 'lucide-react';
import DataTable from './DataTable';
import {
  detectNumericFields,
  describeAllFields,
  allPairwiseCorrelations,
  simpleLinearRegression,
  allOneWayAnovas,
} from '../utils/statistics';
import { humanizeFieldName } from '../utils/dataDictionary';

// Full descriptive + inferential statistics for one dataset (bridges or
// culverts), computed live from whatever rows are currently loaded — nothing
// here is pre-baked. Presented as sortable tables (the app's existing
// DataTable component) rather than charts, per house style: charts live on
// the Overview dashboard, Analytics is tables and formulas.
//
// Numeric-field auto-detection also keeps any personal/confidential text
// fields (inspector, checked-by, etc.) out of scope automatically, since
// those never parse as numeric.

const fmt = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '-∞';
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
};

const fmtP = (p) => {
  if (p === null || p === undefined || Number.isNaN(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
};

const sigStars = (p) => {
  if (p === null || p === undefined || Number.isNaN(p)) return '—';
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  return 'n.s.';
};

// Column helper: numeric field shown formatted, sorted on the raw value.
const numCol = (header, key, digits = 2) => ({
  header,
  cell: (row) => fmt(row[key], digits),
  sortValue: (row) => row[key],
});

function Section({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="stat-section">
      <button className="stat-section-header" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Icon size={16} />
        <span className="stat-section-title">{title}</span>
        {subtitle && <span className="stat-section-subtitle">{subtitle}</span>}
      </button>
      {open && <div className="stat-section-body">{children}</div>}
    </div>
  );
}

export default function StatisticalAnalysis({ rows, label, groupFields }) {
  const numericFields = useMemo(() => detectNumericFields(rows || []), [rows]);

  const descriptive = useMemo(
    () => describeAllFields(rows || [], numericFields),
    [rows, numericFields]
  );

  // Two fields that are the same underlying value under two names (e.g. a
  // GIS-derived alias column) correlate at r=1 by construction. That is a
  // tautology, not an inferential finding, and produces meaningless,
  // wildly inflated t-statistics — so those pairs are set aside rather
  // than reported as "significant". Nothing is hidden: the count of
  // excluded duplicate-field pairs is shown in the section subtitle.
  const DUPLICATE_R_THRESHOLD = 0.999999;

  const { correlations, duplicateFieldPairCount } = useMemo(() => {
    const all = allPairwiseCorrelations(rows || [], numericFields)
      .filter((c) => c.n >= 10 && Number.isFinite(c.r));
    const genuine = [];
    let duplicates = 0;
    all.forEach((c) => {
      if (Math.abs(c.r) >= DUPLICATE_R_THRESHOLD) duplicates += 1;
      else genuine.push(c);
    });
    genuine.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    return { correlations: genuine, duplicateFieldPairCount: duplicates };
  }, [rows, numericFields]);

  const correlationRows = useMemo(() => {
    return correlations.map((c) => {
      const reg = c.p < 0.05 ? simpleLinearRegression(rows || [], c.keyA, c.keyB) : null;
      // Humanize the raw snake_case field keys wherever they're rendered as
      // a label, here included, rather than leaking source column names.
      return {
        ...c,
        r2: c.r * c.r,
        equation: reg ? `${humanizeFieldName(c.keyB)} = ${fmt(reg.intercept)} + ${fmt(reg.slope)} × ${humanizeFieldName(c.keyA)}` : '—',
      };
    });
  }, [correlations, rows]);

  const validGroupFields = useMemo(
    () => (groupFields || []).filter((g) => (rows || []).some((r) => r && r[g.key] !== undefined && r[g.key] !== null && r[g.key] !== '')),
    [rows, groupFields]
  );

  const anovas = useMemo(() => {
    const all = allOneWayAnovas(rows || [], numericFields, validGroupFields.map((g) => g.key))
      .filter((a) => Number.isFinite(a.p));
    return all.sort((a, b) => a.p - b.p);
  }, [rows, numericFields, validGroupFields]);

  const groupLabel = (key) => (validGroupFields.find((g) => g.key === key) || {}).label || key;

  const anovaRows = useMemo(() => anovas.map((a) => ({
    ...a,
    groupLabel: groupLabel(a.groupKey),
    groupMeans: a.groups.map((g) => `${g.label}: ${fmt(g.mean)} (n=${g.n})`).join(' · '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [anovas]);

  const descriptiveColumns = useMemo(() => [
    // Raw snake_case source keys (aadt_2025, pave_age, ...) are humanized for
    // display -- this only relabels the field name, it never decodes values.
    { header: 'Field', cell: (r) => humanizeFieldName(r.field), sortValue: (r) => r.field },
    numCol('n', 'n', 0),
    numCol('Missing', 'missing', 0),
    numCol('Mean', 'mean'),
    numCol('Median', 'median'),
    numCol('Mode', 'mode'),
    numCol('Min', 'min'),
    numCol('Max', 'max'),
    numCol('Range', 'range'),
    numCol('Std dev', 'stdev'),
    numCol('Std err', 'stderr'),
    numCol('CV %', 'cv'),
    numCol('P10', 'p10'),
    numCol('Q1', 'q1'),
    numCol('Q3', 'q3'),
    numCol('P90', 'p90'),
    numCol('P95', 'p95'),
    numCol('IQR', 'iqr'),
    numCol('Skewness', 'skewness'),
    numCol('Kurtosis (excess)', 'kurtosisExcess'),
    {
      header: '95% CI of mean',
      cell: (r) => (Number.isFinite(r.ciLow95) ? `[${fmt(r.ciLow95)}, ${fmt(r.ciHigh95)}]` : '—'),
      sortValue: (r) => r.mean,
    },
  ], []);

  const correlationColumns = useMemo(() => [
    { header: 'Field A', cell: (r) => humanizeFieldName(r.keyA), sortValue: (r) => r.keyA },
    { header: 'Field B', cell: (r) => humanizeFieldName(r.keyB), sortValue: (r) => r.keyB },
    numCol('n', 'n', 0),
    numCol('r', 'r', 3),
    numCol('R²', 'r2', 3),
    numCol('t', 't'),
    numCol('df', 'df', 0),
    { header: 'p', cell: (r) => fmtP(r.p), sortValue: (r) => r.p },
    { header: 'Sig.', cell: (r) => sigStars(r.p), sortValue: (r) => r.p },
    { header: 'Regression (B = a + b·A)', cell: (r) => r.equation, sortValue: (r) => r.equation },
  ], []);

  const anovaColumns = useMemo(() => [
    { header: 'Numeric field', cell: (r) => humanizeFieldName(r.numericKey), sortValue: (r) => r.numericKey },
    { header: 'Grouped by', cell: (r) => r.groupLabel, sortValue: (r) => r.groupLabel },
    numCol('Groups (k)', 'k', 0),
    numCol('n', 'n', 0),
    numCol('F', 'f'),
    numCol('df1', 'df1', 0),
    numCol('df2', 'df2', 0),
    { header: 'p', cell: (r) => fmtP(r.p), sortValue: (r) => r.p },
    { header: 'Sig.', cell: (r) => sigStars(r.p), sortValue: (r) => r.p },
    numCol('η² (effect size)', 'etaSquared', 3),
    { header: 'Group means', cell: (r) => r.groupMeans, sortValue: (r) => r.groupMeans },
  ], []);

  if (!rows || !rows.length) return null;

  return (
    <section className="statistical-analysis glass-card">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Statistical analysis</span>
          <h2>{label} — Descriptive &amp; Inferential Statistics</h2>
        </div>
        <span className="stat-meta">{numericFields.length} numeric fields · {rows.length} records</span>
      </div>

      <Section icon={Sigma} title="Descriptive statistics" subtitle={`${descriptive.length} fields`} defaultOpen>
        <DataTable columns={descriptiveColumns} data={descriptive} />
      </Section>

      <Section
        icon={GitBranch}
        title="Correlations (Pearson r) & simple linear regression"
        subtitle={`${correlationRows.length} pairs tested · ${correlationRows.filter((c) => c.p < 0.05).length} significant (p<0.05)${duplicateFieldPairCount ? ` · ${duplicateFieldPairCount} duplicate-field pair${duplicateFieldPairCount === 1 ? '' : 's'} excluded` : ''}`}
      >
        <DataTable columns={correlationColumns} data={correlationRows} />
      </Section>

      <Section
        icon={Layers3}
        title="One-way ANOVA (numeric field across groups)"
        subtitle={`${anovaRows.length} tests · grouped by ${validGroupFields.map((g) => g.label).join(', ') || '—'}`}
      >
        <DataTable columns={anovaColumns} data={anovaRows} />
      </Section>
    </section>
  );
}
