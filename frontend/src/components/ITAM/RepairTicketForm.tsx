/**
 * Repair Ticket Form
 * 
 * Form for creating repair tickets/RMAs
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiTool, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { assetsAPI } from '../../config/api';

const RepairTicketForm = ({ asset, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    assetId: asset?.id || '',
    description: '',
    vendorCaseNumber: '',
    warrantyCovered: true,
    loanerAssetId: '',
    priority: 'Normal',
  });

  // Fetch available loaner assets
  const { data: loanersData } = useQuery({
    queryKey: ['assets', 'available-loaners'],
    queryFn: () => assetsAPI.getAll({ state: 'In Service', owner: null, limit: 50 }),
    enabled: !!asset,
  });

  const availableLoaners = loanersData?.data?.data || [];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Info */}
      {asset && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FiPackage className="text-gray-400" />
            <div className="font-medium text-gray-900">{asset.model}</div>
          </div>
          <div className="text-sm text-gray-600">
            {asset.assetTag || asset.globalAssetId} • {asset.serialNumber}
          </div>
          {asset.warranty && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Warranty: </span>
              <span className="font-medium">
                {asset.warranty.provider} • Expires:{' '}
                {asset.warranty.end ? new Date(asset.warranty.end).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="label">
          Problem Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="input"
          rows={4}
          placeholder="Describe the problem or issue..."
          required
        />
      </div>

      {/* Vendor Case Number */}
      <div>
        <label className="label">Vendor Case Number</label>
        <input
          type="text"
          value={formData.vendorCaseNumber}
          onChange={(e) => handleChange('vendorCaseNumber', e.target.value)}
          className="input"
          placeholder="e.g., RMA-2025-001234"
        />
        <div className="mt-1 text-sm text-gray-600">
          Optional: Vendor-provided RMA or case number
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="label">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="input"
        >
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {/* Warranty Coverage */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          checked={formData.warrantyCovered}
          onChange={(e) => handleChange('warrantyCovered', e.target.checked)}
          className="rounded"
          id="warrantyCovered"
        />
        <label htmlFor="warrantyCovered" className="text-sm text-gray-700">
          Warranty covered (no cost to customer)
        </label>
      </div>

      {/* Loaner Assignment */}
      <div>
        <label className="label">Assign Loaner (Optional)</label>
        <select
          value={formData.loanerAssetId}
          onChange={(e) => handleChange('loanerAssetId', e.target.value)}
          className="input"
        >
          <option value="">No loaner needed</option>
          {availableLoaners.map((loaner) => (
            <option key={loaner.id} value={loaner.id}>
              {loaner.model} ({loaner.assetTag || loaner.globalAssetId})
            </option>
          ))}
        </select>
        <div className="mt-1 text-sm text-gray-600">
          Select a loaner asset to assign to the user while this asset is being repaired
        </div>
      </div>

      {/* Info */}
      {asset?.warranty && asset.warranty.end && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Warranty Status:</strong> This asset's warranty{' '}
            {new Date(asset.warranty.end) > new Date() ? 'is active' : 'has expired'}.{' '}
            {formData.warrantyCovered
              ? 'Repair will be covered under warranty.'
              : 'Repair may not be covered under warranty.'}
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
        <button type="submit" className="btn btn-primary flex items-center gap-2">
          <FiTool />
          Create Repair Ticket
        </button>
      </div>
    </form>
  );
};

export default RepairTicketForm;

