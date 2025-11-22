import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiLayers,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiTag,
  FiInfo,
  FiRefreshCw,
  FiMapPin,
  FiDownload,
  FiCopy,
  FiFilter,
  FiX,
  FiSettings,
  FiPlus,
  FiMinus,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';
import { assetGroupsAPI, assetsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import FilterChip from '../../components/ui/FilterChip';
import BulkProgress from '../../components/ui/BulkProgress';
import AssetGroupForm from './AssetGroupForm';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterPanel from '../../components/ui/FilterPanel';
import ExportMenu from '../../components/ui/ExportMenu';
import { getCategoryIcon, getStatusIcon, getManufacturerIcon } from '../../utils/assetCategoryIcons';
import AddAssetsToGroupModal from './AddAssetsToGroupModal';
import toast from 'react-hot-toast';

const AssetGroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showAddAssetsModal, setShowAddAssetsModal] = useState(false);
  const [showRemoveAssetsModal, setShowRemoveAssetsModal] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
  });
  const [bulkProgress, setBulkProgress] = useState({
    inProgress: false,
    total: 0,
    completed: 0,
    failed: 0,
    message: 'Processing...',
  });

  // Check if creating new asset group (when no id is present)
  const isNewGroup = !id;
  
  // Check if editing asset group
  const isEditingGroup = window.location.pathname.includes('/edit');

  // Fetch asset group details (without assets for editing mode)
  const { data: groupWithoutAssets, isLoading: isLoadingBasic } = useQuery({
    queryKey: ['asset-group-basic', id],
    queryFn: () => {
      if (!id) throw new Error('Asset group ID is required');
      return assetGroupsAPI.getById(id).then((res) => res.data.data?.group || res.data.data);
    },
    enabled: !!id && !isNewGroup && isEditingGroup, // Fetch basic group data when editing
  });

  // Fetch assets in this group - get from group endpoint which includes both criteria-matched and manually added
  const { data: groupData, isLoading: isLoadingFull, isError: groupError } = useQuery({
    queryKey: ['asset-group-full', id],
    queryFn: () => {
      if (!id) return null;
      return assetGroupsAPI.getById(id).then((res) => res.data.data);
    },
    enabled: !!id && !isNewGroup && !isEditingGroup, // Only fetch when viewing
  });

  // Determine loading state based on which query is active
  const loadingGroup = isEditingGroup ? isLoadingBasic : isLoadingFull;

  // Use group from full data when viewing, or basic group when editing
  const group = isEditingGroup ? groupWithoutAssets : (groupData?.group || groupWithoutAssets);

  // Extract assets from group data (backend returns both criteria-matched and manually added)
  const assetsData = groupData?.assets || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Asset group ID is required');
      return assetGroupsAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asset-groups']);
      toast.success('Asset group deleted successfully');
      navigate('/asset-groups');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset group');
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (data) => assetGroupsAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['asset-groups']);
      toast.success('Asset group duplicated successfully');
      setShowDuplicateModal(false);
      navigate(`/asset-groups/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate asset group');
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: (data) => {
      if (!id) throw new Error('Asset group ID is required');
      // Start progress tracking
      const actionName = (data.action || 'bulk action').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setBulkProgress({
        inProgress: true,
        total: selectedAssets.length,
        completed: 0,
        failed: 0,
        message: `Processing ${actionName}...`,
      });
      return assetGroupsAPI.bulkAction(id, { ...data, assetIds: selectedAssets });
    },
    onSuccess: (response) => {
      const result = response?.data?.data || {};
      const completed = result.completed || selectedAssets.length;
      const failed = result.failed || 0;
      
      // Update final progress
      setBulkProgress(prev => ({
        ...prev,
        completed,
        failed,
        inProgress: false,
        message: failed > 0 ? 'Completed with errors' : 'Completed successfully',
      }));
      
      if (id) {
        queryClient.invalidateQueries(['asset-group-full', id]);
        queryClient.invalidateQueries(['asset-group-basic', id]);
        queryClient.invalidateQueries(['asset-group', id]);
      }
      
      // Close progress after a delay
      setTimeout(() => {
        setBulkProgress({ inProgress: false, total: 0, completed: 0, failed: 0, message: 'Processing...' });
        setShowBulkActionModal(false);
        setSelectedAssets([]);
      }, 2000);
      
      if (failed > 0) {
        toast.error(`Bulk action completed with ${failed} error(s)`);
      } else {
        toast.success('Bulk action completed successfully');
      }
    },
    onError: (error) => {
      setBulkProgress(prev => ({
        ...prev,
        inProgress: false,
        failed: prev.total,
        message: 'Operation failed',
      }));
      toast.error(error.response?.data?.message || 'Failed to perform bulk action');
      setTimeout(() => {
        setBulkProgress({ inProgress: false, total: 0, completed: 0, failed: 0, message: 'Processing...' });
      }, 3000);
    },
  });

  // Remove assets mutation
  const removeAssetsMutation = useMutation({
    mutationFn: (assetIds) => {
      if (!id) throw new Error('Asset group ID is required');
      return assetGroupsAPI.removeAssets(id, { assetIds });
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries(['asset-group-full', id]);
        queryClient.invalidateQueries(['asset-group-basic', id]);
        queryClient.invalidateQueries(['asset-group', id]);
      }
      toast.success(`Removed ${selectedAssets.length} asset(s) from group`);
      setShowRemoveAssetsModal(false);
      setSelectedAssets([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove assets from group');
    },
  });

  // Get assets data
  const assets = assetsData || [];

  // Filter and search assets - always show results, never hide completely
  const filteredAssets = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    
    let filtered = [...assets];
    
    // Apply search - only filter if query exists, otherwise show all
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchFiltered = filtered.filter(asset => 
        asset.name?.toLowerCase().includes(query) ||
        asset.assetTag?.toLowerCase().includes(query) ||
        asset.serialNumber?.toLowerCase().includes(query) ||
        asset.manufacturer?.toLowerCase().includes(query) ||
        asset.model?.toLowerCase().includes(query) ||
        asset.location?.toLowerCase().includes(query) ||
        asset.category?.toLowerCase().includes(query) ||
        asset.status?.toLowerCase().includes(query)
      );
      // If search returns results, use them; otherwise show all (don't hide)
      if (searchFiltered.length > 0) {
        filtered = searchFiltered;
      }
      // If search returns 0, keep showing all assets (don't hide)
    }
    
    // Apply status filter - only filter if not 'all'
    if (filters.status && filters.status !== 'all') {
      const statusFiltered = filtered.filter(asset => asset.status === filters.status);
      // If filter returns results, use them; otherwise show all (don't hide)
      if (statusFiltered.length > 0) {
        filtered = statusFiltered;
      }
    }
    
    // Apply category filter - only filter if not 'all'
    if (filters.category && filters.category !== 'all') {
      const categoryFiltered = filtered.filter(asset => asset.category === filters.category);
      // If filter returns results, use them; otherwise show all (don't hide)
      if (categoryFiltered.length > 0) {
        filtered = categoryFiltered;
      }
    }
    
    return filtered;
  }, [assets, searchQuery, filters]);

  // Early return if id is missing and not creating new group (handle route transition)
  // MUST be after all hooks are called
  if (!id && !isNewGroup) {
    // If editing but no id, show error, otherwise show loading (might be route transition)
    if (isEditingGroup) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Asset group ID is missing</p>
          <Link to="/asset-groups" className="btn btn-primary mt-4">
            Back to Asset Groups
          </Link>
        </div>
      );
    }
    return <LoadingSpinner />;
  }

  const handleDelete = () => {
    if (!id) {
      toast.error('Asset group ID is missing');
      return;
    }
    deleteMutation.mutate();
  };

  const handleDuplicate = () => {
    if (!group) return;
    duplicateMutation.mutate({
      name: `${group?.name || 'Asset Group'} (Copy)`,
      description: group?.description,
      criteria: group?.criteria,
      alerts: group?.alerts,
    });
  };

  const handleBulkAction = (action, data = {}) => {
    if (selectedAssets.length === 0) {
      toast.error('Please select assets to perform bulk action');
      return;
    }
    setShowBulkActionModal(false);
    bulkActionMutation.mutate({
      action,
      data,
    });
  };

  const handleCancelBulkAction = () => {
    // Note: This doesn't actually cancel the API call, but hides the progress
    // In a real implementation, you'd need to cancel the request
    setBulkProgress({ inProgress: false, total: 0, completed: 0, failed: 0, message: 'Processing...' });
    toast.info('Bulk operation cancelled');
  };

  const handleSelectAll = (isSelected) => {
    // Handle both button click (no param) and DataTable checkbox (with boolean param)
    if (isSelected === undefined) {
      // Toggle behavior when called from button
      if (selectedAssets.length === filteredAssets.length && filteredAssets.length > 0) {
        setSelectedAssets([]);
      } else {
        setSelectedAssets(filteredAssets.map(asset => asset._id));
      }
    } else {
      // Explicit select/deselect when called from DataTable checkbox
      if (isSelected) {
        setSelectedAssets(filteredAssets.map(asset => asset._id));
      } else {
        setSelectedAssets([]);
      }
    }
  };

  const handleRefresh = () => {
    if (id) {
      queryClient.invalidateQueries(['asset-group-full', id]);
      queryClient.invalidateQueries(['asset-group-basic', id]);
      queryClient.invalidateQueries(['asset-group', id]);
      queryClient.invalidateQueries(['asset-groups']);
      toast.success('Group refreshed');
    }
  };

  const handleRemoveAssets = () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select assets to remove');
      return;
    }
    if (!id) {
      toast.error('Asset group ID is missing');
      return;
    }
    removeAssetsMutation.mutate(selectedAssets);
  };

  // Export assets
  const handleExport = (format) => {
    const assetsToExport = selectedAssets.length > 0 
      ? filteredAssets.filter(a => selectedAssets.includes(a._id))
      : filteredAssets;

    if (assetsToExport.length === 0) {
      toast.error('No assets to export');
      return;
    }

    if (format === 'csv') {
      const headers = ['Name', 'Asset Tag', 'Serial Number', 'Category', 'Manufacturer', 'Model', 'Status', 'Location', 'Purchase Date', 'Purchase Price'];
      const rows = assetsToExport.map(asset => [
        asset.name || '',
        asset.assetTag || '',
        asset.serialNumber || '',
        asset.category || '',
        asset.manufacturer || '',
        asset.model || '',
        asset.status || '',
        asset.location || '',
        asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '',
        asset.purchasePrice || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${group?.name || 'asset-group'}-assets-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${assetsToExport.length} asset(s) to CSV`);
    }
  };

  // Loading state check (id check already handled earlier)
  if (loadingGroup && !isNewGroup && !isEditingGroup) {
    return <LoadingSpinner fullScreen />;
  }

  // Handle error state
  if (groupError && !isNewGroup && !isEditingGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load asset group</p>
        <Link to="/asset-groups" className="btn btn-primary mt-4">
          Back to Asset Groups
        </Link>
      </div>
    );
  }

  // Create or Edit Asset Group
  if (isNewGroup || (isEditingGroup && group)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => group ? navigate(`/asset-groups/${id}`) : navigate('/asset-groups')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">
              {isEditingGroup ? 'Edit Asset Group' : 'Create New Asset Group'}
            </h1>
            <p className="text-secondary-600 mt-2">
              {isEditingGroup ? 'Update asset group information' : 'Define criteria for grouping assets'}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <AssetGroupForm
              assetGroup={isEditingGroup ? group : null}
              onClose={() => group ? navigate(`/asset-groups/${id}`) : navigate('/asset-groups')}
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

  // Ensure group exists before rendering main content
  if (!group && !isNewGroup && !isEditingGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Asset group not found</p>
        <Link to="/asset-groups" className="btn btn-primary mt-4">
          Back to Asset Groups
        </Link>
      </div>
    );
  }

  // Safety check: If still loading or group is undefined when it shouldn't be, show loading
  if ((loadingGroup || !group) && !isNewGroup && !isEditingGroup) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bulk Progress Indicator */}
      {bulkProgress.inProgress && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <BulkProgress
            total={bulkProgress.total}
            completed={bulkProgress.completed}
            failed={bulkProgress.failed}
            inProgress={bulkProgress.inProgress}
            message={bulkProgress.message}
            onCancel={handleCancelBulkAction}
          />
        </div>
      )}
      
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 lg:p-8 backdrop-blur-sm">
        {/* Background decoration with animation */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-full blur-3xl -mr-32 -mt-32 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/30 to-purple-100/20 rounded-full blur-3xl -ml-24 -mb-24 animate-float" style={{animationDelay: '1s'}}></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <button
              onClick={() => navigate('/asset-groups')}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all hover:scale-110 hover:shadow-lg active:scale-95 group"
            >
              <FiArrowLeft size={22} className="text-slate-600 group-hover:text-primary-600 transition-colors" />
            </button>
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FiLayers className="text-white" size={36} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">
                    {group?.name || 'Asset Group'}
                  </h1>
                  {group?.alerts?.lowStockEnabled && (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border-2 border-red-300 animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Low Stock
                    </span>
                  )}
                </div>
                <p className="text-slate-600 font-semibold text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                  Asset Group Details & Management
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {canManage() && (
              <>
                <Tooltip content="Create a copy of this group" position="bottom">
                  <button
                    onClick={() => setShowDuplicateModal(true)}
                    className="group relative overflow-hidden btn btn-outline flex items-center gap-2 px-5 py-3 font-bold shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <FiCopy size={18} className="group-hover:rotate-180 transition-transform duration-500 ease-out" />
                      Duplicate
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 bg-primary-100 opacity-0 group-active:opacity-20 transition-opacity duration-150"></span>
                  </button>
                </Tooltip>
                <Tooltip content="Edit group details and criteria" position="bottom">
                  <Link
                    to={`/asset-groups/${id}/edit`}
                    className="group relative overflow-hidden btn btn-outline flex items-center gap-2 px-5 py-3 font-bold shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <FiEdit size={18} className="group-hover:rotate-12 transition-transform duration-500 ease-out" />
                      Edit
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 bg-blue-100 opacity-0 group-active:opacity-20 transition-opacity duration-150"></span>
                  </Link>
                </Tooltip>
                <Tooltip content="Delete this asset group permanently" position="bottom">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="group relative overflow-hidden btn btn-danger flex items-center gap-2 px-5 py-3 font-bold shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <FiTrash2 size={18} className="group-hover:scale-110 transition-transform duration-300 ease-out" />
                      Delete
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 bg-red-700 opacity-0 group-active:opacity-30 transition-opacity duration-150"></span>
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50 border-2 border-blue-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] transform backdrop-blur-sm animate-stagger-1">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-300 rounded-full -ml-12 -mb-12 opacity-15 group-hover:opacity-25 group-hover:scale-125 transition-all duration-500"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Total Assets</p>
                <p className="text-4xl font-extrabold bg-gradient-to-br from-blue-900 to-blue-700 bg-clip-text text-transparent mb-1">
                  {group?.assetCount || assets.length}
                </p>
                {filteredAssets.length !== assets.length && (
                  <p className="text-xs font-semibold text-blue-600 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                    Showing {filteredAssets.length} filtered
                  </p>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FiPackage className="text-white" size={30} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-100/50 to-green-50 border-2 border-green-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] transform backdrop-blur-sm animate-stagger-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300 rounded-full -ml-12 -mb-12 opacity-15 group-hover:opacity-25 group-hover:scale-125 transition-all duration-500"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Available</p>
                <p className="text-4xl font-extrabold bg-gradient-to-br from-green-900 to-green-700 bg-clip-text text-transparent mb-1">
                  {assets.filter(a => a.status === 'available').length}
                </p>
                {assets.length > 0 && (
                  <p className="text-xs font-semibold text-green-600 mt-2">
                    {Math.round((assets.filter(a => a.status === 'available').length / assets.length) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-green-500/50">
                  <FiCheckCircle className="text-white" size={30} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-100/50 to-orange-50 border-2 border-orange-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] transform backdrop-blur-sm animate-stagger-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-300 rounded-full -ml-12 -mb-12 opacity-15 group-hover:opacity-25 group-hover:scale-125 transition-all duration-500"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">Assigned</p>
                <p className="text-4xl font-extrabold bg-gradient-to-br from-orange-900 to-orange-700 bg-clip-text text-transparent mb-1">
                  {assets.filter(a => a.status === 'assigned').length}
                </p>
                {assets.length > 0 && (
                  <p className="text-xs font-semibold text-orange-600 mt-2">
                    {Math.round((assets.filter(a => a.status === 'assigned').length / assets.length) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-orange-500/50">
                  <FiTag className="text-white" size={30} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-100/50 to-purple-50 border-2 border-purple-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-300 rounded-full -ml-12 -mb-12 opacity-15 group-hover:opacity-25 group-hover:scale-125 transition-all duration-500"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">In Maintenance</p>
                <p className="text-4xl font-extrabold bg-gradient-to-br from-purple-900 to-purple-700 bg-clip-text text-transparent mb-1">
                  {assets.filter(a => a.status === 'maintenance').length}
                </p>
                {assets.length > 0 && (
                  <p className="text-xs font-semibold text-purple-600 mt-2">
                    {Math.round((assets.filter(a => a.status === 'maintenance').length / assets.length) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-purple-500/50">
                  <FiRefreshCw className="text-white" size={30} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Chart */}
      {assets.length > 0 && (
        <div className="card hover:border-primary-300 hover:shadow-2xl transition-all duration-500 ease-out backdrop-blur-sm">
          <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <FiPackage className="text-white" size={20} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">Status Distribution</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {['available', 'assigned', 'maintenance', 'retired', 'disposed'].map((status, index) => {
                const count = assets.filter(a => a.status === status).length;
                const percentage = assets.length > 0 ? (count / assets.length) * 100 : 0;
                
                if (count === 0) return null;
                
                const statusConfig = {
                  available: { 
                    bg: 'bg-gradient-to-r from-green-500 to-emerald-500', 
                    text: 'text-green-700', 
                    label: 'Available',
                    icon: FiCheckCircle
                  },
                  assigned: { 
                    bg: 'bg-gradient-to-r from-orange-500 to-amber-500', 
                    text: 'text-orange-700', 
                    label: 'Assigned',
                    icon: FiTag
                  },
                  maintenance: { 
                    bg: 'bg-gradient-to-r from-purple-500 to-violet-500', 
                    text: 'text-purple-700', 
                    label: 'Maintenance',
                    icon: FiRefreshCw
                  },
                  retired: { 
                    bg: 'bg-gradient-to-r from-gray-500 to-slate-500', 
                    text: 'text-gray-700', 
                    label: 'Retired',
                    icon: FiPackage
                  },
                  disposed: { 
                    bg: 'bg-gradient-to-r from-red-500 to-rose-500', 
                    text: 'text-red-700', 
                    label: 'Disposed',
                    icon: FiTrash2
                  },
                };
                
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                
                return (
                  <div 
                    key={status} 
                    className="group space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-500 ease-out hover:-translate-y-0.5 transform"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`relative p-2 rounded-xl ${config.bg} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out`}>
                          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <StatusIcon className="relative text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-slate-900 group-hover:scale-110 transition-transform duration-300">{count}</span>
                        <span className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 rounded-full text-xs font-bold border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full ${config.bg} shadow-lg transition-all duration-1000 ease-out group-hover:shadow-xl relative`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {group?.alerts?.lowStockEnabled && (
        <div className={`group relative overflow-hidden rounded-3xl border-2 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out backdrop-blur-sm ${
          (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) 
            ? 'border-red-400 bg-gradient-to-br from-red-50 via-orange-50/80 to-red-50 hover:border-red-500' 
            : 'border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50/80 to-orange-50 hover:border-orange-400'
        }`}>
          {/* Animated background elements */}
          <div className={`absolute top-0 right-0 w-40 h-40 ${
            (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) ? 'bg-red-300' : 'bg-orange-300'
          } rounded-full -mr-20 -mt-20 opacity-20 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500 animate-float`}></div>
          <div className={`absolute bottom-0 left-0 w-32 h-32 ${
            (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) ? 'bg-orange-200' : 'bg-amber-200'
          } rounded-full -ml-16 -mb-16 opacity-15 group-hover:opacity-25 group-hover:scale-110 transition-all duration-500 animate-float`} style={{animationDelay: '0.5s'}}></div>
          
          <div className="relative p-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`absolute inset-0 ${
                  (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) ? 'bg-red-400' : 'bg-orange-400'
                } rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                <div className={`relative p-5 rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out ${
                  (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0)
                    ? 'bg-gradient-to-br from-red-500 to-red-600 group-hover:shadow-red-500/50'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600 group-hover:shadow-orange-500/50'
                }`}>
                  <FiAlertCircle className={`${
                    (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0)
                      ? 'text-red-50'
                      : 'text-orange-50'
                  }`} size={32} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-2xl font-extrabold ${
                    (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0)
                      ? 'text-red-900'
                      : 'text-orange-900'
                  } group-hover:scale-105 transition-transform duration-300 inline-block`}>
                    {(group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) 
                      ? '⚠️ Low Stock Alert' 
                      : '✅ Stock Monitoring Active'}
                  </h3>
                  {(group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      URGENT
                    </span>
                  )}
                </div>
                <p className={`text-base font-bold ${
                  (group?.assetCount || 0) <= (group?.alerts?.lowStockThreshold || 0)
                    ? 'text-red-800'
                    : 'text-orange-800'
                }`}>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-3xl font-extrabold">{(group?.assetCount || 0)}</span>
                    <span className="text-sm">available assets</span>
                  </span>
                  <span className="mx-2">•</span>
                  <span>Threshold: <strong>{group?.alerts?.lowStockThreshold}</strong></span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card hover:border-primary-300 transition-all duration-500 ease-out backdrop-blur-sm">
            <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                    <FiInfo className="text-white" size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">Group Information</h3>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Name</label>
                <p className="text-slate-900 font-medium">{group?.name || 'N/A'}</p>
              </div>

              {group?.description && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <p className="text-slate-900 mt-1">{group.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 block">Grouping Criteria</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group?.criteria?.category && (() => {
                    const CategoryIcon = getCategoryIcon(group.criteria.category);
                    return (
                      <div className="group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border-2 border-blue-300 hover:border-blue-400 hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                          <div className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-blue-500/50">
                            <CategoryIcon className="text-white" size={22} strokeWidth={2.5} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 group-hover:text-blue-800 transition-colors">Category</p>
                          <p className="text-base font-extrabold text-blue-900 capitalize group-hover:scale-105 transition-transform duration-300 inline-block">{group.criteria.category}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {group?.criteria?.manufacturer && (() => {
                    const ManufacturerIcon = getManufacturerIcon(group.criteria.manufacturer);
                    return (
                      <div className="group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-2xl border-2 border-green-300 hover:border-green-400 hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                          <div className="relative p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-green-500/50">
                            <ManufacturerIcon className="text-white" size={22} strokeWidth={2.5} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1 group-hover:text-green-800 transition-colors">Manufacturer</p>
                          <p className="text-base font-extrabold text-green-900 group-hover:scale-105 transition-transform duration-300 inline-block">{group.criteria.manufacturer}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {group?.criteria?.model && (
                    <div className="group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-violet-100/50 rounded-2xl border-2 border-purple-300 hover:border-purple-400 hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div className="relative p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-purple-500/50">
                          <FiLayers className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1 group-hover:text-purple-800 transition-colors">Model</p>
                        <p className="text-base font-extrabold text-purple-900 group-hover:scale-105 transition-transform duration-300 inline-block">{group.criteria.model}</p>
                      </div>
                    </div>
                  )}
                  {group?.criteria?.status && (() => {
                    const StatusIcon = getStatusIcon(group.criteria.status);
                    const statusColor = group.criteria.status === 'available' 
                      ? { from: 'from-green-50', to: 'to-emerald-100/50', border: 'border-green-300', hover: 'hover:border-green-400', textLabel: 'text-green-700', textValue: 'text-green-900', bgIcon: 'from-green-500 to-emerald-600', blur: 'bg-green-400' }
                      : group.criteria.status === 'assigned' 
                      ? { from: 'from-orange-50', to: 'to-amber-100/50', border: 'border-orange-300', hover: 'hover:border-orange-400', textLabel: 'text-orange-700', textValue: 'text-orange-900', bgIcon: 'from-orange-500 to-amber-600', blur: 'bg-orange-400' }
                      : { from: 'from-blue-50', to: 'to-cyan-100/50', border: 'border-blue-300', hover: 'hover:border-blue-400', textLabel: 'text-blue-700', textValue: 'text-blue-900', bgIcon: 'from-blue-500 to-cyan-600', blur: 'bg-blue-400' };
                    return (
                      <div className={`group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br ${statusColor.from} ${statusColor.to} rounded-2xl border-2 ${statusColor.border} ${statusColor.hover} hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm`}>
                        <div className="relative">
                          <div className={`absolute inset-0 ${statusColor.blur} rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                          <div className={`relative p-3 bg-gradient-to-br ${statusColor.bgIcon} rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out`}>
                            <StatusIcon className="text-white" size={22} strokeWidth={2.5} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${statusColor.textLabel} uppercase tracking-wide mb-1 transition-colors`}>Status</p>
                          <p className={`text-base font-extrabold ${statusColor.textValue} capitalize group-hover:scale-105 transition-transform duration-300 inline-block`}>{group.criteria.status}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {group?.criteria?.location && (
                    <div className="group relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border-2 border-slate-300 hover:border-slate-400 hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] transform backdrop-blur-sm">
                      <div className="relative">
                        <div className="absolute inset-0 bg-slate-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div className="relative p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out group-hover:shadow-slate-500/50">
                          <FiMapPin className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 group-hover:text-slate-800 transition-colors">Location</p>
                        <p className="text-base font-extrabold text-slate-900 group-hover:scale-105 transition-transform duration-300 inline-block">{group.criteria.location}</p>
                      </div>
                    </div>
                  )}
                  {!Object.values(group?.criteria || {}).some(v => v) && (
                    <p className="text-sm text-slate-500 italic text-center py-4">No criteria set</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assets in Group */}
          <div className="card hover:border-primary-300 transition-all duration-500 ease-out backdrop-blur-sm">
            <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                        <FiPackage className="text-white" size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                      Assets in Group ({filteredAssets.length}{filteredAssets.length !== assets.length ? ` of ${assets.length}` : ''})
                    </h3>
                  </div>
                  {selectedAssets.length > 0 && (
                    <p className="text-sm text-primary-600 mt-1 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                      {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {canManage() && (
                    <>
                      <Tooltip content="Add new assets to this group" position="bottom">
                        <button
                          onClick={() => setShowAddAssetsModal(true)}
                          className="group relative overflow-hidden btn btn-outline btn-sm flex items-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <FiPlus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                            Add Assets
                          </span>
                          <span className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                      </Tooltip>
                      {filteredAssets.length > 0 && (
                        <>
                          <Tooltip content="Export assets to CSV" position="bottom">
                            <div>
                              <ExportMenu 
                                onExport={handleExport}
                                formats={['csv']}
                              />
                            </div>
                          </Tooltip>
                          <Tooltip content={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0 ? "Deselect all assets" : "Select all assets"} position="bottom">
                            <button
                              onClick={() => handleSelectAll()}
                              className="group relative overflow-hidden btn btn-outline btn-sm flex items-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                              disabled={filteredAssets.length === 0}
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0 ? (
                                  <FiCheckSquare size={16} className="group-hover:scale-110 transition-transform duration-300 text-primary-600" />
                                ) : (
                                  <FiSquare size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                )}
                                {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0 ? 'Deselect All' : 'Select All'}
                              </span>
                              <span className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            </button>
                          </Tooltip>
                          {selectedAssets.length > 0 && (
                            <>
                              <Tooltip content="Remove selected assets from group (manually added only)" position="bottom">
                                <button
                                  onClick={() => setShowRemoveAssetsModal(true)}
                                  className="group relative overflow-hidden btn btn-outline btn-sm flex items-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <span className="relative z-10 flex items-center gap-2">
                                    <FiMinus size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                    Remove ({selectedAssets.length})
                                  </span>
                                  <span className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                </button>
                              </Tooltip>
                              <Tooltip content="Perform bulk actions on selected assets" position="bottom">
                                <button
                                  onClick={() => setShowBulkActionModal(true)}
                                  className="group relative overflow-hidden btn btn-primary btn-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                                >
                                  <span className="relative z-10 flex items-center gap-2">
                                    <FiSettings size={16} className="group-hover:rotate-180 transition-transform duration-500 ease-out" />
                                    Bulk Actions ({selectedAssets.length})
                                  </span>
                                  <span className="absolute inset-0 bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                </button>
                              </Tooltip>
                            </>
                          )}
                        </>
                      )}
                      <Tooltip content="Refresh group data" position="bottom">
                        <button
                          onClick={handleRefresh}
                          className="group relative overflow-hidden btn btn-outline btn-sm flex items-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <FiRefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500 ease-out" />
                            Refresh
                          </span>
                          <span className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <SearchBar
                      onSearch={setSearchQuery}
                      placeholder="Search assets by name, tag, serial number..."
                      className="w-full"
                    />
                  </div>
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    filterOptions={{
                      status: [
                        { value: 'all', label: 'All Statuses' },
                        { value: 'available', label: 'Available' },
                        { value: 'assigned', label: 'Assigned' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'retired', label: 'Retired' },
                        { value: 'disposed', label: 'Disposed' },
                      ],
                      category: [
                        { value: 'all', label: 'All Categories' },
                        { value: 'laptop', label: 'Laptop' },
                        { value: 'desktop', label: 'Desktop' },
                        { value: 'monitor', label: 'Monitor' },
                        { value: 'mobile', label: 'Mobile' },
                        { value: 'tablet', label: 'Tablet' },
                        { value: 'server', label: 'Server' },
                        { value: 'network', label: 'Network' },
                        { value: 'printer', label: 'Printer' },
                        { value: 'accessory', label: 'Accessory' },
                        { value: 'other', label: 'Other' },
                      ],
                    }}
                  />
                  {(searchQuery || filters.status !== 'all' || filters.category !== 'all') && (
                    <Tooltip content="Clear all filters and search" position="bottom">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilters({ status: 'all', category: 'all' });
                        }}
                        className="btn btn-outline flex items-center gap-2"
                      >
                        <FiX size={16} />
                        Clear
                      </button>
                    </Tooltip>
                  )}
                </div>
                
                {/* Active Filter Chips */}
                {(searchQuery || filters.status !== 'all' || filters.category !== 'all') && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                    {searchQuery && (
                      <FilterChip
                        label="Search"
                        value={searchQuery}
                        onRemove={() => setSearchQuery('')}
                        icon={FiFilter}
                      />
                    )}
                    {filters.status !== 'all' && (
                      <FilterChip
                        label="Status"
                        value={filters.status}
                        onRemove={() => setFilters({ ...filters, status: 'all' })}
                        icon={getStatusIcon(filters.status)}
                      />
                    )}
                    {filters.category !== 'all' && (
                      <FilterChip
                        label="Category"
                        value={filters.category}
                        onRemove={() => setFilters({ ...filters, category: 'all' })}
                        icon={getCategoryIcon(filters.category)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              {assets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FiPackage size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No assets found in this group</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FiFilter size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No assets match your search or filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({ status: 'all', category: 'all' });
                    }}
                    className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <DataTable
                  data={filteredAssets}
                  columns={[
                    {
                      key: 'name',
                      label: 'Asset Name',
                      render: (row) => {
                        const CategoryIcon = getCategoryIcon(row.category);
                        return (
                          <Link to={`/assets/${row._id}`} className="flex items-center gap-3 text-primary-600 hover:text-primary-700 font-medium group">
                            <div className="p-2 bg-slate-100 group-hover:bg-primary-100 rounded-lg transition-colors">
                              <CategoryIcon className="text-slate-600 group-hover:text-primary-600" size={20} />
                            </div>
                            <span>{row.name || row.assetTag || 'Unnamed Asset'}</span>
                          </Link>
                        );
                      },
                    },
                    {
                      key: 'category',
                      label: 'Category',
                      render: (row) => {
                        const CategoryIcon = getCategoryIcon(row.category);
                        return (
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="text-slate-500" size={16} />
                            <Badge variant="info" text={row.category || 'N/A'} />
                          </div>
                        );
                      },
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (row) => {
                        const StatusIcon = getStatusIcon(row.status);
                        return (
                          <div className="flex items-center gap-2">
                            <StatusIcon className="text-slate-500" size={16} />
                            <Badge
                              variant={
                                row.status === 'available' ? 'success' :
                                row.status === 'assigned' ? 'warning' :
                                row.status === 'maintenance' ? 'info' : 'danger'
                              }
                              text={row.status || 'Unknown'}
                            />
                          </div>
                        );
                      },
                    },
                    {
                      key: 'manufacturer',
                      label: 'Manufacturer',
                      render: (row) => {
                        if (!row.manufacturer) return 'N/A';
                        const ManufacturerIcon = getManufacturerIcon(row.manufacturer);
                        return (
                          <div className="flex items-center gap-2">
                            <ManufacturerIcon className="text-slate-500" size={16} />
                            <span>{row.manufacturer}</span>
                          </div>
                        );
                      },
                    },
                  ]}
                  selectedRows={selectedAssets}
                  onSelectRow={canManage() ? (rowId) => {
                    setSelectedAssets(prev => 
                      prev.includes(rowId) 
                        ? prev.filter(id => id !== rowId)
                        : [...prev, rowId]
                    );
                  } : undefined}
                  onSelectAll={canManage() ? (isSelected) => {
                    if (isSelected) {
                      setSelectedAssets(filteredAssets.map(a => a._id));
                    } else {
                      setSelectedAssets([]);
                    }
                  } : undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts Settings */}
          {group?.alerts && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-bold text-slate-900">Alert Settings</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Low Stock Alerts</span>
                    <Badge
                      variant={group.alerts?.lowStockEnabled ? 'success' : 'danger'}
                      text={group.alerts?.lowStockEnabled ? 'Enabled' : 'Disabled'}
                    />
                  </div>
                  {group.alerts?.lowStockEnabled && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-600">Threshold: {group.alerts?.lowStockThreshold} units</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card hover:border-primary-300 transition-all duration-500 ease-out backdrop-blur-sm">
            <div className="card-header bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                    <FiSettings className="text-white" size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Quick Actions</h3>
              </div>
            </div>
            <div className="card-body space-y-3">
              <Tooltip content="View all assets in the inventory" position="left">
                <Link
                  to="/assets"
                  className="group relative overflow-hidden w-full btn btn-outline flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FiPackage size={16} className="group-hover:scale-110 transition-transform duration-300" />
                    View All Assets
                  </span>
                  <span className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              </Tooltip>
              <Tooltip content="Refresh group data and assets" position="left">
                <button
                  onClick={handleRefresh}
                  className="group relative overflow-hidden w-full btn btn-outline flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FiRefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500 ease-out" />
                    Refresh Group
                  </span>
                  <span className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </Tooltip>
              {canManage() && filteredAssets.length > 0 && (
                <Tooltip content="Export all filtered assets to CSV" position="left">
                  <button
                    onClick={() => handleExport('csv')}
                    className="group relative overflow-hidden w-full btn btn-outline flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <FiDownload size={16} className="group-hover:scale-110 transition-transform duration-300" />
                      Export Assets (CSV)
                    </span>
                    <span className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Asset Group"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{group?.name || 'this asset group'}</strong>? 
            This action cannot be undone. Assets will not be deleted, but they will no longer be grouped.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="group relative overflow-hidden btn btn-outline flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
              disabled={deleteMutation.isPending}
            >
              <span className="relative z-10">Cancel</span>
              <span className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="group relative overflow-hidden btn btn-danger flex items-center gap-2 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 size={18} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>Delete Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkActionModal}
        onClose={() => setShowBulkActionModal(false)}
        title={`Bulk Actions (${selectedAssets.length} assets)`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              <FiInfo className="inline mr-2" size={16} />
              You are about to perform actions on {selectedAssets.length} selected asset{selectedAssets.length !== 1 ? 's' : ''}.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 mb-2">Status Changes</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleBulkAction('update_status', { status: 'available' });
                }}
                className="btn btn-outline flex items-center justify-center gap-2 py-3"
              >
                <FiCheckCircle size={18} />
                Set Available
              </button>
              <button
                onClick={() => {
                  handleBulkAction('update_status', { status: 'maintenance' });
                }}
                className="btn btn-outline flex items-center justify-center gap-2 py-3"
              >
                <FiRefreshCw size={18} />
                Set Maintenance
              </button>
              <button
                onClick={() => {
                  handleBulkAction('update_status', { status: 'assigned' });
                }}
                className="btn btn-outline flex items-center justify-center gap-2 py-3"
              >
                <FiTag size={18} />
                Set Assigned
              </button>
              <button
                onClick={() => {
                  handleBulkAction('update_status', { status: 'retired' });
                }}
                className="btn btn-outline flex items-center justify-center gap-2 py-3"
              >
                <FiPackage size={18} />
                Set Retired
              </button>
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Other Actions</h4>
              <Tooltip content="Update location for all selected assets" position="top">
                <button
                  onClick={() => {
                    const location = prompt('Enter location for selected assets:');
                    if (location && location.trim()) {
                      handleBulkAction('update_location', { location: location.trim() });
                    }
                  }}
                  className="group relative overflow-hidden w-full btn btn-outline flex items-center justify-center gap-2 py-3 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-purple-400 hover:bg-purple-50 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <FiMapPin size={18} className="text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                    Update Location
                  </span>
                  <span className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </Tooltip>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setSelectedAssets([]);
                setShowBulkActionModal(false);
              }}
              className="group relative overflow-hidden btn btn-outline flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FiX size={16} />
                Clear Selection
              </span>
              <span className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button
              onClick={() => setShowBulkActionModal(false)}
              className="group relative overflow-hidden btn btn-outline flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Close
              </span>
              <span className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Assets Modal */}
      <AddAssetsToGroupModal
        isOpen={showAddAssetsModal}
        onClose={() => setShowAddAssetsModal(false)}
        groupId={id}
        groupName={group?.name}
        existingAssetIds={assets.map(asset => asset._id)}
      />

      {/* Remove Assets Confirmation Modal */}
      <Modal
        isOpen={showRemoveAssetsModal}
        onClose={() => setShowRemoveAssetsModal(false)}
        title="Remove Assets from Group"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={18} />
              You are about to remove {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} from this group.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <FiInfo className="inline mr-2" size={16} />
              Only manually added assets can be removed. Assets matched by criteria will remain in the group.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowRemoveAssetsModal(false)}
              className="group relative overflow-hidden btn btn-outline flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
              disabled={removeAssetsMutation.isPending}
            >
              <span className="relative z-10">Cancel</span>
              <span className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button
              onClick={handleRemoveAssets}
              disabled={removeAssetsMutation.isPending}
              className="group relative overflow-hidden btn btn-danger flex items-center gap-2 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              {removeAssetsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <FiMinus size={18} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>Remove Assets</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Group Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicate Asset Group"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            This will create a copy of <strong>{group?.name || 'this asset group'}</strong> with all its criteria and settings.
            The new group will have "(Copy)" added to its name.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <FiInfo className="inline mr-2" size={16} />
              All criteria, alerts, and settings will be duplicated. You can edit the new group after creation.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowDuplicateModal(false)}
              className="group relative overflow-hidden btn btn-outline flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
              disabled={duplicateMutation.isPending}
            >
              <span className="relative z-10">Cancel</span>
              <span className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              className="group relative overflow-hidden btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
            >
              {duplicateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Duplicating...</span>
                </>
              ) : (
                <>
                  <FiCopy size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span>Duplicate Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetGroupDetails;

