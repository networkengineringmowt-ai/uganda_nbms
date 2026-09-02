// Small, dependency-free CSV export + print helpers shared by the
// per-page utility bar (back / scroll-to-top / export) across every shell.

// Structure records carry raw source-spreadsheet metadata alongside the
// real engineering data: who inspected/checked a record, which firm did
// the work, and which source workbook/sheet/row it was imported from.
// None of that belongs in an export a user can download -- this mirrors
// the CONFIDENTIAL_FIELD_PATTERN already used to keep the same fields out
// of the statistics pipeline (see utils/statistics.js), plus a few
// export-only exclusions for internal ids and source-file references that
// numeric stats never touch anyway. "Unnamed: NN" columns are blank
// leftover artifacts from the original spreadsheet import, not real data.
const EXPORT_EXCLUDE_PATTERN = /inspector|checked.?by|firm\b|surveyor|engineer|^_id$|^file$|m.?film|source_workbook|source_sheet|source_row|^unnamed/i;

const escapeCsvValue = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return /[",\n]/.test(str) ? `"${str}"` : str;
};

export function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return false;

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!EXPORT_EXCLUDE_PATTERN.test(key)) set.add(key);
      });
      return set;
    }, new Set())
  );

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row?.[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportStructuresCSV(bridges = [], culverts = []) {
  const stamp = new Date().toISOString().slice(0, 10);
  const rows = [
    ...bridges.map((b) => ({ Type: 'Bridge', ...b })),
    ...culverts.map((c) => ({ Type: 'Culvert', ...c })),
  ];
  return downloadCSV(`uganda-nbms-structures-${stamp}.csv`, rows);
}

export function printCurrentPage() {
  window.print();
}
