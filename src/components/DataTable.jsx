import { useMemo, useState } from 'react';

const DataTable = ({ columns, data }) => {
  const [sort, setSort] = useState({ index: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (sort.index === null) return data;
    const col = columns[sort.index];
    const getSortValue = (row) => {
      if (col.sortValue) return col.sortValue(row);
      if (col.accessor) return row[col.accessor];
      return '';
    };

    return [...data].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      const aNumber = Number(String(aValue ?? '').replace(/,/g, ''));
      const bNumber = Number(String(bValue ?? '').replace(/,/g, ''));
      const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, data, sort]);

  const toggleSort = (index) => {
    setSort((current) => ({
      index,
      direction: current.index === index && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>
                <button className="table-sort-button" type="button" onClick={() => toggleSort(i)}>
                  <span>{col.header}</span>
                  <span aria-hidden="true">{sort.index === i ? (sort.direction === 'asc' ? 'asc' : 'desc') : 'sort'}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => {
                const value = col.accessor ? row[col.accessor] : col.cell(row);
                return <td key={j}>{value ?? '-'}</td>;
              })}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
