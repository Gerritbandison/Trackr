import { useState } from 'react';
import { FiSave, FiBookmark, FiTrash2, FiFilter } from 'react-icons/fi';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import toast from 'react-hot-toast';

/**
 * Saved filters component
 */
const SavedFilters = ({ currentFilters, onApplyFilter, storageKey = 'saved-filters' }) => {
  const [savedFilters, setSavedFilters] = useLocalStorage(storageKey, []);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }

    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    setSavedFilters([...savedFilters, newFilter]);
    setFilterName('');
    setShowSaveDialog(false);
    toast.success('Filter saved successfully');
  };

  const handleDeleteFilter = (id) => {
    setSavedFilters(savedFilters.filter(f => f.id !== id));
    toast.success('Filter deleted');
  };

  const activeFilterCount = Object.values(currentFilters).filter(v => v && v !== '').length;

  return (
    <div className="space-y-3">
      {/* Save current filter button */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          {!showSaveDialog ? (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="btn btn-outline btn-sm flex items-center gap-2"
            >
              <FiSave size={14} />
              Save Current Filter ({activeFilterCount} active)
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filter name..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveFilter();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
              />
              <button
                onClick={handleSaveFilter}
                className="btn btn-primary btn-sm"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Saved filters list */}
      {savedFilters.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FiBookmark size={14} />
            Saved Filters
          </h4>
          <div className="space-y-2">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
              >
                <button
                  onClick={() => onApplyFilter(filter.filters)}
                  className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-primary-600"
                >
                  {filter.name}
                </button>
                <button
                  onClick={() => handleDeleteFilter(filter.id)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedFilters;

