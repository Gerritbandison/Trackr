/**
 * Stock Item Form
 * 
 * Form for creating/editing stock items
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPackage, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const StockItemForm = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || '',
    currentStock: item?.currentStock || 0,
    minStock: item?.minStock || 0,
    maxStock: item?.maxStock || 0,
    reorderPoint: item?.reorderPoint || 0,
    unitCost: item?.unitCost || 0,
    vendor: item?.vendor || '',
    location: item?.location || '',
    batchNumber: item?.batchNumber || '',
    expiryDate: item?.expiryDate || '',
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) =>
      item ? itamAPI.stock.update(item.id, data) : itamAPI.stock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      toast.success(item ? 'Stock item updated' : 'Stock item created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save stock item');
    },
  });

  useEffect(() => {
    // Auto-calculate reorder point if not set
    if (!formData.reorderPoint && formData.minStock) {
      setFormData((prev) => ({
        ...prev,
        reorderPoint: formData.minStock,
      }));
    }
  }, [formData.minStock, formData.reorderPoint]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="input font-mono"
              required
            />
          </div>

          <div>
            <label className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="input"
              required
            >
              <option value="">Select...</option>
              <option value="Cable">Cable</option>
              <option value="Dock">Dock</option>
              <option value="Monitor">Monitor</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="Headset">Headset</option>
              <option value="Webcam">Webcam</option>
              <option value="Accessory">Accessory</option>
              <option value="Consumable">Consumable</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">
              Vendor
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => handleChange('vendor', e.target.value)}
              className="input"
              placeholder="e.g., CDW, Amazon"
            />
          </div>
        </div>
      </div>

      {/* Stock Levels */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Stock Levels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Current Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.currentStock}
              onChange={(e) => handleChange('currentStock', parseInt(e.target.value) || 0)}
              className="input"
              min="0"
              required
            />
          </div>

          <div>
            <label className="label">
              Minimum Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => handleChange('minStock', parseInt(e.target.value) || 0)}
              className="input"
              min="0"
              required
            />
          </div>

          <div>
            <label className="label">
              Maximum Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.maxStock}
              onChange={(e) => handleChange('maxStock', parseInt(e.target.value) || 0)}
              className="input"
              min="1"
              required
            />
          </div>

          <div>
            <label className="label">
              Reorder Point <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.reorderPoint}
              onChange={(e) => handleChange('reorderPoint', parseInt(e.target.value) || 0)}
              className="input"
              min="0"
              required
            />
            <div className="mt-1 text-xs text-gray-600">
              Auto-reorder when stock reaches this level
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
        
        <div>
          <label className="label">
            Unit Cost ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              value={formData.unitCost}
              onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
              className="input pl-8"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="input"
              placeholder="e.g., Warehouse A, Shelf 3"
            />
          </div>

          <div>
            <label className="label">Batch Number</label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => handleChange('batchNumber', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Stock Status Warning */}
      {formData.currentStock <= formData.minStock && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>Warning:</strong> Current stock is at or below minimum level.
            Consider reordering soon.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary"
        >
          {saveMutation.isPending ? 'Saving...' : item ? 'Update' : 'Create'} Item
        </button>
      </div>
    </form>
  );
};

export default StockItemForm;

