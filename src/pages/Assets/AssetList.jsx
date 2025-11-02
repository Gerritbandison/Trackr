import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiUserPlus, FiPackage, FiGrid, FiSearch
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import SearchBar from '../../components/Common/SearchBar';
import Pagination from '../../components/Common/Pagination';
import Badge, { getStatusVariant, getConditionVariant } from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';
import AssetForm from './AssetForm';
import AssignAssetModal from './AssignAssetModal';

const AssetList = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Fetch assets with stats
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', page, search, statusFilter, categoryFilter],
    queryFn: () => {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      return assetsAPI.getAll(params).then((res) => res.data);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch all assets for category stats (limit to first 500)
  const { data: allAssetsData } = useQuery({
    queryKey: ['all-assets-stats'],
    queryFn: () => assetsAPI.getAll({ limit: 500 }).then((res) => res.data.data),
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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
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

  if (isLoading) return <LoadingSpinner />;

  const { data: assets, pagination } = assetsData;

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
            <div className="text-3xl mb-2">{stat.icon}</div>
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

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets?.map((asset) => (
            <div key={asset._id} className="asset-card">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl">
                  {getCategoryIcon(asset.category)}
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
              {asset.assignedTo ? (
                <Link
                  to={`/users/${asset.assignedTo._id}`}
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
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {assets?.map((asset, index) => (
            <div key={asset._id} className="asset-card">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl">
                  {getCategoryIcon(asset.category)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-600">{asset.manufacturer} {asset.model}</p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
                  <Badge variant={getConditionVariant(asset.condition)}>{asset.condition}</Badge>
                </div>
                {asset.assignedTo ? (
                  <Link
                    to={`/users/${asset.assignedTo._id}`}
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
          ))}
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

// Helper function to get category icon
function getCategoryIcon(category) {
  const icons = {
    laptop: '💻',
    desktop: '🖥️',
    monitor: '📺',
    phone: '📱',
    tablet: '📱',
    dock: '🔌',
    keyboard: '⌨️',
    mouse: '🖱️',
    headset: '🎧',
    webcam: '📹',
    accessory: '🎧',
    other: '📦'
  };
  return icons[category] || '📦';
}

// Helper function to get category color
function getCategoryColor(category) {
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

export default AssetList;

