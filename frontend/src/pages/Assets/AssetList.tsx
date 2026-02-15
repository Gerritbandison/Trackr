import { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiEdit, FiTrash2, FiEye, FiUserPlus, FiPackage, FiGrid, FiSearch,
  FiCheckSquare, FiSquare, FiCheckCircle, FiDownload, FiArchive, FiCommand
} from 'react-icons/fi';
import { getCategoryIcon } from '../../utils/assetCategoryIcons';
import { assetsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { handleError } from '../../utils/errorHandler';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge, { getStatusVariant, getConditionVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import BulkActions from '../../components/ui/BulkActions';
import toast from 'react-hot-toast';
import AssetForm from './AssetForm';
import AssignAssetModal from './AssignAssetModal';
import { useAppStore } from '../../store/useAppStore';

interface Asset {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
  status?: string;
  [key: string]: unknown;
}

interface AssetsData {
  data: Asset[];
  pagination?: {
    current?: number;
    total?: number;
    count?: number;
    totalRecords?: number;
  };
}

const AssetList = () => {
  const { canManage } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const keyboardShortcutsEnabled = useAppStore((state) => state.keyboardShortcutsEnabled);

  // Fetch assets with stats
  const { data: assetsData, isLoading, isError, error, refetch } = useQuery<AssetsData>({
    queryKey: ['assets', page, search, statusFilter, categoryFilter, sortBy, sortOrder],
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = { page, limit: 50 };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        const response = await assetsAPI.getAll(params);

        // Based on other components, API returns: response.data.data for assets array
        // and response.data.pagination for pagination
        const responseData = response.data;

        // Check if response.data.data exists (most common structure)
        if (responseData?.data && Array.isArray(responseData.data)) {
          return {
            data: responseData.data,
            pagination: responseData.pagination || responseData.pagination || {},
          };
        }

        // If response.data is the assets array directly
        if (Array.isArray(responseData)) {
          return {
            data: responseData,
            pagination: {},
          };
        }

        // If response.data has data at top level
        if (responseData?.data && Array.isArray(responseData.data)) {
          return {
            data: responseData.data,
            pagination: responseData.pagination || {},
          };
        }

        // Fallback: return empty
        return { data: [], pagination: {} };
      } catch (err: unknown) {
        handleError(err, {
          customMessage: 'Failed to load assets. Please try again.',
        });
        throw err;
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch all assets for category stats (limit to first 500)
  const { data: allAssetsData } = useQuery<Asset[]>({
    queryKey: ['all-assets-stats'],
    queryFn: () => assetsAPI.getAll({ limit: 500 }).then((res) => res.data.data as Asset[]),
  });

  // Calculate category stats
  const categoryStats = useMemo(() => {
    if (!allAssetsData) return [];

    const categories = ['laptop', 'desktop', 'monitor', 'phone', 'tablet', 'dock', 'keyboard', 'mouse', 'headset', 'webcam', 'accessory', 'other'];
    const stats = [];

    categories.forEach(category => {
      const categoryAssets = allAssetsData.filter(a => a.category === category);
      const available = categoryAssets.filter(a => a.status === 'available').length;
      const assigned = categoryAssets.filter(a => a.status === 'assigned').length;
      const repair = categoryAssets.filter(a => a.status === 'repair').length;

      if (categoryAssets.length > 0) {
        stats.push({
          category,
          total: categoryAssets.length,
          available,
          assigned,
          repair,
          icon: getCategoryIcon(category),
          color: getCategoryColor(category)
        });
      }
    });

    return stats.sort((a, b) => b.total - a.total);
  }, [allAssetsData]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => assetsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['all-assets-stats']);
      toast.success('Asset deleted successfully');
    },
    onError: (error: unknown) => {
      handleError(error, {
        customMessage: 'Failed to delete asset. Please try again.',
      });
    },
  });

  // Bulk status change mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ assetIds, status }: { assetIds: string[]; status: string }) => {
      const promises = assetIds.map((id: string) => assetsAPI.update(id, { status }));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['all-assets-stats']);
      toast.success('Asset statuses updated successfully');
      setSelectedAssets([]);
    },
    onError: (error: unknown) => {
      handleError(error, {
        customMessage: 'Failed to update asset statuses. Please try again.',
      });
    },
  });

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const assets = Array.isArray(assetsData?.data) ? assetsData.data : [];
      
      switch (e.key) {
        case 'j': // Move down
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, assets.length - 1));
          break;
        case 'k': // Move up
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter': // Open focused asset
          if (focusedIndex >= 0 && focusedIndex < assets.length) {
            e.preventDefault();
            navigate(`/assets/${assets[focusedIndex]._id}`);
          }
          break;
        case 'x': // Toggle selection
          if (focusedIndex >= 0 && focusedIndex < assets.length) {
            e.preventDefault();
            toggleSelectAsset(assets[focusedIndex]._id);
          }
          break;
        case 'a': // Select all (with shift)
          if (e.shiftKey) {
            e.preventDefault();
            toggleSelectAll();
          }
          break;
        case 'n': // New asset
          if (canManage() && !showCreateModal) {
            e.preventDefault();
            setShowCreateModal(true);
          }
          break;
        case 'Escape': // Clear selection / close modal
          if (selectedAssets.length > 0) {
            e.preventDefault();
            setSelectedAssets([]);
          }
          setFocusedIndex(-1);
          break;
        case '/': // Focus search
          e.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
          break;
        case '?': // Show keyboard shortcuts
          e.preventDefault();
          setShowKeyboardHelp((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutsEnabled, focusedIndex, assetsData, selectedAssets, showCreateModal, canManage, navigate]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-asset-item]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSelectAsset = (id) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map(a => a._id));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedAssets.length === 0) {
      toast.error('Please select assets first');
      return;
    }

    if (window.confirm(`Change status of ${selectedAssets.length} asset(s) to ${newStatus}?`)) {
      bulkStatusMutation.mutate({ assetIds: selectedAssets, status: newStatus });
    }
  };

  const handleBulkDelete = () => {
    if (selectedAssets.length === 0) return;
    if (window.confirm(`Delete ${selectedAssets.length} asset(s)? This cannot be undone.`)) {
      Promise.all(selectedAssets.map(id => deleteMutation.mutateAsync(id)))
        .then(() => {
          setSelectedAssets([]);
          toast.success(`Deleted ${selectedAssets.length} assets`);
        })
        .catch(() => {
          toast.error('Some assets failed to delete');
        });
    }
  };

  const handleBulkExport = () => {
    const selectedData = assets.filter(a => selectedAssets.includes(a._id));
    const csv = [
      ['Name', 'Category', 'Status', 'Serial Number', 'Asset Tag', 'Value', 'Location'],
      ...selectedData.map(a => [
        a.name,
        a.category,
        a.status,
        a.serialNumber || '',
        a.assetTag || '',
        a.purchasePrice || 0,
        a.location || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-export-${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${selectedData.length} assets`);
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'export':
        handleBulkExport();
        break;
      case 'delete':
        handleBulkDelete();
        break;
      case 'clear':
        setSelectedAssets([]);
        break;
      default:
        break;
    }
  };

  const handleCategoryClick = (category) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  if (isLoading) return <LoadingSkeleton type="assetGrid" rows={8} />;

  // Handle error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card">
          <div className="card-body text-center py-12">
            <FiPackage size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Assets</h3>
            <p className="text-gray-600 mb-4">
              {error?.message || 'Unable to load assets. Please check your connection and try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract assets and pagination from response
  // assetsData should be: { data: [...], pagination: {...} }
  const assets = Array.isArray(assetsData?.data) ? assetsData.data :
    Array.isArray(assetsData) ? assetsData : [];
  const pagination = assetsData?.pagination || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Hardware Assets</h1>
          <p className="text-secondary-600 mt-2">
            Manage your IT hardware inventory and lifecycle
          </p>
        </div>
        <div className="flex items-center gap-3">
          {keyboardShortcutsEnabled && (
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="btn btn-outline btn-sm flex items-center gap-2 text-gray-500"
              title="Keyboard shortcuts (?)"
            >
              <FiCommand size={16} />
              <span className="hidden sm:inline">?</span>
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-outline flex items-center gap-2"
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            <FiGrid size={18} />
          </button>
          {canManage() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <FiPlus size={20} />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <button
          onClick={clearFilters}
          className={`category-card ${!categoryFilter ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-semibold text-sm text-gray-900">All Assets</div>
          <div className="text-xs text-gray-500 mt-1">{pagination?.totalResults || 0} total</div>
        </button>
        {categoryStats.map((stat) => (
          <button
            key={stat.category}
            onClick={() => handleCategoryClick(stat.category)}
            className={`category-card ${categoryFilter === stat.category ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
          >
            <div className="text-3xl mb-2 flex items-center justify-center">
              {(() => {
                const IconComponent = stat.icon;
                return <IconComponent size={32} />;
              })()}
            </div>
            <div className="font-semibold text-sm text-gray-900 capitalize">
              {stat.category === 'other' ? 'Other' : stat.category.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stat.total} devices
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="text-green-600">✓{stat.available}</span>
              <span className="text-blue-600">•{stat.assigned}</span>
              {stat.repair > 0 && <span className="text-orange-600">⚠{stat.repair}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search assets..."
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="purchaseDate">Sort by Purchase Date</option>
                <option value="purchasePrice">Sort by Price</option>
                <option value="status">Sort by Status</option>
                <option value="category">Sort by Category</option>
                <option value="createdAt">Sort by Created Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn btn-outline whitespace-nowrap"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input bg-white"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="repair">In Repair</option>
              <option value="retired">Retired</option>
            </select>
            {(search || statusFilter || categoryFilter) && (
              <button
                onClick={clearFilters}
                className="btn btn-outline whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedAssets.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
              <FiCheckCircle className="text-primary-600 dark:text-primary-400" size={18} />
              <span className="font-semibold text-primary-900 dark:text-primary-200">
                {selectedAssets.length} selected
              </span>
            </div>

            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="btn btn-sm btn-outline"
              >
                <option value="">Change Status</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="repair">Repair</option>
                <option value="retired">Retired</option>
              </select>
              <button
                onClick={() => handleBulkStatusChange('retired')}
                className="btn btn-sm btn-outline flex items-center gap-2"
                title="Archive selected assets"
              >
                <FiArchive size={16} />
                Archive
              </button>
              <button
                onClick={() => handleBulkExport()}
                className="btn btn-sm btn-primary flex items-center gap-2"
              >
                <FiDownload size={16} />
                Export
              </button>
              {canManage() && (
                <button
                  onClick={() => handleBulkDelete()}
                  className="btn btn-sm btn-danger flex items-center gap-2"
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
              )}
            </div>

            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

            <button
              onClick={() => setSelectedAssets([])}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
              title="Clear selection (Esc)"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiCommand size={20} />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Navigate down</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">j</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Navigate up</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">k</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Open asset</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Toggle selection</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">x</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Select all</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Shift+A</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">New asset</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">n</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">Focus search</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Clear selection / Close</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <>
          {canManage() && assets.length > 0 && (
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="btn btn-sm btn-outline flex items-center gap-2"
              >
                {selectedAssets.length === assets.length ? <FiSquare /> : <FiCheckSquare />}
                {selectedAssets.length === assets.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="text-sm text-gray-600">
                Showing {assets.length} of {pagination?.total || pagination?.totalResults || assets.length} assets
              </div>
            </div>
          )}
          <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.isArray(assets) && assets.length > 0 ? assets.map((asset, index) => (
              <div 
                key={asset._id} 
                data-asset-item
                className={`asset-card transition-all ${selectedAssets.includes(asset._id) ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''} ${focusedIndex === index ? 'ring-2 ring-blue-400 shadow-lg scale-[1.02]' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    {canManage() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAsset(asset._id);
                        }}
                        className="mt-1"
                      >
                        {selectedAssets.includes(asset._id) ? (
                          <FiCheckSquare className="text-primary-600" size={20} />
                        ) : (
                          <FiSquare className="text-gray-400" size={20} />
                        )}
                      </button>
                    )}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
                      {(() => {
                        const IconComponent = getCategoryIcon(asset.category);
                        return <IconComponent size={32} />;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/assets/${asset._id}`}
                      className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <FiEye size={16} />
                    </Link>
                    {canManage() && (
                      <>
                        <button
                          onClick={() => setEditingAsset(asset)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        {asset.status === 'available' && (
                          <button
                            onClick={() => setAssigningAsset(asset)}
                            className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Assign"
                          >
                            <FiUserPlus size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {asset.manufacturer} {asset.model}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={getStatusVariant(asset.status)} className="text-xs">
                      {asset.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Condition</span>
                    <Badge variant={getConditionVariant(asset.condition)} className="text-xs">
                      {asset.condition}
                    </Badge>
                  </div>
                </div>
                {asset.assignedTo && typeof asset.assignedTo === 'object' && asset.assignedTo.name ? (
                  <Link
                    to={`/users/${asset.assignedTo._id || asset.assignedTo.id}`}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-3 pt-3 border-t border-gray-100"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                      {asset.assignedTo.name.charAt(0)}
                    </div>
                    {asset.assignedTo.name}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-400 italic mt-3 pt-3 border-t border-gray-100">
                    Unassigned
                  </div>
                )}
              </div>
            )) : null}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {Array.isArray(assets) && assets.length > 0 ? assets.map((asset, index) => (
            <div key={asset._id} className="asset-card">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
                  {(() => {
                    const IconComponent = getCategoryIcon(asset.category);
                    return <IconComponent size={32} />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-600">{asset.manufacturer} {asset.model}</p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
                  <Badge variant={getConditionVariant(asset.condition)}>{asset.condition}</Badge>
                </div>
                {asset.assignedTo && typeof asset.assignedTo === 'object' && asset.assignedTo.name ? (
                  <Link
                    to={`/users/${asset.assignedTo._id || asset.assignedTo.id}`}
                    className="hidden lg:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                      {asset.assignedTo.name.charAt(0)}
                    </div>
                    {asset.assignedTo.name}
                  </Link>
                ) : (
                  <div className="hidden lg:block text-sm text-gray-400 italic">Unassigned</div>
                )}
                <div className="flex items-center gap-1">
                  <Link
                    to={`/assets/${asset._id}`}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <FiEye size={18} />
                  </Link>
                  {canManage() && (
                    <>
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      {asset.status === 'available' && (
                        <button
                          onClick={() => setAssigningAsset(asset)}
                          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Assign"
                        >
                          <FiUserPlus size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(asset._id, asset.name)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )) : null}
        </div>
      )}

      {assets?.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <FiPackage size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or add a new asset</p>
            {canManage() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <FiPlus size={18} className="mr-2" />
                Add First Asset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.total}
          onPageChange={setPage}
        />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAsset) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAsset(null);
          }}
          title={editingAsset ? 'Edit Asset' : 'Create New Asset'}
          size="lg"
        >
          <AssetForm
            asset={editingAsset}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingAsset(null);
              queryClient.invalidateQueries(['assets']);
              queryClient.invalidateQueries(['all-assets-stats']);
            }}
          />
        </Modal>
      )}

      {/* Assign Modal */}
      {assigningAsset && (
        <AssignAssetModal
          asset={assigningAsset}
          onClose={() => setAssigningAsset(null)}
          onSuccess={() => {
            setAssigningAsset(null);
            queryClient.invalidateQueries(['assets']);
            queryClient.invalidateQueries(['all-assets-stats']);
          }}
        />
      )}
    </div>
  );
};

// Note: getCategoryIcon is now imported from utils/assetCategoryIcons.js

// Helper function to get category color
function getCategoryColor(category: string): string {
  const colors = {
    laptop: 'from-blue-500 to-blue-600',
    desktop: 'from-purple-500 to-purple-600',
    monitor: 'from-green-500 to-green-600',
    phone: 'from-pink-500 to-pink-600',
    tablet: 'from-indigo-500 to-indigo-600',
    dock: 'from-yellow-500 to-yellow-600',
    keyboard: 'from-red-500 to-red-600',
    mouse: 'from-orange-500 to-orange-600',
    headset: 'from-teal-500 to-teal-600',
    webcam: 'from-cyan-500 to-cyan-600',
    accessory: 'from-gray-500 to-gray-600',
    other: 'from-slate-500 to-slate-600'
  };
  return colors[category] || 'from-gray-500 to-gray-600';
}

export default memo(AssetList);

