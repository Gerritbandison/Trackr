import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiX, FiPackage, FiCheckCircle, FiPlus, FiSearch, FiInfo } from 'react-icons/fi';
import { assetsAPI, assetGroupsAPI } from '../../config/api';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import Badge from '../../components/ui/Badge';
import { getCategoryIcon, getStatusIcon } from '../../utils/assetCategoryIcons';
import toast from 'react-hot-toast';

const AddAssetsToGroupModal = ({ isOpen, onClose, groupId, groupName, existingAssetIds = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all assets (excluding those already in the group)
  const { data: allAssets, isLoading } = useQuery({
    queryKey: ['assets', 'not-in-group', groupId],
    queryFn: () => assetsAPI.getAll({ limit: 1000 }).then((res) => res.data.data || res.data || []),
    enabled: isOpen && !!groupId,
  });

  // Filter assets: exclude those already in the group
  const availableAssets = useMemo(() => {
    if (!allAssets) return [];
    return allAssets.filter(asset => !existingAssetIds.includes(asset._id));
  }, [allAssets, existingAssetIds]);

  // Filter and search assets - always show results, never hide completely
  const filteredAssets = useMemo(() => {
    if (!availableAssets || availableAssets.length === 0) return [];
    
    let filtered = [...availableAssets];
    
    // Search filter - only filter if query exists
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchFiltered = filtered.filter(asset => 
        asset.name?.toLowerCase().includes(query) ||
        asset.assetTag?.toLowerCase().includes(query) ||
        asset.serialNumber?.toLowerCase().includes(query) ||
        asset.model?.toLowerCase().includes(query) ||
        asset.manufacturer?.toLowerCase().includes(query) ||
        asset.category?.toLowerCase().includes(query) ||
        asset.status?.toLowerCase().includes(query)
      );
      // If search returns results, use them; otherwise show all (don't hide)
      if (searchFiltered.length > 0) {
        filtered = searchFiltered;
      }
      // If search returns 0, keep showing all assets (don't hide)
    }
    
    // Status filter - only filter if not 'all'
    if (statusFilter && statusFilter !== 'all') {
      const statusFiltered = filtered.filter(asset => asset.status === statusFilter);
      // If filter returns results, use them; otherwise show all (don't hide)
      if (statusFiltered.length > 0) {
        filtered = statusFiltered;
      }
    }
    
    return filtered;
  }, [availableAssets, searchQuery, statusFilter]);

  // Add assets mutation
  const addAssetsMutation = useMutation({
    mutationFn: (assetIds) => assetGroupsAPI.addAssets(groupId, { assetIds }),
    onSuccess: () => {
      queryClient.invalidateQueries(['asset-group-full', groupId]);
      queryClient.invalidateQueries(['asset-group-basic', groupId]);
      queryClient.invalidateQueries(['asset-group', groupId]);
      queryClient.invalidateQueries(['asset-groups']);
      toast.success(`${selectedAssets.length} asset${selectedAssets.length !== 1 ? 's' : ''} added to group successfully!`);
      setSelectedAssets([]);
      setSearchQuery('');
      setStatusFilter('all');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add assets to group');
    },
  });

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset._id));
    }
  };

  const handleAdd = () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }
    addAssetsMutation.mutate(selectedAssets);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Assets to ${groupName || 'Group'}`}
      size="xl"
      footer={
        <>
          <button 
            onClick={onClose} 
            className="btn btn-outline"
            disabled={addAssetsMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={addAssetsMutation.isPending || selectedAssets.length === 0}
            className="btn btn-primary flex items-center gap-2"
          >
            {addAssetsMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <FiPlus size={18} />
                Add {selectedAssets.length > 0 ? `${selectedAssets.length} ` : ''}Asset{selectedAssets.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search assets by name, tag, serial number..."
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="disposed">Disposed</option>
            </select>
            {filteredAssets.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="btn btn-outline text-sm whitespace-nowrap"
              >
                {selectedAssets.length === filteredAssets.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Selected Count */}
        {selectedAssets.length > 0 && (
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-primary-600" size={20} />
              <span className="font-bold text-primary-900">
                {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => setSelectedAssets([])}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Assets List */}
        <div className="border-2 border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FiPackage size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No assets available</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'All assets are already in this group'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssets.includes(asset._id);
                const CategoryIcon = getCategoryIcon(asset.category);
                const StatusIcon = getStatusIcon(asset.status);
                
                return (
                  <div
                    key={asset._id}
                    onClick={() => toggleAssetSelection(asset._id)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary-600 border-primary-600' 
                          : 'border-slate-300 hover:border-primary-400'
                      }`}>
                        {isSelected && <FiCheckCircle className="text-white" size={18} strokeWidth={3} />}
                      </div>

                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary-100' : 'bg-slate-100'
                      }`}>
                        <CategoryIcon className={isSelected ? 'text-primary-600' : 'text-slate-600'} size={24} />
                      </div>

                      {/* Asset Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 truncate">
                            {asset.name || asset.assetTag || 'Unnamed Asset'}
                          </h4>
                          {asset.assetTag && (
                            <Badge variant="info" text={`Tag: ${asset.assetTag}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <StatusIcon size={14} />
                            <span className="capitalize">{asset.status || 'N/A'}</span>
                          </div>
                          {asset.model && (
                            <>
                              <span>•</span>
                              <span>{asset.model}</span>
                            </>
                          )}
                          {asset.manufacturer && (
                            <>
                              <span>•</span>
                              <span>{asset.manufacturer}</span>
                            </>
                          )}
                          {asset.serialNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs">SN: {asset.serialNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-800">
            <FiInfo className="inline mr-2" size={16} />
            Select assets to add to this group. Assets that match the group's criteria will be automatically added when the group is created.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AddAssetsToGroupModal;

