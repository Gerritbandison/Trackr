/**
 * Loaner Policy Configuration Component
 * 
 * Configures loaner policies and rules
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const LoanerPolicyConfig = ({ policy: initialPolicy, onSuccess }) => {
  const [policy, setPolicy] = useState({
    maxConcurrentAssets: initialPolicy?.maxConcurrentAssets || 3,
    defaultLoanDays: initialPolicy?.defaultLoanDays || 7,
    autoEmailDaysBeforeDue: initialPolicy?.autoEmailDaysBeforeDue || 2,
    convertToLostAfterDays: initialPolicy?.convertToLostAfterDays || 30,
    requireDeposit: initialPolicy?.requireDeposit || false,
    depositAmount: initialPolicy?.depositAmount || 0,
    ...initialPolicy,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => itamAPI.loaners.savePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loaner-policy']);
      toast.success('Loaner policy saved');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save policy');
    },
  });

  const handleChange = (field, value) => {
    setPolicy({ ...policy, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(policy);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Loaner Policy Settings</h3>

        {/* Max Concurrent Assets */}
        <div>
          <label className="label">
            Maximum Concurrent Assets Per User
          </label>
          <input
            type="number"
            value={policy.maxConcurrentAssets}
            onChange={(e) => handleChange('maxConcurrentAssets', parseInt(e.target.value) || 1)}
            className="input"
            min="1"
            required
          />
          <div className="mt-1 text-sm text-gray-600">
            Maximum number of assets a user can have checked out at once
          </div>
        </div>

        {/* Default Loan Days */}
        <div>
          <label className="label">
            Default Loan Period (Days)
          </label>
          <input
            type="number"
            value={policy.defaultLoanDays}
            onChange={(e) => handleChange('defaultLoanDays', parseInt(e.target.value) || 7)}
            className="input"
            min="1"
            required
          />
          <div className="mt-1 text-sm text-gray-600">
            Default number of days for loaner checkout
          </div>
        </div>

        {/* Auto-email Days Before Due */}
        <div>
          <label className="label">
            Auto-email Reminder (Days Before Due)
          </label>
          <input
            type="number"
            value={policy.autoEmailDaysBeforeDue}
            onChange={(e) => handleChange('autoEmailDaysBeforeDue', parseInt(e.target.value) || 2)}
            className="input"
            min="0"
            required
          />
          <div className="mt-1 text-sm text-gray-600">
            Send automatic reminder email this many days before due date
          </div>
        </div>

        {/* Convert to Lost After Days */}
        <div>
          <label className="label">
            Convert to Lost After (Days)
          </label>
          <input
            type="number"
            value={policy.convertToLostAfterDays}
            onChange={(e) => handleChange('convertToLostAfterDays', parseInt(e.target.value) || 30)}
            className="input"
            min="1"
            required
          />
          <div className="mt-1 text-sm text-gray-600">
            Automatically convert overdue loaners to "Lost" after this many days
          </div>
        </div>

        {/* Require Deposit */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Require Deposit</div>
            <div className="text-sm text-gray-600">
              Require a deposit when checking out loaner assets
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireDeposit}
              onChange={(e) => handleChange('requireDeposit', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Deposit Amount */}
        {policy.requireDeposit && (
          <div>
            <label className="label">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              value={policy.depositAmount}
              onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
              className="input"
              step="0.01"
              min="0"
              required
            />
            <div className="mt-1 text-sm text-gray-600">
              Amount required as deposit for loaner checkout
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiSave />
          {saveMutation.isPending ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </form>
  );
};

export default LoanerPolicyConfig;

