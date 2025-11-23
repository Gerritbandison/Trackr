import { useState, useMemo, ReactNode } from 'react';
import { FiChevronUp, FiChevronDown, FiChevronsUpDown } from 'react-icons/fi';

/**
 * Sortable table component with column sorting
 */
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface SortableTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  renderRow: (row: any, index: number) => ReactNode;
}

const SortableTable = ({ columns, data, onRowClick, renderRow }: SortableTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <FiChevronsUpDown className="text-gray-400" size={14} />;
    }
    return sortConfig.direction === 'asc' ? (
      <FiChevronUp className="text-primary-600" size={14} />
    ) : (
      <FiChevronDown className="text-primary-600" size={14} />
    );
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`text-left py-3 px-4 text-sm font-semibold text-gray-700 ${
                  column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                }`}
                onClick={() => column.sortable !== false && requestSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable !== false && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-gray-100 ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
              } transition-colors`}
            >
              {renderRow(row, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;

