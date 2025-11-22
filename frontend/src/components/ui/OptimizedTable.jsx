import { memo, useMemo } from 'react';

/**
 * Optimized table component with React.memo and useMemo
 * Prevents unnecessary re-renders
 */
const OptimizedTable = memo(({ data, columns, onRowClick, isLoading }) => {
  // Memoize rendered rows to prevent re-renders
  const renderedRows = useMemo(() => {
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="text-center py-8 text-gray-500">
            No data available
          </td>
        </tr>
      );
    }

    return data.map((row, index) => (
      <tr
        key={row.id || index}
        onClick={() => onRowClick?.(row)}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {columns.map((column) => (
          <td key={column.key} className="px-4 py-3">
            {column.render ? column.render(row[column.key], row) : row[column.key]}
          </td>
        ))}
      </tr>
    ));
  }, [data, columns, onRowClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {renderedRows}
        </tbody>
      </table>
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

export default OptimizedTable;

