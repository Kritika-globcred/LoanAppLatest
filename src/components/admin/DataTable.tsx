import React from 'react';

interface Column {
  key: string;
  label: string;
  group?: string; // For grouped headers
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  onSelectRow?: (selected: string[]) => void;
  renderCell?: (row: any, col: Column) => React.ReactNode;
  onDeleteRow?: (rowKey: string) => void;
  loading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, onSelectRow, renderCell, onDeleteRow, loading }) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  // Group columns by group label
  const groups: Record<string, Column[]> = {};
  columns.forEach(col => {
    const group = col.group || '';
    if (!groups[group]) groups[group] = [];
    groups[group].push(col);
  });
  const groupKeys = Object.keys(groups);

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      return next;
    });
  };

  React.useEffect(() => {
    if (onSelectRow) onSelectRow(selected);
  }, [selected, onSelectRow]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0 rounded-lg bg-gray-900 shadow-sm">

        <thead className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur">
          {/* Grouped header row */}
          {groupKeys.length > 1 && (
            <tr>
              <th className="w-10 bg-gray-800" />
              {groupKeys.map(group => (
                <th
                  key={group}
                  colSpan={groups[group].length}
                  className="bg-gray-800 text-center px-4 py-3 text-xs font-bold text-muted-foreground border-b border-border"
                >
                  {group || ''}
                </th>
              ))}
            </tr>
          )}
          {/* Column header row */}
          <tr>
            <th className="w-10 bg-gray-800">
              {(() => {
                const masterCheckboxRef = React.useRef<HTMLInputElement>(null);
                React.useEffect(() => {
                  if (masterCheckboxRef.current) {
                    masterCheckboxRef.current.indeterminate = selected.length > 0 && selected.length < data.length;
                  }
                }, [selected, data]);
                return (
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={e => {
                      if (selected.length === data.length) {
                        setSelected([]);
                        onSelectRow?.([]);
                      } else {
                        const allIds = data.map(row => row.id || row.key);
                        setSelected(allIds);
                        onSelectRow?.(allIds);
                      }
                    }}
                    className="accent-primary rounded border-muted focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Select all rows"
                  />
                );
              })()}

            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className="bg-gray-800 px-4 py-3 text-xs font-semibold text-white border-b border-border whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900">
          {data.map((row, idx) => {
            const rowKey = row.user_userId || row.id || row.key || idx;
            return (
              <tr
                key={rowKey}
                className={`transition-colors hover:bg-accent/40 ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}`}
              >
                <td className="px-4 py-3 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={selected.includes(rowKey)}
                    onChange={() => handleSelect(rowKey)}
                    className="accent-primary rounded border-muted focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </td>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-4 py-3 align-middle text-white border-b border-border whitespace-nowrap"
                  >
                    {renderCell && typeof renderCell === 'function'
                      ? renderCell(row, col)
                      : (React.isValidElement(row[col.key]) ? row[col.key] : row[col.key] ?? '')}
                  </td>
                ))}
                {/* Delete button column */}
                <td className="px-4 py-3 align-middle text-center border-b border-border">
                  <button
                    className="text-red-500 hover:text-red-700"
                    title="Delete this customer"
                    onClick={() => onDeleteRow && onDeleteRow(rowKey)}
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
