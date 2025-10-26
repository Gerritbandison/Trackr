import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUserPlus, FiPackage } from 'react-icons/fi';
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

  // Fetch assets
  const { data, isLoading } = useQuery({
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

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const { data: assets, pagination } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Hardware Assets</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Comprehensive hardware asset inventory and lifecycle management
          </p>
        </div>
        {canManage() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <FiPlus size={20} />
            Add New Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-secondary-900">Filter & Search</h3>
            <span className="ml-auto text-sm text-secondary-500">
              {pagination?.totalResults || 0} assets found
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search by name, serial, model..."
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input bg-white"
              >
                <option value="">📊 All Status</option>
                <option value="available">✅ Available</option>
                <option value="assigned">👤 Assigned</option>
                <option value="repair">🔧 In Repair</option>
                <option value="retired">📦 Retired</option>
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input bg-white"
              >
                <option value="">🏷️ All Categories</option>
                <option value="laptop">💻 Laptop</option>
                <option value="desktop">🖥️ Desktop</option>
                <option value="monitor">📺 Monitor</option>
                <option value="phone">📱 Phone</option>
                <option value="dock">🔌 Dock</option>
                <option value="accessory">🎧 Accessory</option>
              </select>
            </div>
          </div>
          {(search || statusFilter || categoryFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-secondary-600">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  Search: {search}
                  <button onClick={() => setSearch('')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter('')} className="hover:text-primary-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-transparent">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">Asset Inventory</h3>
          <div className="text-sm text-secondary-600">
            Showing {assets?.length || 0} of {pagination?.totalResults || 0} assets
          </div>
        </div>
        <div className="space-y-0">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="pb-3 px-4">Asset Details</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Serial Number</th>
                <th className="pb-3 px-4">Assigned To</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Condition</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets?.length > 0 ? assets?.map((asset, index) => (
                <tr key={asset._id} className="table-row-bubble animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-sm">
                        {asset.category === 'laptop' && '💻'}
                        {asset.category === 'desktop' && '🖥️'}
                        {asset.category === 'monitor' && '📺'}
                        {asset.category === 'phone' && '📱'}
                        {asset.category === 'dock' && '🔌'}
                        {!['laptop', 'desktop', 'monitor', 'phone', 'dock'].includes(asset.category) && '📦'}
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900">{asset.name}</div>
                        <div className="text-sm text-secondary-500">
                          {asset.manufacturer} {asset.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-secondary-700 font-medium">{asset.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-mono bg-secondary-50 px-2 py-1 rounded text-secondary-700">
                      {asset.serialNumber || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    {asset.assignedTo ? (
                      <Link
                        to={`/users/${asset.assignedTo._id}`}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium group-hover:underline"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                          {asset.assignedTo.name.charAt(0)}
                        </div>
                        {asset.assignedTo.name}
                      </Link>
                    ) : (
                      <span className="text-secondary-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={getStatusVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={getConditionVariant(asset.condition)}>
                      {asset.condition}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/assets/${asset._id}`}
                        className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </Link>
                      {canManage() && (
                        <>
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="p-2 text-secondary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit size={18} />
                          </button>
                          {asset.status === 'available' && (
                            <button
                              onClick={() => setAssigningAsset(asset)}
                              className="p-2 text-secondary-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Assign"
                            >
                              <FiUserPlus size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(asset._id, asset.name)}
                            className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FiPackage size={48} className="text-secondary-300" />
                      <div>
                        <p className="text-lg font-semibold text-secondary-900">No assets found</p>
                        <p className="text-secondary-500">Try adjusting your filters or add a new asset</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 1 && (
          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

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
          }}
        />
      )}
    </div>
  );
};

export default AssetList;

