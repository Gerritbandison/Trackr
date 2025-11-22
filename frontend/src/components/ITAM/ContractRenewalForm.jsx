/**
 * Contract Renewal Form
 * 
 * Form for renewing contracts with decision tracking
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiCalendar, FiDollarSign, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

const ContractRenewalForm = ({ contract, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    decision: 'renew', // 'renew', 'cancel', 'negotiate'
    newEndDate: '',
    newTerm: contract?.term || 12,
    newCost: contract?.cost || 0,
    notes: '',
    autoRenew: contract?.autoRenew || false,
  });

  const queryClient = useQueryClient();

  // Fetch health score
  const { data: healthScoreData } = useQuery({
    queryKey: ['contract', contract?.id, 'health-score'],
    queryFn: () => itamAPI.contracts.getHealthScore(contract?.id),
    enabled: !!contract?.id,
  });

  const renewalMutation = useMutation({
    mutationFn: (data) => itamAPI.contracts.acknowledgeRenewal(contract.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      queryClient.invalidateQueries(['contract-renewal-notifications']);
      toast.success('Contract renewal processed');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process renewal');
    },
  });

  useEffect(() => {
    if (contract?.endDate) {
      const newEndDate = addDays(new Date(contract.endDate), formData.newTerm * 30);
      setFormData((prev) => ({
        ...prev,
        newEndDate: format(newEndDate, 'yyyy-MM-dd'),
      }));
    }
  }, [contract?.endDate, formData.newTerm]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    renewalMutation.mutate({
      ...formData,
      contractId: contract.id,
      processedAt: new Date().toISOString(),
    });
  };

  const healthScore = healthScoreData?.data?.healthScore;
  const recommendations = healthScoreData?.data?.recommendations || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contract Info */}
      {contract && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900 mb-2">{contract.name}</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Vendor:</span> {contract.vendor}
            </div>
            <div>
              <span className="font-medium">Type:</span> {contract.type}
            </div>
            <div>
              <span className="font-medium">Current End Date:</span>{' '}
              {contract.endDate ? format(new Date(contract.endDate), 'MMM dd, yyyy') : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Current Cost:</span> ${contract.cost || 0}
            </div>
          </div>
        </div>
      )}

      {/* Health Score */}
      {healthScore !== undefined && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-blue-600" />
              <span className="font-medium text-gray-900">Health Score</span>
            </div>
            <span
              className={`text-2xl font-bold ${
                healthScore >= 80
                  ? 'text-green-600'
                  : healthScore >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {healthScore}/100
            </span>
          </div>
          {recommendations.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-sm font-medium text-gray-700">Recommendations:</div>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Decision */}
      <div>
        <label className="label">
          Renewal Decision <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.decision}
          onChange={(e) => handleChange('decision', e.target.value)}
          className="input"
          required
        >
          <option value="renew">Renew Contract</option>
          <option value="negotiate">Negotiate Terms</option>
          <option value="cancel">Cancel Contract</option>
        </select>
      </div>

      {/* Renewal Details */}
      {formData.decision === 'renew' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                New Term (Months) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.newTerm}
                onChange={(e) => handleChange('newTerm', parseInt(e.target.value) || 12)}
                className="input"
                min="1"
                required
              />
            </div>

            <div>
              <label className="label">
                New End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.newEndDate}
                onChange={(e) => handleChange('newEndDate', e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">
              New Cost ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={formData.newCost}
                onChange={(e) => handleChange('newCost', parseFloat(e.target.value) || 0)}
                className="input pl-8"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.autoRenew}
              onChange={(e) => handleChange('autoRenew', e.target.checked)}
              className="rounded"
              id="autoRenew"
            />
            <label htmlFor="autoRenew" className="text-sm text-gray-700">
              Enable auto-renewal for this contract
            </label>
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="input"
          rows={4}
          placeholder="Add notes about this renewal decision..."
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
          disabled={renewalMutation.isPending}
          className={`btn flex items-center gap-2 ${
            formData.decision === 'cancel'
              ? 'btn-danger'
              : formData.decision === 'negotiate'
              ? 'btn-warning'
              : 'btn-primary'
          }`}
        >
          <FiCheckCircle />
          {renewalMutation.isPending
            ? 'Processing...'
            : formData.decision === 'cancel'
            ? 'Cancel Contract'
            : formData.decision === 'negotiate'
            ? 'Request Negotiation'
            : 'Renew Contract'}
        </button>
      </div>
    </form>
  );
};

export default ContractRenewalForm;

