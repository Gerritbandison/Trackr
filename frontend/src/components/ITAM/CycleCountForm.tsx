/**
 * Cycle Count Form
 * 
 * Form for performing cycle counts on stock items
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface CycleCountData {
  itemId: string;
  expectedCount: number;
  actualCount: number;
  variance: number;
}

interface CycleCountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CycleCountForm: React.FC<CycleCountFormProps> = ({ onSuccess, onCancel }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  // Fetch stock items
  const { data: stockData } = useQuery<{ data: { data: StockItem[] } }>({
    queryKey: ['stock', 'cycle-count'],
    queryFn: () => itamAPI.stock.getAll({ limit: 100 }),
  });

  const items = stockData?.data?.data || [];

  const cycleCountMutation = useMutation({
    mutationFn: (data: { counts: CycleCountData[] }) => itamAPI.stock.cycleCount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Cycle count completed');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete cycle count');
    },
  });

  const handleCountChange = (itemId: string, value: string) => {
    setCounts({ ...counts, [itemId]: parseInt(value) || 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const countData: CycleCountData[] = Object.entries(counts).map(([itemId, count]) => {
      const item = items.find((i) => i.id === itemId);
      return {
        itemId,
        expectedCount: item?.currentStock || 0,
        actualCount: count,
        variance: count - (item?.currentStock || 0),
      };
    });

    cycleCountMutation.mutate({ counts: countData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Cycle Count</h3>
        <p className="text-sm text-gray-600">
          Enter actual counts for stock items. Variances will be calculated automatically.
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Expected</div>
                  <div className="font-medium">{item.currentStock}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="label text-xs">Actual Count</label>
                <input
                  type="number"
                  value={counts[item.id] || ''}
                  onChange={(e) => handleCountChange(item.id, e.target.value)}
                  className="input flex-1"
                  min="0"
                  placeholder="Enter count..."
                />
                {counts[item.id] !== undefined && (
                  <div className="text-sm">
                    <span
                      className={
                        (counts[item.id] || 0) - item.currentStock === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      Variance: {(counts[item.id] || 0) - item.currentStock}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
          disabled={cycleCountMutation.isPending || Object.keys(counts).length === 0}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiCheckCircle />
          {cycleCountMutation.isPending ? 'Processing...' : 'Complete Cycle Count'}
        </button>
      </div>
    </form>
  );
};

export default CycleCountForm;
