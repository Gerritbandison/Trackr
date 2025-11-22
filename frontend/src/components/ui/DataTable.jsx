import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

/**
 * Advanced data table with pagination, sorting, and selection
 */
const DataTable = ({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  onSort,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  emptyState,
  rowClassName,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    const direction =
      sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: columnKey, direction });
    if (onSort) onSort(columnKey, direction);
  };

  if (isLoading) {
    return <LoadingSkeleton type="table" rows={10} />;
  }

  if (!data || data.length === 0) {
    return emptyState || <EmptyState />;
  }

  const totalPages = pagination?.total || 1;
  const currentPage = pagination?.current || 1;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
              {onSelectAll && (
                <th className="py-4 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer transition-all"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-slate-100/50 hover:text-primary-600 transition-colors' : ''
                    }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortConfig.key === column.key && (
                      <span className="text-primary-500">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr
                key={row._id || index}
                className={`hover:bg-slate-50/80 transition-all duration-200 ${rowClassName ? rowClassName(row) : ''
                  }`}
              >
                {onSelectRow && (
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row._id)}
                      onChange={() => onSelectRow(row._id)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer transition-all"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="py-4 px-4 text-sm text-slate-700 font-medium">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * (pagination.count || 0)) + 1} to{' '}
            {Math.min(currentPage * (pagination.count || 0), pagination.totalRecords || 0)} of{' '}
            {pagination.totalRecords || 0} results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <FiChevronsLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <FiChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg font-medium text-sm ${pageNum === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <FiChevronRight size={18} />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <FiChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

