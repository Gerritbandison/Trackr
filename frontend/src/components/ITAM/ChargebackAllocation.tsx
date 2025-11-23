/**
 * Chargeback Allocation Component
 * 
 * Displays chargeback allocations for assets
 */

import React from 'react';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';

interface Allocation {
  assetId: string;
  asset?: {
    model?: string;
  };
  costCenter?: string;
  department?: string;
  percentage: number;
  monthlyAmount?: number;
}

interface ChargebackAllocationProps {
  data?: Allocation[];
  selectedAsset?: string;
  onAssetSelect?: (assetId: string) => void;
}

const ChargebackAllocation = ({ data, selectedAsset, onAssetSelect }: ChargebackAllocationProps) => {
  const allocations = data || [];

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chargeback Allocations</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Center</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Allocation %</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Amount</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No chargeback allocations found
                  </td>
                </tr>
              ) : (
                allocations.map((allocation) => (
                  <tr
                    key={allocation.assetId}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onAssetSelect?.(allocation.assetId)}
                  >
                    <td className="py-3 px-4">{allocation.asset?.model || allocation.assetId}</td>
                    <td className="py-3 px-4">{allocation.costCenter}</td>
                    <td className="py-3 px-4">{allocation.department || 'N/A'}</td>
                    <td className="py-3 px-4">{allocation.percentage}%</td>
                    <td className="py-3 px-4 font-medium">
                      ${allocation.monthlyAmount?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChargebackAllocation;

