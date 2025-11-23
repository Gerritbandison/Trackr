/**
 * Software Form
 * 
 * Form for creating/editing software entries
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPackage, FiKey, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const SoftwareForm = ({ software, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: software?.name || '',
    vendor: software?.vendor || '',
    version: software?.version || '',
    category: software?.category || '',
    totalLicenses: software?.totalLicenses || 0,
    licenseType: software?.licenseType || 'perpetual',
    expirationDate: software?.expirationDate || '',
    purchaseDate: software?.purchaseDate || '',
    purchaseCost: software?.purchaseCost || 0,
    renewalCost: software?.renewalCost || 0,
    contractNumber: software?.contractNumber || '',
    notes: software?.notes || '',
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) =>
      software ? itamAPI.software.update(software.id, data) : itamAPI.software.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['software']);
      toast.success(software ? 'Software updated' : 'Software added');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save software');
    },
  });

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
              Software Name <span className="text-red-500">*</span>
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
              Vendor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => handleChange('vendor', e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">
              Version
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => handleChange('version', e.target.value)}
              className="input"
              placeholder="e.g., 2024.1"
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
              <option value="Office Suite">Office Suite</option>
              <option value="Development">Development</option>
              <option value="Security">Security</option>
              <option value="Design">Design</option>
              <option value="Database">Database</option>
              <option value="Project Management">Project Management</option>
              <option value="Communication">Communication</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Total Licenses <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.totalLicenses}
              onChange={(e) => handleChange('totalLicenses', parseInt(e.target.value) || 0)}
              className="input"
              min="0"
              required
            />
          </div>

          <div>
            <label className="label">
              License Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.licenseType}
              onChange={(e) => handleChange('licenseType', e.target.value)}
              className="input"
              required
            >
              <option value="perpetual">Perpetual</option>
              <option value="subscription">Subscription</option>
              <option value="concurrent">Concurrent</option>
              <option value="named-user">Named User</option>
            </select>
          </div>

          <div>
            <label className="label">
              Expiration Date
            </label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => handleChange('expirationDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Contract Number
            </label>
            <input
              type="text"
              value={formData.contractNumber}
              onChange={(e) => handleChange('contractNumber', e.target.value)}
              className="input"
              placeholder="e.g., CON-2024-001"
            />
          </div>
        </div>
      </div>

      {/* Financial Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Purchase Cost ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => handleChange('purchaseCost', parseFloat(e.target.value) || 0)}
                className="input pl-8"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="label">
              Annual Renewal Cost ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={formData.renewalCost}
                onChange={(e) => handleChange('renewalCost', parseFloat(e.target.value) || 0)}
                className="input pl-8"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
        
        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input"
            rows="4"
            placeholder="Additional notes or comments..."
          />
        </div>
      </div>

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
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          {saveMutation.isPending ? 'Saving...' : software ? 'Update' : 'Create'} Software
        </button>
      </div>
    </form>
  );
};

export default SoftwareForm;

