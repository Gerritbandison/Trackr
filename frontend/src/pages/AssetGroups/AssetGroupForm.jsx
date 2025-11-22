import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiLayers, FiTag, FiInfo, FiAlertCircle, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import { assetGroupsAPI } from '../../config/api';
import { getCategoryIcon, getStatusIcon, getManufacturerIcon } from '../../utils/assetCategoryIcons';
import toast from 'react-hot-toast';

const AssetGroupForm = ({ assetGroup = null, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      category: '',
      manufacturer: '',
      model: '',
      status: '',
      location: '',
    },
    alerts: {
      lowStockEnabled: false,
      lowStockThreshold: 10,
    },
  });

  // Initialize form data when assetGroup prop changes
  useEffect(() => {
    if (assetGroup) {
      setFormData({
        name: assetGroup.name || '',
        description: assetGroup.description || '',
        criteria: {
          category: assetGroup.criteria?.category || '',
          manufacturer: assetGroup.criteria?.manufacturer || '',
          model: assetGroup.criteria?.model || '',
          status: assetGroup.criteria?.status || '',
          location: assetGroup.criteria?.location || '',
        },
        alerts: {
          lowStockEnabled: assetGroup.alerts?.lowStockEnabled || false,
          lowStockThreshold: assetGroup.alerts?.lowStockThreshold || 10,
        },
      });
    }
  }, [assetGroup]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean the data - remove empty criteria fields
      const cleanData = { ...data };
      Object.keys(cleanData.criteria).forEach(key => {
        if (cleanData.criteria[key] === '') {
          delete cleanData.criteria[key];
        }
      });

      // Convert threshold to number
      if (cleanData.alerts.lowStockThreshold) {
        cleanData.alerts.lowStockThreshold = Number(cleanData.alerts.lowStockThreshold);
      }

      if (assetGroup) {
        return assetGroupsAPI.update(assetGroup._id, cleanData);
      } else {
        return assetGroupsAPI.create(cleanData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['asset-groups']);
      queryClient.invalidateQueries(['low-stock-alerts']);
      toast.success(assetGroup ? 'Asset group updated successfully!' : 'Asset group created successfully!');
      onSuccess?.(response.data.data);
      onClose();
    },
    onError: (error) => {
      console.error('Asset group form error:', error);
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const errors = errorData.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            const message = typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err);
            toast.error(message);
          });
        } else if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            const message = typeof value === 'string' ? value : value.msg || value.message || JSON.stringify(value);
            toast.error(`${key}: ${message}`);
          });
        } else {
          toast.error(String(errors));
        }
      } else {
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Operation failed';
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Asset group name is required');
      return;
    }

    // Validate that at least one criteria is set
    const hasCriteria = Object.values(formData.criteria).some(value => value !== '');
    if (!hasCriteria) {
      toast.error('At least one criteria (category, manufacturer, status, etc.) must be set');
      return;
    }

    // Validate threshold if low stock alerts are enabled
    if (formData.alerts.lowStockEnabled && (!formData.alerts.lowStockThreshold || formData.alerts.lowStockThreshold < 1)) {
      toast.error('Low stock threshold must be at least 1');
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('criteria.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [field]: value
        }
      }));
    } else if (name.startsWith('alerts.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        alerts: {
          ...prev.alerts,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Asset categories
  const categories = ['laptop', 'desktop', 'monitor', 'mobile', 'tablet', 'server', 'network', 'printer', 'accessory', 'other'];
  
  // Asset statuses
  const statuses = ['available', 'assigned', 'maintenance', 'retired', 'disposed'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <FiLayers className="text-white" size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input w-full pl-10"
                placeholder="e.g., Laptops - Sales Team"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input w-full"
              placeholder="Describe this asset group and its purpose..."
            />
          </div>
        </div>
      </div>

      {/* Grouping Criteria */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <FiCheckCircle className="text-white" size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Grouping Criteria</h3>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-blue-800">
            <FiInfo className="inline mr-2" size={16} />
            Assets matching these criteria will be automatically included in this group. At least one criterion must be set.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FiTag size={16} className="text-slate-500" />
              Category
            </label>
            <div className="relative">
              {formData.criteria.category && (() => {
                const CategoryIcon = getCategoryIcon(formData.criteria.category);
                return (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <CategoryIcon className="text-slate-400" size={18} />
                  </div>
                );
              })()}
              <select
                name="criteria.category"
                value={formData.criteria.category}
                onChange={handleChange}
                className={`input w-full ${formData.criteria.category ? 'pl-10' : ''}`}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FiLayers size={16} className="text-slate-500" />
              Manufacturer
            </label>
            <div className="relative">
              {formData.criteria.manufacturer && (() => {
                const ManufacturerIcon = getManufacturerIcon(formData.criteria.manufacturer);
                return (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ManufacturerIcon className="text-slate-400" size={18} />
                  </div>
                );
              })()}
              <input
                type="text"
                name="criteria.manufacturer"
                value={formData.criteria.manufacturer}
                onChange={handleChange}
                className={`input w-full ${formData.criteria.manufacturer ? 'pl-10' : ''}`}
                placeholder="e.g., Lenovo, Dell, Apple"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FiTag size={16} className="text-slate-500" />
              Model
            </label>
            <input
              type="text"
              name="criteria.model"
              value={formData.criteria.model}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g., ThinkPad X1 Carbon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FiCheckCircle size={16} className="text-slate-500" />
              Status
            </label>
            <div className="relative">
              {formData.criteria.status && (() => {
                const StatusIcon = getStatusIcon(formData.criteria.status);
                return (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <StatusIcon className="text-slate-400" size={18} />
                  </div>
                );
              })()}
              <select
                name="criteria.status"
                value={formData.criteria.status}
                onChange={handleChange}
                className={`input w-full ${formData.criteria.status ? 'pl-10' : ''}`}
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FiMapPin size={16} className="text-slate-500" />
              Location
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <FiMapPin className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                name="criteria.location"
                value={formData.criteria.location}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="e.g., Building A, Floor 3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <FiAlertCircle className="text-white" size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Alerts & Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="alerts.lowStockEnabled"
              id="lowStockEnabled"
              checked={formData.alerts.lowStockEnabled}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 mt-1"
            />
            <div className="flex-1">
              <label htmlFor="lowStockEnabled" className="block text-sm font-medium text-slate-700 mb-2">
                Enable Low Stock Alerts
              </label>
              <p className="text-xs text-slate-600 mb-2">
                Get notified when the number of available assets in this group falls below the threshold
              </p>
              {formData.alerts.lowStockEnabled && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                  <label className="block text-sm font-semibold text-orange-900 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="alerts.lowStockThreshold"
                    value={formData.alerts.lowStockThreshold}
                    onChange={handleChange}
                    min="1"
                    required={formData.alerts.lowStockEnabled}
                    className="input w-full max-w-xs border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="10"
                  />
                  <p className="text-xs text-orange-700 mt-2">
                    You'll be alerted when available assets fall below this number
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline px-6 py-2.5 font-semibold shadow-sm hover:shadow-md transition-all"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {assetGroup ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {assetGroup ? 'Update Asset Group' : 'Create Asset Group'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AssetGroupForm;

