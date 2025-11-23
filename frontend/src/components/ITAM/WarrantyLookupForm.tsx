/**
 * Warranty Lookup Form
 * 
 * Bulk warranty lookup for multiple assets
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import toast from 'react-hot-toast';

interface LookupResult {
  serial: string;
  status: 'success' | 'not_found' | 'error';
  asset?: string;
  error?: string;
}

interface WarrantyLookupFormProps {
  onSuccess?: () => void;
}

const WarrantyLookupForm: React.FC<WarrantyLookupFormProps> = ({ onSuccess }) => {
  const [serialNumbers, setSerialNumbers] = useState('');
  const [manufacturers, setManufacturers] = useState('Dell,Lenovo,HP');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const queryClient = useQueryClient();

  const lookupMutation = useMutation({
    mutationFn: async ({ serialNumbers, manufacturers, autoUpdate }: { serialNumbers: string; manufacturers: string; autoUpdate: boolean }): Promise<LookupResult[]> => {
      const serials = serialNumbers.split('\n').filter((s) => s.trim());
      const results: LookupResult[] = [];

      for (const serial of serials) {
        try {
          // Find asset by serial number
          const assetsRes = await assetsAPI.getAll({ search: serial.trim() });
          const assets = assetsRes.data?.data || [];
          
          if (assets.length > 0) {
            const asset = assets[0];
            const manufacturer = manufacturers.split(',').find((m) =>
              asset.model?.toLowerCase().includes(m.toLowerCase())
            ) || asset.manufacturer;

            // Lookup warranty
            await assetsAPI.lookupWarranty(asset.id, manufacturer || 'Dell');
            results.push({ serial: serial.trim(), status: 'success', asset: asset.model });
          } else {
            results.push({ serial: serial.trim(), status: 'not_found' });
          }
        } catch (error: any) {
          results.push({ serial: serial.trim(), status: 'error', error: error.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      const successCount = results.filter((r) => r.status === 'success').length;
      toast.success(`Warranty lookup completed: ${successCount}/${results.length} successful`);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk warranty lookup');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumbers.trim()) {
      toast.error('Please enter at least one serial number');
      return;
    }

    lookupMutation.mutate({ serialNumbers, manufacturers, autoUpdate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="label">
            Serial Numbers (one per line) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={serialNumbers}
            onChange={(e) => setSerialNumbers(e.target.value)}
            className="input"
            rows={8}
            placeholder="Enter serial numbers, one per line:&#10;DLX123456789&#10;PF3ABC12&#10;5CD123456"
            required
          />
          <div className="mt-1 text-sm text-gray-600">
            Enter one serial number per line
          </div>
        </div>

        <div>
          <label className="label">Manufacturers (comma-separated)</label>
          <input
            type="text"
            value={manufacturers}
            onChange={(e) => setManufacturers(e.target.value)}
            className="input"
            placeholder="Dell,Lenovo,HP"
          />
          <div className="mt-1 text-sm text-gray-600">
            Manufacturers to try for warranty lookup
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(e) => setAutoUpdate(e.target.checked)}
            className="rounded"
            id="autoUpdate"
          />
          <label htmlFor="autoUpdate" className="text-sm text-gray-700">
            Automatically update asset warranty information
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <FiAlertCircle className="text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Note:</strong> This will lookup warranty information from OEM APIs (Dell, Lenovo, HP).
          The lookup may take a few moments per asset.
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiRefreshCw className={lookupMutation.isPending ? 'animate-spin' : ''} />
          {lookupMutation.isPending ? 'Looking up...' : 'Lookup Warranty'}
        </button>
      </div>
    </form>
  );
};

export default WarrantyLookupForm;
