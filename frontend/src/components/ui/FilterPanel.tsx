import { useState } from 'react';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

/**
 * Advanced filter panel component
 */
interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  filterOptions?: Record<string, FilterOption[]>;
}

const FilterPanel = ({ filters, onFiltersChange, filterOptions }: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClear = () => {
    const clearedFilters: Record<string, string> = {};
    Object.keys(filters).forEach(key => {
      clearedFilters[key] = 'all';
    });
    onFiltersChange(clearedFilters);
    setIsOpen(false);
  };

  const activeCount = Object.values(filters).filter(value => value !== 'all').length;

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
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              {filterOptions && Object.entries(filterOptions).map(([key, options]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <select
                    value={filters[key] || 'all'}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
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
