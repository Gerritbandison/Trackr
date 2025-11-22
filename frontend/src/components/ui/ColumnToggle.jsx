import { useState } from 'react';
import { FiColumns, FiCheck } from 'react-icons/fi';
import { useLocalStorage } from '../../hooks/useLocalStorage';

/**
 * Column visibility toggle component
 */
const ColumnToggle = ({ columns, storageKey = 'visible-columns' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useLocalStorage(
    storageKey,
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline btn-sm flex items-center gap-2"
      >
        <FiColumns size={16} />
        Columns ({visibleCount}/{columns.length})
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900">Show Columns</h4>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {columns.map((column) => (
                <button
                  key={column.key}
                  onClick={() => toggleColumn(column.key)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      visibleColumns[column.key]
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {visibleColumns[column.key] && (
                      <FiCheck className="text-white" size={14} />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{column.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnToggle;

