import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiLayers, FiAlertCircle, FiArrowLeft, FiZap, FiPackage } from 'react-icons/fi';
import { assetGroupsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';
import AssetGroupForm from './AssetGroupForm';
import AssetGroupDetails from './AssetGroupDetails';
import AutoGenerateGroups from './AutoGenerateGroups';
import { getCategoryIcon, getStatusIcon, getManufacturerIcon } from '../../utils/assetCategoryIcons';
import toast from 'react-hot-toast';

const AssetGroupList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Check if creating new or viewing/editing
  const isNewGroup = location.pathname === '/asset-groups/new';
  const isViewingOrEditing = id && location.pathname.startsWith('/asset-groups/') && location.pathname !== '/asset-groups/new';
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);

  // Fetch asset groups (only fetch when not viewing/editing)
  const { data: groups, isLoading } = useQuery({
    queryKey: ['asset-groups'],
    queryFn: () => assetGroupsAPI.getAll().then((res) => res.data.data),
    enabled: !isViewingOrEditing && !isNewGroup,
  });

  // Fetch low stock alerts (only fetch when not viewing/editing)
  const { data: lowStockAlerts } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => assetGroupsAPI.getLowStockAlerts().then((res) => res.data.data),
    enabled: !isViewingOrEditing && !isNewGroup,
  });

  // Delete mutation - MUST be before any conditional returns
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

  // If viewing/editing a specific group, show AssetGroupDetails
  // MUST be after all hooks are called
  if (isViewingOrEditing) {
    return <AssetGroupDetails />;
  }

  // If creating new group, show form
  if (isNewGroup) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 lg:p-8 backdrop-blur-sm">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-full blur-3xl -mr-32 -mt-32 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/30 to-purple-100/20 rounded-full blur-3xl -ml-24 -mb-24 animate-float" style={{animationDelay: '1s'}}></div>
          
          <div className="relative flex items-center gap-5">
            <button
              onClick={() => navigate('/asset-groups')}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all hover:scale-110 hover:shadow-lg active:scale-95 group"
            >
              <FiArrowLeft size={22} className="text-slate-600 group-hover:text-primary-600 transition-colors" />
            </button>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative p-5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiLayers className="text-white" size={36} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">
                Create New Asset Group
              </h1>
              <p className="text-slate-600 font-semibold text-lg mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                Define criteria for grouping assets
              </p>
            </div>
          </div>
        </div>
        <div className="card hover:border-primary-300 transition-all duration-500 ease-out backdrop-blur-sm">
          <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <FiPlus className="text-white" size={20} strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Group Details
              </h2>
            </div>
          </div>
          <div className="card-body">
            <AssetGroupForm
              onClose={() => navigate('/asset-groups')}
              onSuccess={(newGroup) => {
                if (newGroup?._id) {
                  navigate(`/asset-groups/${newGroup._id}`);
                } else {
                  navigate('/asset-groups');
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
              <FiLayers className="text-white" size={32} />
            </div>
            <div>
              <div className="h-10 bg-slate-200 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-slate-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
        </div>
        <LoadingSkeleton type="grid" rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 lg:p-8 backdrop-blur-sm">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-full blur-3xl -mr-32 -mt-32 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/30 to-purple-100/20 rounded-full blur-3xl -ml-24 -mb-24 animate-float" style={{animationDelay: '1s'}}></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative p-5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiLayers className="text-white" size={36} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">
                Asset Groups
              </h1>
              <p className="text-slate-600 font-semibold text-lg mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                Smart grouping and bulk management of assets
              </p>
            </div>
          </div>
          {canManage() && (
            <div className="flex items-center gap-3 flex-wrap">
              <Tooltip content="Automatically generate groups from your inventory" position="bottom">
                <button
                  onClick={() => setShowAutoGenerate(true)}
                  className="group relative overflow-hidden btn btn-outline flex items-center gap-2 px-5 py-3 font-bold shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 hover:border-yellow-400 active:translate-y-0 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FiZap size={18} className="text-yellow-600 group-hover:animate-pulse group-hover:rotate-12 transition-transform duration-300" />
                    Auto-Generate
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </Tooltip>
              <Tooltip content="Create a new asset group manually" position="bottom">
                <Link
                  to="/asset-groups/new"
                  className="group relative overflow-hidden btn btn-primary flex items-center gap-2 px-5 py-3 font-bold shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FiPlus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    Create Group
                  </span>
                  <span className="absolute inset-0 bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50/80 to-amber-50 border-2 border-red-400 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out backdrop-blur-sm">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-300 rounded-full -mr-20 -mt-20 opacity-20 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200 rounded-full -ml-16 -mb-16 opacity-15 group-hover:opacity-25 group-hover:scale-110 transition-all duration-500 animate-float" style={{animationDelay: '0.5s'}}></div>
          
          <div className="relative p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-red-500/50">
                  <FiAlertCircle className="text-white" size={28} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-red-900 group-hover:scale-105 transition-transform duration-300 inline-block">
                  Low Stock Alerts
                </h3>
                <p className="text-base font-bold text-red-700 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {lowStockAlerts.length} group{lowStockAlerts.length !== 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.map((alert, index) => (
                <div 
                  key={alert.groupId}
                  className={`group relative overflow-hidden bg-white rounded-2xl p-5 border-2 shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm animate-stagger-${(index % 4) + 1} ${
                    alert.severity === 'urgent' ? 'border-red-400 hover:border-red-500' : 'border-orange-300 hover:border-orange-400'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    alert.severity === 'urgent' ? 'from-red-500 to-red-600' : 'from-orange-500 to-amber-500'
                  }`}></div>
                  <h4 className="font-bold text-lg text-slate-900 mb-3 group-hover:text-red-600 transition-colors">{alert.group}</h4>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-extrabold bg-gradient-to-br from-red-600 to-red-800 bg-clip-text text-transparent mb-1">
                        {alert.availableCount}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Threshold</p>
                      <p className="text-xl font-extrabold text-slate-900">{alert.threshold}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 group-hover:scale-105 ${
                    alert.severity === 'urgent' 
                      ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-2 border-red-300 animate-pulse' 
                      : 'bg-gradient-to-r from-orange-100 to-amber-50 text-orange-800 border-2 border-orange-300'
                  }`}>
                    {alert.severity === 'urgent' && <FiAlertCircle size={14} className="animate-pulse" />}
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="card hover:border-primary-300 transition-all duration-500 ease-out backdrop-blur-sm">
        <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                <FiPackage className="text-white" size={20} strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              Asset Groups ({groups?.length || 0})
            </h2>
          </div>
        </div>
        <div className="card-body">
          {!groups || groups.length === 0 ? (
            <EmptyState
              icon={FiLayers}
              title="No Asset Groups Yet"
              description="Get started by creating asset groups to organize and manage your inventory more efficiently."
              action={canManage() ? () => setShowAutoGenerate(true) : null}
              actionLabel="Auto-Generate from Inventory"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, index) => {
                // Memoize color calculation
                const groupColors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-green-500 to-green-600',
                  'from-orange-500 to-orange-600',
                  'from-pink-500 to-pink-600',
                  'from-indigo-500 to-indigo-600',
                ];
                const groupColor = groupColors[index % groupColors.length];

                return (
                  <div
                    key={group._id}
                    className={`group relative overflow-hidden bg-white border-2 border-slate-200 rounded-3xl p-6 hover:border-primary-400 hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] transform cursor-pointer backdrop-blur-sm animate-stagger-${(index % 4) + 1}`}
                  >
                    {/* Animated background elements */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${groupColor} rounded-full -mr-12 -mt-12 opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500`}></div>
                    <div className={`absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr ${groupColor} rounded-full -ml-10 -mb-10 opacity-5 group-hover:opacity-15 group-hover:scale-125 transition-all duration-500`}></div>
                    
                    {/* Gradient Header with Animation */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${groupColor} group-hover:h-3 transition-all duration-500`}></div>
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-blue-50/0 group-hover:from-primary-50/40 group-hover:to-blue-50/30 rounded-3xl transition-all duration-500 pointer-events-none"></div>
                    
                    <div className="relative">
                      {/* Header with Icon */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <Tooltip content={`View details for ${group.name}`} position="top">
                            <div className={`relative p-4 bg-gradient-to-br ${groupColor} rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out`}>
                              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                              <div className={`absolute inset-0 bg-gradient-to-br ${groupColor} rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                              {(() => {
                                // Use category icon if criteria has category, otherwise use layers icon
                                const CategoryIcon = group.criteria?.category 
                                  ? getCategoryIcon(group.criteria.category) 
                                  : FiLayers;
                                return <CategoryIcon className="text-white relative z-10" size={28} strokeWidth={2.5} />;
                              })()}
                            </div>
                          </Tooltip>
                          <div className="flex-1">
                            <Link to={`/asset-groups/${group._id}`} className="block">
                              <h3 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-primary-600 transition-colors duration-300 line-clamp-1">
                                {group.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <FiPackage className="text-slate-400 group-hover:text-primary-500 transition-colors" size={16} />
                              <p className="text-sm font-semibold text-slate-600 group-hover:text-primary-600 transition-colors">
                                {group.assetCount || 0} asset{group.assetCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {group.description && (
                        <p className="text-sm text-slate-600 mb-5 leading-relaxed line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* Criteria Tags */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {group.criteria.category && (() => {
                          const CategoryIcon = getCategoryIcon(group.criteria.category);
                          return (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200">
                              <CategoryIcon size={14} />
                              <span>Category: {group.criteria.category}</span>
                            </div>
                          );
                        })()}
                        {group.criteria.manufacturer && (() => {
                          const ManufacturerIcon = getManufacturerIcon(group.criteria.manufacturer);
                          return (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold border border-green-200">
                              <ManufacturerIcon size={14} />
                              <span>{group.criteria.manufacturer}</span>
                            </div>
                          );
                        })()}
                        {group.criteria.status && (() => {
                          const StatusIcon = getStatusIcon(group.criteria.status);
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                              group.criteria.status === 'available' 
                                ? 'bg-green-100 text-green-800 border-green-200' :
                              group.criteria.status === 'assigned' 
                                ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              <StatusIcon size={14} />
                              <span>{group.criteria.status}</span>
                            </div>
                          );
                        })()}
                        {group.criteria.model && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">
                            <FiLayers size={14} />
                            <span>{group.criteria.model}</span>
                          </div>
                        )}
                      </div>

                      {/* Low Stock Alert */}
                      {group.alerts?.lowStockEnabled && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 mb-5 flex items-center gap-2">
                          <FiAlertCircle className="text-orange-600 flex-shrink-0" size={18} />
                          <p className="text-xs font-medium text-orange-800">
                            Low stock alert at {group.alerts.lowStockThreshold} units
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-5 border-t-2 border-slate-200 group-hover:border-primary-300 transition-all duration-300">
                        <Tooltip content={`View details for ${group.name}`} position="top">
                          <Link
                            to={`/asset-groups/${group._id}`}
                            className="group relative overflow-hidden flex-1 btn btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <FiEye size={16} className="group-hover:scale-110 transition-transform duration-300" />
                              View Details
                            </span>
                            <span className="absolute inset-0 bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          </Link>
                        </Tooltip>
                        {canManage() && (
                          <>
                            <Tooltip content="Edit this group" position="top">
                              <Link
                                to={`/asset-groups/${group._id}/edit`}
                                className="group relative overflow-hidden p-2.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 ease-out hover:scale-110 hover:rotate-6 active:scale-95 border border-transparent hover:border-primary-200"
                              >
                                <FiEdit size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                              </Link>
                            </Tooltip>
                            <Tooltip content="Delete this group permanently" position="top">
                              <button
                                onClick={() => handleDelete(group._id, group.name)}
                                disabled={deleteMutation.isPending}
                                className="group relative overflow-hidden p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 ease-out hover:scale-110 hover:rotate-6 active:scale-95 border border-transparent hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FiTrash2 size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                <span className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Generate Modal */}
      <AutoGenerateGroups
        isOpen={showAutoGenerate}
        onClose={() => setShowAutoGenerate(false)}
      />
    </div>
  );
};

export default AssetGroupList;

