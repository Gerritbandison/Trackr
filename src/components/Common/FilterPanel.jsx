import { useState } from 'react';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

/**
 * Advanced filter panel component
 */
const FilterPanel = ({ filters, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleApply = () => {
    onApply(activeFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setActiveFilters({});
    onClear();
    setIsOpen(false);
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2"
      >
        <FiFilter size={16} />
        Filters
        {activeCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full font-semibold">
            {activeCount}
          </span>
        )}
        <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-30">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 max-h-96 overflow-y-auto space-y-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) =>
                        setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">All</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) =>
                        setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  ) : filter.type === 'number' ? (
                    <input
                      type="number"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) =>
                        setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                      }
                      placeholder={filter.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) =>
                        setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                      }
                      placeholder={filter.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="btn btn-primary btn-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterPanel;

