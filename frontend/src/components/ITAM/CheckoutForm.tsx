/**
 * Checkout Form Component
 * 
 * Form for checking out assets as loaners
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiUser, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { usersAPI } from '../../config/api';
import { addDays, format } from 'date-fns';

const CheckoutForm = ({ asset, policy, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    assetId: asset?.id || '',
    custodianId: '',
    custodianUpn: '',
    dueDate: format(addDays(new Date(), policy?.defaultLoanDays || 7), 'yyyy-MM-dd'),
    deposit: policy?.requireDeposit ? policy.depositAmount || 0 : 0,
    notes: '',
  });

  // Fetch users for custodian selection
  const { data: usersData } = useQuery({
    queryKey: ['users', 'search'],
    queryFn: () => usersAPI.getAll({ limit: 100 }),
  });

  const users = usersData?.data?.data || [];

  useEffect(() => {
    if (asset?.id) {
      setFormData((prev) => ({ ...prev, assetId: asset.id }));
    }
  }, [asset]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleUserSelect = (userId) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setFormData({
        ...formData,
        custodianId: user._id,
        custodianUpn: user.email || user.upn,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess?.(formData);
  };

  // Check policy violations
  const checkPolicyViolations = () => {
    const violations = [];
    const selectedUser = users.find((u) => u._id === formData.custodianId);

    if (selectedUser) {
      // Check max concurrent assets
      if (policy?.maxConcurrentAssets) {
        const userLoanerCount = selectedUser.loanerCount || 0;
        if (userLoanerCount >= policy.maxConcurrentAssets) {
          violations.push(
            `User has reached maximum concurrent assets (${policy.maxConcurrentAssets})`
          );
        }
      }
    }

    return violations;
  };

  const violations = checkPolicyViolations();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Info */}
      {asset && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">{asset.model}</div>
          <div className="text-sm text-gray-600">
            {asset.assetTag || asset.globalAssetId} • {asset.serialNumber}
          </div>
        </div>
      )}

      {/* Policy Violations */}
      {violations.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800 mb-1">Policy Violations</div>
              <ul className="list-disc list-inside text-sm text-red-700">
                {violations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Custodian Selection */}
      <div>
        <label className="label">
          Custodian <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.custodianId}
          onChange={(e) => handleUserSelect(e.target.value)}
          className="input"
          required
        >
          <option value="">Select user...</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name || user.email} ({user.email || user.upn})
            </option>
          ))}
        </select>
        {formData.custodianUpn && (
          <div className="mt-1 text-sm text-gray-600">{formData.custodianUpn}</div>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label className="label">
          Due Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => handleChange('dueDate', e.target.value)}
          className="input"
          min={format(new Date(), 'yyyy-MM-dd')}
          required
        />
        <div className="mt-1 text-sm text-gray-600">
          Auto-email reminder {policy?.autoEmailDaysBeforeDue || 2} days before due date
        </div>
      </div>

      {/* Deposit */}
      {policy?.requireDeposit && (
        <div>
          <label className="label">
            Deposit Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              value={formData.deposit}
              onChange={(e) => handleChange('deposit', parseFloat(e.target.value) || 0)}
              className="input pl-8"
              step="0.01"
              min="0"
            />
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Required deposit: ${policy.depositAmount || 0}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="input"
          rows={3}
          placeholder="Optional notes about this checkout..."
        />
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
          disabled={violations.length > 0}
          className="btn btn-primary"
        >
          Check Out
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;

