import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiZap, FiCheck, FiLayers, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { assetsAPI, assetGroupsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { getCategoryIcon, getStatusIcon, getManufacturerIcon } from '../../utils/assetCategoryIcons';
import toast from 'react-hot-toast';

const AutoGenerateGroups = ({ isOpen, onClose }) => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all assets to analyze
  const { data: allAssetsData, isLoading } = useQuery({
    queryKey: ['all-assets-for-groups'],
    queryFn: () => assetsAPI.getAll({ limit: 10000 }).then((res) => res.data.data || res.data || []),
    enabled: isOpen,
  });

  // Fetch existing asset groups to avoid duplicates
  const { data: existingGroups } = useQuery({
    queryKey: ['asset-groups'],
    queryFn: () => assetGroupsAPI.getAll().then((res) => res.data.data || []),
    enabled: isOpen,
  });

  // Analyze assets and generate suggested groups
  const suggestedGroups = useMemo(() => {
    if (!allAssetsData || allAssetsData.length === 0) return [];

    const groups = [];
    const existingNames = (existingGroups || []).map(g => g.name.toLowerCase());

    // Group by Category
    const categoryMap = {};
    allAssetsData.forEach(asset => {
      const category = asset.category || 'other';
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(asset);
    });

    Object.entries(categoryMap).forEach(([category, assets]) => {
      if (assets.length > 0) {
        const name = `${category.charAt(0).toUpperCase() + category.slice(1)} - All`;
        if (!existingNames.includes(name.toLowerCase())) {
          groups.push({
            name,
            description: `All ${category} assets in inventory`,
            criteria: { category },
            estimatedCount: assets.length,
            type: 'category',
          });
        }
      }
    });

    // Group by Manufacturer
    const manufacturerMap = {};
    allAssetsData.forEach(asset => {
      const manufacturer = asset.manufacturer?.trim();
      if (manufacturer && manufacturer.length > 0) {
        if (!manufacturerMap[manufacturer]) {
          manufacturerMap[manufacturer] = [];
        }
        manufacturerMap[manufacturer].push(asset);
      }
    });

    Object.entries(manufacturerMap).forEach(([manufacturer, assets]) => {
      if (assets.length >= 3) { // Only create groups with at least 3 assets
        const name = `${manufacturer} - All Devices`;
        if (!existingNames.includes(name.toLowerCase())) {
          groups.push({
            name,
            description: `All ${manufacturer} devices`,
            criteria: { manufacturer },
            estimatedCount: assets.length,
            type: 'manufacturer',
          });
        }
      }
    });

    // Group by Status
    const statusMap = {
      available: 'Available Assets',
      assigned: 'Assigned Assets',
      maintenance: 'Assets in Maintenance',
      retired: 'Retired Assets',
    };

    Object.entries(statusMap).forEach(([status, label]) => {
      const assets = allAssetsData.filter(a => a.status === status);
      if (assets.length > 0) {
        const name = label;
        if (!existingNames.includes(name.toLowerCase())) {
          groups.push({
            name,
            description: `All assets with ${status} status`,
            criteria: { status },
            estimatedCount: assets.length,
            type: 'status',
          });
        }
      }
    });

    // Group by Category + Status (e.g., Available Laptops)
    const categories = ['laptop', 'desktop', 'monitor', 'mobile', 'tablet', 'server'];
    const statuses = ['available', 'assigned'];
    
    categories.forEach(category => {
      statuses.forEach(status => {
        const assets = allAssetsData.filter(a => a.category === category && a.status === status);
        if (assets.length >= 3) {
          const name = `${status.charAt(0).toUpperCase() + status.slice(1)} ${category.charAt(0).toUpperCase() + category.slice(1)}s`;
          if (!existingNames.includes(name.toLowerCase())) {
            groups.push({
              name,
              description: `${status.charAt(0).toUpperCase() + status.slice(1)} ${category} assets`,
              criteria: { category, status },
              estimatedCount: assets.length,
              type: 'category-status',
            });
          }
        }
      });
    });

    // Group by Manufacturer + Category (e.g., Lenovo Laptops)
    Object.entries(manufacturerMap).forEach(([manufacturer, manufacturerAssets]) => {
      const categoryMap = {};
      manufacturerAssets.forEach(asset => {
        const category = asset.category || 'other';
        if (!categoryMap[category]) {
          categoryMap[category] = [];
        }
        categoryMap[category].push(asset);
      });

      Object.entries(categoryMap).forEach(([category, assets]) => {
        if (assets.length >= 3) {
          const name = `${manufacturer} ${category.charAt(0).toUpperCase() + category.slice(1)}s`;
          if (!existingNames.includes(name.toLowerCase())) {
            groups.push({
              name,
              description: `${manufacturer} ${category} devices`,
              criteria: { manufacturer, category },
              estimatedCount: assets.length,
              type: 'manufacturer-category',
            });
          }
        }
      });
    });

    // Sort by estimated count (descending)
    return groups.sort((a, b) => b.estimatedCount - a.estimatedCount);
  }, [allAssetsData, existingGroups]);

  // Create asset groups mutation
  const createGroupsMutation = useMutation({
    mutationFn: async (groups) => {
      const results = [];
      for (const group of groups) {
        try {
          const response = await assetGroupsAPI.create({
            name: group.name,
            description: group.description,
            criteria: group.criteria,
            alerts: {
              lowStockEnabled: group.criteria.status === 'available' && group.estimatedCount > 10,
              lowStockThreshold: group.criteria.status === 'available' ? 5 : 10,
            },
          });
          results.push({ success: true, data: response.data.data, group: group.name });
        } catch (error) {
          results.push({ success: false, error: error.response?.data?.message || 'Failed to create group', group: group.name });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries(['asset-groups']);
      queryClient.invalidateQueries(['low-stock-alerts']);
      
      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} asset group${successCount !== 1 ? 's' : ''}`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to create ${failureCount} asset group${failureCount !== 1 ? 's' : ''}`);
      }
      
      setSelectedGroups([]);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create asset groups');
    },
  });

  const handleToggleGroup = (index) => {
    setSelectedGroups(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === suggestedGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(suggestedGroups.map((_, index) => index));
    }
  };

  const handleGenerate = () => {
    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group to create');
      return;
    }

    const groupsToCreate = selectedGroups.map(index => suggestedGroups[index]);
    setIsGenerating(true);
    createGroupsMutation.mutate(groupsToCreate);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  if (!canManage()) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-Generate Asset Groups"
      size="lg"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : suggestedGroups.length === 0 ? (
          <div className="text-center py-8">
            <FiPackage size={48} className="mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600">No assets found in inventory or all possible groups already exist.</p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 mb-5 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FiZap className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-blue-900 mb-2">Smart Group Suggestions</h4>
                  <p className="text-sm font-medium text-blue-700">
                    We've analyzed your inventory and found <strong>{suggestedGroups.length}</strong> potential asset groups.
                    Select the ones you'd like to create automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-700">
                {selectedGroups.length} of {suggestedGroups.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedGroups.length === suggestedGroups.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {suggestedGroups.map((group, index) => {
                const isSelected = selectedGroups.includes(index);
                return (
                  <div
                    key={index}
                    onClick={() => handleToggleGroup(index)}
                    className={`group relative overflow-hidden border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                      isSelected
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-lg scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50 hover:shadow-md'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary-500">
                        <FiCheck className="absolute top-[-18px] right-[2px] text-white" size={12} />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleGroup(index)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-5 h-5 text-primary-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {(() => {
                              let IconComponent = FiLayers;
                              let iconColor = 'text-purple-600';
                              if (group.criteria.category) {
                                IconComponent = getCategoryIcon(group.criteria.category);
                                iconColor = 'text-blue-600';
                              } else if (group.criteria.manufacturer) {
                                IconComponent = getManufacturerIcon(group.criteria.manufacturer);
                                iconColor = 'text-green-600';
                              } else if (group.criteria.status) {
                                IconComponent = getStatusIcon(group.criteria.status);
                                iconColor = 'text-orange-600';
                              }
                              return (
                                <div className={`p-1.5 rounded-lg ${
                                  group.criteria.category ? 'bg-blue-100' :
                                  group.criteria.manufacturer ? 'bg-green-100' :
                                  group.criteria.status ? 'bg-orange-100' :
                                  'bg-purple-100'
                                }`}>
                                  <IconComponent className={iconColor} size={16} />
                                </div>
                              );
                            })()}
                            <h4 className={`font-bold text-lg ${isSelected ? 'text-primary-900' : 'text-slate-900'}`}>
                              {group.name}
                            </h4>
                            <Badge
                              variant={
                                group.type === 'category' ? 'info' :
                                group.type === 'manufacturer' ? 'success' :
                                group.type === 'status' ? 'warning' :
                                'primary'
                              }
                              text={group.type.replace('-', ' ')}
                              size="sm"
                            />
                          </div>
                          <p className="text-sm text-slate-600 mb-3 leading-relaxed">{group.description}</p>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                              <FiPackage className="text-blue-600" size={16} />
                              <span className="font-bold text-blue-900">{group.estimatedCount} assets</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                              <FiLayers className="text-slate-600" size={14} />
                              <span className="font-medium text-slate-700 text-xs">
                                {Object.entries(group.criteria)
                                  .filter(([_, value]) => value)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(' • ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="btn btn-outline"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedGroups.length === 0 || isGenerating}
                className="btn btn-primary flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiZap size={18} />
                    Create {selectedGroups.length} Group{selectedGroups.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AutoGenerateGroups;

