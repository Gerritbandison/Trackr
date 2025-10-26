import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiStar, FiEye, FiEdit, FiTrash2, FiPackage, 
  FiDownload, FiRefreshCw, FiFilter 
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useRecentItems } from '../../hooks/useRecentItems';
import { useFavorites } from '../../hooks/useFavorites';
import LoadingSkeleton from '../../components/Common/LoadingSkeleton';
import BulkActions from '../../components/Common/BulkActions';
import QuickViewModal from '../../components/Common/QuickViewModal';
import Badge from '../../components/Common/Badge';
import toast from 'react-hot-toast';

const EnhancedAssetList = () => {
  const { canManage } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [quickViewAsset, setQuickViewAsset] = useState(null);

  // Hooks
  const debouncedSearch = useDebounce(search, 300);
  const { recentItems, addRecentItem } = useRecentItems('recent-assets', 5);
  const { favorites, isFavorite, toggleFavorite } = useFavorites('favorite-assets');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'n': () => canManage() && navigate('/assets/new'),
    'r': () => queryClient.invalidateQueries(['assets']),
    '/': (e) => {
      e.preventDefault();
      document.getElementById('asset-search')?.focus();
    },
  });

  // Fetch assets
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['assets', page, debouncedSearch, statusFilter, categoryFilter],
    queryFn: () => {
      const params = { page, limit: 50 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      return assetsAPI.getAll(params).then((res) => res.data);
    },
    keepPreviousData: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => assetsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    },
  });

  // Bulk export
  const handleBulkExport = () => {
    const selectedData = assets.filter(a => selectedAssets.includes(a._id));
    // Create CSV
    const csv = [
      ['Name', 'Category', 'Status', 'Serial Number', 'Value'],
      ...selectedData.map(a => [
        a.name,
        a.category,
        a.status,
        a.serialNumber || '',
        a.purchasePrice || 0
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

  // Bulk delete
  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selectedAssets.length} assets? This cannot be undone.`)) {
      return;
    }
    Promise.all(selectedAssets.map(id => deleteMutation.mutateAsync(id)))
      .then(() => {
        setSelectedAssets([]);
        toast.success(`Deleted ${selectedAssets.length} assets`);
      })
      .catch(() => {
        toast.error('Some assets failed to delete');
      });
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

  const handleQuickView = (asset) => {
    setQuickViewAsset(asset);
    addRecentItem({ id: asset._id, name: asset.name, type: 'asset', viewedAt: new Date().toISOString() });
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

  const assets = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) return <LoadingSkeleton type="table" rows={10} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Hardware Assets</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            {pagination?.totalRecords || 0} assets • {selectedAssets.length} selected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn btn-outline btn-sm flex items-center gap-2"
            disabled={isFetching}
          >
            <FiRefreshCw className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canManage() && (
            <button
              onClick={() => navigate('/assets/new')}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiPlus />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Favorites & Recent */}
      {(favorites.length > 0 || recentItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {favorites.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiStar className="text-yellow-500" />
                  Favorites
                </h3>
                <div className="space-y-2">
                  {favorites.slice(0, 3).map(fav => (
                    <Link
                      key={fav.id}
                      to={`/assets/${fav.id}`}
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{fav.name}</p>
                      <p className="text-xs text-gray-500">{fav.category}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {recentItems.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h3 className="font-semibold text-gray-900 mb-3">Recently Viewed</h3>
                <div className="space-y-2">
                  {recentItems.slice(0, 3).map(item => (
                    <Link
                      key={item.id}
                      to={`/assets/${item.id}`}
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.viewedAt).toLocaleString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                id="asset-search"
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && !debouncedSearch && (
                <p className="text-xs text-gray-500 mt-1">Searching...</p>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="repair">In Repair</option>
              <option value="retired">Retired</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="monitor">Monitor</option>
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedAssets.length === assets.length && assets.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Owner</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset._id)}
                        onChange={() => toggleSelectAsset(asset._id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFavorite(asset)}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          <FiStar
                            className={isFavorite(asset._id) ? 'fill-yellow-500 text-yellow-500' : ''}
                            size={16}
                          />
                        </button>
                        <div>
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-500">{asset.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{asset.category}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        asset.status === 'available' ? 'success' :
                        asset.status === 'assigned' ? 'info' :
                        asset.status === 'repair' ? 'warning' : 'default'
                      }>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {asset.assignedTo?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ${(asset.purchasePrice || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickView(asset)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Quick view"
                        >
                          <FiEye size={16} />
                        </button>
                        {canManage() && (
                          <>
                            <Link
                              to={`/assets/${asset._id}/edit`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </Link>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${asset.name}?`)) {
                                  deleteMutation.mutate(asset._id);
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions selectedCount={selectedAssets.length} onAction={handleBulkAction} />

      {/* Quick View Modal */}
      {quickViewAsset && (
        <QuickViewModal
          isOpen={!!quickViewAsset}
          onClose={() => setQuickViewAsset(null)}
          title={quickViewAsset.name}
          detailUrl={`/assets/${quickViewAsset._id}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-900">{quickViewAsset.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={quickViewAsset.status === 'available' ? 'success' : 'info'}>
                  {quickViewAsset.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manufacturer</p>
                <p className="font-semibold text-gray-900">{quickViewAsset.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="font-semibold text-gray-900">{quickViewAsset.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Serial Number</p>
                <p className="font-semibold text-gray-900">{quickViewAsset.serialNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="font-semibold text-gray-900">
                  ${(quickViewAsset.purchasePrice || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </QuickViewModal>
      )}
    </div>
  );
};

export default EnhancedAssetList;

