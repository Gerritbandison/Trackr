import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiLayers, FiAlertCircle } from 'react-icons/fi';
import { assetGroupsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AssetGroupList = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  // Fetch asset groups
  const { data: groups, isLoading } = useQuery({
    queryKey: ['asset-groups'],
    queryFn: () => assetGroupsAPI.getAll().then((res) => res.data.data),
  });

  // Fetch low stock alerts
  const { data: lowStockAlerts } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => assetGroupsAPI.getLowStockAlerts().then((res) => res.data.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => assetGroupsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['asset-groups']);
      toast.success('Asset group deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset group');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Asset Groups</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Smart grouping and bulk management of assets
          </p>
        </div>
        {canManage() && (
          <Link
            to="/asset-groups/new"
            className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <FiPlus size={20} />
            Create Asset Group
          </Link>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500">
          <div className="card-body">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-4">
              <FiAlertCircle />
              Low Stock Alerts ({lowStockAlerts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.map((alert) => (
                <div key={alert.groupId} className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-gray-900">{alert.group}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Only {alert.availableCount} available (threshold: {alert.threshold})
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    alert.severity === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="card">
        <div className="card-body">
          {!groups || groups.length === 0 ? (
            <div className="text-center py-12">
              <FiLayers className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">No asset groups created yet</p>
              {canManage() && (
                <Link to="/asset-groups/new" className="btn btn-primary inline-flex items-center gap-2">
                  <FiPlus />
                  Create Your First Asset Group
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <FiLayers className="text-primary-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {group.assetCount} asset{group.assetCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  )}

                  {/* Criteria */}
                  <div className="space-y-2 mb-4">
                    {group.criteria.category && (
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Category:</span> {group.criteria.category}
                      </div>
                    )}
                    {group.criteria.manufacturer && (
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Manufacturer:</span> {group.criteria.manufacturer}
                      </div>
                    )}
                    {group.criteria.status && (
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Status:</span> {group.criteria.status}
                      </div>
                    )}
                  </div>

                  {/* Alerts */}
                  {group.alerts.lowStockEnabled && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-4">
                      <p className="text-xs text-orange-800">
                        🔔 Low stock alert at {group.alerts.lowStockThreshold} units
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <Link
                      to={`/asset-groups/${group._id}`}
                      className="flex-1 btn btn-outline text-sm flex items-center justify-center gap-2"
                    >
                      <FiEye size={16} />
                      View
                    </Link>
                    {canManage() && (
                      <>
                        <Link
                          to={`/asset-groups/${group._id}/edit`}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <FiEdit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(group._id, group.name)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetGroupList;

