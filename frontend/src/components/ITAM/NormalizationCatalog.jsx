/**
 * Normalization Catalog
 * 
 * Manage normalization rules and catalogs
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const NormalizationCatalog = ({ onClose }) => {
  const queryClient = useQueryClient();

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['normalization-catalog'],
    queryFn: () => itamAPI.dataQuality.getNormalizationCatalog(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => itamAPI.dataQuality.updateNormalizationCatalog(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['normalization-catalog']);
      toast.success('Normalization catalog updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update catalog');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const catalog = catalogData?.data || {};
  const rules = catalog.rules || [];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Normalization Catalog</strong> - Define rules to standardize data values
          (e.g., manufacturer names, model names) to maintain data consistency.
        </div>
      </div>

      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Normalization Rules</h3>
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiCheckCircle className="mx-auto mb-3 text-gray-300" size={48} />
                <div className="text-lg font-medium">No normalization rules</div>
                <div className="text-sm mt-1">Rules will be automatically added as data is normalized</div>
              </div>
            ) : (
              rules.map((rule, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{rule.field}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">From:</span> {rule.originalValue} →{' '}
                        <span className="font-medium">To:</span> {rule.normalizedValue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {rule.matchCount || 0} matches
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  );
};

export default NormalizationCatalog;

